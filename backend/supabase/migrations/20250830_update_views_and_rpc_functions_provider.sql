-- Migration: Update views and RPC functions to include provider field
-- Date: 2025-08-30
-- Description: Updates views first, then RPC functions to include the provider column

-- Step 1: Update bundles_by_country view
CREATE OR REPLACE VIEW "public"."bundles_by_country" AS
 SELECT "unnest"("countries") AS "country_code",
    "esim_go_name",
    "description",
    "groups",
    "validity_in_days",
    "data_amount_mb",
    "data_amount_readable",
    "is_unlimited",
    "price",
    "currency",
    "region",
    "speed",
    "provider"  -- Added provider column
   FROM "public"."catalog_bundles"
  WHERE (("countries" IS NOT NULL) AND ("array_length"("countries", 1) > 0));

-- Step 2: Update bundles_by_group view
CREATE OR REPLACE VIEW "public"."bundles_by_group" AS
 SELECT "unnest"("groups") AS "group_name",
    "esim_go_name",
    "description",
    "validity_in_days",
    "data_amount_mb",
    "data_amount_readable",
    "is_unlimited",
    "price",
    "currency",
    "countries",
    "region",
    "speed",
    "provider"  -- Added provider column
   FROM "public"."catalog_bundles"
  WHERE (("groups" IS NOT NULL) AND ("array_length"("groups", 1) > 0));

-- Step 3: Update bundles_by_region view (if it exists)
CREATE OR REPLACE VIEW "public"."bundles_by_region" AS
 SELECT 
    "region",
    "esim_go_name",
    "description",
    "validity_in_days",
    "data_amount_mb",
    "data_amount_readable",
    "is_unlimited",
    "price",
    "currency",
    "countries",
    "groups",
    "speed",
    "provider"  -- Added provider column
   FROM "public"."catalog_bundles"
  WHERE "region" IS NOT NULL;

-- Step 4: Update get_bundles_by_countries function
CREATE OR REPLACE FUNCTION "public"."get_bundles_by_countries"() 
RETURNS TABLE(
  "country_code" "text", 
  "bundles" "jsonb", 
  "bundle_count" bigint, 
  "min_price" numeric, 
  "max_price" numeric, 
  "avg_price" numeric, 
  "groups" "text"[], 
  "has_unlimited" boolean, 
  "common_region" "text"
)
LANGUAGE "sql" STABLE
AS $$
  WITH country_bundles AS (
    SELECT 
      bc.country_code,
      jsonb_agg(
        jsonb_build_object(
          'esim_go_name', bc.esim_go_name,
          'validity_in_days', bc.validity_in_days,
          'data_amount_readable', bc.data_amount_readable,
          'is_unlimited', bc.is_unlimited,
          'price', bc.price,
          'groups', bc.groups,
          'speed', bc.speed,
          'provider', bc.provider
        ) ORDER BY bc.price ASC
      ) as bundles,
      COUNT(*)::bigint as bundle_count,
      MIN(bc.price) as min_price,
      MAX(bc.price) as max_price,
      ROUND(AVG(bc.price), 2) as avg_price,
      array_agg(DISTINCT g) as all_groups,
      BOOL_OR(bc.is_unlimited) as has_unlimited,
      MODE() WITHIN GROUP (ORDER BY bc.region) as common_region
    FROM bundles_by_country bc
    LEFT JOIN LATERAL unnest(bc.groups) g ON true
    GROUP BY bc.country_code
  )
  SELECT 
    country_code,
    bundles,
    bundle_count,
    min_price,
    max_price,
    avg_price,
    all_groups,
    has_unlimited,
    common_region
  FROM country_bundles
  ORDER BY bundle_count DESC, country_code;
$$;

-- Step 5: Update get_bundles_by_groups function (FIXED)
CREATE OR REPLACE FUNCTION "public"."get_bundles_by_groups"() 
RETURNS TABLE(
  "group_name" "text", 
  "bundles" "jsonb", 
  "bundle_count" bigint, 
  "min_price" numeric, 
  "max_price" numeric, 
  "avg_price" numeric, 
  "countries_count" bigint, 
  "has_unlimited" boolean
)
LANGUAGE "sql" STABLE
AS $$
  WITH group_bundles AS (
    SELECT 
      bg.group_name,
      jsonb_agg(
        jsonb_build_object(
          'esim_go_name', bg.esim_go_name,
          'description', bg.description,
          'validity_in_days', bg.validity_in_days,
          'data_amount_readable', bg.data_amount_readable,
          'is_unlimited', bg.is_unlimited,
          'price', bg.price,
          'currency', bg.currency,
          'countries', bg.countries,
          'region', bg.region,
          'speed', bg.speed,
          'provider', bg.provider
        ) ORDER BY bg.price ASC
      ) as bundles,
      COUNT(*)::bigint as bundle_count,
      MIN(bg.price) as min_price,
      MAX(bg.price) as max_price,
      ROUND(AVG(bg.price), 2) as avg_price,
      BOOL_OR(bg.is_unlimited) as has_unlimited
    FROM bundles_by_group bg
    GROUP BY bg.group_name
  ),
  country_counts AS (
    SELECT 
      bg.group_name,
      COUNT(DISTINCT c)::bigint as countries_count
    FROM bundles_by_group bg
    LEFT JOIN LATERAL unnest(bg.countries) c ON true
    GROUP BY bg.group_name
  )
  SELECT 
    gb.group_name,
    gb.bundles,
    gb.bundle_count,
    gb.min_price,
    gb.max_price,
    gb.avg_price,
    COALESCE(cc.countries_count, 0) as countries_count,
    gb.has_unlimited
  FROM group_bundles gb
  LEFT JOIN country_counts cc ON gb.group_name = cc.group_name
  ORDER BY gb.bundle_count DESC, gb.group_name;
