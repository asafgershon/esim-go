import { ESIMGoDataSource } from "./esim-go-base";
import { GraphQLError } from "graphql";
import { CacheHealthService } from "../../services/cache-health.service";
import { createLogger, withPerformanceLogging } from "../../lib/logger";

/**
 * DataSource for eSIM Go Pricing API
 * Handles real-time pricing calculations using the /orders/calculate endpoint
 */
export class PricingDataSource extends ESIMGoDataSource {
  private cacheHealth: CacheHealthService;
  private logger = createLogger({ 
    component: 'PricingDataSource',
    operationType: 'pricing-operations'
  });

  // Cache TTL for pricing data - 30 days as per eSIM Go recommendations
  private readonly PRICING_CACHE_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

  constructor(config?: any) {
    super(config);
    this.cacheHealth = new CacheHealthService(this.cache);
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
    quantity: number = 1,
  ): Promise<{ basePrice: number; currency: string; bundleName: string }> {
    const cacheKey = this.getCacheKey("pricing:bundle", { bundleName, countryCode });

    return withPerformanceLogging(
      this.logger,
      'get-bundle-pricing',
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
        
        this.logger.info('Skipping cache to get fresh pricing data', { 
          bundleName, 
          countryCode,
          operationType: 'cache-bypass-debug'
        });

        // Get bundle price from catalog API
        try {
          const url = new URL('/v2.5/catalogue', this.baseURL);
          url.searchParams.set('countries', countryCode);
          url.searchParams.set('perPage', '200'); // Get all bundles for this country
          
          this.logger.info('Fetching bundle pricing from catalog', { 
            bundleName,
            countryCode,
            url: url.toString(),
            operationType: 'catalog-pricing-request'
          });

          const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
              'X-API-Key': process.env.ESIM_GO_API_KEY!,
              'Content-Type': 'application/json',
              'User-Agent': 'curl/8.7.1',
            },
            signal: AbortSignal.timeout(15000),
          });

          if (!response.ok) {
            const errorBody = await response.text();
            this.logger.error('Catalog pricing request failed', undefined, {
              status: response.status,
              statusText: response.statusText,
              errorBody,
              bundleName,
              countryCode,
              operationType: 'catalog-pricing-error'
            });
            throw new Error(`${response.status}: ${response.statusText}`);
          }

          const catalogResponse = await response.json() as {
            bundles: Array<{
              name: string;
              price: number;
              currency?: string;
              description?: string;
              duration?: number;
            }>;
          };

          this.logger.info('Catalog response received', {
            countryCode,
            totalBundles: catalogResponse.bundles.length,
            searchingFor: bundleName,
            // Show ALL Austria bundles for debugging
            allBundles: catalogResponse.bundles.map(b => ({
              name: b.name,
              price: b.price,
              description: b.description,
              duration: b.duration
            })),
            operationType: 'catalog-response-debug'
          });

          // CRITICAL: Check if we're getting the expected Austria 7-day bundle price
          const austria7DayBundle = catalogResponse.bundles.find(b => b.name === 'esim_1GB_7D_AT_V2');
          if (austria7DayBundle) {
            this.logger.error('PRICE MISMATCH CHECK', {
              bundleName: 'esim_1GB_7D_AT_V2',
              actualPrice: austria7DayBundle.price,
              expectedPrice: 10.32,
              priceMatches: austria7DayBundle.price === 10.32,
              priceDifference: Math.abs(austria7DayBundle.price - 10.32),
              operationType: 'price-verification'
            });
          }

          // Find the specific bundle in the catalog
          const bundle = catalogResponse.bundles.find(b => b.name === bundleName);
          
