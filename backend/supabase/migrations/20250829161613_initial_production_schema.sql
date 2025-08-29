

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."block_type" AS ENUM (
    'cost',
    'markup',
    'discount',
    'unused_days_discount',
    'psychological_rounding',
    'region_rounding',
    'profit_constraint',
    'processing_fee',
    'custom'
);


ALTER TYPE "public"."block_type" OWNER TO "postgres";


CREATE TYPE "public"."coupon_applicability" AS ENUM (
    'global',
    'region_specific',
    'bundle_specific'
);


ALTER TYPE "public"."coupon_applicability" OWNER TO "postgres";


CREATE TYPE "public"."coupon_type" AS ENUM (
    'percentage',
    'fixed_amount'
);


ALTER TYPE "public"."coupon_type" OWNER TO "postgres";


CREATE TYPE "public"."event_type" AS ENUM (
    'set-base-price',
    'apply-markup',
    'apply-discount',
    'apply-unused-days-discount',
    'apply-psychological-rounding',
    'apply-region-rounding',
    'apply-profit-constraint',
    'apply-processing-fee'
);


ALTER TYPE "public"."event_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_checkout_sessions"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM checkout_sessions 
  WHERE expires_at < NOW() - INTERVAL '1 hour'; -- Keep expired sessions for 1 hour for debugging
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_checkout_sessions"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_expired_checkout_sessions"() IS 'Maintenance function to remove old expired sessions';



CREATE OR REPLACE FUNCTION "public"."get_bundle_coverage_stats"() RETURNS TABLE("total_bundles" bigint, "total_countries" bigint, "total_regions" bigint, "total_groups" bigint, "avg_countries_per_bundle" numeric, "most_covered_country" "text", "most_covered_region" "text", "price_range" "jsonb")
    LANGUAGE "sql" STABLE
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


ALTER FUNCTION "public"."get_bundle_coverage_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bundles_by_countries"() RETURNS TABLE("country_code" "text", "bundles" "jsonb", "bundle_count" bigint, "min_price" numeric, "max_price" numeric, "avg_price" numeric, "groups" "text"[], "has_unlimited" boolean, "common_region" "text")
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
          'speed', bc.speed
        ) ORDER BY bc.price ASC
      ) as bundles,
      COUNT(*)::bigint as bundle_count,
      MIN(bc.price) as min_price,
      MAX(bc.price) as max_price,
      ROUND(AVG(bc.price), 2) as avg_price,
      BOOL_OR(bc.is_unlimited) as has_unlimited,
      -- Get the most common region for this country
      mode() WITHIN GROUP (ORDER BY bc.region) as common_region
    FROM bundles_by_country bc
    GROUP BY bc.country_code
  ),
  country_groups AS (
    SELECT 
      country_code,
      array_agg(DISTINCT grp ORDER BY grp) as groups
    FROM (
      SELECT bc.country_code, unnest(bc.groups) as grp
      FROM bundles_by_country bc
    ) cg
    GROUP BY country_code
  )
  SELECT 
    cb.country_code,
    cb.bundles,
    cb.bundle_count,
    cb.min_price,
    cb.max_price,
    cb.avg_price,
    cg.groups,
    cb.has_unlimited,
    cb.common_region
  FROM country_bundles cb
  JOIN country_groups cg ON cb.country_code = cg.country_code
  ORDER BY cb.bundle_count DESC, cb.country_code;
$$;


ALTER FUNCTION "public"."get_bundles_by_countries"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bundles_by_groups"() RETURNS TABLE("group_name" "text", "bundles" "jsonb", "bundle_count" bigint, "min_price" numeric, "max_price" numeric, "avg_price" numeric, "countries_count" bigint, "has_unlimited" boolean)
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
          'speed', bg.speed
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
  group_countries AS (
    SELECT 
      group_name,
      COUNT(DISTINCT country)::bigint as countries_count
    FROM (
      SELECT bg.group_name, unnest(bg.countries) as country
      FROM bundles_by_group bg
    ) gc
    GROUP BY group_name
  )
  SELECT 
    gb.group_name,
    gb.bundles,
    gb.bundle_count,
    gb.min_price,
    gb.max_price,
    gb.avg_price,
    gc.countries_count,
    gb.has_unlimited
  FROM group_bundles gb
  JOIN group_countries gc ON gb.group_name = gc.group_name
  ORDER BY gb.bundle_count DESC, gb.group_name;
$$;


ALTER FUNCTION "public"."get_bundles_by_groups"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bundles_by_groups_simple"() RETURNS TABLE("group_name" "text", "bundle_count" bigint, "bundle_ids" "text"[], "min_price" numeric, "max_price" numeric, "avg_price" numeric, "has_unlimited" boolean)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT 
    bg.group_name,
    COUNT(*)::bigint as bundle_count,
    array_agg(DISTINCT bg.esim_go_name ORDER BY bg.esim_go_name) as bundle_ids,
    MIN(bg.price) as min_price,
    MAX(bg.price) as max_price,
    ROUND(AVG(bg.price), 2) as avg_price,
    BOOL_OR(bg.is_unlimited) as has_unlimited
  FROM bundles_by_group bg
  GROUP BY bg.group_name
  ORDER BY bundle_count DESC, group_name;
$$;


ALTER FUNCTION "public"."get_bundles_by_groups_simple"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bundles_by_regions"() RETURNS TABLE("region" "text", "bundles" "jsonb", "bundle_count" bigint, "min_price" numeric, "max_price" numeric, "avg_price" numeric, "countries" "text"[], "country_count" bigint, "has_unlimited" boolean)
    LANGUAGE "sql" STABLE
    AS $$
WITH region_data AS (
  SELECT
    region,
    jsonb_agg(
      jsonb_build_object(
        'esim_go_name', esim_go_name,
        'description', description,
        'validity_in_days', validity_in_days,
        'data_amount_mb', data_amount_mb,
        'data_amount_readable', data_amount_readable,
        'is_unlimited', is_unlimited,
        'price', price,
        'currency', currency,
        'countries', countries,
        'groups', groups,
        'speed', speed
      ) ORDER BY price ASC
    ) as bundles,
    COUNT(*)::bigint as bundle_count,
    MIN(price) as min_price,
    MAX(price) as max_price,
    ROUND(AVG(price), 2) as avg_price,
    BOOL_OR(is_unlimited) as has_unlimited
  FROM bundles_by_region
  GROUP BY region
),
country_stats AS (
  SELECT DISTINCT
    br.region,
    (
      SELECT COUNT(DISTINCT country)::bigint
      FROM (
        SELECT unnest(countries) as country
        FROM bundles_by_region
        WHERE region = br.region
      ) c
    ) as country_count
  FROM bundles_by_region br
),
country_arrays AS (
  SELECT 
    region,
    ARRAY(
      SELECT DISTINCT country
      FROM (
        SELECT unnest(countries) as country
        FROM bundles_by_region br2
        WHERE br2.region = br.region
      ) c
      ORDER BY country
    ) as countries
  FROM (SELECT DISTINCT region FROM bundles_by_region) br
)
SELECT
  rd.region,
  rd.bundles,
  rd.bundle_count,
  rd.min_price,
  rd.max_price,
  rd.avg_price,
  ca.countries,
  cs.country_count,
  rd.has_unlimited
