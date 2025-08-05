import { GraphQLError } from "graphql";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import { 
  pricingPerformanceMonitor, 
  PricingCacheManager 
} from "../services/pricing-performance-monitor";

const logger = createLogger({
  component: "PricingManagementResolvers",
  operationType: "resolver",
});

/**
 * Administrative resolvers for pricing cache management and performance monitoring
 * These should be protected with admin-only auth directives
 */
export const pricingManagementResolvers = {
  Query: {
    /**
     * Get current pricing performance metrics
     */
    pricingPerformanceMetrics: async (_, __, context: Context) => {
      logger.info("Fetching pricing performance metrics", {
        operationType: "get-performance-metrics",
      });

      try {
        const metrics = pricingPerformanceMonitor.getCurrentMetrics();
        
        return {
          recentAvgDuration: metrics.recentAvgDuration,
          recentAvgBatchSize: metrics.recentAvgBatchSize,
          recentCacheHitRate: metrics.recentCacheHitRate,
          totalCalculations: metrics.totalCalculations,
          errorRate: metrics.errorRate,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        logger.error("Failed to fetch performance metrics", error as Error, {
          operationType: "get-performance-metrics",
        });
        throw new GraphQLError("Failed to fetch performance metrics", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },

    /**
     * Get cache statistics
     */
    pricingCacheStats: async (_, __, context: Context) => {
      logger.info("Fetching pricing cache statistics", {
        operationType: "get-cache-stats",
      });

      try {
        const keys = await context.services.redis.keys("pricing:*");
        let totalSize = 0;
        let expiredCount = 0;
        let validCount = 0;

        // Sample a subset of keys to avoid performance issues
        const sampleSize = Math.min(keys.length, 100);
        const sampleKeys = keys.slice(0, sampleSize);

        for (const key of sampleKeys) {
          try {
            const ttl = await context.services.redis.ttl(key);
            const value = await context.services.redis.get(key);
            
            if (value) {
              totalSize += value.length;
              
              if (ttl > 0) {
                validCount++;
              } else {
                expiredCount++;
              }
            }
          } catch (error) {
            // Skip invalid keys
            expiredCount++;
          }
        }

        const avgSize = sampleSize > 0 ? totalSize / sampleSize : 0;
        const estimatedTotalSize = avgSize * keys.length;

        return {
          totalKeys: keys.length,
          estimatedSizeMB: Math.round(estimatedTotalSize / (1024 * 1024) * 100) / 100,
          validKeys: Math.round((validCount / sampleSize) * keys.length),
          expiredKeys: Math.round((expiredCount / sampleSize) * keys.length),
          avgKeySizeKB: Math.round(avgSize / 1024 * 100) / 100,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        logger.error("Failed to fetch cache statistics", error as Error, {
          operationType: "get-cache-stats",
        });
        throw new GraphQLError("Failed to fetch cache statistics", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },
  },

  Mutation: {
    /**
     * Clear all pricing cache
     */
    clearPricingCache: async (_, __, context: Context) => {
      logger.info("Clearing all pricing cache", {
        userId: context.auth?.user?.id,
        operationType: "clear-all-cache",
      });

      try {
        const cacheManager = new PricingCacheManager(context);
        const clearedCount = await cacheManager.invalidateAll();

        logger.info("Successfully cleared pricing cache", {
          clearedCount,
          userId: context.auth?.user?.id,
          operationType: "clear-all-cache-success",
        });

        return {
          success: true,
          message: `Cleared ${clearedCount} cache entries`,
          clearedCount,
        };
      } catch (error) {
        logger.error("Failed to clear pricing cache", error as Error, {
          userId: context.auth?.user?.id,
          operationType: "clear-all-cache",
        });
        throw new GraphQLError("Failed to clear pricing cache", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },

    /**
     * Clear pricing cache for specific bundle
     */
    clearBundlePricingCache: async (_, { bundleId }, context: Context) => {
      logger.info("Clearing pricing cache for bundle", {
        bundleId,
        userId: context.auth?.user?.id,
        operationType: "clear-bundle-cache",
      });

      try {
        const cacheManager = new PricingCacheManager(context);
        const clearedCount = await cacheManager.invalidateBundle(bundleId);

        logger.info("Successfully cleared bundle pricing cache", {
          bundleId,
          clearedCount,
          userId: context.auth?.user?.id,
          operationType: "clear-bundle-cache-success",
        });

        return {
          success: true,
          message: `Cleared ${clearedCount} cache entries for bundle ${bundleId}`,
          clearedCount,
        };
      } catch (error) {
        logger.error("Failed to clear bundle pricing cache", error as Error, {
          bundleId,
          userId: context.auth?.user?.id,
          operationType: "clear-bundle-cache",
        });
        throw new GraphQLError("Failed to clear bundle pricing cache", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },

    /**
     * Clear pricing cache for specific country
     */
    clearCountryPricingCache: async (_, { countryId }, context: Context) => {
      logger.info("Clearing pricing cache for country", {
        countryId,
        userId: context.auth?.user?.id,
        operationType: "clear-country-cache",
      });

      try {
        const cacheManager = new PricingCacheManager(context);
        const clearedCount = await cacheManager.invalidateCountry(countryId);

        logger.info("Successfully cleared country pricing cache", {
          countryId,
          clearedCount,
          userId: context.auth?.user?.id,
          operationType: "clear-country-cache-success",
        });

        return {
          success: true,
          message: `Cleared ${clearedCount} cache entries for country ${countryId}`,
          clearedCount,
        };
      } catch (error) {
        logger.error("Failed to clear country pricing cache", error as Error, {
          countryId,
          userId: context.auth?.user?.id,
          operationType: "clear-country-cache",
        });
        throw new GraphQLError("Failed to clear country pricing cache", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },

    /**
     * Perform cache cleanup (remove expired entries)
     */
    cleanupPricingCache: async (_, __, context: Context) => {
      logger.info("Starting pricing cache cleanup", {
        userId: context.auth?.user?.id,
        operationType: "cleanup-cache",
      });

      try {
        const cacheManager = new PricingCacheManager(context);
        await cacheManager.performScheduledCleanup();

        logger.info("Successfully completed cache cleanup", {
          userId: context.auth?.user?.id,
          operationType: "cleanup-cache-success",
        });

        return {
          success: true,
          message: "Cache cleanup completed successfully",
        };
      } catch (error) {
        logger.error("Failed to cleanup pricing cache", error as Error, {
          userId: context.auth?.user?.id,
          operationType: "cleanup-cache",
        });
        throw new GraphQLError("Failed to cleanup pricing cache", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },

    /**
     * Reset performance metrics
     */
    resetPricingMetrics: async (_, __, context: Context) => {
      logger.info("Resetting pricing performance metrics", {
        userId: context.auth?.user?.id,
        operationType: "reset-metrics",
      });

      try {
        pricingPerformanceMonitor.resetMetrics();

        logger.info("Successfully reset performance metrics", {
          userId: context.auth?.user?.id,
          operationType: "reset-metrics-success",
        });

        return {
          success: true,
          message: "Performance metrics reset successfully",
        };
      } catch (error) {
        logger.error("Failed to reset performance metrics", error as Error, {
          userId: context.auth?.user?.id,
          operationType: "reset-metrics",
        });
        throw new GraphQLError("Failed to reset performance metrics", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },

    /**
     * Smart cache invalidation based on rule changes
     */
    invalidateCacheByRuleChange: async (_, { ruleType, affectedEntities }, context: Context) => {
      logger.info("Smart cache invalidation for rule change", {
        ruleType,
        affectedEntities,
        userId: context.auth?.user?.id,
        operationType: "smart-cache-invalidation",
      });

      try {
        const cacheManager = new PricingCacheManager(context);
        const clearedCount = await cacheManager.invalidateByRuleChange(ruleType, affectedEntities);

        logger.info("Successfully invalidated cache by rule change", {
          ruleType,
          affectedEntities,
          clearedCount,
          userId: context.auth?.user?.id,
          operationType: "smart-cache-invalidation-success",
        });

        return {
          success: true,
          message: `Invalidated ${clearedCount} cache entries for ${ruleType} rule change`,
          clearedCount,
        };
      } catch (error) {
        logger.error("Failed to invalidate cache by rule change", error as Error, {
          ruleType,
          affectedEntities,
          userId: context.auth?.user?.id,
          operationType: "smart-cache-invalidation",
        });
        throw new GraphQLError("Failed to invalidate cache by rule change", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },
  },
};