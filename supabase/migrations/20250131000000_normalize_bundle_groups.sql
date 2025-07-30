-- Migration: Normalize bundle groups by removing hyphens
-- This ensures consistency between eSIM Go API data and our system

-- 1. Update bundle groups in catalog_bundles table
UPDATE catalog_bundles
SET groups = ARRAY(
  SELECT REPLACE(unnest(groups), '-', '')
)
WHERE groups IS NOT NULL;

-- 2. Update pricing rules conditions arrays (moved to separate migration file)
-- See: 20250131000001_fix_pricing_rules_arrays.sql

-- 3. Update pricing_markup_configurations table if it has hyphenated group names
UPDATE pricing_markup_configurations
SET bundle_group = REPLACE(bundle_group, '-', '')
WHERE bundle_group LIKE '%-%';

-- 4. Update any catalog_sync_jobs that reference hyphenated groups
UPDATE catalog_sync_jobs
SET bundle_group = REPLACE(bundle_group, '-', '')
WHERE bundle_group LIKE '%-%';

-- 5. Update catalog_metadata bundle_groups array
UPDATE catalog_metadata
SET bundle_groups = ARRAY(
  SELECT REPLACE(unnest(bundle_groups), '-', '')
)
WHERE bundle_groups IS NOT NULL;

-- 6. Add a comment to document the normalization
COMMENT ON COLUMN catalog_bundles.groups IS 'Bundle groups normalized without hyphens (e.g., "Standard Unlimited Essential" not "Standard - Unlimited Essential")';

-- 7. Recreate the bundles_by_group view to ensure it uses normalized data
DROP VIEW IF EXISTS bundles_by_group;

CREATE OR REPLACE VIEW bundles_by_group AS
SELECT 
  unnest(groups) as group_name,
  esim_go_name,
  name,
  description,
  validity_in_days,
  data_amount_mb,
  data_amount_readable,
  is_unlimited,
  price,
  currency,
  countries,
  region,
  speed
FROM catalog_bundles
WHERE groups IS NOT NULL AND array_length(groups, 1) > 0;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Bundle group normalization completed. All hyphens have been removed from group names.';
  RAISE NOTICE 'Pricing rule field paths have been updated to match new state structure.';
END $$;