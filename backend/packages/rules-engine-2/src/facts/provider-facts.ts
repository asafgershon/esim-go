import { Almanac } from "json-rules-engine";
import { getSupabaseClient } from "../supabase";
import { Database } from "@hiilo/supabase";
import { Provider } from "../generated/types";

const supabase = getSupabaseClient();

type Bundle = Database["public"]["Views"]["bundles_by_group"]["Row"];
/**
 * Returns list of available providers based on bundle availability
 */
export const availableProviders = async (
  _params: Record<string, any>,
  almanac: Almanac
): Promise<Provider[]> => {
  const bundles = await almanac.factValue<Bundle[]>("availableBundles");
  const providers = new Set<Provider>();

  bundles.forEach((bundle) => {
    if (bundle.provider) {
      providers.add(bundle.provider as Provider);
    }
  });

  return Array.from(providers);
};

/**
 * Returns the preferred provider based on configuration
 */
export const preferredProvider = async (
  _params: Record<string, any>,
  almanac: Almanac
): Promise<Provider> => {
  // Default to Maya as preferred provider
  return Provider.Maya;
};

/**
 * Checks if a specific provider is available
 */
export const isProviderAvailable = async (
  params: { provider: Provider },
  almanac: Almanac
): Promise<boolean> => {
  const providers = await almanac.factValue<Provider[]>("availableProviders");
  return providers.includes(params.provider);
};

/**
 * Determines which provider to use based on bundle availability
 * Prioritizes Maya Mobile, falls back to eSIM-Go
 */
export const selectProvider = async (
  params: Record<string, any>,
  almanac: Almanac
): Promise<Provider> => {
  const group = await almanac.factValue<string>("requestedGroup");
  const region = await almanac.factValue<string>("region");
  const country = await almanac.factValue<string>("country");
  const requestedDays = await almanac.factValue<number>(
    "requestedValidityDays"
  );

  const bundlesQuery = supabase.from("bundles_by_group").select("*");

  if (region) {
    bundlesQuery.eq("region", region);
  }

  if (country) {
    bundlesQuery.contains("countries", [country]);
  }

  const result = await bundlesQuery;
  let bundles = (result.data as Bundle[]) || [];

  if (group) {
    bundles = bundles.filter((bundle) => bundle.group_name?.includes(group));
  }

  // Get available durations for each provider
  const mayaBundles = bundles.filter((b) => b.provider === Provider.Maya);
  const esimGoBundles = bundles.filter((b) => b.provider === Provider.EsimGo);

  const mayaDurations = mayaBundles.map((b) => b.validity_in_days || 0);
  const esimGoDurations = esimGoBundles.map((b) => b.validity_in_days || 0);

  // Check if Maya has exact match or next longer duration
  const mayaHasExact = mayaDurations.includes(requestedDays);
  const mayaNextLonger = mayaDurations
    .filter((d) => d > requestedDays)
    .sort((a, b) => a - b)[0];

  // Check if eSIM-Go has exact match or next longer duration
  const esimGoHasExact = esimGoDurations.includes(requestedDays);
  const esimGoNextLonger = esimGoDurations
    .filter((d) => d > requestedDays)
    .sort((a, b) => a - b)[0];

  // Prefer Maya if available, otherwise use eSIM-Go
  if (mayaHasExact || mayaNextLonger) {
    return Provider.Maya;
  } else if (esimGoHasExact || esimGoNextLonger) {
    return Provider.EsimGo;
  }

  // Default to Maya if no suitable bundles found (will be handled elsewhere)
  return Provider.Maya;
};

/**
 * Returns bundles filtered by the selected provider
 */
export const availableBundlesByProvider = async (
  _params: Record<string, any>,
  almanac: Almanac
): Promise<Bundle[]> => {
  const allBundles = await almanac.factValue<Bundle[]>("availableBundles");

  // Get selected provider from runtime facts
  let selectedProvider: Provider | null = null;
  try {
    selectedProvider = await almanac.factValue<Provider>("selectedProvider");
  } catch {
    // Provider not selected yet, return all bundles
    return allBundles;
  }

  if (!selectedProvider) {
    return allBundles;
  }

  // Filter bundles by selected provider
  return allBundles.filter((bundle) => bundle.provider === selectedProvider);
};

/**
 * Checks if a specific provider has bundles available
 */
export const hasProviderBundles = async (
  params: { provider: Provider },
  almanac: Almanac
): Promise<boolean> => {
  const group = await almanac.factValue<string>("requestedGroup");
  const region = await almanac.factValue<string>("region");
  const country = await almanac.factValue<string>("country");

  const bundlesQuery = supabase.from("bundles_by_group").select("*");

  if (region) {
    bundlesQuery.eq("region", region);
  }

  if (country) {
    bundlesQuery.contains("countries", [country]);
  }

  bundlesQuery.eq("provider", params.provider);

  const result = await bundlesQuery;
  let bundles = (result.data as Bundle[]) || [];

  if (group) {
    bundles = bundles.filter((bundle) => bundle.group_name?.includes(group));
  }

  return bundles.length > 0;
};
