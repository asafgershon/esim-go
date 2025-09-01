-- ============================================================================
-- Apply All Default Pricing Rules and Strategies
-- ============================================================================
-- This script applies all default pricing rules and strategies in the correct order
-- It is idempotent and can be run multiple times safely
-- ============================================================================

-- First, ensure the required tables exist
-- Note: These should already exist from your migrations

-- Step 1: Set up the default pricing strategy
\echo 'Setting up default pricing strategy...'
\i pricing-strategies/001-create-default-strategy.sql

-- Step 2: Apply Pricing Blocks in priority order (highest to lowest priority)
\echo 'Applying pricing blocks...'

\echo '  1. Provider Selection (Priority 100)...'
\i pricing-rules/009-provider-selection.sql

\echo '  2. Cost Block (Priority 99)...'
\i pricing-rules/001-cost-base.sql

\echo '  3. Unlimited Bundle Markup (Priority 90)...'
\i pricing-rules/003-bundle-markup-matrix.sql

\echo '  4. Unused Days Discount (Priority 80)...'
\i pricing-rules/007-unused-days-discount.sql

\echo '  5. Processing Fee Matrix (Priority 40)...'
\i pricing-rules/004-processing-fee-matrix.sql

\echo '  6. Minimum Profit Protection (Priority 20)...'
\i pricing-rules/002-keep-profit-standard.sql

\echo '  7. Psychological Rounding (Priority 10)...'
\i pricing-rules/005-psychological-rounding.sql

\echo '  8. Region Rounding (Priority 5)...'
\i pricing-rules/006-region-rounding.sql

\echo '  9. Fixed Price Ukraine (Priority 1)...'
\i pricing-rules/008-fixed-price-ukraine.sql

\echo 'All pricing blocks have been applied successfully!'

-- Step 3: Associate blocks with the default strategy
\echo ''
\echo 'Associating pricing blocks with default strategy...'
\i pricing-strategies/002-associate-blocks-with-strategy.sql

-- Step 4: Verify everything was applied correctly
\echo ''
\echo 'Verification Results:'
\echo '===================='
SELECT 'Active Strategies:' as type, COUNT(*) as count FROM pricing_strategies WHERE is_enabled = true
UNION ALL
SELECT 'Default Strategies:' as type, COUNT(*) as count FROM pricing_strategies WHERE is_default = true  
UNION ALL
SELECT 'Active Pricing Blocks:' as type, COUNT(*) as count FROM pricing_blocks WHERE is_active = true
UNION ALL  
SELECT 'Strategy-Block Links:' as type, COUNT(*) as count FROM strategy_blocks WHERE is_enabled = true;

\echo ''
\echo '✅ Default pricing rules and strategy setup completed successfully!'