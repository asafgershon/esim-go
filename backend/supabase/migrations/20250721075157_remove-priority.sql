-- Remove priority field from pricing_configurations table
-- Simplifying to non-overlapping specific rules vs global config

-- First, drop the index that uses priority
DROP INDEX IF EXISTS idx_pricing_configurations_active_priority;

-- Remove the priority column
ALTER TABLE public.pricing_configurations 
DROP COLUMN IF EXISTS priority;

-- Recreate the index without priority (just for active configs)
CREATE INDEX IF NOT EXISTS idx_pricing_configurations_active 
ON public.pricing_configurations(is_active) 
WHERE is_active = true;