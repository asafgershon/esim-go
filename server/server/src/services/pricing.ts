import { GraphQLError } from "graphql";
import type { CatalogueDataSource } from "../datasources/esim-go";
import type { ESIMGoDataPlan } from "../datasources/esim-go/types";

// Types for the pricing service
interface PricingService {
  calculatePrice: (
    numOfDays: number,
    regionId: string,
    countryId: string
  ) => Promise<number>;
  calculateCountryPrice: (
    countryId: string,
    duration: number
  ) => Promise<number>;
  calculateRegionPrice: (regionId: string, duration: number) => Promise<number>;
}

// Factory function to create the pricing service
const getPricingService = (
  catalogueDataSource: CatalogueDataSource
): PricingService => {
  // Helper functions (pure functions)
  const matchBundleDuration = (numOfDays: number): number | null => {
    // Find the closest duration that is longer than the numOfDays
    const durations = [1, 3, 5, 7, 10, 15, 30];
    const closestDuration = durations.reduce((prev, curr) => {
      return Math.abs(curr - numOfDays) < Math.abs((prev || 0) - numOfDays)
        ? curr
        : prev || 0;
    }, 0);
    return closestDuration;
  };

  /**
   * In case that we need to offer our client bundle that is longer than the numOfDays, we need to give him a discount for the extra days
   * the discount is 0.5$ for each extra day (temporary)
   */
  const getDaysDiscount = (
    numOfDays: number,
    bundleDuration: number
  ): number => {
    const discount = 0.25 * (bundleDuration - numOfDays);
    return discount;
  };

  const getCostPlusPrice = (bundleDuration: number): number => {
    // TODO: get the cost+ price we defined for the bundle
    const nearestDuration = matchBundleDuration(bundleDuration);
    const costPlusPrice = {
      1: 3,
      3: 5,
      5: 9,
      7: 12,
      10: 15,
      15: 17,
      30: 20,
    };
    const plus =
      costPlusPrice[nearestDuration as keyof typeof costPlusPrice] || 0;
    if (plus === 0) {
      throw new GraphQLError("No cost+ price found for the given duration", {
        extensions: {
          code: "NO_COST_PLUS_PRICE",
        },
      });
    }
    return plus;
  };

  /**
   * Find the best matching bundle for given criteria
   */
  const findBestBundle = async (
    bundles: ESIMGoDataPlan[],
    requestedDays: number
  ): Promise<ESIMGoDataPlan | null> => {
    if (bundles.length === 0) return null;

    // First, try to find exact duration match
    const exactMatch = bundles.find(
      (bundle) => bundle.duration === requestedDays
    );
    if (exactMatch) return exactMatch;

    // If no exact match, find the next higher duration
    const higherDurationBundles = bundles
      .filter((bundle) => bundle.duration > requestedDays)
      .sort((a, b) => a.duration - b.duration);

    if (higherDurationBundles.length > 0) {
      return higherDurationBundles[0] || null;
    }

    // If no higher duration available, return the highest duration bundle
    const sortedByDuration = bundles.sort((a, b) => b.duration - a.duration);
    return sortedByDuration[0] || null;
  };

  /**
   * Calculate final price including cost-plus markup and day discounts
   */
  const calculateFinalPrice = (
    bundle: ESIMGoDataPlan,
    requestedDays: number,
    bundleDuration: number
  ): number => {
    // For inventory bundles, we don't have a price field, so we need to calculate it
    // This is a temporary calculation - you should implement proper pricing logic
    const basePrice = bundle.price; // $10 per day as base price
    const costPlusMarkup = getCostPlusPrice(bundleDuration);

    // If bundle duration is longer than requested, apply discount
    const dayDiscount =
      bundleDuration > requestedDays
        ? getDaysDiscount(requestedDays, bundleDuration)
        : 0;

    const finalPrice = basePrice + costPlusMarkup - dayDiscount;

    // Round to the nearest quarter dollar
    return Math.round(finalPrice * 4) / 4;
  };

  // Main service methods
  const calculatePrice = async (
    numOfDays: number,
    regionId: string,
    countryId: string
  ): Promise<number> => {
    const bundleDuration = matchBundleDuration(numOfDays);
    if (!bundleDuration) {
      throw new GraphQLError("No bundle found for the given number of days", {
        extensions: {
          code: "NO_BUNDLE_FOUND",
        },
      });
    }
    if (countryId) {
      return calculateCountryPrice(countryId, bundleDuration);
    }

    if (regionId) {
      return calculateRegionPrice(regionId, bundleDuration);
    }

    throw new GraphQLError("Either regionId or countryId must be provided", {
      extensions: {
        code: "INVALID_PARAMETERS",
      },
    });
  };

  const calculateCountryPrice = async (
    countryId: string,
    duration: number
  ): Promise<number> => {
    try {
      const group = "Standard Unlimited Lite"; //

      // Get country available bundles from inventory
      const countryBundles = await catalogueDataSource.getPlansByCountry(
        countryId,
        group
      );

      if (countryBundles.length === 0) {
        throw new GraphQLError(`No bundles found for country: ${countryId}`, {
          extensions: {
            code: "NO_COUNTRY_BUNDLES",
          },
        });
      }

      const unlimitedBundles = countryBundles.filter(
        (bundle) => bundle.unlimited || bundle.dataAmount === -1
      );
      // Find the best bundle that matches the duration
      const bestBundle = await findBestBundle(unlimitedBundles, duration);

      if (!bestBundle) {
        throw new GraphQLError(
          `No suitable bundle found for country: ${countryId} and duration: ${duration}`,
          {
            extensions: {
              code: "NO_SUITABLE_BUNDLE",
            },
          }
        );
      }

      // Calculate final price with cost-plus and discounts
      const price = calculateFinalPrice(
        bestBundle,
        duration,
        bestBundle.duration
      );
      return price;
    } catch (error) {
      console.error(`Error calculating country price for ${countryId}:`, error);
      throw error;
    }
  };

  const calculateRegionPrice = async (
    regionId: string,
    duration: number
  ): Promise<number> => {
    try {
      // Get region available bundles from inventory
      const regionBundles = await catalogueDataSource.getPlansByRegion(
        regionId
      );

      if (regionBundles.length === 0) {
        throw new GraphQLError(`No bundles found for region: ${regionId}`, {
          extensions: {
            code: "NO_REGION_BUNDLES",
          },
        });
      }

      // Find the best bundle that matches the duration
      const bestBundle = await findBestBundle(regionBundles, duration);

      if (!bestBundle) {
        throw new GraphQLError(
          `No suitable bundle found for region: ${regionId} and duration: ${duration}`,
          {
            extensions: {
              code: "NO_SUITABLE_BUNDLE",
            },
          }
        );
      }

      // Calculate final price with cost-plus and discounts
      return calculateFinalPrice(bestBundle, duration, bestBundle.duration);
    } catch (error) {
      console.error(`Error calculating region price for ${regionId}:`, error);
      throw error;
    }
  };

  // Return the service interface
  return {
    calculatePrice,
    calculateCountryPrice,
    calculateRegionPrice,
  };
};

// Singleton instance - lazy initialization
let pricingServiceInstance: PricingService | null = null;

// Public API - ensures singleton behavior
export const getPricingServiceInstance = (
  catalogueDataSource: CatalogueDataSource
): PricingService => {
  if (!pricingServiceInstance) {
    pricingServiceInstance = getPricingService(catalogueDataSource);
  }
  return pricingServiceInstance;
};

// Convenience export for the main function
export const calculatePrice = async (
  numOfDays: number,
  regionId: string,
  countryId: string,
  catalogueDataSource: CatalogueDataSource
): Promise<number> => {
  const service = getPricingServiceInstance(catalogueDataSource);
  return service.calculatePrice(numOfDays, regionId, countryId);
};
