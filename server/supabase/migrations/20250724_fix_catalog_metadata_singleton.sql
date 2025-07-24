-- Fix catalog_metadata table to use singleton pattern
-- The workers expect a single row with id = 'singleton'

-- Drop the existing table
DROP TABLE IF EXISTS catalog_metadata CASCADE;

-- Recreate with VARCHAR id for singleton pattern
CREATE TABLE catalog_metadata (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'singleton',
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT catalog_metadata_singleton_check CHECK (id = 'singleton')
);

-- Enable Row Level Security
ALTER TABLE catalog_metadata ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all on catalog_metadata" ON catalog_metadata FOR ALL USING (true);

-- Insert initial singleton row
INSERT INTO catalog_metadata (id) VALUES ('singleton') ON CONFLICT (id) DO NOTHING;