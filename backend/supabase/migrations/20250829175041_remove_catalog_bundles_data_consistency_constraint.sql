-- Migration to fix data_amount column issues in catalog_bundles

-- Drop the unused data_amount column (we're keeping data_amount_mb)
ALTER TABLE catalog_bundles 
DROP COLUMN IF EXISTS data_amount;

-- The constraint will work properly now since we're only using data_amount_mb
-- Keep the constraint as it ensures data integrity:
-- - If is_unlimited = true, then data_amount_mb must be NULL
-- - If is_unlimited = false, then data_amount_mb must have a value