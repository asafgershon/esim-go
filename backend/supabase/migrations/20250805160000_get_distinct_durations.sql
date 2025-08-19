-- Create function to get distinct durations from catalog bundles
CREATE OR REPLACE FUNCTION get_distinct_durations()
RETURNS TABLE (
  value text,
  label text,
  min_days integer,
  max_days integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
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

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION get_distinct_durations() TO authenticated;
GRANT EXECUTE ON FUNCTION get_distinct_durations() TO anon;

-- Add comment
COMMENT ON FUNCTION get_distinct_durations() IS 'Returns distinct duration values from catalog bundles for pricing configuration';