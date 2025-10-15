import DataLoader from "dataloader";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import { withPerformanceMonitoring } from "../services/pricing-performance-monitor";
import type { Country, PaymentMethod, PricingBreakdown, Provider } from "../types";
import { calculateSimplePrice } from "../../../packages/rules-engine-2/src/simple-pricer/simple-pricer";


const logger = createLogger({
  component: "PricingDataLoader",
  operationType: "dataloader",
});

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

export interface PricingResult extends PricingBreakdown {
  cacheKey: string; // We keep the key for DataLoader's internal caching, but not for Redis
}

function createCacheKey(key: PricingKey): string {
  return `pricing:${key.bundleId}:${key.validityInDays}:${key.countries.join(
    ","
  )}:${key.region || "none"}:${key.paymentMethod}:${key.group || "default"}:${
    key.promo || "none"
  }:${key.userId || "anonymous"}`;
}

export function createPricingDataLoader(
  context: Context
): DataLoader<PricingKey, PricingResult, string> {
  return new DataLoader<PricingKey, PricingResult, string>(
    withPerformanceMonitoring(
      async (keys: readonly PricingKey[]): Promise<(PricingResult | Error)[]> => {
        const startTime = Date.now();
        logger.info("Batch loading pricing calculations (No Redis)", { batchSize: keys.length });

          const results = await Promise.all(
            keys.map(async (key) => {
              const cacheKey = createCacheKey(key);

              try {
                const countryIso = key.countries?.[0];
                if (!countryIso) {
                    throw new Error('Country ISO is required for pricing calculation.');
                }
                
                const simpleResult = await calculateSimplePrice(countryIso, key.validityInDays);

                const pricingBreakdown: PricingResult = {
                    __typename: "PricingBreakdown",
                    cacheKey,
                    finalPrice: simpleResult.finalPrice,
                    cost: simpleResult.calculation.upperPackagePrice - (simpleResult.calculation.totalDiscount || 0),
                    markup: 0,
                    currency: "USD",
                    unusedDays: simpleResult.calculation.unusedDays,
                    processingCost: 0,
                    discountPerDay: 0,
                    discountValue: simpleResult.calculation.totalDiscount,
                    priceAfterDiscount: simpleResult.finalPrice,
                    discountRate: 0,
                    totalCost: 0,
                    processingRate: 0,
                    finalRevenue: 0,
                    revenueAfterProcessing: 0,
                    netProfit: 0,
                    totalCostBeforeProcessing: 0,
                    appliedRules: [],
                    bundle: {
                        __typename: "CountryBundle",
                        id: simpleResult.bundleName || key.bundleId,
                        name: simpleResult.bundleName || "",
                        duration: key.validityInDays,
                        data: 0,
                        isUnlimited: false,
                        currency: "USD",
                        group: key.group || "default",
                        provider: simpleResult.provider as Provider,
                        country: { __typename: "Country", iso: key.countries?.[0] || "" } as Country,
                    },
                    country: {
                        iso: key.countries?.[0] || "",
                        name: key.countries?.[0] || "",
                        region: key.region || "",
                    },
                    duration: key.validityInDays,
                    selectedReason: "calculated_simple",
                };
                return pricingBreakdown;

              } catch (error) {
                logger.error("Failed to calculate pricing for key", error as Error, { cacheKey });
                return error as Error;
              }
            })
          );
        const duration = Date.now() - startTime;
        logger.info("Batch pricing calculations completed", { duration });
          return results;
      }
    ),
    { cacheKeyFn: (key: PricingKey) => createCacheKey(key) }
  );
}

export async function invalidatePricingCache(
 context: Context,
 pattern: string
): Promise<number> {
  logger.info("Cache invalidation is disabled in simple-pricer mode.", { pattern });
  return 0;
}

// +++ FIXED +++
// הוספנו בחזרה את הפונקציה הזו כפונקציה ריקה כדי למנוע את שגיאת ה-import
export function extractPricingKey(
  bundle: any,
  paymentMethod: PaymentMethod,
  context: Context
): PricingKey {
  logger.warn("extractPricingKey is a dummy function in simple-pricer mode.");
  return {
    bundleId: bundle.id || "unknown",
    validityInDays: bundle.duration || 1,
    countries: bundle.country ? [bundle.country.iso] : [],
    region: bundle.region,
    paymentMethod,
    group: bundle.group || "default",
    userId: context.auth?.user?.id,
    userEmail: context.auth?.user?.email,
  };
}

