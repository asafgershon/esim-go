import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import { invalidatePricingCache } from "../dataloaders/pricing-dataloader";

const logger = createLogger({
  component: "PricingPerformanceMonitor",
  operationType: "performance-monitor",
});

interface PerformanceMetrics {
  batchSize: number;
  duration: number;
  cacheHitRate: number;
  avgCalculationTime: number;
  errors: number;
  timestamp: Date;
}

/**
 * Performance monitoring service for pricing calculations
 */
export class PricingPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetricsHistory = 1000;

  /**
   * Record performance metrics for a pricing batch
   */
  recordBatchMetrics(metrics: Omit<PerformanceMetrics, "timestamp">): void {
    const metric: PerformanceMetrics = {
      ...metrics,
      timestamp: new Date(),
    };

    this.metrics.push(metric);

    // Keep only recent metrics to avoid memory leaks
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Log performance warnings
    if (metrics.avgCalculationTime > 500) {
      logger.warn("Slow pricing calculations detected", {
        avgCalculationTime: metrics.avgCalculationTime,
        batchSize: metrics.batchSize,
        duration: metrics.duration,
        operationType: "slow-calculation-warning",
      });
    }

    if (metrics.cacheHitRate < 0.5) {
      logger.warn("Low cache hit rate detected", {
        cacheHitRate: metrics.cacheHitRate,
        batchSize: metrics.batchSize,
        operationType: "low-cache-hit-warning",
      });
    }

    // Log periodic performance summary
    if (this.metrics.length % 100 === 0) {
      this.logPerformanceSummary();
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): {
    recentAvgDuration: number;
    recentAvgBatchSize: number;
    recentCacheHitRate: number;
    totalCalculations: number;
    errorRate: number;
  } {
    if (this.metrics.length === 0) {
      return {
        recentAvgDuration: 0,
        recentAvgBatchSize: 0,
        recentCacheHitRate: 0,
        totalCalculations: 0,
        errorRate: 0,
      };
    }

    // Use last 50 metrics for recent averages
    const recentMetrics = this.metrics.slice(-50);
    const totalBatches = this.metrics.reduce((sum, m) => sum + m.batchSize, 0);
    const totalErrors = this.metrics.reduce((sum, m) => sum + m.errors, 0);

    return {
      recentAvgDuration: recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length,
      recentAvgBatchSize: recentMetrics.reduce((sum, m) => sum + m.batchSize, 0) / recentMetrics.length,
      recentCacheHitRate: recentMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / recentMetrics.length,
      totalCalculations: totalBatches,
      errorRate: totalBatches > 0 ? totalErrors / totalBatches : 0,
    };
  }

  /**
   * Log performance summary
   */
  private logPerformanceSummary(): void {
    const metrics = this.getCurrentMetrics();
    
    logger.info("Pricing performance summary", {
      ...metrics,
      metricsCount: this.metrics.length,
      operationType: "performance-summary",
    });
  }

  /**
   * Reset metrics history
   */
  resetMetrics(): void {
    this.metrics = [];
    logger.info("Performance metrics reset", {
      operationType: "metrics-reset",
    });
  }
}

/**
 * Cache invalidation strategies
 */
export class PricingCacheManager {
  constructor(private context: Context) {}

  /**
   * Invalidate all pricing cache
   */
  async invalidateAll(): Promise<number> {
    logger.info("Invalidating all pricing cache", {
      operationType: "cache-invalidate-all",
    });
    
    return invalidatePricingCache(this.context, "*");
  }

  /**
   * Invalidate cache for a specific bundle
   */
  async invalidateBundle(bundleId: string): Promise<number> {
    logger.info("Invalidating cache for bundle", {
      bundleId,
      operationType: "cache-invalidate-bundle",
    });
    
    return invalidatePricingCache(this.context, bundleId);
  }

  /**
   * Invalidate cache for a specific country
   */
  async invalidateCountry(countryId: string): Promise<number> {
    logger.info("Invalidating cache for country", {
      countryId,
      operationType: "cache-invalidate-country",
    });
    
    // Pattern matches any bundle with this country
    return invalidatePricingCache(this.context, `*:*:${countryId}*`);
  }

  /**
   * Invalidate cache for a specific payment method
   */
  async invalidatePaymentMethod(paymentMethod: string): Promise<number> {
    logger.info("Invalidating cache for payment method", {
      paymentMethod,
      operationType: "cache-invalidate-payment-method",
    });
    
    // Pattern matches any bundle with this payment method
    return invalidatePricingCache(this.context, `*:*:*:*:${paymentMethod}*`);
  }

