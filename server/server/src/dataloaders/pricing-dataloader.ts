import { calculatePricingWithDB, type RequestFacts } from "@hiilo/rules-engine-2";
import DataLoader from "dataloader";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import { withPerformanceMonitoring } from "../services/pricing-performance-monitor";
import type { PaymentMethod, PricingBreakdown } from "../types";

const logger = createLogger({
  component: "PricingDataLoader",
  operationType: "dataloader",
});

// Key for the DataLoader that uniquely identifies a pricing request
export interface PricingKey {
  bundleId: string;
  validityInDays: number;
  countries: string[];
  region?: string;
  paymentMethod: PaymentMethod;
  group?: string;
  promo?: string;
  userId?: string;
  userEmail?: string;
}

// Result from the pricing calculation
export interface PricingResult extends PricingBreakdown {
  cacheKey: string;
}

/**
 * Creates a string cache key from the pricing key
 */
function createCacheKey(key: PricingKey): string {
  return `pricing:${key.bundleId}:${key.validityInDays}:${key.countries.join(",")}:${
    key.region || "none"
  }:${key.paymentMethod}:${key.group || "default"}:${key.promo || "none"}:${
    key.userId || "anonymous"
  }`;
}

/**
 * Creates a DataLoader instance for batch loading pricing calculations
 * This is created per-request to ensure proper request isolation
 */
export function createPricingDataLoader(context: Context): DataLoader<PricingKey, PricingResult> {
  return new DataLoader<PricingKey, PricingResult>(
    withPerformanceMonitoring(async (keys: readonly PricingKey[]): Promise<PricingResult[]> => {
      const startTime = Date.now();
      
      logger.info("Batch loading pricing calculations", {
        batchSize: keys.length,
        operationType: "batch-load",
      });

      try {
        // Process calculations in parallel
        const results = await Promise.all(
          keys.map(async (key) => {
            const cacheKey = createCacheKey(key);
            
            try {
              // Check Redis cache first
              const cachedResult = await getCachedPricing(context, cacheKey);
              if (cachedResult) {
                logger.debug("Cache hit for pricing calculation", {
                  cacheKey,
                  bundleId: key.bundleId,
                  operationType: "cache-hit",
                });
                return cachedResult;
              }

              // Prepare request facts for the rules engine
              const requestFacts: RequestFacts = {
                group: key.group || "Standard Unlimited Essential",
                days: key.validityInDays,
                paymentMethod: key.paymentMethod,
                ...(key.countries?.[0] ? { country: key.countries[0] } : {}),
                ...(key.region ? { region: key.region } : {}),
                ...(key.promo ? { couponCode: key.promo } : {}),
                ...(key.userId ? { userId: key.userId } : {}),
                ...(key.userEmail ? { userEmail: key.userEmail } : {}),
              };

              // Calculate pricing using the rules engine
              const result = await calculatePricingWithDB(requestFacts);

              // Map to PricingBreakdown format
              const pricingBreakdown: PricingResult = {
                __typename: "PricingBreakdown",
                cacheKey,
                
                ...result.pricing,
                
                // Bundle Information
                bundle: {
                  __typename: "CountryBundle",
                  id: result.selectedBundle?.esim_go_name || key.bundleId,
                  name: result.selectedBundle?.esim_go_name || "",
                  duration: key.validityInDays,
                  data: result.selectedBundle?.data_amount_mb || 0,
                  isUnlimited: result.selectedBundle?.is_unlimited || false,
                  currency: "USD",
                  group: key.group || "Standard Unlimited Essential",
                  country: {
                    __typename: "Country",
                    iso: key.countries?.[0] || "",
                  },
                },

                country: {
                  iso: key.countries?.[0] || "",
                  name: key.countries?.[0] || "",
                  region: key.region || "",
                },

                duration: key.validityInDays,
                appliedRules: result.appliedRules,
                unusedDays: result.unusedDays,
                selectedReason: "calculated",
                totalCostBeforeProcessing: result.pricing.totalCostBeforeProcessing,
                
                // Store the full calculation for field resolvers
                _pricingCalculation: result,
              };

              // Cache the result
              await cachePricing(context, cacheKey, pricingBreakdown);

              return pricingBreakdown;
            } catch (error) {
              logger.error("Failed to calculate pricing for key", error as Error, {
                cacheKey,
                bundleId: key.bundleId,
                operationType: "calculation-error",
              });
              
              // Return a default error result to avoid breaking the batch
              return {
                __typename: "PricingBreakdown",
                cacheKey,
                basePrice: 0,
                markup: 0,
                processingFee: 0,
                totalCost: 0,
                finalPrice: 0,
                currency: "USD",
                bundle: {
                  __typename: "CountryBundle",
                  id: key.bundleId,
                  name: "",
                  duration: key.validityInDays,
                  data: 0,
                  isUnlimited: false,
                  currency: "USD",
                  group: key.group || "",
                  country: {
                    __typename: "Country",
                    iso: key.countries?.[0] || "",
                  },
                },
                country: {
                  iso: key.countries?.[0] || "",
                  name: key.countries?.[0] || "",
                  region: key.region || "",
                },
                duration: key.validityInDays,
                appliedRules: [],
                unusedDays: 0,
                selectedReason: "error",
                totalCostBeforeProcessing: 0,
              } as PricingResult;
            }
          })
        );

        const duration = Date.now() - startTime;
        logger.info("Batch pricing calculations completed", {
          batchSize: keys.length,
          duration,
          avgTimePerCalc: duration / keys.length,
          operationType: "batch-complete",
        });

        return results;
      } catch (error) {
        logger.error("Failed to batch load pricing calculations", error as Error, {
          batchSize: keys.length,
          operationType: "batch-error",
        });
        throw error;
      }
    }),
    {
      // DataLoader options
      cacheKeyFn: (key: PricingKey) => createCacheKey(key),
      maxBatchSize: 100, // Limit batch size to avoid overwhelming the rules engine
      batchScheduleFn: (callback) => setTimeout(callback, 10), // Small delay to allow batching
    }
  );
}

