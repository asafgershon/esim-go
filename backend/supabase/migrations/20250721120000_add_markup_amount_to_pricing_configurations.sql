-- Add markup_amount field to pricing_configurations table
-- This allows for country+duration specific markup overrides

ALTER TABLE public.pricing_configurations 
ADD COLUMN markup_amount DECIMAL(10,2);

-- Add comment to explain the field
COMMENT ON COLUMN public.pricing_configurations.markup_amount IS 'Fixed markup amount in USD to add to base cost. NULL means use global markup from markup_config table.';

-- Create index for efficient queries on markup_amount
CREATE INDEX IF NOT EXISTS idx_pricing_configurations_markup_amount ON public.pricing_configurations(markup_amount) WHERE markup_amount IS NOT NULL;

-- Update the RLS policies to include the new column (they already work with dynamic columns)
-- No changes needed to existing policies as they use wildcard permissions