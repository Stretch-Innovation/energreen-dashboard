import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

export const webhookSecret = Deno.env.get("DYNAMICS_WEBHOOK_SECRET");

// ── UTM → GH Code mapping ──────────────────────────────────────────
const UTM_TO_GH: Record<string, string> = {
  "[leads] gh12 (exp13)": "GH12",
  "[leads] gh13 (exp14) - stretch - robin ugc": "GH13",
  "[leads] gh2 - stretch": "GH2",
  "[leads] gh4 - it1 | stretch": "GH4TR",
  "[leads] gh4 - tr | stretch": "GH4TR",
  "[leads] gh4b - stretch": "GH4D",
  "[leads] gh4d - stretch": "GH4D",
  "23337668539": "GH17TR",
  pmax_22990300921: "GH1",
  gh4: "GH1",
  gh4_d: "GH1",
  gh4d_pmax_stretch: "GH1",
  gh2_exp3_stretch: "GH2",
  gh2_it1_stretch: "GH2",
  gh2_it2_stretch: "GH2",
  gh4_stretch: "GH4",
  gh4_exp6_stretch: "GH4",
  gh4d_stretch: "GH4D",
  gh4_it1_stretch: "GH4TR",
  gh4_tr_stretch: "GH4TR",
  gh5_stretch: "GH5",
  gh5d_stretch: "GH5D",
  gh5_tr_stretch: "GH5TR",
  gh6_it2_stretch: "GH6D",
  gh9_stretch: "GH9",
  gh9_exp10_stretch: "GH9",
  gh16_stretch: "GH16",
  gh17: "GH17",
  gh17_pmax_stretch: "GH17",
  gh17d_pmax_stretch: "GH17D",
  gh17_tr: "GH17TR",
  gh17_tr_stretch: "GH17TR",
  gh20_stretch: "GH20",
  gh20d_stretch: "GH20D",
  gh20_tr_stretch: "GH20TR",
  gh21_stretch: "GH21",
  gh21d_stretch: "GH21D",
  gh21_tr_stretch: "GH21TR",
  gh22: "GH22",
  gh22_pmax_stretch: "GH22",
  gh22d_stretch: "GH22",
  gh24_stretch: "GH24",
  gh24d_stretch: "GH24D",
  gh24_tr_stretch: "GH24TR",
  gh25_tr_stretch: "GH25TR",
  gh30_stretch: "GH30",
  gh30d_stretch: "GH30D",
  gh30_tr_stretch: "GH30TR",
  gh32: "GH4D",
  gh32_pmax_stretch: "GH32",
  gh32_d: "GH32D",
  gh32d_pmax_stretch: "GH32D",
  gh32_tr: "GH32TR",
  gh32_tr_pmax_stretch: "GH32TR",
  gh33_stretch: "GH33",
  gh33d_stretch: "GH33D",
  gh33_tr_stretch: "GH33TR",
  gh36_stretch: "GH36",
  gh37_stretch: "GH37",
  gh38_stretch: "GH38",
  gh39_stretch: "GH39",
  gh40_stretch: "GH40D",
  gh40d_stretch: "GH40D",
  gh40_tr_stretch: "GH40TR",
  gh41_stretch: "GH41",
  gh42_stretch: "GH42",
  gh42d_stretch: "GH42D",
  gh43_stretch: "GH43",
  gh43d_stretch: "GH43D",
  gh43_tr_stretch: "GH43TR",
  gh44_stretch: "GH44",
  gh44d_stretch: "GH44D",
  gh44_tr_stretch: "GH44TR",
  gh45_stretch: "GH45",
  gh45d_stretch: "GH45D",
  gh45_tr_stretch: "GH45TR",
  nurture_calculator_stretch: "Nurture flow",
  nurture_stretch: "Nurture flow",
  stretch_adviesgesprek_befr: "Nurture flow",
  stretch_adviesgesprek_benl: "Nurture flow",
  stretch_calculator_benl: "Nurture flow",
  stretch_calculator_befr: "Nurture flow",
  calculator_stretch: "Nurture flow",
};

