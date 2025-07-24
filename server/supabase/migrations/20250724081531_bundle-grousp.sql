-- 1. Create a view that unnests groups (flattens the array)
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

CREATE OR REPLACE FUNCTION get_bundles_by_groups()
RETURNS TABLE (
  group_name text,
  bundles jsonb,
  bundle_count bigint,
  min_price numeric,
  max_price numeric,
  avg_price numeric,
  countries_count bigint,
  has_unlimited boolean
)


-- 4. Optimized function using lateral joins (more efficient)
CREATE OR REPLACE FUNCTION get_bundle_groups_optimized()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  WITH bundle_groups AS (
    SELECT DISTINCT unnest(groups) as group_name
    FROM catalog_bundles
    WHERE groups IS NOT NULL
  ),
  group_stats AS (
    SELECT 
      bg.group_name,
      COUNT(DISTINCT cb.esim_go_name) as bundle_count,
      MIN(cb.price) as min_price,
      MAX(cb.price) as max_price,
      ROUND(AVG(cb.price), 2) as avg_price,
      BOOL_OR(cb.is_unlimited) as has_unlimited,
      array_agg(DISTINCT cb.esim_go_name ORDER BY cb.price) as bundle_ids
    FROM bundle_groups bg
    JOIN catalog_bundles cb ON bg.group_name = ANY(cb.groups)
    GROUP BY bg.group_name
  )
  SELECT jsonb_object_agg(
    group_name,
    jsonb_build_object(
      'bundle_count', bundle_count,
      'price_range', jsonb_build_object(
        'min', min_price,
        'max', max_price,
        'avg', avg_price
      ),
      'has_unlimited', has_unlimited,
      'bundle_ids', bundle_ids
    )
  )
  FROM group_stats;
$$;
