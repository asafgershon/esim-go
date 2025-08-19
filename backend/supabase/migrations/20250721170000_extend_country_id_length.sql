-- Extend country_id column to support both ISO alpha-2 and alpha-3 codes
-- This fixes the issue where 3-character codes like 'CYP' were being rejected

-- Alter the country_id column to allow up to 3 characters
ALTER TABLE public.high_demand_countries 
ALTER COLUMN country_id TYPE VARCHAR(3);

-- Update the comment to reflect the change
COMMENT ON COLUMN public.high_demand_countries.country_id IS 'ISO country code - supports both alpha-2 (US, GB) and alpha-3 (CYP, USA) formats';