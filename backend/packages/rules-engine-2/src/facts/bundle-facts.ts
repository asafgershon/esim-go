import { Almanac } from "json-rules-engine";
import { Database } from "@hiilo/supabase";
import { MarkupRule } from "src/blocks/markups";
import { Provider } from "src/index-with-db";
import { durations } from "./durations";

type BundleByGroupRow = Database["public"]["Views"]["bundles_by_group"]["Row"];
export type SelectedBundleFact = BundleByGroupRow | null;

export const selectBundle = async (
  _params: Record<string, any>,
  almanac: Almanac
): Promise<SelectedBundleFact> => {
  let bundle: SelectedBundleFact | null = null;
  const days = await almanac.factValue<number>("requestedValidityDays");
  const durations = await almanac.factValue<number[]>("durations");

  // Try to get provider-filtered bundles first, fallback to all bundles
  let availableBundles: BundleByGroupRow[];
  try {
    availableBundles = await almanac.factValue<BundleByGroupRow[]>(
      "availableBundlesByProvider"
    );
  } catch {
    availableBundles = await almanac.factValue<BundleByGroupRow[]>(
      "availableBundles"
    );
  }

  const preferredProvider = await almanac.factValue<Provider>("preferredProvider");

  // Check for exact match
  if (durations.includes(days)) {
    const bundles = availableBundles?.filter((b) => b.validity_in_days === days) || null;
    bundle = bundles.find((b) => b.provider === preferredProvider) || bundles[0] || null;
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

  // Try to get provider-filtered bundles first, fallback to all bundles
  let availableBundles: BundleByGroupRow[];
  try {
    availableBundles = await almanac.factValue<BundleByGroupRow[]>(
      "availableBundlesByProvider"
    );
  } catch {
    availableBundles = await almanac.factValue<BundleByGroupRow[]>(
      "availableBundles"
    );
  }

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

export const isExactMatch = async (
  _params: Record<string, any>,
  almanac: Almanac
): Promise<boolean> => {
  const selectedBundle = await almanac.factValue<SelectedBundleFact>(
    "selectedBundle"
  );
  const requestedDays = await almanac.factValue<number>(
    "requestedValidityDays"
  );
  return selectedBundle?.validity_in_days === requestedDays;
};

export const selectedBundleMarkup = async (
  _params: Record<string, any>,
  almanac: Almanac
): Promise<number> => {
  const selectedBundle = await almanac.factValue<SelectedBundleFact>(
    "selectedBundle"
  );
  const markupRule = await almanac.factValue<MarkupRule>("markupRule");

  if (!markupRule || !selectedBundle) return 0;

  const provider = selectedBundle.provider || "ESIM_GO";
  const groupName = selectedBundle.group_name || "";
  const days = selectedBundle.validity_in_days || 0;

  let markupKey: string;

  if (provider === "MAYA") {
    // Maya has no groups, use MAYA key directly
    markupKey = "MAYA";
  } else if (groupName) {
    // For ESIM_GO, try provider-specific key first, then legacy key
    const providerSpecificKey = `${provider}-${groupName}`;
    if (markupRule.event.params.markupMatrix[providerSpecificKey]) {
      markupKey = providerSpecificKey;
    } else {
      // Fallback to legacy key (backward compatibility)
      markupKey = groupName;
    }
  } else {
    return 0;
  }

  const markup = markupRule.event.params.markupMatrix[markupKey]?.[days];
  return markup ?? 0;
};

export const previousBundleMarkup = async (
  _params: Record<string, any>,
  almanac: Almanac
): Promise<number> => {
  const previousBundle = await almanac.factValue<PreviousBundleFact>(
    "previousBundle"
  );
  const markupRule = await almanac.factValue<MarkupRule>("markupRule");

  if (!markupRule || !previousBundle) return 0;

  const provider = previousBundle.provider || "ESIM_GO";
  const groupName = previousBundle.group_name || "";
  const days = previousBundle.validity_in_days || 0;

  let markupKey: string;

  if (provider === "MAYA") {
    // Maya has no groups, use MAYA key directly
    markupKey = "MAYA";
  } else if (groupName) {
    // For ESIM_GO, try provider-specific key first, then legacy key
    const providerSpecificKey = `${provider}-${groupName}`;
    if (markupRule.event.params.markupMatrix[providerSpecificKey]) {
      markupKey = providerSpecificKey;
    } else {
      // Fallback to legacy key (backward compatibility)
      markupKey = groupName;
    }
  } else {
    return 0;
  }

  const markup = markupRule.event.params.markupMatrix[markupKey]?.[days];
  return markup ?? 0;
};
