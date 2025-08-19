
-- Remove cost_split_percent column from pricing_configurations table
-- This will also automatically drop the associated check constraint

ALTER TABLE public.pricing_configurations 
DROP COLUMN IF EXISTS cost_split_percent;