-- Migration to add provider column to catalog_bundles
ALTER TABLE catalog_bundles 
ADD COLUMN provider VARCHAR(255) NULL;

-- Add a comment to provide context
COMMENT ON COLUMN catalog_bundles.provider IS 'Source provider for the eSIM bundle (e.g., esim-go, airalo, maya)';

-- Optional: Add an index for better query performance when filtering by provider
CREATE INDEX idx_catalog_bundles_provider ON catalog_bundles(provider);