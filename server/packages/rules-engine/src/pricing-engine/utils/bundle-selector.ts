import type { Bundle } from "../../rules-engine-types";
import type { BundleSelector } from "../types";

/**
 * Find the optimal bundle for the requested duration
 * 1. Try exact match first
 * 2. Find smallest bundle that covers the requested duration
 * 3. Fallback to largest bundle if none can cover the duration
 */
export const findOptimalBundle: BundleSelector = (bundles, requestedDuration) => {
  // Try exact match first
  const exactMatch = bundles.find(b => b.validityInDays === requestedDuration);
  if (exactMatch) return {
    selectedBundle: exactMatch,
    previousBundle: undefined
  };

  // Find smallest bundle that covers the requested duration
  const suitableBundles = bundles
    .filter(b => b.validityInDays >= requestedDuration)
    .sort((a, b) => a.validityInDays - b.validityInDays);

  if (suitableBundles.length > 0) {
    return {
      selectedBundle: suitableBundles[0],
      previousBundle: suitableBundles[1]
    }
  }

  // Fallback to largest bundle if none can cover the duration
  const sortedBundles = bundles.sort((a, b) => b.validityInDays - a.validityInDays);
  return {
    selectedBundle: sortedBundles[0],
    previousBundle: sortedBundles[1]
  }
};

/**
 * Calculate discount per unused day based on markup difference formula
 * Formula: (selectedBundlePrice - previousBundlePrice) / (selectedDuration - previousDuration)
 */
export const calculateUnusedDayDiscount = (
  availableBundles: Bundle[],
  selectedBundle: Bundle,
  requestedDuration: number
): number => {
  // Find all bundles in the same group/category
  const sameCategoryBundles = availableBundles.filter(
    bundle =>
      bundle.groups.some(group => selectedBundle.groups.includes(group)) &&
      bundle.countries.some(country => selectedBundle.countries.includes(country))
  );

  // Get all available durations, sorted
  const availableDurations = [...new Set(
    sameCategoryBundles.map(bundle => bundle.validityInDays)
  )].sort((a, b) => a - b);

  // Find the previous duration (closest duration less than requested)
  const previousDuration = availableDurations
    .filter(duration => duration < requestedDuration)
    .pop();

  if (!previousDuration) {
    return 0;
  }

  // Find the previous bundle
  const previousBundle = sameCategoryBundles.find(
    bundle => bundle.validityInDays === previousDuration
  );

  if (!previousBundle) {
    return 0;
  }

  // Calculate discount per day using the markup difference formula
  const priceDifference = selectedBundle.basePrice - previousBundle.basePrice;
  const daysDifference = selectedBundle.validityInDays - previousBundle.validityInDays;

  if (daysDifference <= 0) {
    return 0;
  }

  const discountPerDay = priceDifference / daysDifference;
  return Math.max(0, discountPerDay); // Ensure non-negative discount
};