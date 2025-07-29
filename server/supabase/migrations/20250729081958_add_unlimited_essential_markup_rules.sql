-- Migration to create markup rules for Standard Unlimited Essential packages
-- Using the same pricing structure as Standard Unlimited Lite for consistency
-- Formula:
-- Standard Unlimited Essential: 1d=$3, 3d=$5, 5d=$9, 7d=$12, 10d=$15, 15d=$17, 30d=$20

-- First, get any admin user ID to use as created_by, or create a system user
DO $$
DECLARE
  system_user_id UUID;
BEGIN
  -- Try to get an existing admin user
  SELECT id INTO system_user_id
  FROM auth.users
  WHERE raw_app_meta_data->>'role' = 'ADMIN'
  LIMIT 1;
  
  -- If no admin user exists, use a fixed UUID
  IF system_user_id IS NULL THEN
    system_user_id := '00000000-0000-0000-0000-000000000001'::uuid;
  END IF;

  -- Create markup rules for Standard Unlimited Essential
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
  -- 1 day Standard Unlimited Essential
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Essential - 1 day Markup',
    'Fixed markup of $3 for 1-day Standard Unlimited Essential bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Essential"'
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
    system_user_id
  ),
  -- 3 days Standard Unlimited Essential
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Essential - 3 days Markup',
    'Fixed markup of $5 for 3-day Standard Unlimited Essential bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Essential"'
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
    system_user_id
  ),
  -- 5 days Standard Unlimited Essential
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Essential - 5 days Markup',
    'Fixed markup of $9 for 5-day Standard Unlimited Essential bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Essential"'
      ),
      jsonb_build_object(
        'field', 'duration',
        'operator', 'EQUALS',
        'value', '5'
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
        'value', 9
      )
    ),
    50,
    true,
    true,
    system_user_id
  ),
  -- 7 days Standard Unlimited Essential
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Essential - 7 days Markup',
    'Fixed markup of $12 for 7-day Standard Unlimited Essential bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Essential"'
      ),
      jsonb_build_object(
        'field', 'duration',
        'operator', 'EQUALS',
        'value', '7'
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
        'value', 12
      )
    ),
    50,
    true,
    true,
    system_user_id
  ),
  -- 10 days Standard Unlimited Essential
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Essential - 10 days Markup',
    'Fixed markup of $15 for 10-day Standard Unlimited Essential bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Essential"'
      ),
      jsonb_build_object(
        'field', 'duration',
        'operator', 'EQUALS',
        'value', '10'
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
        'value', 15
      )
    ),
    50,
    true,
    true,
    system_user_id
  ),
  -- 15 days Standard Unlimited Essential
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Essential - 15 days Markup',
    'Fixed markup of $17 for 15-day Standard Unlimited Essential bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Essential"'
      ),
      jsonb_build_object(
        'field', 'duration',
        'operator', 'EQUALS',
        'value', '15'
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
        'value', 17
      )
    ),
    50,
    true,
    true,
    system_user_id
  ),
  -- 30 days Standard Unlimited Essential
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Essential - 30 days Markup',
    'Fixed markup of $20 for 30-day Standard Unlimited Essential bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Essential"'
      ),
      jsonb_build_object(
        'field', 'duration',
        'operator', 'EQUALS',
        'value', '30'
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
        'value', 20
      )
    ),
    50,
    true,
    true,
    system_user_id
  );
  
  RAISE NOTICE 'Created 7 Standard Unlimited Essential markup rules with user ID: %', system_user_id;
END $$;