$$;

-- Step 6: Update get_bundles_by_regions function (FIXED)
CREATE OR REPLACE FUNCTION "public"."get_bundles_by_regions"() 
RETURNS TABLE(
  "region" "text", 
  "bundles" "jsonb", 
  "bundle_count" bigint, 
  "min_price" numeric, 
  "max_price" numeric, 
  "avg_price" numeric, 
  "countries" "text"[], 
  "country_count" bigint, 
  "has_unlimited" boolean
)
LANGUAGE "sql" STABLE
AS $$
WITH region_data AS (
  SELECT
    br.region,
    jsonb_agg(
      jsonb_build_object(
        'esim_go_name', br.esim_go_name,
        'description', br.description,
        'validity_in_days', br.validity_in_days,
        'data_amount_mb', br.data_amount_mb,
        'data_amount_readable', br.data_amount_readable,
        'is_unlimited', br.is_unlimited,
        'price', br.price,
        'currency', br.currency,
        'countries', br.countries,
        'groups', br.groups,
        'speed', br.speed,
        'provider', br.provider
      ) ORDER BY br.price ASC
    ) as bundles,
    COUNT(*)::bigint as bundle_count,
    MIN(br.price) as min_price,
    MAX(br.price) as max_price,
    ROUND(AVG(br.price), 2) as avg_price,
    BOOL_OR(br.is_unlimited) as has_unlimited
  FROM bundles_by_region br
  GROUP BY br.region
),
country_aggregates AS (
  SELECT
    br.region,
    array_agg(DISTINCT c) as countries,
    COUNT(DISTINCT c)::bigint as country_count
  FROM bundles_by_region br
  LEFT JOIN LATERAL unnest(br.countries) c ON true
  GROUP BY br.region
)
SELECT 
  rd.region,
  rd.bundles,
  rd.bundle_count,
  rd.min_price,
  rd.max_price,
  rd.avg_price,
  ca.countries,
  ca.country_count,
  rd.has_unlimited
FROM region_data rd
LEFT JOIN country_aggregates ca ON rd.region = ca.region
ORDER BY rd.bundle_count DESC, rd.region;
$$;

-- Step 7: Update get_bundles_for_country function (FIXED)
CREATE OR REPLACE FUNCTION "public"."get_bundles_for_country"("country_param" "text") 
RETURNS TABLE(
  "country_code" "text", 
  "bundles" "jsonb", 
  "bundle_count" bigint, 
  "min_price" numeric, 
  "max_price" numeric, 
  "groups" "text"[], 
  "regions" "text"[], 
  "has_unlimited" boolean
)
LANGUAGE "sql" STABLE
AS $$
  WITH country_data AS (
    SELECT 
      country_param as country_code,
      jsonb_agg(
        jsonb_build_object(
          'esim_go_name', cb.esim_go_name,
          'validity_in_days', cb.validity_in_days,
          'data_amount_readable', cb.data_amount_readable,
          'is_unlimited', cb.is_unlimited,
          'price', cb.price,
          'groups', cb.groups,
          'region', cb.region,
          'speed', cb.speed,
          'provider', cb.provider
        ) ORDER BY cb.price ASC
      ) as bundles,
      COUNT(*)::bigint as bundle_count,
      MIN(cb.price) as min_price,
      MAX(cb.price) as max_price,
      array_agg(DISTINCT cb.region) FILTER (WHERE cb.region IS NOT NULL) as regions,
      BOOL_OR(cb.is_unlimited) as has_unlimited
    FROM catalog_bundles cb
    WHERE country_param = ANY(cb.countries)
    GROUP BY country_param
  ),
  groups_agg AS (
    SELECT 
      array_agg(DISTINCT g) FILTER (WHERE g IS NOT NULL) as groups
    FROM catalog_bundles cb
    LEFT JOIN LATERAL unnest(cb.groups) g ON true
    WHERE country_param = ANY(cb.countries)
  )
  SELECT 
    cd.country_code,
    cd.bundles,
    cd.bundle_count,
    cd.min_price,
    cd.max_price,
    ga.groups,
    cd.regions,
    cd.has_unlimited
  FROM country_data cd
  CROSS JOIN groups_agg ga;
