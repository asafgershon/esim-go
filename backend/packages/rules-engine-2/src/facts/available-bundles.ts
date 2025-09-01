import { Almanac } from "json-rules-engine";
import { getSupabaseClient } from "../supabase";
import { Database } from "@hiilo/supabase";
import { Provider } from "../generated/types";

const supabase = getSupabaseClient();

type Bundle = Database["public"]["Tables"]["catalog_bundles"]["Row"];

export const availableBundles = async (
  _params: Record<string, any>,
  almanac: Almanac
): Promise<Bundle[]> => {
  try {
    const group = (await almanac.factValue<string>("requestedGroup")) || "";
    const region = await almanac.factValue<string>("region");
    const country = await almanac.factValue<string>("country");

    const bundlesQuery = supabase
      .from("catalog_bundles")
      .select("*")
      .eq("is_unlimited", true);

    if (region) {
      bundlesQuery.eq("region", region);
    }

    if (country) {
      bundlesQuery.contains("countries", [country]);
    }

    const res = await bundlesQuery;

    if (res.error) {
      console.error("Failed to fetch bundles:", res.error);
      return [];
    }

    let bundles: Bundle[] = res.data || [];

    // Apply group filtering if group is specified
    if (group) {
      bundles = bundles.filter(
        (bundle) => !bundle.groups?.length || bundle.groups?.includes(group)
      );
    }

    return bundles;
  } catch (error) {
    console.error("Error in availableBundles:", error);
    return [];
  }
};

/**
 * Provider-filtered bundles based on selected provider
 */
export const availableBundlesByProvider = async (
  _params: Record<string, any>,
  almanac: Almanac
): Promise<Bundle[]> => {
  try {
    const allBundles = await almanac.factValue<Bundle[]>("availableBundles");

    // Try to get provider selection from runtime facts
    let selectedProvider: Provider | null = null;
    try {
      selectedProvider = await almanac.factValue<Provider>("providerSelection");
    } catch {
      // Provider not selected yet, return all bundles
      return allBundles || [];
    }

    if (!selectedProvider || !allBundles) {
      return allBundles || [];
    }

    // Filter bundles by selected provider
    return allBundles.filter((bundle) => bundle.provider === selectedProvider);
  } catch (error) {
    console.error("Error in availableBundlesByProvider:", error);
    return [];
  }
};
