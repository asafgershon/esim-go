import { Almanac } from "json-rules-engine";
import { getSupabaseClient } from "../supabase";

let supabase = getSupabaseClient();

export const availableBundles = async (
  _params: Record<string, any>,
  almanac: Almanac
) => {
  const group = await almanac.factValue<string>("requestedGroup");
  const region = await almanac.factValue<string>("region");
  const country = await almanac.factValue<string>("country");

  const bundlesQuery = supabase
    .from("bundles_by_group")
    .select("*")
    .eq("group_name", group);

  if (region) {
    bundlesQuery.eq("region", region);
  }

  if (country) {
    bundlesQuery.contains("countries", [country]);
  }

  const res = await bundlesQuery;
  return res.data;
};
