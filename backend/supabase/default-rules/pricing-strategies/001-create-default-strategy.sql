-- ============================================================================
-- Default Rules: Create Default Pricing Strategy
-- ============================================================================
-- Description: Creates the default global pricing strategy for use with default rules
-- Category: STRATEGY_SETUP
-- Priority: N/A (setup script)
-- Created: 2025-09-01
-- ============================================================================

-- Insert the default pricing strategy
INSERT INTO pricing_strategies (
  id, 
  name, 
  description, 
  is_default, 
  is_enabled,
  created_at,
  updated_at
) VALUES (
  'default-global-strategy-2025'::uuid,
  'Default Global Pricing Strategy',
  'Standard pricing with Maya provider preference, markup matrix, psychological rounding, and profit protection',
  true,
  true,
  NOW(),
  NOW()
) 
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  is_default = EXCLUDED.is_default,
  is_enabled = EXCLUDED.is_enabled,
  updated_at = NOW();

-- Ensure only one default strategy exists
UPDATE pricing_strategies 
SET is_default = false, updated_at = NOW()
WHERE name != 'Default Global Pricing Strategy' AND is_default = true;