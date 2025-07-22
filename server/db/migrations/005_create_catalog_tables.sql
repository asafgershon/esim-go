-- Persistent catalog storage for eSIM Go bundles
CREATE TABLE catalog_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  esim_go_name VARCHAR NOT NULL UNIQUE,           -- Bundle name from eSIM Go API
  bundle_group VARCHAR,                           -- Standard Fixed, Standard - Unlimited, etc.
  description TEXT,                               -- Bundle description
  duration INTEGER,                               -- Duration in days
  data_amount BIGINT,                             -- Data amount in bytes (-1 for unlimited)
  unlimited BOOLEAN DEFAULT FALSE,                -- Whether bundle is unlimited
  price_cents INTEGER,                            -- Price in cents
  currency VARCHAR(3) DEFAULT 'USD',              -- Currency code
  countries JSONB,                                -- Array of supported countries
  regions JSONB,                                  -- Array of supported regions  
  metadata JSONB,                                 -- Additional bundle metadata from API
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Last time synced from eSIM Go
);

-- Catalog sync jobs tracking
CREATE TABLE catalog_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR NOT NULL,                      -- 'full-sync', 'country-sync', 'group-sync'
  status VARCHAR NOT NULL DEFAULT 'pending',      -- 'pending', 'running', 'completed', 'failed'
  priority VARCHAR NOT NULL DEFAULT 'normal',     -- 'high', 'normal', 'low'
  bundle_group VARCHAR,                           -- For group-specific syncs
  country_id VARCHAR,                             -- For country-specific syncs
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,                             -- Error details if failed
  bundles_processed INTEGER DEFAULT 0,           -- Number of bundles processed
  bundles_added INTEGER DEFAULT 0,               -- Number of new bundles added
  bundles_updated INTEGER DEFAULT 0,             -- Number of bundles updated
  metadata JSONB,                                -- Job-specific metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catalog metadata for sync tracking
CREATE TABLE catalog_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_version VARCHAR NOT NULL,                 -- Version identifier (e.g., "2024.12")
  last_full_sync TIMESTAMP WITH TIME ZONE,       -- Last successful full sync
  next_scheduled_sync TIMESTAMP WITH TIME ZONE,  -- Next scheduled sync
  bundle_groups JSONB,                           -- Available bundle groups
  total_bundles INTEGER DEFAULT 0,               -- Total number of bundles
  sync_strategy VARCHAR DEFAULT 'bundle-groups', -- 'bundle-groups' or 'pagination'
  api_health_status VARCHAR DEFAULT 'healthy',   -- 'healthy', 'degraded', 'down'
  last_health_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,                                -- Additional sync metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_catalog_bundles_bundle_group ON catalog_bundles(bundle_group);
CREATE INDEX idx_catalog_bundles_duration ON catalog_bundles(duration);
CREATE INDEX idx_catalog_bundles_unlimited ON catalog_bundles(unlimited);
CREATE INDEX idx_catalog_bundles_synced_at ON catalog_bundles(synced_at);
CREATE INDEX idx_catalog_bundles_countries ON catalog_bundles USING GIN(countries);

-- Sync jobs indexes
CREATE INDEX idx_catalog_sync_jobs_status ON catalog_sync_jobs(status);
CREATE INDEX idx_catalog_sync_jobs_type ON catalog_sync_jobs(job_type);
CREATE INDEX idx_catalog_sync_jobs_created_at ON catalog_sync_jobs(created_at);
CREATE INDEX idx_catalog_sync_jobs_bundle_group ON catalog_sync_jobs(bundle_group);

-- Metadata indexes
CREATE INDEX idx_catalog_metadata_sync_version ON catalog_metadata(sync_version);
CREATE INDEX idx_catalog_metadata_last_full_sync ON catalog_metadata(last_full_sync);

-- Update trigger for updated_at columns
CREATE TRIGGER update_catalog_bundles_updated_at BEFORE UPDATE
  ON catalog_bundles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_catalog_sync_jobs_updated_at BEFORE UPDATE
  ON catalog_sync_jobs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_catalog_metadata_updated_at BEFORE UPDATE
  ON catalog_metadata FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add constraints
ALTER TABLE catalog_sync_jobs ADD CONSTRAINT valid_job_status 
  CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'));

ALTER TABLE catalog_sync_jobs ADD CONSTRAINT valid_job_type 
  CHECK (job_type IN ('full-sync', 'country-sync', 'group-sync', 'bundle-sync'));

ALTER TABLE catalog_sync_jobs ADD CONSTRAINT valid_priority 
  CHECK (priority IN ('high', 'normal', 'low'));

ALTER TABLE catalog_metadata ADD CONSTRAINT valid_sync_strategy 
  CHECK (sync_strategy IN ('bundle-groups', 'pagination'));

ALTER TABLE catalog_metadata ADD CONSTRAINT valid_api_health_status 
  CHECK (api_health_status IN ('healthy', 'degraded', 'down'));

-- Function to search bundles by criteria
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

-- View for active sync jobs
CREATE VIEW active_sync_jobs AS
SELECT 
  csj.*,
  EXTRACT(EPOCH FROM (NOW() - csj.created_at)) / 60 as age_minutes,
  CASE 
    WHEN csj.status = 'running' AND csj.started_at < NOW() - INTERVAL '1 hour' 
    THEN TRUE 
    ELSE FALSE 
  END as is_stuck
FROM catalog_sync_jobs csj
WHERE csj.status IN ('pending', 'running')
ORDER BY 
  CASE csj.priority 
    WHEN 'high' THEN 1 
    WHEN 'normal' THEN 2 
    WHEN 'low' THEN 3 
  END,
  csj.created_at ASC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON catalog_bundles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON catalog_sync_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON catalog_metadata TO authenticated;
GRANT SELECT ON active_sync_jobs TO authenticated;
GRANT EXECUTE ON FUNCTION search_catalog_bundles TO authenticated;

-- Rollback commands (commented for safety)
-- DROP VIEW IF EXISTS active_sync_jobs;
-- DROP FUNCTION IF EXISTS search_catalog_bundles;
-- DROP TRIGGER IF EXISTS update_catalog_bundles_updated_at ON catalog_bundles;
-- DROP TRIGGER IF EXISTS update_catalog_sync_jobs_updated_at ON catalog_sync_jobs;
-- DROP TRIGGER IF EXISTS update_catalog_metadata_updated_at ON catalog_metadata;
-- DROP TABLE IF EXISTS catalog_bundles;
-- DROP TABLE IF EXISTS catalog_sync_jobs;
-- DROP TABLE IF EXISTS catalog_metadata;