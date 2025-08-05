-- Link newly created pricing blocks to the existing default strategy
-- This script adds our 10 new blocks to the existing strategy

-- First, let's see which blocks are NOT already in the strategy
WITH new_blocks AS (
    SELECT pb.* 
    FROM pricing_blocks pb
    WHERE pb.is_active = true
    AND pb.id NOT IN (
        SELECT block_id 
        FROM strategy_blocks 
        WHERE strategy_id = 'e3d1840a-c16b-4ecb-88a8-e3af47ce2653'
    )
)
SELECT id, name, category, priority FROM new_blocks ORDER BY priority DESC;

-- Now link the new blocks to the strategy
-- We'll adjust priorities to avoid conflicts
INSERT INTO strategy_blocks (
    strategy_id,
    block_id,
    is_enabled,
    priority,
    config_overrides
)
SELECT 
    'e3d1840a-c16b-4ecb-88a8-e3af47ce2653' as strategy_id,
    pb.id as block_id,
    true as is_enabled,
    -- Adjust priority to avoid conflicts
    CASE 
        WHEN pb.priority = 100 AND pb.category = 'discount' THEN 110
        WHEN pb.priority = 100 AND pb.category = 'fixed-price' THEN 120
        WHEN pb.priority = 100 AND pb.category = 'cost' THEN 130
        WHEN pb.priority = 100 AND pb.category = 'keep-profit' THEN 140
        WHEN pb.priority = 100 AND pb.category = 'region-rounding' THEN 150
        WHEN pb.priority = 85 THEN 850  -- unused-days
        WHEN pb.priority = 50 THEN 550  -- markup
        WHEN pb.priority = 30 THEN 400  -- processing-fee
        WHEN pb.priority = 1 THEN 100   -- psychological-rounding
        ELSE pb.priority
    END as priority,
    '{}'::jsonb as config_overrides
FROM pricing_blocks pb
WHERE pb.is_active = true
AND pb.id NOT IN (
    SELECT block_id 
    FROM strategy_blocks 
    WHERE strategy_id = 'e3d1840a-c16b-4ecb-88a8-e3af47ce2653'
)
ON CONFLICT (strategy_id, block_id) DO NOTHING;

-- Verify the updated strategy
SELECT 
    ps.name as strategy_name,
    COUNT(sb.id) as total_blocks,
    COUNT(CASE WHEN sb.is_enabled THEN 1 END) as enabled_blocks
FROM pricing_strategies ps
LEFT JOIN strategy_blocks sb ON ps.id = sb.strategy_id
WHERE ps.id = 'e3d1840a-c16b-4ecb-88a8-e3af47ce2653'
GROUP BY ps.id, ps.name;

-- Show all blocks in the strategy
SELECT 
    pb.name,
    pb.category,
    sb.priority,
    sb.is_enabled,
    pb.action->>'type' as action_type
FROM strategy_blocks sb
JOIN pricing_blocks pb ON sb.block_id = pb.id
WHERE sb.strategy_id = 'e3d1840a-c16b-4ecb-88a8-e3af47ce2653'
ORDER BY sb.priority DESC;