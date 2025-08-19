import { Almanac } from "json-rules-engine";
import { getSupabaseClient } from "../supabase";

let supabase = getSupabaseClient();

export const durations = async (
  _params: Record<string, any>,
  _almanac: Almanac
) => {
  const res = await supabase
    .rpc("get_unique_durations")
    .then((res) =>
      res.data?.map((d: { validity_in_days: number }) => d.validity_in_days)
    )
    .then((durations) => {
      return durations;
    });

  return res;
};
