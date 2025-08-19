-- Update pricing rules to check against selected bundle duration instead of request duration
-- This ensures markup rules apply correctly even when requested days don't exactly match bundle duration

-- Update field paths from request.duration to processing.selectedBundle.validityInDays
UPDATE pricing_rules 
SET conditions = (
  SELECT jsonb_agg(
    CASE 
      WHEN condition->>'field' = 'request.duration' 
      THEN jsonb_set(condition, '{field}', '"processing.selectedBundle.validityInDays"')
      ELSE condition
    END
  )
  FROM jsonb_array_elements(conditions) AS condition
)
WHERE conditions IS NOT NULL 
  AND jsonb_typeof(conditions) = 'array'
  AND conditions::text LIKE '%request.duration%';

-- Verify the update by showing affected rules
DO $$
DECLARE
  rule_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rule_count
  FROM pricing_rules 
  WHERE conditions::text LIKE '%processing.selectedBundle.validityInDays%';
  
  RAISE NOTICE 'Updated % pricing rules to use processing.selectedBundle.validityInDays', rule_count;
END $$;