FROM region_data rd
JOIN country_stats cs ON rd.region = cs.region
JOIN country_arrays ca ON rd.region = ca.region
ORDER BY rd.bundle_count DESC, rd.region;
$$;


ALTER FUNCTION "public"."get_bundles_by_regions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bundles_by_regions_v2"() RETURNS TABLE("region" "text", "bundle_count" bigint, "min_price" numeric, "max_price" numeric, "avg_price" numeric, "country_count" bigint, "has_unlimited" boolean, "popular_groups" "text"[])
    LANGUAGE "sql" STABLE
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


ALTER FUNCTION "public"."get_bundles_by_regions_v2"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bundles_for_country"("country_param" "text") RETURNS TABLE("country_code" "text", "bundles" "jsonb", "bundle_count" bigint, "min_price" numeric, "max_price" numeric, "groups" "text"[], "regions" "text"[], "has_unlimited" boolean)
    LANGUAGE "sql" STABLE
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


ALTER FUNCTION "public"."get_bundles_for_country"("country_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bundles_for_country_simple"("country_param" "text") RETURNS "jsonb"
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


ALTER FUNCTION "public"."get_bundles_for_country_simple"("country_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bundles_for_group"("group_param" "text") RETURNS TABLE("group_name" "text", "bundles" "jsonb", "bundle_count" bigint, "min_price" numeric, "max_price" numeric, "countries" "text"[], "regions" "text"[], "has_unlimited" boolean)
    LANGUAGE "sql" STABLE
    AS $$
  WITH group_data AS (
    SELECT 
      group_name,
      jsonb_agg(
        jsonb_build_object(
          'esim_go_name', esim_go_name,
          'validity_in_days', validity_in_days,
          'data_amount_readable', data_amount_readable,
          'is_unlimited', is_unlimited,
          'price', price,
          'countries', countries,
          'region', region,
          'speed', speed
        ) ORDER BY price ASC
      ) as bundles,
      COUNT(*)::bigint as bundle_count,
      MIN(price) as min_price,
      MAX(price) as max_price,
      BOOL_OR(is_unlimited) as has_unlimited
    FROM bundles_by_group
    WHERE group_name = group_param
    GROUP BY group_name
  ),
  group_countries AS (
    SELECT ARRAY(
      SELECT DISTINCT country
      FROM (
        SELECT unnest(countries) as country
        FROM bundles_by_group
        WHERE group_name = group_param
      ) c
      ORDER BY country
    ) as countries
  ),
  group_regions AS (
    SELECT ARRAY(
      SELECT DISTINCT region
      FROM bundles_by_group
      WHERE group_name = group_param
        AND region IS NOT NULL
      ORDER BY region
    ) as regions
  )
  SELECT 
    gd.group_name,
    gd.bundles,
    gd.bundle_count,
    gd.min_price,
    gd.max_price,
    gc.countries,
    gr.regions,
    gd.has_unlimited
  FROM group_data gd
  CROSS JOIN group_countries gc
  CROSS JOIN group_regions gr;
$$;


ALTER FUNCTION "public"."get_bundles_for_group"("group_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bundles_for_region"("region_param" "text") RETURNS TABLE("region" "text", "bundles" "jsonb", "bundle_count" bigint, "min_price" numeric, "max_price" numeric, "countries" "text"[], "groups" "text"[], "has_unlimited" boolean)
    LANGUAGE "sql" STABLE
    AS $$
  WITH region_data AS (
    SELECT 
      region,
      jsonb_agg(
        jsonb_build_object(
          'esim_go_name', esim_go_name,
          'validity_in_days', validity_in_days,
          'data_amount_readable', data_amount_readable,
          'is_unlimited', is_unlimited,
          'price', price,
          'countries', countries,
          'groups', groups,
          'speed', speed
        ) ORDER BY price ASC
      ) as bundles,
      COUNT(*)::bigint as bundle_count,
      MIN(price) as min_price,
      MAX(price) as max_price,
      BOOL_OR(is_unlimited) as has_unlimited
    FROM catalog_bundles
    WHERE region = region_param
    GROUP BY region
  ),
  region_countries AS (
    SELECT ARRAY(
      SELECT DISTINCT country
      FROM (
        SELECT unnest(countries) as country
        FROM catalog_bundles
        WHERE region = region_param
      ) c
      ORDER BY country
    ) as countries
  ),
  region_groups AS (
    SELECT ARRAY(
      SELECT DISTINCT grp
      FROM (
        SELECT unnest(groups) as grp
        FROM catalog_bundles
        WHERE region = region_param
      ) g
      ORDER BY grp
    ) as groups
  )
  SELECT 
    rd.region,
    rd.bundles,
    rd.bundle_count,
    rd.min_price,
    rd.max_price,
    rc.countries,
    rg.groups,
    rd.has_unlimited
  FROM region_data rd
  CROSS JOIN region_countries rc
  CROSS JOIN region_groups rg;
$$;


ALTER FUNCTION "public"."get_bundles_for_region"("region_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_distinct_durations"() RETURNS TABLE("value" "text", "label" "text", "min_days" integer, "max_days" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT DISTINCT
    validity_in_days::text as value,
    CASE 
      WHEN validity_in_days = 1 THEN '1 day'
      ELSE validity_in_days::text || ' days'
    END as label,
    validity_in_days as min_days,
    validity_in_days as max_days
  FROM catalog_bundles
  WHERE validity_in_days IS NOT NULL
  ORDER BY validity_in_days;
$$;


ALTER FUNCTION "public"."get_distinct_durations"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_distinct_durations"() IS 'Returns distinct duration values from catalog bundles for pricing configuration';



CREATE OR REPLACE FUNCTION "public"."get_region_countries"("region_param" "text") RETURNS "text"[]
    LANGUAGE "sql" STABLE
    AS $$
  SELECT ARRAY(
    SELECT DISTINCT country
    FROM (
      SELECT unnest(countries) as country
      FROM catalog_bundles
      WHERE region = region_param
    ) c
    ORDER BY country
  );
$$;


ALTER FUNCTION "public"."get_region_countries"("region_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_region_groups"("region_param" "text") RETURNS "text"[]
    LANGUAGE "sql" STABLE
    AS $$
  SELECT ARRAY(
    SELECT DISTINCT grp
    FROM (
      SELECT unnest(groups) as grp
      FROM catalog_bundles
      WHERE region = region_param
    ) g
    ORDER BY grp
  );
$$;


ALTER FUNCTION "public"."get_region_groups"("region_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_region_stats"() RETURNS TABLE("region" "text", "bundle_count" bigint, "country_count" bigint, "group_count" bigint, "unlimited_count" bigint, "price_stats" "jsonb")
    LANGUAGE "sql" STABLE
    AS $$
  WITH region_base AS (
    SELECT 
      region,
      COUNT(*)::bigint as bundle_count,
      COUNT(CASE WHEN is_unlimited THEN 1 END)::bigint as unlimited_count,
      MIN(price) as min_price,
      MAX(price) as max_price,
      ROUND(AVG(price), 2) as avg_price,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median_price
    FROM catalog_bundles
    WHERE region IS NOT NULL
    GROUP BY region
  ),
  region_countries AS (
    SELECT 
      region,
      COUNT(DISTINCT country)::bigint as country_count
    FROM (
      SELECT region, unnest(countries) as country
      FROM catalog_bundles
      WHERE region IS NOT NULL
    ) rc
    GROUP BY region
  ),
  region_groups AS (
    SELECT 
      region,
      COUNT(DISTINCT grp)::bigint as group_count
    FROM (
      SELECT region, unnest(groups) as grp
      FROM catalog_bundles
      WHERE region IS NOT NULL
    ) rg
    GROUP BY region
  )
  SELECT 
    rb.region,
    rb.bundle_count,
    rc.country_count,
    rg.group_count,
    rb.unlimited_count,
    jsonb_build_object(
      'min', rb.min_price,
      'max', rb.max_price,
      'avg', rb.avg_price,
      'median', rb.median_price
    ) as price_stats
  FROM region_base rb
  JOIN region_countries rc ON rb.region = rc.region
  JOIN region_groups rg ON rb.region = rg.region
  ORDER BY rb.bundle_count DESC, rb.region;
$$;


ALTER FUNCTION "public"."get_region_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_regions_with_bundles"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  WITH region_bundles AS (
    SELECT 
      region,
      jsonb_agg(
        jsonb_build_object(
          'esim_go_name', esim_go_name,
          'validity_in_days', validity_in_days,
          'data_amount_readable', data_amount_readable,
          'is_unlimited', is_unlimited,
          'price', price,
          'speed', speed
        ) ORDER BY price ASC
      ) as bundles,
      COUNT(*) as bundle_count,
      MIN(price) as min_price,
      MAX(price) as max_price,
      ROUND(AVG(price), 2) as avg_price
    FROM catalog_bundles
    WHERE region IS NOT NULL
    GROUP BY region
  )
  SELECT jsonb_object_agg(
    region,
    jsonb_build_object(
      'bundles', bundles,
      'bundle_count', bundle_count,
      'price_range', jsonb_build_object(
        'min', min_price,
        'max', max_price,
        'avg', avg_price
      )
    )
  )
  FROM region_bundles;
$$;


ALTER FUNCTION "public"."get_regions_with_bundles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unique_durations"() RETURNS TABLE("validity_in_days" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY SELECT DISTINCT cd.validity_in_days 
  FROM catalog_bundles cd 
  ORDER BY cd.validity_in_days;
END;
$$;


ALTER FUNCTION "public"."get_unique_durations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unique_groups_from_bundles"() RETURNS "text"[]
    LANGUAGE "sql" STABLE
    AS $$
  SELECT ARRAY(
    SELECT DISTINCT grp
    FROM (
      SELECT unnest(groups) as grp
      FROM catalog_bundles
      WHERE groups IS NOT NULL
    ) g
    ORDER BY grp
  );
$$;


ALTER FUNCTION "public"."get_unique_groups_from_bundles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unique_regions"() RETURNS "text"[]
    LANGUAGE "sql" STABLE
    AS $$
  SELECT ARRAY(
    SELECT DISTINCT region
    FROM catalog_bundles
    WHERE region IS NOT NULL
    ORDER BY region
  );
$$;


ALTER FUNCTION "public"."get_unique_regions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (id, first_name, last_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name', new.phone);
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = user_id 
          AND (
              raw_user_meta_data->>'role' = 'ADMIN' OR 
              raw_app_meta_data->>'role' = 'ADMIN'
          )
    );
END;
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_checkout_session_complete"("session_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  session_steps JSONB;
  auth_completed BOOLEAN DEFAULT FALSE;
  delivery_completed BOOLEAN DEFAULT FALSE;
  payment_completed BOOLEAN DEFAULT FALSE;
BEGIN
  SELECT steps INTO session_steps
  FROM checkout_sessions
  WHERE id = session_id;
  
  IF session_steps IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check authentication step
  auth_completed := COALESCE((session_steps->'authentication'->>'completed')::BOOLEAN, FALSE);
  
  -- Check delivery step  
  delivery_completed := COALESCE((session_steps->'delivery'->>'completed')::BOOLEAN, FALSE);
  
  -- Check payment step
  payment_completed := COALESCE((session_steps->'payment'->>'completed')::BOOLEAN, FALSE);
  
  RETURN auth_completed AND delivery_completed AND payment_completed;
END;
$$;


ALTER FUNCTION "public"."is_checkout_session_complete"("session_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_checkout_session_complete"("session_id" "uuid") IS 'Validates if all required checkout steps are completed';



CREATE OR REPLACE FUNCTION "public"."is_master_tenant_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE 
    is_master BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM user_tenants ut
        JOIN tenants t ON ut.tenant_slug = t.slug
        WHERE t.tenant_type = 'master' 
        AND ut.user_id = auth.uid()
    ) INTO is_master;
    
    RETURN COALESCE(is_master, FALSE);
END;
$$;


ALTER FUNCTION "public"."is_master_tenant_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_master_tenant_admin"("check_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  DECLARE
      is_master BOOLEAN;
  BEGIN
      SELECT EXISTS (
          SELECT 1
          FROM user_tenants ut
          JOIN tenants t ON ut.tenant_slug = t.slug
          WHERE t.tenant_type = 'master'
          AND ut.user_id = check_user_id
          AND ut.role = 'admin'
      ) INTO is_master;

      RETURN COALESCE(is_master, FALSE);
  END;
  $$;


ALTER FUNCTION "public"."is_user_master_tenant_admin"("check_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_region_summary"() RETURNS "void"
    LANGUAGE "sql"
    AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY region_summary;
$$;


ALTER FUNCTION "public"."refresh_region_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_catalog_bundles"("p_countries" "text"[] DEFAULT NULL::"text"[], "p_bundle_groups" "text"[] DEFAULT NULL::"text"[], "p_min_duration" integer DEFAULT NULL::integer, "p_max_duration" integer DEFAULT NULL::integer, "p_unlimited" boolean DEFAULT NULL::boolean, "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "esim_go_name" character varying, "bundle_group" character varying, "description" "text", "duration" integer, "data_amount" bigint, "unlimited" boolean, "price_cents" integer, "currency" character varying, "countries" "jsonb", "regions" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cb.id,
    cb.esim_go_name,
    cb.bundle_group,
    cb.description,
    cb.duration,
    cb.data_amount,
    cb.unlimited,
    cb.price_cents,
    cb.currency,
    cb.countries,
    cb.regions
  FROM catalog_bundles cb
  WHERE 
    (p_countries IS NULL OR cb.countries ?| p_countries) AND
    (p_bundle_groups IS NULL OR cb.bundle_group = ANY(p_bundle_groups)) AND
    (p_min_duration IS NULL OR cb.duration >= p_min_duration) AND
    (p_max_duration IS NULL OR cb.duration <= p_max_duration) AND
    (p_unlimited IS NULL OR cb.unlimited = p_unlimited)
  ORDER BY cb.duration ASC, cb.data_amount ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."search_catalog_bundles"("p_countries" "text"[], "p_bundle_groups" "text"[], "p_min_duration" integer, "p_max_duration" integer, "p_unlimited" boolean, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_checkout_sessions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_checkout_sessions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
  BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
  END;
  $$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_tenants_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
  BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
  END;
  $$;


ALTER FUNCTION "public"."update_user_tenants_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_checkout_session_token"("session_token" "text") RETURNS TABLE("session_id" "uuid", "user_id" "uuid", "is_valid" boolean, "expires_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.user_id,
    (cs.expires_at > NOW()) as is_valid,
    cs.expires_at
  FROM checkout_sessions cs
  WHERE cs.token_hash = encode(sha256(session_token::bytea), 'hex')
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."validate_checkout_session_token"("session_token" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."data_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "description" "text",
    "countries" json NOT NULL,
    "region" character varying NOT NULL,
    "duration" integer NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "is_unlimited" boolean DEFAULT true,
    "bundle_group" character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."data_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."esim_bundles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "esim_id" "uuid" NOT NULL,
    "data_plan_id" "uuid" NOT NULL,
    "name" character varying NOT NULL,
    "state" character varying DEFAULT 'PROCESSING'::character varying NOT NULL,
    "remaining_data" bigint,
    "used_data" bigint DEFAULT 0,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_bundle_state" CHECK ((("state")::"text" = ANY ((ARRAY['PROCESSING'::character varying, 'ACTIVE'::character varying, 'INACTIVE'::character varying, 'SUSPENDED'::character varying, 'EXPIRED'::character varying, 'CANCELLED'::character varying])::"text"[])))
);


ALTER TABLE "public"."esim_bundles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."esims" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "iccid" character varying NOT NULL,
    "customer_ref" character varying,
    "qr_code_url" character varying,
    "status" character varying DEFAULT 'PROCESSING'::character varying NOT NULL,
    "assigned_date" timestamp with time zone,
    "last_action" character varying,
    "action_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "activation_code" character varying(255),
    "smdp_address" character varying(255),
    "matching_id" character varying(255),
    CONSTRAINT "valid_esim_action" CHECK ((("last_action" IS NULL) OR (("last_action")::"text" = ANY ((ARRAY['CREATED'::character varying, 'ASSIGNED'::character varying, 'INSTALLED'::character varying, 'SUSPENDED'::character varying, 'RESTORED'::character varying, 'CANCELLED'::character varying])::"text"[])))),
    CONSTRAINT "valid_esim_status" CHECK ((("status")::"text" = ANY ((ARRAY['PROCESSING'::character varying, 'ASSIGNED'::character varying, 'ACTIVE'::character varying, 'SUSPENDED'::character varying, 'EXPIRED'::character varying, 'CANCELLED'::character varying])::"text"[])))
);


ALTER TABLE "public"."esims" OWNER TO "postgres";


COMMENT ON COLUMN "public"."esims"."activation_code" IS 'Activation code for manual eSIM installation';



COMMENT ON COLUMN "public"."esims"."smdp_address" IS 'SMDP+ address for eSIM activation';



COMMENT ON COLUMN "public"."esims"."matching_id" IS 'Matching ID (confirmation code) for eSIM activation';



CREATE OR REPLACE VIEW "public"."active_bundles" AS
 SELECT "eb"."id",
    "eb"."esim_id",
    "eb"."data_plan_id",
    "eb"."name",
    "eb"."state",
    "eb"."remaining_data",
    "eb"."used_data",
    "eb"."start_date",
    "eb"."end_date",
    "eb"."created_at",
    "eb"."updated_at",
    "dp"."description" AS "plan_description",
    "dp"."region",
    "dp"."countries",
    "dp"."duration",
    "dp"."is_unlimited",
    "e"."user_id",
    "e"."iccid",
    "e"."status" AS "esim_status"
   FROM (("public"."esim_bundles" "eb"
     JOIN "public"."esims" "e" ON (("eb"."esim_id" = "e"."id")))
     JOIN "public"."data_plans" "dp" ON (("eb"."data_plan_id" = "dp"."id")))
  WHERE ((("eb"."state")::"text" = 'ACTIVE'::"text") AND (("eb"."end_date" IS NULL) OR ("eb"."end_date" > "now"())));


ALTER VIEW "public"."active_bundles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkout_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "plan_id" "text" NOT NULL,
    "plan_snapshot" "jsonb" NOT NULL,
    "pricing" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "steps" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "token_hash" "text",
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:30:00'::interval) NOT NULL,
    "payment_intent_id" "text",
    "payment_status" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "order_id" "uuid",
    "state" character varying(50) DEFAULT 'INITIALIZED'::character varying,
    CONSTRAINT "checkout_sessions_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['PENDING'::"text", 'PROCESSING'::"text", 'SUCCEEDED'::"text", 'FAILED'::"text", 'CANCELED'::"text"]))),
    CONSTRAINT "valid_checkout_session_states" CHECK (((("state")::"text" = ANY ((ARRAY['INITIALIZED'::character varying, 'AUTHENTICATED'::character varying, 'DELIVERY_SET'::character varying, 'PAYMENT_READY'::character varying, 'PAYMENT_PROCESSING'::character varying, 'PAYMENT_COMPLETED'::character varying, 'PAYMENT_FAILED'::character varying, 'EXPIRED'::character varying])::"text"[])) OR ("state" IS NULL)))
);


ALTER TABLE "public"."checkout_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."checkout_sessions" IS 'Secure server-side checkout session management for eSIM Go platform';



COMMENT ON COLUMN "public"."checkout_sessions"."plan_snapshot" IS 'Immutable snapshot of plan details at session creation time';



COMMENT ON COLUMN "public"."checkout_sessions"."pricing" IS 'Server-calculated pricing breakdown to prevent client tampering';



COMMENT ON COLUMN "public"."checkout_sessions"."steps" IS 'Progress tracking for multi-step checkout flow';



COMMENT ON COLUMN "public"."checkout_sessions"."token_hash" IS 'SHA256 hash of JWT token for secure session lookup';



COMMENT ON COLUMN "public"."checkout_sessions"."order_id" IS 'References the created order when checkout session is completed successfully';



COMMENT ON COLUMN "public"."checkout_sessions"."state" IS 'Current state of the checkout session in the state machine';



CREATE OR REPLACE VIEW "public"."active_checkout_sessions" AS
 SELECT "id",
    "user_id",
    "plan_id",
    "plan_snapshot",
    "pricing",
    "steps",
    "token_hash",
    "expires_at",
    "payment_intent_id",
    "payment_status",
    "created_at",
    "updated_at",
    "metadata",
    "public"."is_checkout_session_complete"("id") AS "is_complete",
    ("expires_at" - "now"()) AS "time_remaining"
   FROM "public"."checkout_sessions" "cs"
  WHERE ("expires_at" > "now"());


ALTER VIEW "public"."active_checkout_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_bundles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "esim_go_name" character varying NOT NULL,
    "description" "text",
    "duration" integer,
    "data_amount" bigint,
    "unlimited" boolean DEFAULT false,
    "currency" character varying(3) DEFAULT 'USD'::character varying,
    "regions" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "synced_at" timestamp with time zone DEFAULT "now"(),
    "groups" "text"[] DEFAULT '{}'::"text"[],
    "validity_in_days" integer,
    "data_amount_mb" bigint,
    "data_amount_readable" character varying(50),
    "is_unlimited" boolean DEFAULT false,
    "price" numeric(10,2),
    "region" character varying(100),
    "speed" "text"[] DEFAULT '{}'::"text"[],
    "countries" "text"[] DEFAULT '{}'::"text"[],
    CONSTRAINT "catalog_bundles_data_consistency" CHECK (((("is_unlimited" = true) AND ("data_amount_mb" IS NULL)) OR (("is_unlimited" = false) AND ("data_amount_mb" IS NOT NULL)))),
    CONSTRAINT "catalog_bundles_price_check" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "catalog_bundles_validity_check" CHECK (("validity_in_days" > 0))
);


ALTER TABLE "public"."catalog_bundles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."catalog_bundles"."groups" IS 'Bundle groups normalized without hyphens (e.g., "Standard Unlimited Essential" not "Standard - Unlimited Essential")';



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
    "speed"
   FROM "public"."catalog_bundles"
  WHERE (("countries" IS NOT NULL) AND ("array_length"("countries", 1) > 0));


ALTER VIEW "public"."bundles_by_country" OWNER TO "postgres";


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
    "speed"
   FROM "public"."catalog_bundles"
  WHERE (("groups" IS NOT NULL) AND ("array_length"("groups", 1) > 0));


ALTER VIEW "public"."bundles_by_group" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_metadata" (
    "id" character varying(50) DEFAULT 'singleton'::character varying NOT NULL,
    "sync_version" character varying(20),
    "last_full_sync" timestamp with time zone,
    "next_scheduled_sync" timestamp with time zone,
    "bundle_groups" "text"[],
    "total_bundles" integer DEFAULT 0,
    "sync_strategy" character varying(50) DEFAULT 'bundle-groups'::character varying,
    "api_health_status" character varying(20) DEFAULT 'healthy'::character varying,
    "last_health_check" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "catalog_metadata_singleton_check" CHECK ((("id")::"text" = 'singleton'::"text"))
);


ALTER TABLE "public"."catalog_metadata" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_sync_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_type" character varying(50) NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    "priority" character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    "bundle_group" character varying(255),
    "country_id" character varying(10),
    "bundles_processed" integer DEFAULT 0,
    "bundles_added" integer DEFAULT 0,
    "bundles_updated" integer DEFAULT 0,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."catalog_sync_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."corporate_email_domains" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "domain" "text" NOT NULL,
    "discount_percentage" numeric NOT NULL,
    "max_discount" numeric,
    "min_spend" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."corporate_email_domains" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupon_usage_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "coupon_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "order_id" "uuid",
    "original_amount" numeric NOT NULL,
    "discounted_amount" numeric NOT NULL,
    "discount_amount" numeric NOT NULL,
    "used_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coupon_usage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupons" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "coupon_type" "public"."coupon_type" NOT NULL,
    "value" numeric NOT NULL,
    "valid_from" timestamp with time zone,
    "valid_until" timestamp with time zone,
    "max_total_usage" integer,
    "max_per_user" integer,
    "min_spend" numeric,
    "max_discount" numeric,
    "applicability" "public"."coupon_applicability" DEFAULT 'global'::"public"."coupon_applicability",
    "allowed_regions" "text"[],
    "allowed_bundle_ids" "uuid"[],
    "corporate_domain" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."coupons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."esim_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reference" character varying NOT NULL,
    "status" character varying DEFAULT 'PROCESSING'::character varying NOT NULL,
    "data_plan_id" "uuid",
    "quantity" integer DEFAULT 1 NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "esim_go_order_ref" character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "plan_data" "jsonb",
    "pricing_breakdown" "jsonb",
    CONSTRAINT "valid_order_status" CHECK ((("status")::"text" = ANY ((ARRAY['PROCESSING'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying, 'CANCELLED'::character varying, 'REFUNDED'::character varying])::"text"[])))
);


ALTER TABLE "public"."esim_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."high_demand_countries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "country_id" character varying(3) NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."high_demand_countries" OWNER TO "postgres";


COMMENT ON COLUMN "public"."high_demand_countries"."country_id" IS 'ISO country code - supports both alpha-2 (US, GB) and alpha-3 (CYP, USA) formats';



CREATE TABLE IF NOT EXISTS "public"."package_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "data_plan_id" "text" NOT NULL,
    "assigned_by" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "plan_snapshot" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "package_assignments_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'ASSIGNED'::"text", 'ACTIVATED'::"text", 'EXPIRED'::"text", 'CANCELLED'::"text"])))
);


ALTER TABLE "public"."package_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pricing_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "category" character varying(50) NOT NULL,
    "conditions" "jsonb" NOT NULL,
    "priority" integer DEFAULT 100,
    "is_active" boolean DEFAULT true,
    "is_editable" boolean DEFAULT true,
    "valid_from" timestamp without time zone,
    "valid_until" timestamp without time zone,
    "created_by" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "event_type" "text" DEFAULT 'default'::"text" NOT NULL,
    "params" "jsonb"
);


ALTER TABLE "public"."pricing_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pricing_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "rule_type" character varying(50) NOT NULL,
    "event_type" character varying(50) NOT NULL,
    "conditions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "event_params" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pricing_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pricing_rules_backup_20250730" (
    "id" "uuid",
    "name" character varying(255),
    "description" "text",
    "category" "text",
    "conditions" "jsonb",
    "actions" "jsonb",
    "priority" integer,
    "is_active" boolean,
    "is_editable" boolean,
    "valid_from" timestamp with time zone,
    "valid_until" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."pricing_rules_backup_20250730" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pricing_strategies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "is_default" boolean DEFAULT false,
    "version" integer DEFAULT 1 NOT NULL,
    "parent_strategy_id" "uuid",
    "activation_count" integer DEFAULT 0,
    "last_activated_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "archived_at" timestamp with time zone,
    "validated_at" timestamp with time zone,
    "validation_errors" "jsonb"
);


ALTER TABLE "public"."pricing_strategies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "phone" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."strategy_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "strategy_id" "uuid" NOT NULL,
    "block_id" "uuid" NOT NULL,
    "is_enabled" boolean DEFAULT true,
    "priority" integer NOT NULL,
    "config_overrides" "jsonb" DEFAULT '{}'::"jsonb",
    "added_at" timestamp with time zone DEFAULT "now"(),
    "added_by" "uuid"
);


ALTER TABLE "public"."strategy_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "img_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_type" character varying(20) DEFAULT 'standard'::character varying
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "description" "text" NOT NULL,
    "region_id" character varying NOT NULL,
    "country_ids" json NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."trips" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_slug" "text" NOT NULL,
    "role" character varying(50) DEFAULT 'member'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_tenants" OWNER TO "postgres";


ALTER TABLE ONLY "public"."catalog_bundles"
    ADD CONSTRAINT "catalog_bundles_esim_go_name_key" UNIQUE ("esim_go_name");



ALTER TABLE ONLY "public"."catalog_bundles"
    ADD CONSTRAINT "catalog_bundles_pkey" PRIMARY KEY ("esim_go_name");



ALTER TABLE ONLY "public"."catalog_metadata"
    ADD CONSTRAINT "catalog_metadata_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_sync_jobs"
    ADD CONSTRAINT "catalog_sync_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."corporate_email_domains"
    ADD CONSTRAINT "corporate_email_domains_domain_key" UNIQUE ("domain");



ALTER TABLE ONLY "public"."corporate_email_domains"
    ADD CONSTRAINT "corporate_email_domains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupon_usage_logs"
    ADD CONSTRAINT "coupon_usage_logs_coupon_id_user_id_key" UNIQUE ("coupon_id", "user_id");



ALTER TABLE ONLY "public"."coupon_usage_logs"
    ADD CONSTRAINT "coupon_usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data_plans"
    ADD CONSTRAINT "data_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."esim_bundles"
    ADD CONSTRAINT "esim_bundles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."esim_orders"
    ADD CONSTRAINT "esim_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."esim_orders"
    ADD CONSTRAINT "esim_orders_reference_key" UNIQUE ("reference");



ALTER TABLE ONLY "public"."esims"
    ADD CONSTRAINT "esims_iccid_key" UNIQUE ("iccid");



ALTER TABLE ONLY "public"."esims"
    ADD CONSTRAINT "esims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."high_demand_countries"
    ADD CONSTRAINT "high_demand_countries_country_id_key" UNIQUE ("country_id");



ALTER TABLE ONLY "public"."high_demand_countries"
    ADD CONSTRAINT "high_demand_countries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."package_assignments"
    ADD CONSTRAINT "package_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_blocks"
    ADD CONSTRAINT "pricing_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_rules"
    ADD CONSTRAINT "pricing_rules_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."pricing_rules"
    ADD CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_strategies"
    ADD CONSTRAINT "pricing_strategies_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."pricing_strategies"
    ADD CONSTRAINT "pricing_strategies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_strategies"
    ADD CONSTRAINT "single_default_strategy" EXCLUDE USING "btree" ("is_default" WITH =) WHERE (("is_default" = true));



ALTER TABLE ONLY "public"."strategy_blocks"
    ADD CONSTRAINT "strategy_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("slug");



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."strategy_blocks"
    ADD CONSTRAINT "unique_priority_per_strategy" UNIQUE ("strategy_id", "priority");



ALTER TABLE ONLY "public"."strategy_blocks"
    ADD CONSTRAINT "unique_rule_per_strategy" UNIQUE ("strategy_id", "block_id");



ALTER TABLE ONLY "public"."user_tenants"
    ADD CONSTRAINT "user_tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_tenants"
    ADD CONSTRAINT "user_tenants_user_id_tenant_slug_key" UNIQUE ("user_id", "tenant_slug");



CREATE INDEX "idx_catalog_bundles_countries" ON "public"."catalog_bundles" USING "gin" ("countries");



CREATE INDEX "idx_catalog_bundles_duration" ON "public"."catalog_bundles" USING "btree" ("duration");



CREATE INDEX "idx_catalog_bundles_esim_go_name" ON "public"."catalog_bundles" USING "btree" ("esim_go_name");



CREATE INDEX "idx_catalog_bundles_groups" ON "public"."catalog_bundles" USING "gin" ("groups");



CREATE INDEX "idx_catalog_bundles_price" ON "public"."catalog_bundles" USING "btree" ("price");



CREATE INDEX "idx_catalog_bundles_region" ON "public"."catalog_bundles" USING "btree" ("region");



CREATE INDEX "idx_catalog_bundles_speed" ON "public"."catalog_bundles" USING "gin" ("speed");



CREATE INDEX "idx_catalog_bundles_synced_at" ON "public"."catalog_bundles" USING "btree" ("synced_at");



CREATE INDEX "idx_catalog_bundles_unlimited" ON "public"."catalog_bundles" USING "btree" ("is_unlimited");



CREATE INDEX "idx_catalog_bundles_validity" ON "public"."catalog_bundles" USING "btree" ("validity_in_days");



CREATE INDEX "idx_catalog_sync_jobs_created_at" ON "public"."catalog_sync_jobs" USING "btree" ("created_at");



CREATE INDEX "idx_catalog_sync_jobs_job_type" ON "public"."catalog_sync_jobs" USING "btree" ("job_type");



CREATE INDEX "idx_catalog_sync_jobs_status" ON "public"."catalog_sync_jobs" USING "btree" ("status");



CREATE INDEX "idx_checkout_sessions_created_at" ON "public"."checkout_sessions" USING "btree" ("created_at");



CREATE INDEX "idx_checkout_sessions_expires_at" ON "public"."checkout_sessions" USING "btree" ("expires_at");



CREATE INDEX "idx_checkout_sessions_order_id" ON "public"."checkout_sessions" USING "btree" ("order_id");



CREATE INDEX "idx_checkout_sessions_payment_intent" ON "public"."checkout_sessions" USING "btree" ("payment_intent_id");



CREATE INDEX "idx_checkout_sessions_token_hash" ON "public"."checkout_sessions" USING "btree" ("token_hash");



CREATE INDEX "idx_checkout_sessions_user_expires" ON "public"."checkout_sessions" USING "btree" ("user_id", "expires_at");



CREATE INDEX "idx_checkout_sessions_user_id" ON "public"."checkout_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_corporate_domains" ON "public"."corporate_email_domains" USING "btree" ("domain");



CREATE INDEX "idx_coupon_usage_logs_coupon" ON "public"."coupon_usage_logs" USING "btree" ("coupon_id");



CREATE INDEX "idx_coupon_usage_logs_user" ON "public"."coupon_usage_logs" USING "btree" ("user_id");



CREATE INDEX "idx_coupons_code" ON "public"."coupons" USING "btree" ("code");



CREATE INDEX "idx_coupons_validity" ON "public"."coupons" USING "btree" ("valid_from", "valid_until");



CREATE INDEX "idx_data_plans_bundle_group" ON "public"."data_plans" USING "btree" ("bundle_group");



CREATE INDEX "idx_data_plans_name" ON "public"."data_plans" USING "btree" ("name");



CREATE INDEX "idx_data_plans_region" ON "public"."data_plans" USING "btree" ("region");



CREATE INDEX "idx_esim_bundles_end_date" ON "public"."esim_bundles" USING "btree" ("end_date");



CREATE INDEX "idx_esim_bundles_esim_id" ON "public"."esim_bundles" USING "btree" ("esim_id");



CREATE INDEX "idx_esim_bundles_name" ON "public"."esim_bundles" USING "btree" ("name");



CREATE INDEX "idx_esim_bundles_state" ON "public"."esim_bundles" USING "btree" ("state");



CREATE INDEX "idx_esim_orders_created_at" ON "public"."esim_orders" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_esim_orders_reference" ON "public"."esim_orders" USING "btree" ("reference");



CREATE INDEX "idx_esim_orders_status" ON "public"."esim_orders" USING "btree" ("status");



CREATE INDEX "idx_esim_orders_user_id" ON "public"."esim_orders" USING "btree" ("user_id");



CREATE INDEX "idx_esims_assigned_date" ON "public"."esims" USING "btree" ("assigned_date" DESC);



CREATE INDEX "idx_esims_iccid" ON "public"."esims" USING "btree" ("iccid");



CREATE INDEX "idx_esims_order_id" ON "public"."esims" USING "btree" ("order_id");



CREATE INDEX "idx_esims_status" ON "public"."esims" USING "btree" ("status");



CREATE INDEX "idx_esims_user_id" ON "public"."esims" USING "btree" ("user_id");



CREATE INDEX "idx_high_demand_countries_country_id" ON "public"."high_demand_countries" USING "btree" ("country_id");



CREATE INDEX "idx_high_demand_countries_created_at" ON "public"."high_demand_countries" USING "btree" ("created_at");



CREATE INDEX "idx_package_assignments_assigned_by" ON "public"."package_assignments" USING "btree" ("assigned_by");



CREATE INDEX "idx_package_assignments_created_at" ON "public"."package_assignments" USING "btree" ("created_at");



CREATE INDEX "idx_package_assignments_status" ON "public"."package_assignments" USING "btree" ("status");



CREATE INDEX "idx_package_assignments_user_id" ON "public"."package_assignments" USING "btree" ("user_id");



CREATE INDEX "idx_pricing_blocks_active" ON "public"."pricing_blocks" USING "btree" ("is_active");



CREATE INDEX "idx_pricing_blocks_category" ON "public"."pricing_blocks" USING "btree" ("category");



CREATE INDEX "idx_pricing_blocks_conditions" ON "public"."pricing_blocks" USING "gin" ("conditions");



CREATE INDEX "idx_strategy_rules_by_strategy" ON "public"."strategy_blocks" USING "btree" ("strategy_id", "priority" DESC) WHERE ("is_enabled" = true);



CREATE INDEX "idx_trips_created_by" ON "public"."trips" USING "btree" ("created_by");



CREATE INDEX "idx_trips_region_id" ON "public"."trips" USING "btree" ("region_id");



CREATE OR REPLACE TRIGGER "trigger_checkout_sessions_updated_at" BEFORE UPDATE ON "public"."checkout_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_checkout_sessions_updated_at"();



CREATE OR REPLACE TRIGGER "update_catalog_bundles_updated_at" BEFORE UPDATE ON "public"."catalog_bundles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_data_plans_updated_at" BEFORE UPDATE ON "public"."data_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_esim_bundles_updated_at" BEFORE UPDATE ON "public"."esim_bundles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_esim_orders_updated_at" BEFORE UPDATE ON "public"."esim_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_esims_updated_at" BEFORE UPDATE ON "public"."esims" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_high_demand_countries_updated_at" BEFORE UPDATE ON "public"."high_demand_countries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_package_assignments_updated_at" BEFORE UPDATE ON "public"."package_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tenants_modtime" BEFORE UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_trips_updated_at" BEFORE UPDATE ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_tenants_modtime" BEFORE UPDATE ON "public"."user_tenants" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_tenants_modified_column"();



ALTER TABLE ONLY "public"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."esim_orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coupon_usage_logs"
    ADD CONSTRAINT "coupon_usage_logs_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id");



ALTER TABLE ONLY "public"."coupon_usage_logs"
    ADD CONSTRAINT "coupon_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."esim_bundles"
    ADD CONSTRAINT "esim_bundles_data_plan_id_fkey" FOREIGN KEY ("data_plan_id") REFERENCES "public"."data_plans"("id");



ALTER TABLE ONLY "public"."esim_bundles"
    ADD CONSTRAINT "esim_bundles_esim_id_fkey" FOREIGN KEY ("esim_id") REFERENCES "public"."esims"("id");



ALTER TABLE ONLY "public"."esim_orders"
    ADD CONSTRAINT "esim_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."esims"
    ADD CONSTRAINT "esims_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."esim_orders"("id");



ALTER TABLE ONLY "public"."esims"
    ADD CONSTRAINT "esims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."package_assignments"
    ADD CONSTRAINT "package_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."package_assignments"
    ADD CONSTRAINT "package_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pricing_strategies"
    ADD CONSTRAINT "pricing_strategies_parent_strategy_id_fkey" FOREIGN KEY ("parent_strategy_id") REFERENCES "public"."pricing_strategies"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."strategy_blocks"
    ADD CONSTRAINT "strategy_blocks_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "public"."pricing_blocks"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."strategy_blocks"
    ADD CONSTRAINT "strategy_blocks_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "public"."pricing_strategies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_tenants"
    ADD CONSTRAINT "user_tenants_tenant_slug_fkey" FOREIGN KEY ("tenant_slug") REFERENCES "public"."tenants"("slug") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tenants"
    ADD CONSTRAINT "user_tenants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can access all checkout sessions" ON "public"."checkout_sessions" TO "authenticated" USING (("public"."is_admin"("auth"."uid"()) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Admin can access all esims" ON "public"."esims" TO "authenticated" USING (("public"."is_admin"("auth"."uid"()) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Admin can access all profiles" ON "public"."profiles" TO "authenticated" USING (("public"."is_admin"("auth"."uid"()) OR ("id" = "auth"."uid"())));



CREATE POLICY "Admin can access all records" ON "public"."esim_orders" TO "authenticated" USING (("public"."is_admin"("auth"."uid"()) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Admin can manage corporate domains" ON "public"."corporate_email_domains" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text"))));



CREATE POLICY "Admin can manage coupons" ON "public"."coupons" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text"))));



CREATE POLICY "Allow all on catalog_metadata" ON "public"."catalog_metadata" USING (true);



CREATE POLICY "Allow all on catalog_sync_jobs" ON "public"."catalog_sync_jobs" USING (true);



CREATE POLICY "Anonymous users can access anonymous sessions" ON "public"."checkout_sessions" TO "anon" USING (("user_id" IS NULL)) WITH CHECK (("user_id" IS NULL));



CREATE POLICY "Anyone can view data plans" ON "public"."data_plans" FOR SELECT USING (true);



CREATE POLICY "Only admins can delete data plans" ON "public"."data_plans" FOR DELETE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can insert data plans" ON "public"."data_plans" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can modify high demand countries" ON "public"."high_demand_countries" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'ADMIN'::"text")))));



