-- Create Default Pricing Strategy
-- This script creates a default strategy and links all existing pricing blocks to it

-- First, create the default strategy
INSERT INTO pricing_strategies (
    id,
    code,
    name,
    description,
    is_default,
    version,
    created_by,
    validated_at
) VALUES (
    'def00000-0000-0000-0000-000000000001',
    'DEFAULT_V1',
    'Default Pricing Strategy',
    'The default pricing strategy based on the original rules-engine-2 implementation. Includes base cost initialization, markups, processing fees, discounts, and rounding rules.',
    true,
    1,
    '00000000-0000-0000-0000-000000000000', -- System user
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Link all active pricing blocks to the default strategy
-- We'll maintain the original priorities from the blocks
INSERT INTO strategy_blocks (
    strategy_id,
    block_id,
    is_enabled,
    priority,
    config_overrides
)
SELECT 
    'def00000-0000-0000-0000-000000000001' as strategy_id,
    pb.id as block_id,
    true as is_enabled,
    pb.priority,
    '{}'::jsonb as config_overrides
FROM pricing_blocks pb
WHERE pb.is_active = true
ON CONFLICT (strategy_id, block_id) DO NOTHING;

-- Update any existing default strategies to not be default
UPDATE pricing_strategies 
SET is_default = false 
WHERE id != 'def00000-0000-0000-0000-000000000001' 
AND is_default = true;

-- Verify the strategy was created
SELECT 
    ps.name as strategy_name,
    ps.code as strategy_code,
    ps.is_default,
    COUNT(sb.id) as block_count
FROM pricing_strategies ps
LEFT JOIN strategy_blocks sb ON ps.id = sb.strategy_id
WHERE ps.id = 'def00000-0000-0000-0000-000000000001'
GROUP BY ps.id, ps.name, ps.code, ps.is_default;