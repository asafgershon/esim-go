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
 * Fallback hardcoded blocks when database is unavailable
 */
const getFallbackBlocks = (filter?: any) => {
  const fallbackBlocks = [
    {
      id: "fallback-base-price",
      name: "Base Price",
      description: "Initialize base price from bundle cost",
      category: "INITIALIZATION",
      conditions: {},
      action: {},
      priority: 1,
      isActive: true,
      isEditable: false,
      validFrom: null,
      validUntil: null,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "fallback-markup",
      name: "Markup",
      description: "Add markup to base price",
      category: "markup",
      conditions: {},
      action: {},
      priority: 10,
      isActive: true,
      isEditable: false,
      validFrom: null,
      validUntil: null,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "fallback-processing-fee",
      name: "Processing Fee",
      description: "Calculate payment processing fees",
      category: "FEE",
      conditions: {},
      action: {},
      priority: 20,
      isActive: true,
      isEditable: false,
      validFrom: null,
      validUntil: null,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "fallback-profit-constraint",
      name: "Keep Profit",
      description: "Maintain minimum profit margin",
      category: "profit-constraint",
      conditions: {},
      action: {},
      priority: 25,
      isActive: true,
      isEditable: false,
      validFrom: null,
      validUntil: null,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "fallback-psychological-rounding",
      name: "Psychological Rounding",
      description: "Apply charm pricing (e.g., $9.99)",
      category: "ROUNDING",
      conditions: {},
      action: {},
      priority: 30,
      isActive: true,
      isEditable: false,
      validFrom: null,
      validUntil: null,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "fallback-unused-days-discount",
      name: "Unused Days Discount",
      description: "Apply discount for unused days from previous bundle",
      category: "unused-days-discount",
      conditions: {},
      action: {},
      priority: 5,
      isActive: true,
      isEditable: false,
      validFrom: null,
      validUntil: null,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "fallback-discount",
      name: "Discount",
      description: "Apply percentage or fixed discount",
      category: "DISCOUNT",
      conditions: {},
      action: {},
      priority: 15,
      isActive: false, // Disabled - coming soon
      isEditable: false,
      validFrom: null,
      validUntil: null,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "fallback-coupon",
      name: "Coupon",
      description: "Manage discount coupons and corporate domains",
      category: "coupon",
      conditions: {},
      action: {},
      priority: 18,
      isActive: false, // Disabled - coming soon
      isEditable: false,
      validFrom: null,
      validUntil: null,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Apply filters to fallback blocks
  let filteredBlocks = fallbackBlocks;
  
  if (filter?.category) {
    filteredBlocks = filteredBlocks.filter(block => block.category === filter.category);
  }
  if (filter?.isActive !== undefined) {
    filteredBlocks = filteredBlocks.filter(block => block.isActive === filter.isActive);
  }
  if (filter?.isEditable !== undefined) {
    filteredBlocks = filteredBlocks.filter(block => block.isEditable === filter.isEditable);
  }
  if (filter?.searchTerm) {
    const searchLower = filter.searchTerm.toLowerCase();
    filteredBlocks = filteredBlocks.filter(block => 
      block.name.toLowerCase().includes(searchLower) || 
      block.description.toLowerCase().includes(searchLower)
    );
  }

  return filteredBlocks;
};

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

    /**
     * Get all pricing blocks for strategy builder
     */
    pricingBlocks: async (_, { filter }, context: Context) => {
      logger.info("Fetching pricing blocks", {
        filter,
        userId: context.auth?.user?.id,
        operationType: "get-pricing-blocks",
      });

      try {
        let query = context.services.db
          .from("pricing_blocks")
          .select("*")
          .order("priority", { ascending: true })
          .order("category", { ascending: true });

        // Apply filters
        if (filter?.category) {
          query = query.eq("category", filter.category);
        }
        if (filter?.isActive !== undefined) {
          query = query.eq("is_active", filter.isActive);
        }
        if (filter?.isEditable !== undefined) {
          query = query.eq("is_editable", filter.isEditable);
        }
        if (filter?.searchTerm) {
          query = query.or(`name.ilike.%${filter.searchTerm}%,description.ilike.%${filter.searchTerm}%`);
        }

        const { data, error } = await query;

        let blocks = [];

        if (error || !data || data.length === 0) {
          // Log database error but fall back to hardcoded blocks
          if (error) {
            logger.warn("Database error, falling back to hardcoded blocks", {
              error: error.message,
              filter,
              userId: context.auth?.user?.id,
              operationType: "get-pricing-blocks-fallback",
            });
          } else {
            logger.info("No database blocks found, using hardcoded blocks", {
              filter,
              userId: context.auth?.user?.id,
              operationType: "get-pricing-blocks-fallback",
            });
          }

          // Return hardcoded fallback blocks
          blocks = getFallbackBlocks(filter);
        } else {
          // Map database blocks to GraphQL format
          blocks = data.map(block => ({
            id: block.id,
            name: block.name,
            description: block.description,
            category: block.category,
            conditions: block.conditions,
            action: block.action || {},
            priority: block.priority,
            isActive: block.is_active,
            isEditable: block.is_editable,
            validFrom: block.valid_from,
            validUntil: block.valid_until,
            createdBy: block.created_by,
            createdAt: block.created_at,
            updatedAt: block.updated_at,
          }));
        }

        logger.info("Successfully fetched pricing blocks", {
          count: blocks.length,
          source: error || !data?.length ? "fallback" : "database",
          userId: context.auth?.user?.id,
          operationType: "get-pricing-blocks-success",
        });

        return blocks;
      } catch (error) {
        logger.warn("Failed to fetch pricing blocks, falling back to hardcoded", error as Error, {
          filter,
          userId: context.auth?.user?.id,
          operationType: "get-pricing-blocks-error-fallback",
        });
        
        // Return fallback blocks on any error
        return getFallbackBlocks(filter);
      }
    },

    /**
     * Get a specific pricing block by ID
     */
    pricingBlock: async (_, { id }, context: Context) => {
      logger.info("Fetching pricing block by ID", {
        id,
        userId: context.auth?.user?.id,
        operationType: "get-pricing-block",
      });

      try {
        const { data, error } = await context.supabaseClient
          .from("pricing_blocks")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          logger.error("Failed to fetch pricing block from database", error, {
            id,
            userId: context.auth?.user?.id,
            operationType: "get-pricing-block",
          });
          throw new GraphQLError("Failed to fetch pricing block", {
            extensions: { code: "DATABASE_ERROR" },
          });
        }

        if (!data) {
          throw new GraphQLError("Pricing block not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        const block = {
          id: data.id,
          name: data.name,
          description: data.description,
          category: data.category,
          conditions: data.conditions,
          action: data.action,
          priority: data.priority,
          isActive: data.is_active,
          isEditable: data.is_editable,
          validFrom: data.valid_from,
          validUntil: data.valid_until,
          createdBy: data.created_by,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        logger.info("Successfully fetched pricing block", {
          id,
          name: block.name,
          userId: context.auth?.user?.id,
          operationType: "get-pricing-block-success",
        });

        return block;
      } catch (error) {
        logger.error("Failed to fetch pricing block", error as Error, {
          id,
          userId: context.auth?.user?.id,
          operationType: "get-pricing-block",
        });
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError("Failed to fetch pricing block", {
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
  },
};