          if (!bundle) {
            this.logger.warn('Bundle search details', {
              bundleName,
              countryCode,
              availableNames: catalogResponse.bundles.map(b => b.name),
              operationType: 'bundle-search-debug'
            });
          } else {
            this.logger.info('Bundle found in catalog', {
              bundleName,
              foundBundle: {
                name: bundle.name,
                price: bundle.price,
                currency: bundle.currency,
                description: bundle.description
              },
              operationType: 'bundle-found-debug'
            });
          }
          
          if (!bundle) {
            this.logger.warn('Bundle not found in catalog for country', {
              bundleName,
              countryCode,
              availableBundles: catalogResponse.bundles.length,
              operationType: 'bundle-not-found'
            });
            
            // Return 0 instead of estimating - as requested
            return {
              basePrice: 0,
              currency: 'USD',
              bundleName,
            };
          }

          const pricingData = {
            basePrice: bundle.price,
            currency: bundle.currency || 'USD',
            bundleName,
          };

          // Cache the result
          const cacheSetResult = await this.cacheHealth.safeSet(
            cacheKey, 
            JSON.stringify(pricingData), 
            { ttl: this.PRICING_CACHE_TTL }
          );

          if (!cacheSetResult.success) {
            this.logger.warn('Failed to cache pricing data', { 
              error: cacheSetResult.error?.message, 
              cacheKey 
            });
          }

          this.logger.info('Real catalog pricing retrieved', { 
            bundleName,
            countryCode,
            basePrice: pricingData.basePrice,
            currency: pricingData.currency,
            operationType: 'catalog-pricing-success'
          });

          return pricingData;

        } catch (error) {
          this.logger.error('Failed to get pricing from catalog', error as Error, { 
            bundleName, 
            countryCode,
            operationType: 'catalog-pricing-error'
          });
          
          // Return 0 instead of cached fallback - no estimates
          this.logger.warn('Returning zero price - no real data available', {
            bundleName,
            countryCode,
            operationType: 'pricing-zero-fallback'
          });

          return {
            basePrice: 0,
            currency: 'USD',
            bundleName,
          };
        }
      },
      { bundleName, countryCode }
    );
  }

  /**
   * Get pricing for multiple bundles in batch
   * Uses Promise.allSettled to handle partial failures gracefully
   */
  async getBatchPricing(
    requests: Array<{ bundleName: string; quantity?: number }>
  ): Promise<Array<{
    bundleName: string;
    basePrice?: number;
    currency?: string;
    error?: string;
  }>> {
    return withPerformanceLogging(
      this.logger,
      'get-batch-pricing',
      async () => {
        const results = await Promise.allSettled(
          requests.map(async (req) => {
            try {
              const pricing = await this.getBundlePricing(req.bundleName, req.quantity || 1);
              return {
                bundleName: req.bundleName,
                basePrice: pricing.basePrice,
                currency: pricing.currency,
              };
            } catch (error) {
              this.logger.warn('Failed to get pricing for bundle in batch', { 
                bundleName: req.bundleName,
                error: error instanceof Error ? error.message : String(error)
              });
              return {
                bundleName: req.bundleName,
                error: error instanceof Error ? error.message : 'Unknown pricing error',
              };
            }
          })
        );

        return results.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            return {
              bundleName: requests[index].bundleName,
              error: result.reason instanceof Error ? result.reason.message : 'Batch pricing failed',
            };
          }
        });
      },
      { batchSize: requests.length }
    );
  }

  /**
   * Clear pricing cache for a specific bundle or all pricing data
   */
  async clearPricingCache(bundleName?: string): Promise<void> {
    if (bundleName) {
      // Clear specific bundle cache
      const pattern = `esim-go:pricing:bundle:*${bundleName}*`;
      this.logger.info('Clearing pricing cache for bundle', { bundleName, pattern });
      // Note: This would require a pattern-based cache clear which depends on cache implementation
      // For now, we'll document this as a future enhancement
    } else {
      // Clear all pricing cache
      this.logger.info('Clearing all pricing cache');
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
    this.logger.info('PricingDataSource cleanup completed');
  }
}