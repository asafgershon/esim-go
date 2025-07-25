-- Fix bundles_by_country view - remove non-existent 'name' column
CREATE OR REPLACE VIEW bundles_by_country AS
SELECT 
  unnest(countries) as country_code,
  esim_go_name,
  description,
  groups,
  validity_in_days,
  data_amount_mb,
  data_amount_readable,
  is_unlimited,
  price,
  currency,
  region,
  speed
FROM catalog_bundles
WHERE countries IS NOT NULL AND array_length(countries, 1) > 0;