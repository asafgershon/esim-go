import { GraphQLError } from "graphql";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import DataLoader from "dataloader";
import type { QueryPricingStrategiesArgs, QueryPricingStrategyArgs,PricingStrategy, QueryPricingBlocksArgs  } from "../types";
import { unknown } from "zod";


const logger = createLogger({
  component: "StrategiesResolvers",
  operationType: "resolver",
});

/**
 * DataLoader for batching strategy blocks loading
 * This prevents N+1 queries when loading blocks for multiple strategies
 */
const createStrategyBlocksLoader = (context: Context) => {
  return new DataLoader(async (strategyIds: readonly string[]) => {
    logger.info("Batch loading strategy blocks", {
      strategyIds,
      count: strategyIds.length,
      operationType: "batch-load-strategy-blocks",
    });

    try {
      // Load all blocks for all strategies in one query
      const { data: blocksData, error: blocksError } = await context.services.db
        .from("strategy_blocks")
        .select(`
          *,
          pricing_blocks (*)
        `)
        .in("strategy_id", strategyIds as string[])
        .order("priority", { ascending: false });

      if (blocksError) {
        logger.error("Failed to batch load strategy blocks", blocksError, {
          strategyIds,
          operationType: "batch-load-strategy-blocks",
        });
        throw new Error(`Failed to load strategy blocks: ${blocksError.message}`);
      }

      // Group blocks by strategy ID
      const blocksByStrategyId: Record<string, any[]> = {};
      
      // Initialize empty arrays for all strategy IDs
      for (const strategyId of strategyIds) {
        blocksByStrategyId[strategyId] = [];
      }

      // Group the blocks
      (blocksData || []).forEach(blockRow => {
        const strategyId = blockRow.strategy_id;
        if (!blocksByStrategyId[strategyId]) {
          blocksByStrategyId[strategyId] = [];
        }
        
        blocksByStrategyId[strategyId].push({
          priority: blockRow.priority,
          isEnabled: blockRow.is_enabled ?? true,
          configOverrides: blockRow.config_overrides,
          pricingBlock: {
            id: blockRow.block_id,
            name: blockRow.pricing_blocks.name,
            description: blockRow.pricing_blocks.description,
            category: blockRow.pricing_blocks.category,
            conditions: blockRow.pricing_blocks.conditions,
            action: blockRow.pricing_blocks.params,
            priority: blockRow.pricing_blocks.priority,
            isActive: blockRow.pricing_blocks.is_active,
            isEditable: blockRow.pricing_blocks.is_editable,
            validFrom: blockRow.pricing_blocks.valid_from,
              validUntil: blockRow.pricing_blocks.valid_until,
            createdBy: blockRow.pricing_blocks.created_by,
            createdAt: blockRow.pricing_blocks.created_at,
            updatedAt: blockRow.pricing_blocks.updated_at,
          }
        });
      });

      // Return blocks in the same order as requested strategy IDs
      const result = strategyIds.map(strategyId => blocksByStrategyId[strategyId] || []);

      logger.info("Successfully batch loaded strategy blocks", {
        strategyIds,
        totalBlocks: (blocksData || []).length,
        operationType: "batch-load-strategy-blocks-success",
      });

      return result;
    } catch (error) {
      logger.error("Error in strategy blocks DataLoader", error as Error, {
        strategyIds,
        operationType: "batch-load-strategy-blocks",
      });
      throw error;
    }
  });
};

/**
 * GraphQL resolvers for pricing strategies
 */
