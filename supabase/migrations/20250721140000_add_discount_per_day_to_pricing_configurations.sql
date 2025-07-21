-- Add discount_per_day field to pricing_configurations table
-- This allows for country+bundle specific discount rate overrides for unused days

ALTER TABLE public.pricing_configurations 
ADD COLUMN discount_per_day DECIMAL(5,4) DEFAULT 0.10 CHECK (discount_per_day >= 0 AND discount_per_day <= 1);

-- Add comment to explain the field
COMMENT ON COLUMN public.pricing_configurations.discount_per_day IS 'Discount rate per unused day as decimal (0.10 = 10% per unused day). Can be overridden per country/bundle. Default is 0.10 (10%).';

-- Create index for efficient queries on discount_per_day
CREATE INDEX IF NOT EXISTS idx_pricing_configurations_discount_per_day ON public.pricing_configurations(discount_per_day) WHERE discount_per_day IS NOT NULL;

-- Update default pricing configuration to include explicit discount_per_day
UPDATE public.pricing_configurations 
SET discount_per_day = 0.10 
WHERE name = 'Default Global Pricing' AND discount_per_day IS NULL;