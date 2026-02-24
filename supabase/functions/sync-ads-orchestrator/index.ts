import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const results = [];
  // Call both sync functions in parallel
  const [metaResult, googleResult] = await Promise.allSettled([
    fetch(`${supabaseUrl}/functions/v1/sync-meta-ads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json"
      }
    }).then(async (r)=>{
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || `Meta sync failed with ${r.status}`);
      return body;
    }),
    fetch(`${supabaseUrl}/functions/v1/sync-google-ads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json"
      }
    }).then(async (r)=>{
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || `Google sync failed with ${r.status}`);
      return body;
    })
  ]);
  // Process Meta result
  if (metaResult.status === "fulfilled") {
    results.push(metaResult.value);
    await supabase.from("sync_log").insert({
      platform: "meta",
      rows_synced: metaResult.value.rows_synced,
      status: "success",
      date_range_start: metaResult.value.date_range_start,
      date_range_end: metaResult.value.date_range_end
    });
  } else {
    const errorMsg = metaResult.reason?.message || String(metaResult.reason);
    results.push({
      platform: "meta",
      status: "error",
      error: errorMsg
    });
    await supabase.from("sync_log").insert({
      platform: "meta",
      rows_synced: 0,
      status: "error",
      error_message: errorMsg
    });
  }
  // Process Google result
  if (googleResult.status === "fulfilled") {
    results.push(googleResult.value);
    await supabase.from("sync_log").insert({
      platform: "google",
      rows_synced: googleResult.value.rows_synced,
      status: "success",
      date_range_start: googleResult.value.date_range_start,
      date_range_end: googleResult.value.date_range_end
    });
  } else {
    const errorMsg = googleResult.reason?.message || String(googleResult.reason);
    results.push({
      platform: "google",
      status: "error",
      error: errorMsg
    });
    await supabase.from("sync_log").insert({
      platform: "google",
      rows_synced: 0,
      status: "error",
      error_message: errorMsg
    });
  }
  const overallStatus = results.every((r)=>r.status === "success") ? "success" : "partial";
  return new Response(JSON.stringify({
    status: overallStatus,
    results
  }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
});