export const strategiesResolvers = {
  Query: {
    /**
     * Get all pricing strategies with optional filtering
     */
pricingStrategies: async (
  _parent: unknown,
  args: Partial<QueryPricingBlocksArgs>,
  context: Context
) => {
  const  filter  = args?.filter ?? {};

  logger.info("Fetching pricing strategies", {
    filter,
    userId: context.auth?.user?.id,
    operationType: "get-pricing-strategies",
  });

      try {
        // Map GraphQL filter to repository filter
        const repositoryFilter = {
          isDefault: filter.isDefault ?? undefined,
          // isArchived: filter.archived ?? undefined,
          searchTerm: filter.search ?? undefined,
        };

        const strategies = await context.repositories.strategies.getAllStrategies(repositoryFilter);

        logger.info("Successfully fetched pricing strategies", {
          count: strategies.length,
          filter,
          userId: context.auth?.user?.id,
          operationType: "get-pricing-strategies-success",
        });

        return strategies;
      } catch (error) {
        logger.error("Failed to fetch pricing strategies", error as Error, {
          filter,
          userId: context.auth?.user?.id,
          operationType: "get-pricing-strategies",
        });
        throw new GraphQLError("Failed to fetch pricing strategies", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },

    /**
     * Get a specific pricing strategy by ID
     */
    pricingStrategy: async (_parent: unknown, args: QueryPricingStrategyArgs, context: Context) => {
      const { id } = args;

      logger.info("Fetching pricing strategy by ID", {
        id,
        userId: context.auth?.user?.id,
        operationType: "get-pricing-strategy",
      });

      try {
        const strategy = await context.repositories.strategies.getStrategyById(id);

        if (!strategy) {
          throw new GraphQLError("Pricing strategy not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        logger.info("Successfully fetched pricing strategy", {
          id,
          name: strategy.name,
          userId: context.auth?.user?.id,
          operationType: "get-pricing-strategy-success",
        });

        return strategy;
      } catch (error) {
        logger.error("Failed to fetch pricing strategy", error as Error, {
          id,
          userId: context.auth?.user?.id,
          operationType: "get-pricing-strategy",
        });
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError("Failed to fetch pricing strategy", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },

    /**
     * Get the default pricing strategy
     */
    defaultPricingStrategy: async (_: unknown, __: unknown, context: Context) => {
  logger.info("Fetching default pricing strategy", {
    userId: context.auth?.user?.id,
    operationType: "get-default-pricing-strategy",
  });

  try {
    const dbStrategy = await context.repositories.strategies.getDefaultStrategy();

    const strategyWithBlocks: PricingStrategy = dbStrategy
      ? {
          ...dbStrategy,
          blocks: (dbStrategy as any).blocks ?? [],
        }
      : {
          __typename: "PricingStrategy",
          id: "default-pricing",
          name: "Default Global Pricing Strategy",
          code: "default-pricing",
          description: "Fallback default strategy (should not happen in prod)",
          version: 1,
          isDefault: true,
          activationCount: 0,
          lastActivatedAt: null,
          validatedAt: null,
          validationErrors: null,
          archivedAt: null,
          createdAt: new Date().toISOString(),
          createdBy: "system",
          updatedAt: new Date().toISOString(),
          updatedBy: "system",
          parentStrategyId: null,
          blocks: [],
        };

    logger.info("Successfully fetched default pricing strategy", {
      id: strategyWithBlocks.id,
      name: strategyWithBlocks.name,
      userId: context.auth?.user?.id,
      operationType: "get-default-pricing-strategy-success",
    });

    return strategyWithBlocks;
  } catch (error) {
    logger.error("Failed to fetch default pricing strategy", error as Error, {
      userId: context.auth?.user?.id,
      operationType: "get-default-pricing-strategy",
    });
    throw new GraphQLError("Failed to fetch default pricing strategy", {
      extensions: { code: "INTERNAL_ERROR" },
    });
  } 
},
  },
  /**
   * Field resolvers for PricingStrategy type
   */
  PricingStrategy: {
    /**
     * Efficiently load blocks for a strategy using DataLoader
     * This resolver only loads blocks when the `blocks` field is requested
     */
    blocks: async (parent: PricingStrategy, _args: unknown, context: Context) => {
      logger.debug("Loading blocks for strategy", {
        strategyId: parent.id,
        strategyName: parent.name,
        operationType: "get-strategy-blocks",
      });

      try {
        // Create a DataLoader instance for this request context
        // In production, this should be cached per request context to enable batching
        const loader = createStrategyBlocksLoader(context);
        const blocks = await loader.load(parent.id);

        logger.debug("Successfully loaded blocks for strategy", {
          strategyId: parent.id,
          blockCount: blocks.length,
          operationType: "get-strategy-blocks-success",
        });

        return blocks;
      } catch (error) {
        logger.error("Failed to load blocks for strategy", error as Error, {
          strategyId: parent.id,
          operationType: "get-strategy-blocks",
        });
        throw new GraphQLError("Failed to load strategy blocks", {
          extensions: { code: "INTERNAL_ERROR" },
        });
      }
    },
  },
};