-- Modify pricing_blocks table schema

-- Add new columns
ALTER TABLE pricing_blocks 
ADD COLUMN event_type TEXT DEFAULT 'default', 
ADD COLUMN params JSONB;

-- Migrate data from action column
UPDATE pricing_blocks 
SET 
    event_type = (action->>'type')::TEXT,
    params = (action->>'params')::JSONB;

-- Ensure event_type is not null
UPDATE pricing_blocks 
SET event_type = 'default' 
WHERE event_type IS NULL;

-- Modify event_type to NOT NULL
ALTER TABLE pricing_blocks 
ALTER COLUMN event_type SET NOT NULL;

-- Drop the original action column if no longer needed
ALTER TABLE pricing_blocks 
DROP COLUMN action;