CREATE OR REPLACE VIEW bundles_by_group AS
SELECT 
  unnest(groups) as group_name,
  esim_go_name,
  name,
  description,
  validity_in_days,
  data_amount_mb,
  data_amount_readable,
  is_unlimited,
  price,
  currency,
  countries,
  region,
  speed
FROM catalog_bundles
WHERE groups IS NOT NULL AND array_length(groups, 1) > 0;