const GH_TO_TYPE: Record<string, string> = {
  GH5: "Type 1", GH5D: "Type 1", GH5TR: "Type 1",
  GH9: "Type 1",
  GH21: "Type 1", GH21D: "Type 1", GH21TR: "Type 1",
  GH36: "Type 1",
  GH40: "Type 1", GH40D: "Type 1", GH40TR: "Type 1",
  GH43: "Type 1", GH43D: "Type 1", GH43TR: "Type 1",
  GH44: "Type 1", GH44D: "Type 1", GH44TR: "Type 1",
  GH45: "Type 1", GH45D: "Type 1", GH45TR: "Type 1",
  GH46: "Type 1",
  GH24: "Type 2", GH24D: "Type 2", GH24TR: "Type 2",
  GH30: "Type 2", GH30D: "Type 2", GH30TR: "Type 2",
  GH33: "Type 3", GH33D: "Type 3", GH33TR: "Type 3",
  GH37: "Type 3", GH38: "Type 3", GH39: "Type 3", GH41: "Type 3",
};

export function resolveGhCode(utmCampaign: string | null): string | null {
  if (!utmCampaign) return null;
  return UTM_TO_GH[utmCampaign.trim().toLowerCase()] ?? null;
}

export function getCampaignType(ghCode: string | null): string | null {
  if (!ghCode) return null;
  return GH_TO_TYPE[ghCode] ?? null;
}

// ── Date parser (DD/MM/YYYY HH:MM → ISO 8601) ──────────────────────
export function parseDate(val: string | null): string | null {
  if (!val) return null;
  // Already ISO format (starts with YYYY-)
  if (/^\d{4}-/.test(val)) return val;
  // DD/MM/YYYY HH:MM or DD/MM/YYYY HH:MM:SS
  const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2}(?::\d{2})?)$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}T${match[4]}`;
  return val;
}

export function findDateField(data: Record<string, unknown>, ...patterns: string[]): string | null {
  return parseDate(findField(data, ...patterns));
}

// ── Smart field finder ───────────────────────────────────────────────
export function findField(data: Record<string, unknown>, ...patterns: string[]): string | null {
  for (const p of patterns) {
    if (data[p] !== undefined && data[p] !== null) return String(data[p]);
  }
  const keys = Object.keys(data);
  for (const p of patterns) {
    const match = keys.find((k) => k.toLowerCase().endsWith(p.toLowerCase()));
    if (match && data[match] !== undefined && data[match] !== null) return String(data[match]);
  }
  for (const p of patterns) {
    const match = keys.find((k) => k.toLowerCase().includes(p.toLowerCase()));
    if (match && data[match] !== undefined && data[match] !== null) return String(data[match]);
  }
  return null;
}

export function findNumber(data: Record<string, unknown>, ...patterns: string[]): number | null {
  const val = findField(data, ...patterns);
  if (val === null) return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

export function findDisplayField(data: Record<string, unknown>, baseField: string): string | null {
  const displayKey = `${baseField}@OData.Community.Display.V1.FormattedValue`;
  if (data[displayKey] !== undefined) return String(data[displayKey]);
  const lookupKey = `_${baseField}_value@OData.Community.Display.V1.FormattedValue`;
  if (data[lookupKey] !== undefined) return String(data[lookupKey]);
  return findField(data, baseField);
}

// ── Shared CORS + auth handler ───────────────────────────────────────
export function handleCorsAndAuth(req: Request): Response | null {
  if (req.method === "OPTIONS" || req.method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type, x-webhook-secret",
        "Access-Control-Allow-Methods": "POST, HEAD, OPTIONS",
      },
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== webhookSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  return null; // auth passed
}

// ── Parse and validate records from body ─────────────────────────────
export async function parseRecords(req: Request): Promise<{ records: Record<string, unknown>[]; error?: Response }> {
  const body = await req.json();
  const records = Array.isArray(body.data) ? body.data : body.data ? [body.data] : [];
  if (records.length === 0) {
    return { records: [], error: new Response(JSON.stringify({ error: "No records in data" }), { status: 400 }) };
  }
  return { records };
}

// ── JSON response helper ─────────────────────────────────────────────
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
