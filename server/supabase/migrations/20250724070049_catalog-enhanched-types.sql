-- eSIM Catalog In-Place Migration Script
-- Migrates the existing catalog_bundles table to new schema

-- Step 1: Add new columns to existing table
ALTER TABLE public.catalog_bundles 
  ADD COLUMN IF NOT EXISTS groups TEXT[] DEFAULT '{}';

ALTER TABLE public.catalog_bundles 
  ADD COLUMN IF NOT EXISTS validity_in_days INTEGER;

ALTER TABLE public.catalog_bundles 
  ADD COLUMN IF NOT EXISTS data_amount_mb BIGINT;

ALTER TABLE public.catalog_bundles 
  ADD COLUMN IF NOT EXISTS data_amount_readable VARCHAR(50);

ALTER TABLE public.catalog_bundles 
  ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN DEFAULT FALSE;

ALTER TABLE public.catalog_bundles 
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

ALTER TABLE public.catalog_bundles 
  ADD COLUMN IF NOT EXISTS region VARCHAR(100);

ALTER TABLE public.catalog_bundles 
  ADD COLUMN IF NOT EXISTS speed TEXT[] DEFAULT '{}';

-- Step 2: Create temporary column for countries if needed
ALTER TABLE public.catalog_bundles 
  ADD COLUMN IF NOT EXISTS countries_temp TEXT[] DEFAULT '{}';

-- Step 3: Update all the new columns with data
UPDATE catalog_bundles SET
  -- Convert single bundle_group to array
  groups = CASE 
    WHEN bundle_group IS NULL THEN '{}'::TEXT[]
    ELSE string_to_array(bundle_group, ',')::TEXT[]
  END,
  
  -- Copy duration to validity_in_days
  validity_in_days = COALESCE(duration, 1),
  
  -- Set data_amount_mb (NULL for unlimited)
  data_amount_mb = CASE 
    WHEN unlimited = TRUE THEN NULL
    ELSE data_amount
  END,
  
  -- Create human-readable data amount
  data_amount_readable = CASE 
    WHEN unlimited = TRUE THEN 'Unlimited'
    WHEN data_amount IS NULL THEN 'Unlimited'
    WHEN data_amount >= 1024 THEN CONCAT(ROUND(data_amount::NUMERIC / 1024, 1), 'GB')
    ELSE CONCAT(data_amount, 'MB')
  END,
  
  -- Set is_unlimited flag
  is_unlimited = COALESCE(unlimited, FALSE),
  
  -- Convert cents to decimal dollars
  price = COALESCE(price_cents, 0)::DECIMAL / 100,
  
  -- Extract primary region from JSONB
  region = CASE 
    WHEN regions IS NULL THEN NULL
    WHEN jsonb_typeof(regions) = 'array' AND jsonb_array_length(regions) > 0 THEN 
      regions->0->>'name'
    WHEN jsonb_typeof(regions) = 'object' THEN 
      regions->>'primary'
    ELSE NULL
  END,
  
  -- Extract speed from metadata or default
  speed = CASE 
    WHEN metadata->>'speeds' IS NOT NULL THEN 
      ARRAY(SELECT jsonb_array_elements_text(metadata->'speeds'))
    WHEN metadata->>'network_types' IS NOT NULL THEN 
      ARRAY(SELECT jsonb_array_elements_text(metadata->'network_types'))
    WHEN unlimited = TRUE THEN ARRAY['3G', '4G', '5G']::TEXT[]
    ELSE ARRAY['3G', '4G']::TEXT[]
  END,
  
  -- Handle countries - convert JSONB to TEXT array in temp column
  countries_temp = CASE 
    WHEN countries IS NULL THEN '{}'::TEXT[]
    WHEN pg_typeof(countries) = 'jsonb'::regtype THEN 
      ARRAY(SELECT jsonb_array_elements_text(countries::jsonb))
    ELSE '{}'::TEXT[]
  END
WHERE TRUE; -- Ensure UPDATE runs even if some columns don't exist

-- Step 4: Drop old countries column if it's JSONB and rename temp
-- First check and drop if exists
ALTER TABLE catalog_bundles DROP COLUMN IF EXISTS countries;