CREATE POLICY "Only admins can update data plans" ON "public"."data_plans" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Service role can access all checkout sessions" ON "public"."checkout_sessions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "System can create esim bundles" ON "public"."esim_bundles" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create esims" ON "public"."esims" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can update esim bundles" ON "public"."esim_bundles" FOR UPDATE USING (true);



CREATE POLICY "Tenants can be read by authenticated users" ON "public"."tenants" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can create own orders" ON "public"."esim_orders" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own checkout sessions" ON "public"."checkout_sessions" TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL))) WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can see their own tenant associations" ON "public"."user_tenants" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own esims" ON "public"."esims" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own orders" ON "public"."esim_orders" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view high demand countries" ON "public"."high_demand_countries" FOR SELECT USING (true);



CREATE POLICY "Users can view own esim bundles" ON "public"."esim_bundles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."esims"
  WHERE (("esims"."id" = "esim_bundles"."esim_id") AND ("esims"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own esims" ON "public"."esims" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own orders" ON "public"."esim_orders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own usage logs" ON "public"."coupon_usage_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."catalog_metadata" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalog_sync_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkout_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."corporate_email_domains" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupon_usage_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."data_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."esim_bundles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."esim_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."esims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."high_demand_countries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."package_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "package_assignments_admin_insert" ON "public"."package_assignments" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'ADMIN'::"text"));



CREATE POLICY "package_assignments_admin_select" ON "public"."package_assignments" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'ADMIN'::"text"));