/**
 * Get cached pricing from Redis
 */
async function getCachedPricing(
  context: Context,
  cacheKey: string
): Promise<PricingResult | null> {
  try {
    const cached = await context.services.redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Add 1 hour TTL check
      if (parsed.cachedAt && Date.now() - parsed.cachedAt < 3600000) {
        return parsed.data;
      }
    }
  } catch (error) {
    logger.error("Failed to get cached pricing", error as Error, {
      cacheKey,
      operationType: "cache-get-error",
    });
  }
  return null;
}

/**
 * Cache pricing result in Redis
 */
async function cachePricing(
  context: Context,
  cacheKey: string,
  result: PricingResult
): Promise<void> {
  try {
    const cacheData = {
      data: result,
      cachedAt: Date.now(),
    };
    // Cache for 1 hour
    await context.services.redis.setex(cacheKey, 3600, JSON.stringify(cacheData));
    
    logger.debug("Cached pricing result", {
      cacheKey,
      operationType: "cache-set",
    });
  } catch (error) {
    logger.error("Failed to cache pricing", error as Error, {
      cacheKey,
      operationType: "cache-set-error",
    });
  }
}

/**
 * Invalidate cached pricing for a specific bundle or pattern
 */
export async function invalidatePricingCache(
  context: Context,
  pattern: string
): Promise<number> {
  try {
    const keys = await context.services.redis.keys(`pricing:${pattern}*`);
    if (keys.length > 0) {
      await context.services.redis.del(...keys);
      logger.info("Invalidated pricing cache", {
        pattern,
        keysDeleted: keys.length,
        operationType: "cache-invalidate",
      });
    }
    return keys.length;
  } catch (error) {
    logger.error("Failed to invalidate pricing cache", error as Error, {
      pattern,
      operationType: "cache-invalidate-error",
    });
    return 0;
  }
}

/**
 * Helper to extract pricing key from bundle data
 */
export function extractPricingKey(
  bundle: any,
  paymentMethod: PaymentMethod,
  context: Context
): PricingKey {
  return {
    bundleId: bundle.esimGoName || bundle.id || bundle.name || "unknown",
    validityInDays: bundle.validityInDays || bundle.duration || 1,
    countries: bundle.countries || (bundle.country ? [bundle.country.iso] : []),
    region: bundle.region,
    paymentMethod,
    group: bundle.group || bundle.groups?.[0] || "Standard Unlimited Essential",
    userId: context.auth?.user?.id,
    userEmail: context.auth?.user?.email,
  };
}