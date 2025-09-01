-- ============================================================================
-- Default Rules: Associate Pricing Blocks with Default Strategy
-- ============================================================================
-- Description: Links all active pricing blocks with the default strategy
-- Category: STRATEGY_SETUP
-- Priority: N/A (setup script)
-- Created: 2025-09-01
-- ============================================================================

-- Associate all pricing blocks with the default strategy
INSERT INTO strategy_blocks (strategy_id, block_id, priority, is_enabled, created_at, updated_at)
SELECT 
  (SELECT id FROM pricing_strategies WHERE is_default = true LIMIT 1) as strategy_id,
  pb.id as block_id,
  pb.priority,
  pb.is_active as is_enabled,
  NOW() as created_at,
  NOW() as updated_at
FROM pricing_blocks pb
WHERE pb.is_active = true
ON CONFLICT (strategy_id, block_id) DO UPDATE SET
  priority = EXCLUDED.priority,
  is_enabled = EXCLUDED.is_enabled,
  updated_at = NOW();