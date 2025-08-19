-- Migration: Fix pricing rules conditions arrays to remove hyphens from group values
-- This handles the fact that conditions is a JSON array, not a single object

-- Update pricing rules conditions array
UPDATE pricing_rules
SET conditions = COALESCE(
  (
    SELECT jsonb_agg(
      CASE
        -- Update field paths and remove hyphens from values
        WHEN elem->>'field' = 'bundleGroup' THEN
          elem || jsonb_build_object(
            'field', 'processing.group',
            'value', REPLACE(elem->>'value', '-', '')
          )
        WHEN elem->>'field' = 'duration' THEN
          elem || jsonb_build_object(
            'field', 'processing.selectedBundle.validityInDays'
          )
        WHEN elem->>'field' = 'isUnlimited' THEN
          elem || jsonb_build_object(
            'field', 'processing.selectedBundle.isUnlimited'
          )
        WHEN elem->>'field' = 'bundle.isUnlimited' THEN
          elem || jsonb_build_object(
            'field', 'processing.selectedBundle.isUnlimited'
          )
        WHEN elem->>'field' = 'request.group' THEN
          elem || jsonb_build_object(
            'field', 'processing.group',
            'value', REPLACE(elem->>'value', '-', '')
          )
        WHEN elem->>'field' = 'request.region' THEN
          elem || jsonb_build_object(
            'field', 'processing.region'
          )
        WHEN elem->>'field' = 'request.isUnlimited' THEN
          elem || jsonb_build_object(
            'field', 'request.dataType',
            'value', CASE 
              WHEN elem->>'value' = 'true' THEN 'unlimited'
              WHEN elem->>'value' = 'false' THEN 'fixed'
              ELSE elem->>'value'
            END
          )
        -- For processing.group fields, remove hyphens from values
        WHEN elem->>'field' = 'processing.group' AND elem->>'value' LIKE '%-%' THEN
          elem || jsonb_build_object(
            'value', REPLACE(elem->>'value', '-', '')
          )
        -- For any other string values with hyphens in group-related fields
        WHEN elem->>'field' IN ('processing.group', 'bundleGroup', 'request.group') AND jsonb_typeof(elem->'value') = 'string' THEN
          elem || jsonb_build_object(
            'value', REPLACE(elem->>'value', '-', '')
          )
        -- Keep other conditions as-is
        ELSE elem
      END
    )
    FROM jsonb_array_elements(conditions) AS elem
  ),
  '[]'::jsonb  -- If jsonb_agg returns NULL (empty array), use empty array instead
)
WHERE jsonb_typeof(conditions) = 'array';

-- Log what we updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM pricing_rules
  WHERE conditions::text LIKE '%Standard%Unlimited%';
  
  RAISE NOTICE 'Updated % pricing rules to remove hyphens from bundle group names', updated_count;
END $$;