-- Rename temp to countries
ALTER TABLE catalog_bundles RENAME COLUMN countries_temp TO countries;

-- Step 5: Drop the existing primary key constraint if it exists
ALTER TABLE catalog_bundles DROP CONSTRAINT IF EXISTS catalog_bundles_pkey;

-- Step 6: Add primary key constraint to esim_go_name
ALTER TABLE catalog_bundles ADD CONSTRAINT catalog_bundles_pkey PRIMARY KEY (esim_go_name);

-- Step 7: Add new constraints
ALTER TABLE catalog_bundles DROP CONSTRAINT IF EXISTS catalog_bundles_validity_check;
ALTER TABLE catalog_bundles ADD CONSTRAINT catalog_bundles_validity_check CHECK (validity_in_days > 0);

ALTER TABLE catalog_bundles DROP CONSTRAINT IF EXISTS catalog_bundles_price_check;
ALTER TABLE catalog_bundles ADD CONSTRAINT catalog_bundles_price_check CHECK (price >= 0);

ALTER TABLE catalog_bundles DROP CONSTRAINT IF EXISTS catalog_bundles_data_consistency;
ALTER TABLE catalog_bundles ADD CONSTRAINT catalog_bundles_data_consistency CHECK (
  (is_unlimited = TRUE AND data_amount_mb IS NULL) OR
  (is_unlimited = FALSE AND data_amount_mb IS NOT NULL)
);

-- Step 8: Create indexes
DROP INDEX IF EXISTS idx_catalog_bundles_groups;
CREATE INDEX idx_catalog_bundles_groups ON catalog_bundles USING GIN (groups);

DROP INDEX IF EXISTS idx_catalog_bundles_countries;
CREATE INDEX idx_catalog_bundles_countries ON catalog_bundles USING GIN (countries);

DROP INDEX IF EXISTS idx_catalog_bundles_region;
CREATE INDEX idx_catalog_bundles_region ON catalog_bundles (region);

DROP INDEX IF EXISTS idx_catalog_bundles_validity;
CREATE INDEX idx_catalog_bundles_validity ON catalog_bundles (validity_in_days);

DROP INDEX IF EXISTS idx_catalog_bundles_price;
CREATE INDEX idx_catalog_bundles_price ON catalog_bundles (price);

DROP INDEX IF EXISTS idx_catalog_bundles_unlimited;
CREATE INDEX idx_catalog_bundles_unlimited ON catalog_bundles (is_unlimited);

DROP INDEX IF EXISTS idx_catalog_bundles_speed;
CREATE INDEX idx_catalog_bundles_speed ON catalog_bundles USING GIN (speed);

-- Step 9: Create or replace update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 10: Create trigger if not exists
DROP TRIGGER IF EXISTS update_catalog_bundles_updated_at ON catalog_bundles;
CREATE TRIGGER update_catalog_bundles_updated_at 
  BEFORE UPDATE ON catalog_bundles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Verify migration (optional - comment out if causes issues)
SELECT 
  COUNT(*) as total_bundles,
  COUNT(CASE WHEN is_unlimited THEN 1 END) as unlimited_bundles,
  COUNT(CASE WHEN array_length(groups, 1) > 0 THEN 1 END) as bundles_with_groups,
  COUNT(CASE WHEN array_length(countries, 1) > 0 THEN 1 END) as bundles_with_countries,
  MIN(price) as min_price,
  MAX(price) as max_price,
  AVG(price)::DECIMAL(10,2) as avg_price
FROM catalog_bundles;

-- Step 12: Drop old columns (CAREFUL - only uncomment after verifying data is correct)
/*
ALTER TABLE catalog_bundles 
  DROP COLUMN IF EXISTS id,
  DROP COLUMN IF EXISTS bundle_group,
  DROP COLUMN IF EXISTS duration,
  DROP COLUMN IF EXISTS data_amount,
  DROP COLUMN IF EXISTS unlimited,
  DROP COLUMN IF EXISTS price_cents,
  DROP COLUMN IF EXISTS regions,
  DROP COLUMN IF EXISTS metadata;
*/