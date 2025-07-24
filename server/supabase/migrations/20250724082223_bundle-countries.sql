-- SQL Functions for Regions and Countries Aggregation

-- 1. View to unnest countries (similar to groups)
CREATE OR REPLACE VIEW bundles_by_country AS
SELECT 
  unnest(countries) as country_code,
  esim_go_name,
  name,
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
-- Fixed SQL Functions without ORDER BY in DISTINCT aggregates

-- 2. Fixed function to get bundles for a specific country
CREATE OR REPLACE FUNCTION get_bundles_for_country(country_param text)
RETURNS TABLE (
  country_code text,
  bundles jsonb,
  bundle_count bigint,
  min_price numeric,
  max_price numeric,
  groups text[],
  regions text[],
  has_unlimited boolean
)
LANGUAGE sql
STABLE
AS $$
  WITH country_data AS (
    SELECT 
      country_param as country_code,
      jsonb_agg(
        jsonb_build_object(
          'esim_go_name', esim_go_name,
          'validity_in_days', validity_in_days,
          'data_amount_readable', data_amount_readable,
          'is_unlimited', is_unlimited,
          'price', price,
          'groups', groups,
          'region', region,
          'speed', speed
        ) ORDER BY price ASC
      ) as bundles,
      COUNT(*)::bigint as bundle_count,
      MIN(price) as min_price,
      MAX(price) as max_price,
      BOOL_OR(is_unlimited) as has_unlimited
    FROM catalog_bundles
    WHERE country_param = ANY(countries)
  ),
  country_groups AS (
    SELECT ARRAY(
      SELECT DISTINCT grp
      FROM (
        SELECT unnest(groups) as grp
        FROM catalog_bundles
        WHERE country_param = ANY(countries)
      ) g
      ORDER BY grp
    ) as groups
  ),
  country_regions AS (
    SELECT ARRAY(
      SELECT DISTINCT region
      FROM catalog_bundles
      WHERE country_param = ANY(countries)
        AND region IS NOT NULL
      ORDER BY region
    ) as regions
  )
  SELECT 
    cd.country_code,
    cd.bundles,
    cd.bundle_count,
    cd.min_price,
    cd.max_price,
    cg.groups,
    cr.regions,
    cd.has_unlimited
  FROM country_data cd
  CROSS JOIN country_groups cg
  CROSS JOIN country_regions cr;
$$;

CREATE OR REPLACE FUNCTION get_bundle_coverage_stats()
RETURNS TABLE (
  total_bundles bigint,
  total_countries bigint,
  total_regions bigint,
  total_groups bigint,
  avg_countries_per_bundle numeric,
  most_covered_country text,
  most_covered_region text,
  price_range jsonb
)
LANGUAGE sql
STABLE
AS $$
  WITH stats AS (
    SELECT 
      COUNT(*)::bigint as total_bundles,
      (SELECT COUNT(DISTINCT country) FROM (SELECT unnest(countries) as country FROM catalog_bundles) c) as total_countries,
      COUNT(DISTINCT region) as total_regions,
      (SELECT COUNT(DISTINCT grp) FROM (SELECT unnest(groups) as grp FROM catalog_bundles) g) as total_groups,
      ROUND(AVG(cardinality(countries)), 2) as avg_countries_per_bundle,
      MIN(price) as min_price,
      MAX(price) as max_price,
      ROUND(AVG(price), 2) as avg_price
    FROM catalog_bundles
  ),
  top_country AS (
    SELECT country_code, COUNT(*) as cnt
    FROM bundles_by_country
    GROUP BY country_code
    ORDER BY cnt DESC
    LIMIT 1
  ),
  top_region AS (
    SELECT region, COUNT(*) as cnt
    FROM catalog_bundles
    WHERE region IS NOT NULL
    GROUP BY region
    ORDER BY cnt DESC
    LIMIT 1
  )
  SELECT 
    s.total_bundles,
    s.total_countries,
    s.total_regions,
    s.total_groups,
    s.avg_countries_per_bundle,
    tc.country_code as most_covered_country,
    tr.region as most_covered_region,
    jsonb_build_object(
      'min', s.min_price,
      'max', s.max_price,
      'avg', s.avg_price
    ) as price_range
  FROM stats s
  CROSS JOIN top_country tc
  CROSS JOIN top_region tr;
$$;


-- 4. Simplified version using array construction instead of array_agg
CREATE OR REPLACE FUNCTION get_bundles_for_country_simple(country_param text)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  WITH bundle_data AS (
    SELECT 
      esim_go_name,
      validity_in_days,
      data_amount_readable,
      is_unlimited,
      price,
      groups,
      region,
      speed
    FROM catalog_bundles
    WHERE country_param = ANY(countries)
    ORDER BY price ASC
  )
  SELECT jsonb_build_object(
    'country_code', country_param,
    'bundles', jsonb_agg(
      jsonb_build_object(
        'esim_go_name', esim_go_name,
        'validity_in_days', validity_in_days,
        'data_amount_readable', data_amount_readable,
        'is_unlimited', is_unlimited,
        'price', price,
        'groups', groups,
        'region', region,
        'speed', speed
      )
    ),
    'bundle_count', COUNT(*),
    'min_price', MIN(price),
    'max_price', MAX(price),
    'avg_price', ROUND(AVG(price), 2),
    'has_unlimited', BOOL_OR(is_unlimited)
  )
  FROM bundle_data;
$$;