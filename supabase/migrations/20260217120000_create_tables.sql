-- Energreen Full Company Performance Dashboard
-- Migration 001: Create core tables

-- 1. Leads uit Dynamics CRM
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dynamics_id TEXT UNIQUE,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  mobile_phone TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  language TEXT,
  lead_type TEXT,
  quote_type TEXT,
  quote_group TEXT,
  lead_source TEXT,
  rating TEXT,
  status TEXT,
  status_reason TEXT,
  owner TEXT,
  utm_campaign TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_content TEXT,
  gh_code TEXT,
  campaign_type TEXT,
  description TEXT,
  est_value DECIMAL(12,2),
  existing_contact BOOLEAN DEFAULT false,
  created_on TIMESTAMPTZ,
  modified_on TIMESTAMPTZ,
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Opportunities uit Dynamics CRM
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dynamics_id TEXT UNIQUE,
  contact_name TEXT,
  account_name TEXT,
  originating_lead_name TEXT,
  lead_id UUID REFERENCES leads(id),
  type TEXT,
  quote_type TEXT,
  quote_group TEXT,
  pipeline_phase TEXT,
  status_reason TEXT,
  rating TEXT,
  owner TEXT,
  branch TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  language TEXT,
  est_revenue DECIMAL(12,2),
  actual_revenue DECIMAL(12,2),
  probability TEXT,
  created_on TIMESTAMPTZ,
  actual_close_date TIMESTAMPTZ,
  est_close_date TIMESTAMPTZ,
  last_activity_date TIMESTAMPTZ,
  visit_date TIMESTAMPTZ,
  gh_code TEXT,
  campaign_type TEXT,
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Meta Ads (daily per campaign)
CREATE TABLE IF NOT EXISTS meta_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id TEXT,
  campaign_id TEXT,
  campaign_name TEXT,
  gh_code TEXT,
  date DATE,
  spend DECIMAL(10,2),
  impressions INTEGER,
  clicks INTEGER,
  cpm DECIMAL(8,4),
  ctr DECIMAL(6,4),
  cpc DECIMAL(8,4),
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Google Ads (daily per campaign)
CREATE TABLE IF NOT EXISTS google_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT,
  gh_code TEXT,
  date DATE,
  spend DECIMAL(10,2),
  impressions INTEGER,
  clicks INTEGER,
  ctr DECIMAL(6,4),
  cpc DECIMAL(8,4),
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Campaign mapping reference
CREATE TABLE IF NOT EXISTS campaign_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utm_campaign TEXT,
  gh_code TEXT,
  campaign_type TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_gh_code ON leads(gh_code);
CREATE INDEX IF NOT EXISTS idx_leads_quote_group ON leads(quote_group);
CREATE INDEX IF NOT EXISTS idx_leads_created_on ON leads(created_on);
CREATE INDEX IF NOT EXISTS idx_leads_status_reason ON leads(status_reason);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON leads(owner);
CREATE INDEX IF NOT EXISTS idx_opps_quote_group ON opportunities(quote_group);
CREATE INDEX IF NOT EXISTS idx_opps_branch ON opportunities(branch);
CREATE INDEX IF NOT EXISTS idx_opps_status ON opportunities(status_reason);
CREATE INDEX IF NOT EXISTS idx_opps_lead_id ON opportunities(lead_id);
CREATE INDEX IF NOT EXISTS idx_opps_gh_code ON opportunities(gh_code);
CREATE INDEX IF NOT EXISTS idx_opps_created_on ON opportunities(created_on);
CREATE INDEX IF NOT EXISTS idx_opps_owner ON opportunities(owner);
CREATE INDEX IF NOT EXISTS idx_meta_date ON meta_ads(date);
CREATE INDEX IF NOT EXISTS idx_meta_gh ON meta_ads(gh_code);
CREATE INDEX IF NOT EXISTS idx_meta_campaign ON meta_ads(campaign_name);
CREATE INDEX IF NOT EXISTS idx_google_date ON google_ads(date);
CREATE INDEX IF NOT EXISTS idx_google_gh ON google_ads(gh_code);
CREATE INDEX IF NOT EXISTS idx_google_campaign ON google_ads(campaign_name);

-- Unified ad spend view
CREATE OR REPLACE VIEW ad_spend_daily AS
SELECT
  date, gh_code, 'meta' AS platform,
  SUM(spend) AS spend, SUM(impressions) AS impressions, SUM(clicks) AS clicks
FROM meta_ads
WHERE gh_code IS NOT NULL
GROUP BY date, gh_code
UNION ALL
SELECT
  date, gh_code, 'google' AS platform,
  SUM(spend) AS spend, SUM(impressions) AS impressions, SUM(clicks) AS clicks
FROM google_ads
WHERE gh_code IS NOT NULL
GROUP BY date, gh_code;

-- RLS policies: allow anonymous read access
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read on opportunities" ON opportunities FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read on meta_ads" ON meta_ads FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read on google_ads" ON google_ads FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read on campaign_mapping" ON campaign_mapping FOR SELECT USING (true);

-- Service role insert policies (for import script)
CREATE POLICY "Allow service role insert on leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role insert on opportunities" ON opportunities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role insert on meta_ads" ON meta_ads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role insert on google_ads" ON google_ads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role insert on campaign_mapping" ON campaign_mapping FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role update on leads" ON leads FOR UPDATE USING (true);
CREATE POLICY "Allow service role update on opportunities" ON opportunities FOR UPDATE USING (true);
