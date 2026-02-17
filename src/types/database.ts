export interface Lead {
  id: string
  dynamics_id: string | null
  full_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  city: string | null
  country: string | null
  language: string | null
  lead_type: string | null
  quote_type: string | null
  quote_group: string | null
  lead_source: string | null
  rating: string | null
  status: string | null
  status_reason: string | null
  owner: string | null
  utm_campaign: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_content: string | null
  gh_code: string | null
  campaign_type: string | null
  created_on: string | null
  modified_on: string | null
}

export interface Opportunity {
  id: string
  dynamics_id: string | null
  contact_name: string | null
  originating_lead_name: string | null
  lead_id: string | null
  type: string | null
  quote_type: string | null
  quote_group: string | null
  pipeline_phase: string | null
  status_reason: string | null
  rating: string | null
  owner: string | null
  branch: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  language: string | null
  est_revenue: number | null
  actual_revenue: number | null
  probability: string | null
  created_on: string | null
  actual_close_date: string | null
  est_close_date: string | null
  last_activity_date: string | null
  visit_date: string | null
  gh_code: string | null
  campaign_type: string | null
}

export interface MetaAd {
  id: string
  campaign_name: string
  gh_code: string | null
  date: string
  spend: number
  impressions: number
  clicks: number
  cpm: number | null
  ctr: number | null
  cpc: number | null
}

export interface GoogleAd {
  id: string
  campaign_name: string
  gh_code: string | null
  date: string
  spend: number
  impressions: number
  clicks: number
  ctr: number | null
  cpc: number | null
}

export interface CampaignMapping {
  id: string
  utm_campaign: string
  gh_code: string
  campaign_type: string
  source: string
}

export interface DateRange {
  from: Date
  to: Date
}

export interface Filters {
  dateRange: DateRange
  quoteGroups: string[]
  branches: string[]
  productTypes: string[]
}
