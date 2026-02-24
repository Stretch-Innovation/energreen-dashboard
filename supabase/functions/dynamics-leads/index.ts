import {
  supabase,
  findField, findDateField, findDisplayField,
  resolveGhCode, getCampaignType,
  handleCorsAndAuth, parseRecords, jsonResponse,
} from "../_shared/dynamics-helpers.ts";

// ── OData formatted value helper ─────────────────────────────────────
function fmtVal(d: Record<string, unknown>, field: string): string | null {
  const fmtKey = `${field}@OData.Community.Display.V1.FormattedValue`;
  if (d[fmtKey] != null && d[fmtKey] !== "") return String(d[fmtKey]);
  const lookupFmtKey = `_${field}_value@OData.Community.Display.V1.FormattedValue`;
  if (d[lookupFmtKey] != null && d[lookupFmtKey] !== "") return String(d[lookupFmtKey]);
  if (d[field] != null && d[field] !== "") return String(d[field]);
  const lookupKey = `_${field}_value`;
  if (d[lookupKey] != null && d[lookupKey] !== "") return String(d[lookupKey]);
  return null;
}

// ── Map raw Dynamics lead to our schema ──────────────────────────────
function mapLead(d: Record<string, unknown>) {
  const utmCampaign = findField(d, "gd_utmcampaign", "msdynmkt_utmcampaign", "utmcampaign", "utm_campaign");
  const ghCode = resolveGhCode(utmCampaign);
  return {
    dynamics_id: findField(d, "leadid"),
    full_name: findField(d, "fullname"),
    first_name: findField(d, "firstname"),
    last_name: findField(d, "lastname"),
    email: findField(d, "emailaddress1"),
    mobile_phone: findField(d, "mobilephone", "telephone1"),
    city: findField(d, "address1_city"),
    postal_code: findField(d, "address1_postalcode"),
    country: fmtVal(d, "gmi_country") || findField(d, "address1_country"),
    language: fmtVal(d, "gd_language") || findField(d, "language"),
    lead_type: fmtVal(d, "gd_type") || findDisplayField(d, "leadqualitycode"),
    quote_type: fmtVal(d, "gd_quotetype") || findField(d, "_gd_quotetype_value@OData.Community.Display.V1.FormattedValue"),
    quote_group: fmtVal(d, "gd_quotegroup") || findField(d, "_gd_quotegroup_value@OData.Community.Display.V1.FormattedValue"),
    lead_source: findDisplayField(d, "leadsourcecode"),
    rating: findDisplayField(d, "leadqualitycode"),
    status: findDisplayField(d, "statecode"),
    status_reason: findDisplayField(d, "statuscode"),
    owner: findDisplayField(d, "ownerid"),
    utm_campaign: utmCampaign,
    utm_source: findField(d, "gd_utmsource", "msdynmkt_utmsource", "utmsource", "utm_source"),
    utm_medium: findField(d, "gd_utmmedium", "msdynmkt_utmmedium", "utmmedium", "utm_medium"),
    utm_content: findField(d, "gd_utmcontent", "msdynmkt_utmcontent", "utmcontent", "utm_content"),
    gh_code: ghCode,
    campaign_type: getCampaignType(ghCode),
    est_value: findField(d, "estimatedvalue") != null ? parseFloat(String(findField(d, "estimatedvalue"))) : null,
    existing_contact: findField(d, "gd_existingcontact") === "true" || fmtVal(d, "gd_existingcontact") === "Yes",
    created_on: findDateField(d, "createdon"),
    modified_on: findDateField(d, "modifiedon"),
  };
}

// ── Process a single lead ────────────────────────────────────────────
async function processLead(data: Record<string, unknown>) {
  const mapped = mapLead(data);
  if (!mapped.dynamics_id) {
    return { success: false, dynamics_id: null, error: "No leadid found" };
  }
  const result = await supabase.from("leads").upsert(mapped, { onConflict: "dynamics_id" });
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

    console.log(`[leads] Processing batch of ${records.length} records`);
    if (records.length > 0) {
      console.log(`[leads] Sample keys:`, Object.keys(records[0]).sort().join(", "));
    }

    const results = await Promise.all(records.map(processLead));
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    if (failed.length > 0) {
      console.error(`[leads] Failed records:`, JSON.stringify(failed));
    }

    return jsonResponse({
      success: true,
      entity: "lead",
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
