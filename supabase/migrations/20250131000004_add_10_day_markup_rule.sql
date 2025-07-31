-- Add 10-day markup rule for Standard Unlimited Essential
-- This ensures that when users request 9 days but get a 10-day bundle, markup is still applied

INSERT INTO pricing_rules (
  id,
  name,
  category,
  conditions,
  actions,
  is_active,
  created_by,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Standard Unlimited Essential - 10 days Markup',
  'BUNDLE_ADJUSTMENT',
  '[
    {
      "field": "processing.group",
      "operator": "EQUALS",
      "value": "Standard Unlimited Essential"
    },
    {
      "field": "processing.selectedBundle.validityInDays",
      "operator": "EQUALS",
      "value": 10
    }
  ]',
  '[
    {
      "type": "ADD_MARKUP",
      "value": 15
    }
  ]',
  true,
  'system',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  conditions = EXCLUDED.conditions,
  actions = EXCLUDED.actions,
  updated_at = NOW();

-- Also add a 1-day markup rule for completeness
INSERT INTO pricing_rules (
  id,
  name,
  category,
  conditions,
  actions,
  is_active,
  created_by,
  created_at,
  updated_at
) VALUES (
  'rule-standard-unlimited-essential-1d-markup',
  'Standard Unlimited Essential - 1 day Markup',
  'BUNDLE_ADJUSTMENT',
  '[
    {
      "field": "processing.group",
      "operator": "EQUALS",
      "value": "Standard Unlimited Essential"
    },
    {
      "field": "processing.selectedBundle.validityInDays",
      "operator": "EQUALS",
      "value": 1
    }
  ]',
  '[
    {
      "type": "ADD_MARKUP",
      "value": 8
    }
  ]',
  true,
  'system',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  conditions = EXCLUDED.conditions,
  actions = EXCLUDED.actions,
  updated_at = NOW();