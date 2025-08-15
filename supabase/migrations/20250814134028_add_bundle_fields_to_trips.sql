-- Add bundle_name and title fields to trips table
-- This migration transitions trips to be 1:1 with bundles from the catalog

-- Add new columns
ALTER TABLE trips 
ADD COLUMN bundle_name VARCHAR NOT NULL DEFAULT '',
ADD COLUMN title VARCHAR NOT NULL DEFAULT '';

-- Update existing trips to have bundle_name and title (temporary defaults)
-- This allows for smooth migration without breaking existing data
UPDATE trips 
SET bundle_name = 'temp-' || id::text,
    title = name
WHERE bundle_name = '' OR title = '';

-- Note: region_id and country_ids will be derived from the selected bundle
-- We keep them for now to maintain backward compatibility during transition
-- They will be removed in a future migration once the frontend is updated

-- Add indexes for performance
CREATE INDEX idx_trips_bundle_name ON trips(bundle_name);
CREATE INDEX idx_trips_title ON trips(title);

-- Add foreign key constraint to ensure bundle_name exists in catalog_bundles
-- Note: This is commented out for now to allow smooth transition
-- ALTER TABLE trips 
-- ADD CONSTRAINT fk_trips_bundle_name 
-- FOREIGN KEY (bundle_name) REFERENCES catalog_bundles(esim_go_name);