import { createClient } from "@supabase/supabase-js";
import { Event, Rule, TopLevelCondition } from "json-rules-engine";
import { createLogger } from "@hiilo/utils";
import { EventParamsSchemas } from "../schemas/event-params";
import { Database } from "@hiilo/supabase";

const logger = createLogger({
  name: "pricing-blocks-loader",
  level: "info",
});

// Database types
type PricingBlock = Database["public"]["Tables"]["pricing_blocks"]["Row"];
// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

/**
 * Converts a database pricing block to a json-rules-engine Rule
 */
function convertBlockToRule(block: PricingBlock): Rule {
  const { name, conditions, event_type, params, priority } = block;

  // Validate params using Zod schema if available
  let validatedParams = params || {};

  // Normalize event type to match our schema keys
  const schemaKey = event_type
    .toLowerCase()
    .replace(/_/g, "-") as keyof typeof EventParamsSchemas;
  const paramSchema = EventParamsSchemas[schemaKey];

  if (!paramSchema)
    throw new Error(`No schema found for event type: ${event_type}`);

  validatedParams = paramSchema.parse(params || {});

  // Create event from new columns
  const event = {
    type: event_type,
    params: validatedParams,
  };

  return new Rule({
    name,
    priority: priority || 0,
    conditions: (conditions as TopLevelCondition) || [],
    event: event as Event,
  });
}

/**
 * Loads all active pricing blocks from the database
 */
export async function loadPricingBlocksFromDatabase(): Promise<Rule[]> {
  try {
    logger.info("Loading pricing blocks from database...");

    const { data: blocks, error } = await supabase
      .from("pricing_blocks")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (error) {
      logger.error("Failed to load pricing blocks:", error);
      throw error;
    }

    if (!blocks || blocks.length === 0) {
      logger.warn("No active pricing blocks found in database");
      return [];
    }

    logger.info(`Found ${blocks.length} active pricing blocks`);

    // Convert database blocks to rules
    const rules = blocks.map((block) => {
      try {
        return convertBlockToRule(block);
      } catch (err) {
        logger.error(`Failed to convert block ${block.name}:`, err as Error);
        throw err;
      }
    });

    logger.info(`Successfully loaded ${rules.length} rules`);
    return rules;
  } catch (error) {
    logger.error("Error loading pricing blocks from database:", error as Error);
    throw error;
  }
}

/**
 * Loads pricing blocks for a specific strategy
 */
export async function loadStrategyBlocks(strategyId: string): Promise<Rule[]> {
  try {
    logger.info(`Loading blocks for strategy ${strategyId}...`);

    const { data: strategyBlocks, error } = await supabase
      .from("strategy_blocks")
      .select(
        `
        priority,
        config_overrides,
        is_enabled,
        pricing_blocks (*)
      `
      )
      .eq("strategy_id", strategyId)
      .eq("is_enabled", true)
      .order("priority", { ascending: false });

    if (error) {
      logger.error("Failed to load strategy blocks:", error);
      throw error;
    }

    if (!strategyBlocks || strategyBlocks.length === 0) {
      logger.warn(`No blocks found for strategy ${strategyId}`);
      return [];
    }

    // Convert to rules with config overrides
    const rules = strategyBlocks.map((block) => {
      // Apply config overrides
      const paramsWithOverrides = {
        ...(block.pricing_blocks.params
          ? (block.pricing_blocks.params as Record<string, any>)
          : {}),
        ...(block.config_overrides
          ? (block.config_overrides as Record<string, any>)
          : {}),
      };

      // Validate merged params
      let validatedParams = paramsWithOverrides;
      const schemaKey = block.pricing_blocks.event_type
        .toLowerCase()
        .replace(/_/g, "-") as keyof typeof EventParamsSchemas;
      const paramSchema = EventParamsSchemas[schemaKey];

      if (paramSchema) {
        try {
          validatedParams = paramSchema.parse(paramsWithOverrides);
        } catch (error) {
          logger.warn(
            `Invalid params for strategy block ${block.pricing_blocks.name}:`,
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }

      return new Rule({
        name: block.pricing_blocks.name,
        priority: block.priority, // Use strategy-specific priority
        conditions: block.pricing_blocks.conditions as TopLevelCondition,
        event: {
          type: block.pricing_blocks.event_type,
          params: validatedParams,
        },
      });
    });

    logger.info(
      `Successfully loaded ${rules.length} rules for strategy ${strategyId}`
    );
    return rules;
  } catch (error) {
    logger.error(
      `Error loading strategy blocks for ${strategyId}:`,
      error as Error
    );
    throw error;
  }
}

/**
 * Cache for loaded rules to avoid hitting DB on every request
 */
let cachedRules: Rule[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute

export async function getCachedPricingRules(): Promise<Rule[]> {
  const now = Date.now();

  if (cachedRules && now - cacheTimestamp < CACHE_TTL) {
    return cachedRules;
  }

  // Reload from database
  cachedRules = await loadPricingBlocksFromDatabase();
  cacheTimestamp = now;

  return cachedRules;
}

/**
 * Gets the default strategy ID from the database
 */
export async function getDefaultStrategyId(): Promise<string | null> {
  try {
    logger.info("Loading default strategy ID from database...");

    const { data: strategy, error } = await supabase
      .from("pricing_strategies")
      .select("id")
      .eq("is_default", true)
      .single();

    if (error) {
      logger.error("Failed to load default strategy:", error);
      return null;
    }

    if (!strategy) {
      logger.warn("No default strategy found in database");
      return null;
    }

    logger.info(`Found default strategy: ${strategy.id}`);
    return strategy.id;
  } catch (error) {
    logger.error("Error loading default strategy:", error as Error);
    return null;
  }
}

/**
 * Clears the cache, forcing reload on next request
 */
export function clearRulesCache(): void {
  cachedRules = null;
  cacheTimestamp = 0;
  logger.info("Pricing rules cache cleared");
}
