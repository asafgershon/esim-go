-- Remove processing_rate column from pricing_configurations table
-- Processing fees are now handled by the dedicated processing_fee_configurations table

ALTER TABLE public.pricing_configurations 
DROP COLUMN IF EXISTS processing_rate;