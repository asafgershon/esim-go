-- Migration to create markup rules for unlimited packages based on bundle group and duration
-- IMPORTANT: Replace 'YOUR-ADMIN-USER-ID-HERE' with an actual admin user UUID from your auth.users table

-- Create markup rules for Standard Unlimited Lite
INSERT INTO pricing_rules (
  category, 
  name, 
  description, 
  conditions, 
  actions, 
  priority, 
  is_active, 
  is_editable,
  created_by
) VALUES
-- 1 day Standard Unlimited Lite
(
  'BUNDLE_ADJUSTMENT',
  'Standard Unlimited Lite - 1 day Markup',
  'Fixed markup of $3 for 1-day Standard Unlimited Lite bundles',
  jsonb_build_array(
    jsonb_build_object(
      'field', 'bundleGroup',
      'operator', 'EQUALS',
      'value', '"Standard - Unlimited Lite"'
    ),
    jsonb_build_object(
      'field', 'duration',
      'operator', 'EQUALS',
      'value', '1'
    ),
    jsonb_build_object(
      'field', 'isUnlimited',
      'operator', 'EQUALS',
      'value', 'true'
    )
  ),
  jsonb_build_array(
    jsonb_build_object(
      'type', 'ADD_MARKUP',
      'value', 3
    )
  ),
  50,
  true,
  true,
  'YOUR-ADMIN-USER-ID-HERE'::uuid -- Replace with actual admin user ID
),
-- 3 days Standard Unlimited Lite
(
  'BUNDLE_ADJUSTMENT',
  'Standard Unlimited Lite - 3 days Markup',
  'Fixed markup of $5 for 3-day Standard Unlimited Lite bundles',
  jsonb_build_array(
    jsonb_build_object(
      'field', 'bundleGroup',
      'operator', 'EQUALS',
      'value', '"Standard - Unlimited Lite"'
    ),
    jsonb_build_object(
      'field', 'duration',
      'operator', 'EQUALS',
      'value', '3'
    ),
    jsonb_build_object(
      'field', 'isUnlimited',
      'operator', 'EQUALS',
      'value', 'true'
    )
  ),
  jsonb_build_array(
    jsonb_build_object(
      'type', 'ADD_MARKUP',
      'value', 5
    )
  ),
  50,
  true,
  true,
  'YOUR-ADMIN-USER-ID-HERE'::uuid -- Replace with actual admin user ID
);

-- Continue with the rest of the rules...