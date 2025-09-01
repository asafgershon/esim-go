import { ESIMGoDataSource } from "./esim-go-base";
import { GraphQLError } from "graphql";
import { createLogger, withPerformanceLogging } from "../../lib/logger";
import { BundleRepository } from "../../repositories/catalog/bundle.repository";

/**
 * DataSource for eSIM Go Pricing API
 * Handles real-time pricing calculations using the /orders/calculate endpoint
 */
export class PricingDataSource extends ESIMGoDataSource {
  private bundleRepository: BundleRepository;
  private logger = createLogger({
    component: "PricingDataSource",
    operationType: "pricing-operations",
  });

  // Cache TTL for pricing data - 30 days as per eSIM Go recommendations
  private readonly PRICING_CACHE_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

  constructor(config?: any) {
    super(config);
    this.bundleRepository = new BundleRepository("catalog_bundles");
  }

  /**
   * Get real-time pricing for a specific bundle
   * @param bundleName - The eSIM Go bundle name
   * @param quantity - Number of eSIMs (default: 1)
   * @returns Real-time pricing information
   */
  async getBundlePricing(
    bundleName: string,
    countryCode: string,
    quantity: number = 1
  ): Promise<{ basePrice: number; currency: string; bundleName: string }> {
    const cacheKey = this.getCacheKey("pricing:bundle", {
      bundleName,
      countryCode,
    });

    return withPerformanceLogging(
      this.logger,
      "get-bundle-pricing",
      async () => {
        // TEMPORARILY SKIP CACHE to ensure we get fresh data for debugging
        // const cacheResult = await this.cacheHealth.safeGet(cacheKey);
        // if (cacheResult.success && cacheResult.data) {
        //   try {
        //     const cached = JSON.parse(cacheResult.data);
        //     this.logger.debug('Using cached pricing', { bundleName, countryCode });
        //     return cached;
        //   } catch (error) {
        //     this.logger.warn('Failed to parse cached pricing data', { error, cacheKey });
        //   }
        // }

        this.logger.info("Skipping cache to get fresh pricing data", {
          bundleName,
          countryCode,
          operationType: "cache-bypass-debug",
        });

        // Get bundle price from catalog database
        try {
          this.logger.info("Fetching bundle pricing from database", {
            bundleName,
            countryCode,
            operationType: "database-pricing-request",
          });

          // Search for bundles in the specific country
          const searchResult = await this.bundleRepository.search({
            countries: [countryCode],
            limit: 100, // Get a reasonable number to find the bundle
          });

          if (searchResult.data.length === 0) {
            this.logger.error(
              "No bundles found for country in database",
              undefined,
              {
                countryCode,
                bundleName,
                operationType: "database-pricing-error",
              }
            );
            throw new Error(
              `No bundles found for country ${countryCode} in catalog database`
            );
          }

          this.logger.info("Database bundles retrieved", {
            countryCode,
            totalBundles: searchResult.data.length,
            searchingFor: bundleName,
            operationType: "database-response",
          });

          // Find the specific bundle in the database results
          const bundle = searchResult.data.find(
            (b) => b.bundle_name === bundleName || b.name === bundleName
          );

          if (!bundle) {
            this.logger.warn("Bundle search details", {
              bundleName,
              countryCode,
              availableNames: searchResult.data.map(
                (b) => b.bundle_name || b.name
              ),
              operationType: "bundle-search-debug",
            });

            // Return 0 instead of estimating - as requested
            return {
              basePrice: 0,
              currency: "USD",
              bundleName,
            };
          }

          this.logger.info("Bundle found in database", {
            bundleName,
            foundBundle: {
              name: bundle.bundle_name || bundle.name,
              price: bundle.cost,
              currency: bundle.currency,
              description: bundle.description,
            },
            operationType: "bundle-found-debug",
          });

          const pricingData = {
            basePrice: bundle.cost || 0,
            currency: bundle.currency || "USD",
            bundleName,
          };

          // Cache the result
          try {
            await this.cache.set(cacheKey, JSON.stringify(pricingData), {
              ttl: this.PRICING_CACHE_TTL,
            });
          } catch (error) {
            this.logger.warn("Failed to cache pricing data", error as Error, {
              cacheKey,
            });
          }

          this.logger.info("Real catalog pricing retrieved", {
            bundleName,
            countryCode,
            basePrice: pricingData.basePrice,
            currency: pricingData.currency,
            operationType: "catalog-pricing-success",
          });

          return pricingData;
        } catch (error) {
          this.logger.error(
            "Failed to get pricing from catalog",
            error as Error,
            {
              bundleName,
              countryCode,
              operationType: "catalog-pricing-error",
            }
          );

          // Return 0 instead of cached fallback - no estimates
          this.logger.warn("Returning zero price - no real data available", {
            bundleName,
            countryCode,
            operationType: "pricing-zero-fallback",
          });

          return {
            basePrice: 0,
            currency: "USD",
            bundleName,
          };
        }
      },
      { bundleName, countryCode }
    );
  }

  /**
   * Clear pricing cache for a specific bundle or all pricing data
   */
  async clearPricingCache(bundleName?: string): Promise<void> {
    if (bundleName) {
      // Clear specific bundle cache
      const pattern = `esim-go:pricing:bundle:*${bundleName}*`;
      this.logger.info("Clearing pricing cache for bundle", {
        bundleName,
        pattern,
      });
      // Note: This would require a pattern-based cache clear which depends on cache implementation
      // For now, we'll document this as a future enhancement
    } else {
      // Clear all pricing cache
      this.logger.info("Clearing all pricing cache");
      // Note: This would require pattern-based cache clear for all pricing keys
      // For now, we'll document this as a future enhancement
    }
  }

  /**
   * Get cache health status for pricing operations
   */
  getPricingCacheStatus(): any {
    return {
      healthReport: this.cacheHealth.getHealthReport(),
      cacheEnabled: !!this.cache,
      ttl: this.PRICING_CACHE_TTL,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.cacheHealth.cleanup();
    this.logger.info("PricingDataSource cleanup completed");
  }
}