  /**
   * Invalidate cache for a specific user (for personalized discounts)
   */
  async invalidateUser(userId: string): Promise<number> {
    logger.info("Invalidating cache for user", {
      userId,
      operationType: "cache-invalidate-user",
    });
    
    // Pattern matches any bundle with this user
    return invalidatePricingCache(this.context, `*:*:*:*:*:*:*:${userId}`);
  }

  /**
   * Smart cache invalidation based on rule changes
   */
  async invalidateByRuleChange(ruleType: string, affectedEntities: string[]): Promise<number> {
    logger.info("Smart cache invalidation for rule change", {
      ruleType,
      affectedEntities,
      operationType: "cache-invalidate-rule-change",
    });

    let totalInvalidated = 0;

    switch (ruleType) {
      case "country_discount":
        for (const countryId of affectedEntities) {
          totalInvalidated += await this.invalidateCountry(countryId);
        }
        break;
      case "payment_method_fee":
        for (const paymentMethod of affectedEntities) {
          totalInvalidated += await this.invalidatePaymentMethod(paymentMethod);
        }
        break;
      case "bundle_discount":
        for (const bundleId of affectedEntities) {
          totalInvalidated += await this.invalidateBundle(bundleId);
        }
        break;
      case "global_discount":
        totalInvalidated += await this.invalidateAll();
        break;
      default:
        logger.warn("Unknown rule type for cache invalidation", {
          ruleType,
          operationType: "cache-invalidate-unknown-rule",
        });
        break;
    }

    return totalInvalidated;
  }

  /**
   * Scheduled cache cleanup - remove old entries
   */
  async performScheduledCleanup(): Promise<void> {
    try {
      // Get all pricing cache keys
      const keys = await this.context.services.redis.keys("pricing:*");
      let cleanedCount = 0;
      
      // Check each key's TTL and data validity
      for (const key of keys) {
        try {
          const ttl = await this.context.services.redis.ttl(key);
          
          // If key doesn't have TTL or has expired, remove it
          if (ttl === -1 || ttl === -2) {
            await this.context.services.redis.del(key);
            cleanedCount++;
            continue;
          }

          // Check if cached data is still valid
          const cached = await this.context.services.redis.get(key);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              // Remove entries older than 2 hours
              if (parsed.cachedAt && Date.now() - parsed.cachedAt > 7200000) {
                await this.context.services.redis.del(key);
                cleanedCount++;
              }
            } catch (parseError) {
              // Invalid JSON, remove the key
              await this.context.services.redis.del(key);
              cleanedCount++;
            }
          }
        } catch (error) {
          logger.error("Error checking cache key during cleanup", error as Error, {
            key,
            operationType: "cache-cleanup-error",
          });
        }
      }

      logger.info("Completed scheduled cache cleanup", {
        totalKeys: keys.length,
        cleanedCount,
        operationType: "cache-cleanup-complete",
      });
    } catch (error) {
      logger.error("Failed to perform scheduled cache cleanup", error as Error, {
        operationType: "cache-cleanup-error",
      });
    }
  }
}

// Global performance monitor instance
export const pricingPerformanceMonitor = new PricingPerformanceMonitor();

/**
 * Performance monitoring middleware for pricing DataLoader
 */
export function withPerformanceMonitoring<T, R>(
  batchFn: (keys: readonly T[]) => Promise<R[]>
): (keys: readonly T[]) => Promise<R[]> {
  return async (keys: readonly T[]): Promise<R[]> => {
    const startTime = Date.now();
    let errors = 0;
    let cacheHits = 0;

    try {
      const results = await batchFn(keys);
      
      // Count cache hits (this would need to be implemented in the actual DataLoader)
      // For now, we'll estimate based on response time
      const duration = Date.now() - startTime;
      const avgTimePerItem = duration / keys.length;
      
      // If average time per item is very low, likely cache hits
      if (avgTimePerItem < 10) {
        cacheHits = Math.floor(keys.length * 0.8); // Estimate 80% cache hits
      } else if (avgTimePerItem < 50) {
        cacheHits = Math.floor(keys.length * 0.5); // Estimate 50% cache hits
      }

      pricingPerformanceMonitor.recordBatchMetrics({
        batchSize: keys.length,
        duration,
        cacheHitRate: cacheHits / keys.length,
        avgCalculationTime: avgTimePerItem,
        errors,
      });

      return results;
    } catch (error) {
      errors = keys.length; // Assume all failed if batch fails
      
      pricingPerformanceMonitor.recordBatchMetrics({
        batchSize: keys.length,
        duration: Date.now() - startTime,
        cacheHitRate: 0,
        avgCalculationTime: 0,
        errors,
      });

      throw error;
    }
  };
}