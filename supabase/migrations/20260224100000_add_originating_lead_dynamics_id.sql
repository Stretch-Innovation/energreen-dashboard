-- Add originating_lead_dynamics_id to opportunities
-- Stores the raw Dynamics GUID of the originating lead for reliable lead matching
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS originating_lead_dynamics_id TEXT;
CREATE INDEX IF NOT EXISTS idx_opps_orig_lead_dyn ON opportunities(originating_lead_dynamics_id);