$$;

-- Step 8: Update get_bundles_for_country_simple function
CREATE OR REPLACE FUNCTION "public"."get_bundles_for_country_simple"("country_param" "text") 
RETURNS "jsonb"
LANGUAGE "sql" STABLE
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
      speed,
      provider
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
        'speed', speed,
        'provider', provider
      )
    ),
    'bundle_count', COUNT(*),
    'min_price', MIN(price),
    'max_price', MAX(price)
  )
  FROM bundle_data;
$$;

-- Step 9: Update get_bundles_for_group function (FIXED)
CREATE OR REPLACE FUNCTION "public"."get_bundles_for_group"("group_param" "text") 
RETURNS TABLE(
  "group_name" "text", 
  "bundles" "jsonb", 
  "bundle_count" bigint, 
  "min_price" numeric, 
  "max_price" numeric, 
  "countries" "text"[], 
  "regions" "text"[], 
  "has_unlimited" boolean
)
LANGUAGE "sql" STABLE
AS $$
  WITH group_data AS (
    SELECT 
      bg.group_name,
      jsonb_agg(
        jsonb_build_object(
          'esim_go_name', bg.esim_go_name,
          'validity_in_days', bg.validity_in_days,
          'data_amount_readable', bg.data_amount_readable,
          'is_unlimited', bg.is_unlimited,
          'price', bg.price,
          'countries', bg.countries,
          'region', bg.region,
          'speed', bg.speed,
          'provider', bg.provider
        ) ORDER BY bg.price ASC
      ) as bundles,
      COUNT(*)::bigint as bundle_count,
      MIN(bg.price) as min_price,
      MAX(bg.price) as max_price,
      array_agg(DISTINCT bg.region) FILTER (WHERE bg.region IS NOT NULL) as regions,
      BOOL_OR(bg.is_unlimited) as has_unlimited
    FROM bundles_by_group bg
    WHERE bg.group_name = group_param
    GROUP BY bg.group_name
  ),
  countries_agg AS (
    SELECT 
      array_agg(DISTINCT c) FILTER (WHERE c IS NOT NULL) as countries
    FROM bundles_by_group bg
    LEFT JOIN LATERAL unnest(bg.countries) c ON true
    WHERE bg.group_name = group_param
  )
  SELECT 
    gd.group_name,
    gd.bundles,
    gd.bundle_count,
    gd.min_price,
    gd.max_price,
    ca.countries,
    gd.regions,
    gd.has_unlimited
  FROM group_data gd
  CROSS JOIN countries_agg ca;
$$;

-- Step 10: Update get_bundles_for_region function (FIXED)
CREATE OR REPLACE FUNCTION "public"."get_bundles_for_region"("region_param" "text") 
RETURNS TABLE(
  "region" "text", 
  "bundles" "jsonb", 
  "bundle_count" bigint, 
  "min_price" numeric, 
  "max_price" numeric, 
  "countries" "text"[], 
  "groups" "text"[], 
  "has_unlimited" boolean
)
LANGUAGE "sql" STABLE
AS $$
  WITH region_data AS (
    SELECT 
      cb.region,
      jsonb_agg(
        jsonb_build_object(
          'esim_go_name', cb.esim_go_name,
          'validity_in_days', cb.validity_in_days,
          'data_amount_readable', cb.data_amount_readable,
          'is_unlimited', cb.is_unlimited,
          'price', cb.price,
          'countries', cb.countries,
          'groups', cb.groups,
          'speed', cb.speed,
          'provider', cb.provider
        ) ORDER BY cb.price ASC
      ) as bundles,
      COUNT(*)::bigint as bundle_count,
      MIN(cb.price) as min_price,
      MAX(cb.price) as max_price,
      BOOL_OR(cb.is_unlimited) as has_unlimited
    FROM catalog_bundles cb
    WHERE cb.region = region_param
    GROUP BY cb.region
  ),
  array_aggs AS (
    SELECT 
      array_agg(DISTINCT c) FILTER (WHERE c IS NOT NULL) as countries,
      array_agg(DISTINCT g) FILTER (WHERE g IS NOT NULL) as groups
    FROM catalog_bundles cb
    LEFT JOIN LATERAL unnest(cb.countries) c ON true
    LEFT JOIN LATERAL unnest(cb.groups) g ON true
    WHERE cb.region = region_param
  )
  SELECT 
    rd.region,
    rd.bundles,
    rd.bundle_count,
    rd.min_price,
    rd.max_price,
    aa.countries,
    aa.groups,
    rd.has_unlimited
  FROM region_data rd
  CROSS JOIN array_aggs aa;
$$;