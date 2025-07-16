import { GraphQLError } from "graphql";
import type { CatalogueDataSource } from "../datasources/esim-go";
import type { ESIMGoDataPlan } from "../datasources/esim-go/types";
import z from "zod";

// Types for the pricing service
interface PricingService {
  calculatePrice: (
    numOfDays: number,
    regionId: string,
    countryId: string
  ) => Promise<PricingResponse>; // Updated return type
  calculateCountryPrice: (
    countryId: string,
    requestedDays: number,
    bundleDuration: number
  ) => Promise<PricingResponse>; // Updated signature and return type
  calculateRegionPrice: (
    regionId: string,
    requestedDays: number,
    bundleDuration: number
  ) => Promise<PricingResponse>; // Updated signature and return type
}

const PricingResponseSchema = z.object({
  plan: z.object({
    id: z.string(),
    name: z.string(),
    duration: z.number(),
    price: z.number(),
    countries: z.array(z.string()),
  }),
  costPlusPrice: z.number(),
  dayDiscount: z.number(),
  finalPrice: z.number(),
});

type PricingResponse = z.infer<typeof PricingResponseSchema>;

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
   * Builds the complete pricing response object
   */
  const buildPricingResponse = (
    bundle: ESIMGoDataPlan,
    requestedDays: number
  ): PricingResponse => {
    const bundleDuration = bundle.duration;
    const basePrice = bundle.price;
    const costPlusMarkup = getCostPlusPrice(bundleDuration);

    const dayDiscount =
      bundleDuration > requestedDays
        ? getDaysDiscount(requestedDays, bundleDuration)
        : 0;

    const finalPriceRaw = basePrice + costPlusMarkup - dayDiscount;
    const finalPrice = Math.round(finalPriceRaw * 4) / 4;

    return {
      plan: {
        id: bundle.id || "",
        name: bundle.name,
        duration: bundle.duration,
        price: bundle.price,
        countries: bundle.countries.map((country) => country.iso),
      },
      costPlusPrice: costPlusMarkup,
      dayDiscount: dayDiscount,
      finalPrice: finalPrice,
    };
  };

  // Main service methods
  const calculatePrice = async (
    numOfDays: number,
    regionId: string,
    countryId: string
  ): Promise<PricingResponse> => {
    const bundleDuration = matchBundleDuration(numOfDays);
    if (!bundleDuration) {
      throw new GraphQLError("No bundle found for the given number of days", {
        extensions: {
          code: "NO_BUNDLE_FOUND",
        },
      });
    }

    if (countryId) {
      return calculateCountryPrice(countryId, numOfDays, bundleDuration);
    }

    if (regionId) {
      return calculateRegionPrice(regionId, numOfDays, bundleDuration);
    }

    throw new GraphQLError("Either regionId or countryId must be provided", {
      extensions: {
        code: "INVALID_PARAMETERS",
      },
    });
  };

  const calculateCountryPrice = async (
    countryId: string,
    requestedDays: number,
    bundleDuration: number
  ): Promise<PricingResponse> => {
    try {
      const group = "Standard Unlimited Lite";

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
      const bestBundle = await findBestBundle(unlimitedBundles, bundleDuration);

      if (!bestBundle) {
        throw new GraphQLError(
          `No suitable bundle found for country: ${countryId} and duration: ${bundleDuration}`,
          {
            extensions: {
              code: "NO_SUITABLE_BUNDLE",
            },
          }
        );
      }

      return buildPricingResponse(bestBundle, requestedDays);
    } catch (error) {
      console.error(`Error calculating country price for ${countryId}:`, error);
      throw error;
    }
  };

  const calculateRegionPrice = async (
    regionId: string,
    requestedDays: number,
    bundleDuration: number
  ): Promise<PricingResponse> => {
    try {
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

      const bestBundle = await findBestBundle(regionBundles, bundleDuration);

      if (!bestBundle) {
        throw new GraphQLError(
          `No suitable bundle found for region: ${regionId} and duration: ${bundleDuration}`,
          {
            extensions: {
              code: "NO_SUITABLE_BUNDLE",
            },
          }
        );
      }

      return buildPricingResponse(bestBundle, requestedDays);
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
): Promise<PricingResponse> => {
  const service = getPricingServiceInstance(catalogueDataSource);
  return service.calculatePrice(numOfDays, regionId, countryId);
};
