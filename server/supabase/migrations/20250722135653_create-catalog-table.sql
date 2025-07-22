-- Drop existing tables if they exist
DROP TABLE IF EXISTS catalog_bundles CASCADE;
DROP TABLE IF EXISTS catalog_sync_jobs CASCADE;
DROP TABLE IF EXISTS catalog_metadata CASCADE;

-- Create catalog_bundles table
CREATE TABLE catalog_bundles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bundle_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    bundle_group VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    data_amount INTEGER,
    unlimited BOOLEAN DEFAULT false,
    duration INTEGER NOT NULL,
    countries JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create catalog_sync_jobs table
CREATE TABLE catalog_sync_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    bundle_group VARCHAR(255),
    country_id VARCHAR(10),
    bundles_processed INTEGER DEFAULT 0,
    bundles_added INTEGER DEFAULT 0,
    bundles_updated INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create catalog_metadata table
CREATE TABLE catalog_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sync_version VARCHAR(20),
    last_full_sync TIMESTAMPTZ,
    next_scheduled_sync TIMESTAMPTZ,
    bundle_groups TEXT[],
    total_bundles INTEGER DEFAULT 0,
    sync_strategy VARCHAR(50) DEFAULT 'bundle-groups',
    api_health_status VARCHAR(20) DEFAULT 'healthy',
    last_health_check TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_catalog_bundles_bundle_id ON catalog_bundles(bundle_id);
CREATE INDEX idx_catalog_bundles_bundle_group ON catalog_bundles(bundle_group);
CREATE INDEX idx_catalog_bundles_duration ON catalog_bundles(duration);
CREATE INDEX idx_catalog_bundles_countries ON catalog_bundles USING GIN(countries);

CREATE INDEX idx_catalog_sync_jobs_status ON catalog_sync_jobs(status);
CREATE INDEX idx_catalog_sync_jobs_job_type ON catalog_sync_jobs(job_type);
CREATE INDEX idx_catalog_sync_jobs_created_at ON catalog_sync_jobs(created_at);

-- Enable Row Level Security
ALTER TABLE catalog_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, restrict later as needed)
CREATE POLICY "Allow all on catalog_bundles" ON catalog_bundles FOR ALL USING (true);
CREATE POLICY "Allow all on catalog_sync_jobs" ON catalog_sync_jobs FOR ALL USING (true);
CREATE POLICY "Allow all on catalog_metadata" ON catalog_metadata FOR ALL USING (true);