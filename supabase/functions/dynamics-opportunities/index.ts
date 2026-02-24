import {
  supabase,
  findField, findDateField, findNumber, findDisplayField,
  handleCorsAndAuth, parseRecords, jsonResponse,
} from "../_shared/dynamics-helpers.ts";

// ── OData formatted value helper ─────────────────────────────────────
function fmtVal(d: Record<string, unknown>, field: string): string | null {
  // Try FormattedValue first (human-readable display value for lookups/optionsets)
  const fmtKey = `${field}@OData.Community.Display.V1.FormattedValue`;
  if (d[fmtKey] != null && d[fmtKey] !== "") return String(d[fmtKey]);
  // Try lookup pattern: _field_value with FormattedValue
  const lookupFmtKey = `_${field}_value@OData.Community.Display.V1.FormattedValue`;
  if (d[lookupFmtKey] != null && d[lookupFmtKey] !== "") return String(d[lookupFmtKey]);
  // Fallback to raw value
  if (d[field] != null && d[field] !== "") return String(d[field]);
  // Try lookup raw value
  const lookupKey = `_${field}_value`;
  if (d[lookupKey] != null && d[lookupKey] !== "") return String(d[lookupKey]);
  return null;
}

// ── Map raw Dynamics opportunity to our schema ───────────────────────
function mapOpportunity(d: Record<string, unknown>) {
  // Resolve type: gd_type is a boolean in Dynamics (true=Existing, false=New)
  const rawType = fmtVal(d, "gd_type");
  let typeValue: string | null = null;
  if (rawType === "true" || rawType === "Yes") typeValue = "Existing";
  else if (rawType === "false" || rawType === "No") typeValue = "New";
  else typeValue = rawType;

  return {
    dynamics_id: findField(d, "opportunityid"),
    contact_name: fmtVal(d, "parentcontactid") || findField(d, "_parentcontactid_value@OData.Community.Display.V1.FormattedValue"),
    account_name: fmtVal(d, "customerid") || findField(d, "_customerid_value@OData.Community.Display.V1.FormattedValue"),
    originating_lead_name:
      fmtVal(d, "originatingleadid") ||
      findField(d, "_originatingleadid_value@OData.Community.Display.V1.FormattedValue") ||
      fmtVal(d, "parentcontactid"),
    type: typeValue,
    quote_type: fmtVal(d, "gd_quotetype") || findField(d, "_gd_quotetype_value@OData.Community.Display.V1.FormattedValue"),
    quote_group: fmtVal(d, "gd_quotegroup") || findField(d, "_gd_quotegroup_value@OData.Community.Display.V1.FormattedValue"),
    pipeline_phase: fmtVal(d, "salesstagecode") || findField(d, "stepname"),
    status_reason: fmtVal(d, "statuscode"),
    rating: fmtVal(d, "opportunityratingcode"),
    owner: fmtVal(d, "ownerid") || findField(d, "_ownerid_value@OData.Community.Display.V1.FormattedValue"),
    branch: fmtVal(d, "owningbusinessunit") || findField(d, "_owningbusinessunit_value@OData.Community.Display.V1.FormattedValue"),
    city: findField(d, "gd_city"),
    postal_code: findField(d, "gd_zippostalcode"),
    country: fmtVal(d, "gmi_country") || findField(d, "_gmi_country_value@OData.Community.Display.V1.FormattedValue"),
    language: null, // not directly available in Dynamics opportunity
    est_revenue: findNumber(d, "estimatedvalue"),
    actual_revenue: findNumber(d, "actualvalue"),
    probability: fmtVal(d, "gmi_probabilityoption") || findField(d, "closeprobability"),
    created_on: findDateField(d, "createdon"),
    actual_close_date: findDateField(d, "actualclosedate"),
    est_close_date: findDateField(d, "gmi_closedate") || findDateField(d, "estimatedclosedate"),
    last_activity_date: findDateField(d, "gmi_lastactivitydate_date"),
    visit_date: findDateField(d, "visitdate", "mscrm_visitdate"),
  };
}

// ── Process a single opportunity ─────────────────────────────────────
async function processOpportunity(data: Record<string, unknown>) {
  const mapped = mapOpportunity(data);
  if (!mapped.dynamics_id) {
    return { success: false, dynamics_id: null, error: "No opportunityid found" };
  }

  // Link to lead and inherit gh_code + campaign_type
  let leadId = null;
  let ghCode = null;
  let campaignType = null;
  const originatingLeadDynamicsId = findField(data, "_originatingleadid_value");
  if (originatingLeadDynamicsId) {
    const { data: lead } = await supabase
      .from("leads")
      .select("id, gh_code, campaign_type")
      .eq("dynamics_id", originatingLeadDynamicsId)
      .single();
    if (lead) {
      leadId = lead.id;
      ghCode = lead.gh_code;
      campaignType = lead.campaign_type;
    }
  }

  const result = await supabase.from("opportunities").upsert(
    { ...mapped, lead_id: leadId, gh_code: ghCode, campaign_type: campaignType },
    { onConflict: "dynamics_id" }
  );
  if (result.error) {
    return { success: false, dynamics_id: mapped.dynamics_id, error: result.error.message };
  }
  return { success: true, dynamics_id: mapped.dynamics_id };
}

// ── Handler ──────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const blocked = handleCorsAndAuth(req);
  if (blocked) return blocked;

  try {
    const { records, error } = await parseRecords(req);
    if (error) return error;

    console.log(`[opportunities] Processing batch of ${records.length} records`);
    if (records.length > 0) {
      console.log(`[opportunities] Sample keys:`, Object.keys(records[0]).sort().join(", "));
    }

    const results = await Promise.all(records.map(processOpportunity));
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    if (failed.length > 0) {
      console.error(`[opportunities] Failed records:`, JSON.stringify(failed));
    }

    return jsonResponse({
      success: true,
      entity: "opportunity",
      total: records.length,
      succeeded,
      failed: failed.length,
      errors: failed.length > 0 ? failed : undefined,
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
