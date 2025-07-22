-- Fix catalog schema alignment between workers and server
-- Workers expect different column names and types

-- Drop the existing catalog_bundles table and recreate with worker-expected schema
DROP TABLE IF EXISTS catalog_bundles;

-- Create catalog_bundles table with worker-expected schema
CREATE TABLE catalog_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  esim_go_name VARCHAR NOT NULL UNIQUE,           -- Bundle name from eSIM Go API (worker expects this name)
  bundle_group VARCHAR,                           -- Standard Fixed, Standard - Unlimited, etc.
  description TEXT,                               -- Bundle description
  duration INTEGER,                               -- Duration in days
  data_amount BIGINT,                             -- Data amount in bytes (-1 for unlimited) - worker expects bytes
  unlimited BOOLEAN DEFAULT FALSE,                -- Whether bundle is unlimited
  price_cents INTEGER,                            -- Price in cents (worker expects integer cents)
  currency VARCHAR(3) DEFAULT 'USD',              -- Currency code
  countries JSONB,                                -- Array of supported countries
  regions JSONB,                                  -- Array of supported regions  
  metadata JSONB,                                 -- Additional bundle metadata from API
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Last time synced from eSIM Go
);

-- Recreate indexes
CREATE INDEX idx_catalog_bundles_esim_go_name ON catalog_bundles(esim_go_name);
CREATE INDEX idx_catalog_bundles_bundle_group ON catalog_bundles(bundle_group);
CREATE INDEX idx_catalog_bundles_duration ON catalog_bundles(duration);
CREATE INDEX idx_catalog_bundles_unlimited ON catalog_bundles(unlimited);
CREATE INDEX idx_catalog_bundles_synced_at ON catalog_bundles(synced_at);
CREATE INDEX idx_catalog_bundles_countries ON catalog_bundles USING GIN(countries);

-- Recreate trigger
CREATE TRIGGER update_catalog_bundles_updated_at BEFORE UPDATE
  ON catalog_bundles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Update the search function to use correct column name
DROP FUNCTION IF EXISTS search_catalog_bundles;

CREATE OR REPLACE FUNCTION search_catalog_bundles(
  p_countries TEXT[] DEFAULT NULL,
  p_bundle_groups TEXT[] DEFAULT NULL,
  p_min_duration INTEGER DEFAULT NULL,
  p_max_duration INTEGER DEFAULT NULL,
  p_unlimited BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  esim_go_name VARCHAR,
  bundle_group VARCHAR,
  description TEXT,
  duration INTEGER,
  data_amount BIGINT,
  unlimited BOOLEAN,
  price_cents INTEGER,
  currency VARCHAR,
  countries JSONB,
  regions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cb.id,
    cb.esim_go_name,
    cb.bundle_group,
    cb.description,
    cb.duration,
    cb.data_amount,
    cb.unlimited,
    cb.price_cents,
    cb.currency,
    cb.countries,
    cb.regions
  FROM catalog_bundles cb
  WHERE 
    (p_countries IS NULL OR cb.countries ?| p_countries) AND
    (p_bundle_groups IS NULL OR cb.bundle_group = ANY(p_bundle_groups)) AND
    (p_min_duration IS NULL OR cb.duration >= p_min_duration) AND
    (p_max_duration IS NULL OR cb.duration <= p_max_duration) AND
    (p_unlimited IS NULL OR cb.unlimited = p_unlimited)
  ORDER BY cb.duration ASC, cb.data_amount ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON catalog_bundles TO authenticated;
GRANT EXECUTE ON FUNCTION search_catalog_bundles TO authenticated;