import type { Bundle } from "../../rules-engine-types";
import type { BundleSelector } from "../types";

/**
 * Find the optimal bundle for the requested duration
 * 1. Try exact match first
 * 2. Find smallest bundle that covers the requested duration
 * 3. Fallback to largest bundle if none can cover the duration
 */
export const findOptimalBundle: BundleSelector = (bundles, requestedDuration) => {
  let exactMatch = undefined;
  let smallestSuitable = undefined;
  let largestBundle = undefined;
  let secondLargest = undefined;

  // Single pass through all bundles - O(n)
  for (const bundle of bundles) {
    // Check for exact match
    if (bundle.validityInDays === requestedDuration) {
      exactMatch = bundle;
    }

    // Track smallest bundle that covers requested duration
    if (bundle.validityInDays >= requestedDuration) {
      if (!smallestSuitable || bundle.validityInDays < smallestSuitable.validityInDays) {
        smallestSuitable = bundle;
      }
    }

    // Track largest bundle overall
    if (!largestBundle || bundle.validityInDays > largestBundle.validityInDays) {
      secondLargest = largestBundle;
      largestBundle = bundle;
    } else if (!secondLargest || bundle.validityInDays > secondLargest.validityInDays) {
      secondLargest = bundle;
    }
  }

  // Return exact match if found
  if (exactMatch) {
    return {
      selectedBundle: exactMatch,
      previousBundle: undefined
    };
  }

  // Return smallest suitable bundle if found
  if (smallestSuitable) {
    // Find the largest bundle smaller than selected in another pass - still O(n)
    let previousBundle = undefined;
    for (const bundle of bundles) {
      if (bundle.validityInDays < smallestSuitable.validityInDays) {
        if (!previousBundle || bundle.validityInDays > previousBundle.validityInDays) {
          previousBundle = bundle;
        }
      }
    }
    
    return {
      selectedBundle: smallestSuitable,
      previousBundle
    };
  }

  if (!largestBundle) {
    throw new Error("No bundle found");
  }

  return {
    selectedBundle: largestBundle,
    previousBundle: largestBundle === largestBundle ? secondLargest : undefined
  };
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