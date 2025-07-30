-- Migration: Normalize spaces in bundle group names after hyphen removal
-- This fixes double spaces that were left after removing hyphens

-- Update pricing rules to normalize spaces in group values
UPDATE pricing_rules
SET conditions = COALESCE(
  (
    SELECT jsonb_agg(
      CASE
        -- For any group-related fields, normalize spaces
        WHEN elem->>'field' IN ('processing.group', 'bundleGroup', 'request.group') 
          AND jsonb_typeof(elem->'value') = 'string' 
          AND elem->>'value' LIKE '%  %' THEN
          elem || jsonb_build_object(
            'value', REGEXP_REPLACE(elem->>'value', '\s+', ' ', 'g')
          )
        -- Keep other conditions as-is
        ELSE elem
      END
    )
    FROM jsonb_array_elements(conditions) AS elem
  ),
  '[]'::jsonb
)
WHERE jsonb_typeof(conditions) = 'array'
  AND conditions::text LIKE '%  %';  -- Only update rules with double spaces

-- Also update catalog_bundles to ensure no double spaces in groups
UPDATE catalog_bundles
SET groups = ARRAY(
  SELECT REGEXP_REPLACE(unnest(groups), '\s+', ' ', 'g')
)
WHERE groups::text LIKE '%  %';

-- Update pricing_markup_configurations to normalize spaces
UPDATE pricing_markup_configurations
SET bundle_group = REGEXP_REPLACE(bundle_group, '\s+', ' ', 'g')
WHERE bundle_group LIKE '%  %';

-- Update catalog_sync_jobs to normalize spaces
UPDATE catalog_sync_jobs
SET bundle_group = REGEXP_REPLACE(bundle_group, '\s+', ' ', 'g')
WHERE bundle_group LIKE '%  %';

-- Update catalog_metadata bundle_groups array to normalize spaces
UPDATE catalog_metadata
SET bundle_groups = ARRAY(
  SELECT REGEXP_REPLACE(unnest(bundle_groups), '\s+', ' ', 'g')
)
WHERE bundle_groups::text LIKE '%  %';

-- Log what we fixed
DO $$
DECLARE
  rules_updated INTEGER;
  bundles_updated INTEGER;
BEGIN
  SELECT COUNT(*) INTO rules_updated
  FROM pricing_rules
  WHERE conditions::text LIKE '%Standard%Unlimited%'
    AND conditions::text NOT LIKE '%  %';
  
  SELECT COUNT(*) INTO bundles_updated
  FROM catalog_bundles
  WHERE groups::text LIKE '%Standard%Unlimited%'
    AND groups::text NOT LIKE '%  %';
  
  RAISE NOTICE 'Normalized spaces in % pricing rules and % bundle groups', rules_updated, bundles_updated;
END $$;