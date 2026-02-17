-- Fix Google Ads CTR field precision (some values exceed 99.9999)
ALTER TABLE google_ads ALTER COLUMN ctr TYPE DECIMAL(10,4);

-- Fix Meta Ads CTR too just in case
ALTER TABLE meta_ads ALTER COLUMN ctr TYPE DECIMAL(10,4);