CREATE POLICY "package_assignments_admin_update" ON "public"."package_assignments" FOR UPDATE TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'ADMIN'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'ADMIN'::"text"));



CREATE POLICY "package_assignments_user_select" ON "public"."package_assignments" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_tenants" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."cleanup_expired_checkout_sessions"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_checkout_sessions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_checkout_sessions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bundle_coverage_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_bundle_coverage_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bundle_coverage_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bundles_by_countries"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_bundles_by_countries"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bundles_by_countries"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bundles_by_groups"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_bundles_by_groups"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bundles_by_groups"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bundles_by_groups_simple"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_bundles_by_groups_simple"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bundles_by_groups_simple"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bundles_by_regions"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_bundles_by_regions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bundles_by_regions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bundles_by_regions_v2"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_bundles_by_regions_v2"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bundles_by_regions_v2"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bundles_for_country"("country_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bundles_for_country"("country_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bundles_for_country"("country_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bundles_for_country_simple"("country_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bundles_for_country_simple"("country_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bundles_for_country_simple"("country_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bundles_for_group"("group_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bundles_for_group"("group_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bundles_for_group"("group_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bundles_for_region"("region_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bundles_for_region"("region_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bundles_for_region"("region_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_distinct_durations"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_distinct_durations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_distinct_durations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_region_countries"("region_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_region_countries"("region_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_region_countries"("region_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_region_groups"("region_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_region_groups"("region_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_region_groups"("region_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_region_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_region_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_region_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_regions_with_bundles"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_regions_with_bundles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_regions_with_bundles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unique_durations"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_unique_durations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unique_durations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unique_groups_from_bundles"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_unique_groups_from_bundles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unique_groups_from_bundles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unique_regions"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_unique_regions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unique_regions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_checkout_session_complete"("session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_checkout_session_complete"("session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_checkout_session_complete"("session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_master_tenant_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_master_tenant_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_master_tenant_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_master_tenant_admin"("check_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_master_tenant_admin"("check_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_master_tenant_admin"("check_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_region_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_region_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_region_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_catalog_bundles"("p_countries" "text"[], "p_bundle_groups" "text"[], "p_min_duration" integer, "p_max_duration" integer, "p_unlimited" boolean, "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_catalog_bundles"("p_countries" "text"[], "p_bundle_groups" "text"[], "p_min_duration" integer, "p_max_duration" integer, "p_unlimited" boolean, "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_catalog_bundles"("p_countries" "text"[], "p_bundle_groups" "text"[], "p_min_duration" integer, "p_max_duration" integer, "p_unlimited" boolean, "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_checkout_sessions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_checkout_sessions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_checkout_sessions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_tenants_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_tenants_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_tenants_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_checkout_session_token"("session_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_checkout_session_token"("session_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_checkout_session_token"("session_token" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."data_plans" TO "anon";
GRANT ALL ON TABLE "public"."data_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."data_plans" TO "service_role";



GRANT ALL ON TABLE "public"."esim_bundles" TO "anon";
GRANT ALL ON TABLE "public"."esim_bundles" TO "authenticated";
GRANT ALL ON TABLE "public"."esim_bundles" TO "service_role";



GRANT ALL ON TABLE "public"."esims" TO "anon";
GRANT ALL ON TABLE "public"."esims" TO "authenticated";
GRANT ALL ON TABLE "public"."esims" TO "service_role";



GRANT ALL ON TABLE "public"."active_bundles" TO "anon";
GRANT ALL ON TABLE "public"."active_bundles" TO "authenticated";
GRANT ALL ON TABLE "public"."active_bundles" TO "service_role";



GRANT ALL ON TABLE "public"."checkout_sessions" TO "anon";
GRANT ALL ON TABLE "public"."checkout_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."checkout_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."active_checkout_sessions" TO "anon";
GRANT ALL ON TABLE "public"."active_checkout_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."active_checkout_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_bundles" TO "anon";
GRANT ALL ON TABLE "public"."catalog_bundles" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_bundles" TO "service_role";



GRANT ALL ON TABLE "public"."bundles_by_country" TO "anon";
GRANT ALL ON TABLE "public"."bundles_by_country" TO "authenticated";
GRANT ALL ON TABLE "public"."bundles_by_country" TO "service_role";



GRANT ALL ON TABLE "public"."bundles_by_group" TO "anon";
GRANT ALL ON TABLE "public"."bundles_by_group" TO "authenticated";
GRANT ALL ON TABLE "public"."bundles_by_group" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_metadata" TO "anon";
GRANT ALL ON TABLE "public"."catalog_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_sync_jobs" TO "anon";
GRANT ALL ON TABLE "public"."catalog_sync_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_sync_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."corporate_email_domains" TO "anon";
GRANT ALL ON TABLE "public"."corporate_email_domains" TO "authenticated";
GRANT ALL ON TABLE "public"."corporate_email_domains" TO "service_role";



GRANT ALL ON TABLE "public"."coupon_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."coupon_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."coupon_usage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."coupons" TO "anon";
GRANT ALL ON TABLE "public"."coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."coupons" TO "service_role";



GRANT ALL ON TABLE "public"."esim_orders" TO "anon";
GRANT ALL ON TABLE "public"."esim_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."esim_orders" TO "service_role";



GRANT ALL ON TABLE "public"."high_demand_countries" TO "anon";
GRANT ALL ON TABLE "public"."high_demand_countries" TO "authenticated";
GRANT ALL ON TABLE "public"."high_demand_countries" TO "service_role";



GRANT ALL ON TABLE "public"."package_assignments" TO "anon";
GRANT ALL ON TABLE "public"."package_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."package_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_blocks" TO "anon";
GRANT ALL ON TABLE "public"."pricing_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_rules" TO "anon";
GRANT ALL ON TABLE "public"."pricing_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_rules" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_rules_backup_20250730" TO "anon";
GRANT ALL ON TABLE "public"."pricing_rules_backup_20250730" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_rules_backup_20250730" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_strategies" TO "anon";
GRANT ALL ON TABLE "public"."pricing_strategies" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_strategies" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."strategy_blocks" TO "anon";
GRANT ALL ON TABLE "public"."strategy_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."strategy_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."trips" TO "anon";
GRANT ALL ON TABLE "public"."trips" TO "authenticated";
GRANT ALL ON TABLE "public"."trips" TO "service_role";



GRANT ALL ON TABLE "public"."user_tenants" TO "anon";
GRANT ALL ON TABLE "public"."user_tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."user_tenants" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
