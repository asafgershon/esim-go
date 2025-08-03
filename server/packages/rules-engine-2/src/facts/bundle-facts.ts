import { Almanac } from "json-rules-engine";
import { Database } from "../generated/database.types";

type BundleByGroupRow = Database["public"]["Views"]["bundles_by_group"]["Row"];
export type SelectedBundleFact = BundleByGroupRow | null;

export const selectBundle = async (
  _params: Record<string, any>,
  almanac: Almanac
): Promise<SelectedBundleFact> => {
  let bundle: SelectedBundleFact | null = null;
  const days = await almanac.factValue<number>("requestedValidityDays");
  const durations = await almanac.factValue<number[]>("durations");
  const availableBundles = await almanac.factValue<BundleByGroupRow[]>(
    "availableBundles"
  );

  // Check for exact match
  if (durations.includes(days)) {
    bundle = availableBundles?.find((b) => b.validity_in_days === days) || null;
  } else {
    const nextLongerDuration = durations.find((d) => d > days);
    if (nextLongerDuration) {
      bundle =
        availableBundles?.find(
          (b) => b.validity_in_days === nextLongerDuration
        ) || null;
    }
  }

  if (!bundle) {
    throw new Error("Bundle not found");
  }

  return bundle;
};

export type PreviousBundleFact = BundleByGroupRow | null;

export const previousBundle = async (
  _params: Record<string, any>,
  almanac: Almanac
): Promise<PreviousBundleFact> => {
  const selectedBundle = await almanac.factValue<SelectedBundleFact>(
    "selectedBundle"
  );
  const availableBundles = await almanac.factValue<BundleByGroupRow[]>(
    "availableBundles"
  );
  const durations = await almanac.factValue<number[]>("durations");

  const previousDuration = durations
    .sort((a, b) => b - a)
    .find((d) => d < (selectedBundle?.validity_in_days || 0));

  if (!previousDuration) return null;

  const previousBundle = availableBundles?.find(
    (b) => b.validity_in_days === previousDuration
  );

  return previousBundle || null;
};

export const isUnlimited = async (
  _params: Record<string, any>,
  almanac: Almanac
): Promise<boolean> => {
  const selectedBundle = await almanac.factValue<SelectedBundleFact>(
    "selectedBundle"
  );
  return selectedBundle?.is_unlimited ?? false;
};

export const groupFact = async (
  _params: Record<string, any>,
  almanac: Almanac
): Promise<string> => {
  const selectedBundle = await almanac.factValue<SelectedBundleFact>(
    "selectedBundle"
  );
  return selectedBundle?.group_name ?? "";
};

export const unusedDays = async (
  _params: Record<string, any>,
  almanac: Almanac
): Promise<number> => {
  const selectedBundle = await almanac.factValue<SelectedBundleFact>(
    "selectedBundle"
  );
  const requestedDays = await almanac.factValue<number>(
    "requestedValidityDays"
  );
  return (selectedBundle?.validity_in_days ?? 0) - requestedDays;
};
