-- Create a view for regions (no unnesting needed since region is not an array)
CREATE OR REPLACE VIEW bundles_by_region AS
SELECT 
  region,
  esim_go_name,
  description,
  groups,
  validity_in_days,
  data_amount_mb,
  data_amount_readable,
  is_unlimited,
  price,
  currency,
  countries,
  speed,
  created_at,
  updated_at,
  synced_at
FROM catalog_bundles
WHERE region IS NOT NULL;

-- Now we can simplify many of our functions using this view!

-- Example: Simplified get_bundles_by_regions using the view
CREATE OR REPLACE FUNCTION get_bundles_by_regions_v2()
RETURNS TABLE (
  region text,
  bundle_count bigint,
  min_price numeric,
  max_price numeric,
  avg_price numeric,
  country_count bigint,
  has_unlimited boolean,
  popular_groups text[]
)
LANGUAGE sql
STABLE
AS $$
  WITH region_stats AS (
    SELECT 
      region,
      COUNT(*)::bigint as bundle_count,
      MIN(price) as min_price,
      MAX(price) as max_price,
      ROUND(AVG(price), 2) as avg_price,
      BOOL_OR(is_unlimited) as has_unlimited
    FROM bundles_by_region
    GROUP BY region
  ),
  region_countries AS (
    SELECT 
      region,
      COUNT(DISTINCT country)::bigint as country_count
    FROM (
      SELECT region, unnest(countries) as country
      FROM bundles_by_region
    ) rc
    GROUP BY region
  ),
  region_groups AS (
    SELECT 
      region,
      ARRAY(
        SELECT grp
        FROM (
          SELECT region as r, unnest(groups) as grp, COUNT(*) as cnt
          FROM bundles_by_region
          GROUP BY region, grp
        ) g
        WHERE g.r = rs.region
        ORDER BY cnt DESC, grp
        LIMIT 5
      ) as popular_groups
    FROM region_stats rs
  )
  SELECT 
    rs.region,
    rs.bundle_count,
    rs.min_price,
    rs.max_price,
    rs.avg_price,
    rc.country_count,
    rs.has_unlimited,
    rg.popular_groups
  FROM region_stats rs
  JOIN region_countries rc ON rs.region = rc.region
  JOIN region_groups rg ON rs.region = rg.region
  ORDER BY rs.bundle_count DESC, rs.region;
$$;

-- Create a materialized view for better performance on complex aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS region_summary AS
WITH region_data AS (
  SELECT 
    region,
    COUNT(*)::bigint as bundle_count,
    COUNT(DISTINCT esim_go_name) as unique_bundles,
    MIN(price) as min_price,
    MAX(price) as max_price,
    ROUND(AVG(price), 2) as avg_price,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median_price,
    BOOL_OR(is_unlimited) as has_unlimited,
    COUNT(CASE WHEN is_unlimited THEN 1 END) as unlimited_count,
    COUNT(CASE WHEN validity_in_days >= 30 THEN 1 END) as long_term_count,
    MIN(validity_in_days) as min_validity,
    MAX(validity_in_days) as max_validity
  FROM bundles_by_region
  GROUP BY region
),
country_data AS (
  SELECT 
    region,
    COUNT(DISTINCT country) as country_count,
    array_agg(DISTINCT country ORDER BY country) FILTER (WHERE country IS NOT NULL) as countries
  FROM (
    SELECT region, unnest(countries) as country
    FROM bundles_by_region
  ) c
  GROUP BY region
),
group_data AS (
  SELECT 
    region,
    COUNT(DISTINCT grp) as group_count,
    array_agg(DISTINCT grp ORDER BY grp) FILTER (WHERE grp IS NOT NULL) as groups
  FROM (
    SELECT region, unnest(groups) as grp
    FROM bundles_by_region
  ) g
  GROUP BY region
)
SELECT 
  rd.*,
  cd.country_count,
  cd.countries,
  gd.group_count,
  gd.groups
FROM region_data rd
JOIN country_data cd ON rd.region = cd.region
JOIN group_data gd ON rd.region = gd.region;

-- Create index on the materialized view
CREATE UNIQUE INDEX idx_region_summary_region ON region_summary(region);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_region_summary()
RETURNS void
LANGUAGE sql
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY region_summary;
$$;

-- You can also create a similar view that includes NULL regions as 'Global'
CREATE OR REPLACE VIEW bundles_by_region_with_global AS
SELECT 
  COALESCE(region, 'Global') as region,
  esim_go_name,
  description,
  groups,
  validity_in_days,
  data_amount_mb,
  data_amount_readable,
  is_unlimited,
  price,
  currency,
  countries,
  speed
FROM catalog_bundles;