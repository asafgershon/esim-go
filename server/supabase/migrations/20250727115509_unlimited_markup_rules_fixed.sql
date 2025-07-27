-- Migration to create markup rules for unlimited packages based on bundle group and duration
-- Formula:
-- Standard Unlimited Lite: 1d=$3, 3d=$5, 5d=$9, 7d=$12, 10d=$15, 15d=$17, 30d=$20
-- Standard Unlimited Plus: 1d=$4, 3d=$6, 5d=$10, 7d=$13, 10d=$16, 15d=$18, 30d=$21

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
    system_user_id
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
    system_user_id
  ),
  -- 5 days Standard Unlimited Lite
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Lite - 5 days Markup',
    'Fixed markup of $9 for 5-day Standard Unlimited Lite bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Lite"'
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
  -- 7 days Standard Unlimited Lite
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Lite - 7 days Markup',
    'Fixed markup of $12 for 7-day Standard Unlimited Lite bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Lite"'
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
  -- 10 days Standard Unlimited Lite
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Lite - 10 days Markup',
    'Fixed markup of $15 for 10-day Standard Unlimited Lite bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Lite"'
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
  -- 15 days Standard Unlimited Lite
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Lite - 15 days Markup',
    'Fixed markup of $17 for 15-day Standard Unlimited Lite bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Lite"'
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
  -- 30 days Standard Unlimited Lite
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Lite - 30 days Markup',
    'Fixed markup of $20 for 30-day Standard Unlimited Lite bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Lite"'
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

  -- Create markup rules for Standard Unlimited Plus
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
  -- 1 day Standard Unlimited Plus
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Plus - 1 day Markup',
    'Fixed markup of $4 for 1-day Standard Unlimited Plus bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Plus"'
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
        'value', 4
      )
    ),
    50,
    true,
    true,
    system_user_id
  ),
  -- 3 days Standard Unlimited Plus
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Plus - 3 days Markup',
    'Fixed markup of $6 for 3-day Standard Unlimited Plus bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Plus"'
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
        'value', 6
      )
    ),
    50,
    true,
    true,
    system_user_id
  ),
  -- 5 days Standard Unlimited Plus
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Plus - 5 days Markup',
    'Fixed markup of $10 for 5-day Standard Unlimited Plus bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Plus"'
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
        'value', 10
      )
    ),
    50,
    true,
    true,
    system_user_id
  ),
  -- 7 days Standard Unlimited Plus
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Plus - 7 days Markup',
    'Fixed markup of $13 for 7-day Standard Unlimited Plus bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Plus"'
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
        'value', 13
      )
    ),
    50,
    true,
    true,
    system_user_id
  ),
  -- 10 days Standard Unlimited Plus
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Plus - 10 days Markup',
    'Fixed markup of $16 for 10-day Standard Unlimited Plus bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Plus"'
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
        'value', 16
      )
    ),
    50,
    true,
    true,
    system_user_id
  ),
  -- 15 days Standard Unlimited Plus
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Plus - 15 days Markup',
    'Fixed markup of $18 for 15-day Standard Unlimited Plus bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Plus"'
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
        'value', 18
      )
    ),
    50,
    true,
    true,
    system_user_id
  ),
  -- 30 days Standard Unlimited Plus
  (
    'BUNDLE_ADJUSTMENT',
    'Standard Unlimited Plus - 30 days Markup',
    'Fixed markup of $21 for 30-day Standard Unlimited Plus bundles',
    jsonb_build_array(
      jsonb_build_object(
        'field', 'bundleGroup',
        'operator', 'EQUALS',
        'value', '"Standard - Unlimited Plus"'
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
        'value', 21
      )
    ),
    50,
    true,
    true,
    system_user_id
  );
  
  RAISE NOTICE 'Created 14 unlimited package markup rules with user ID: %', system_user_id;
END $$;