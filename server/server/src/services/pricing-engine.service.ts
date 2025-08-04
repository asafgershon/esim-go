import {
  PricingEngine,
  type PricingEngineInput,
  type PricingEngineOutput,
} from "@hiilo/rules-engine";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RedisPubSub } from "graphql-redis-subscriptions";
import { publishEvent, PubSubEvents } from "../context/pubsub";
import { createLogger, withPerformanceLogging } from "../lib/logger";
import { PricingRulesRepository } from "../repositories/pricing-rules.repository";

export class PricingEngineService {
  private engine: PricingEngine;
  private repository: PricingRulesRepository;
  private pubsub: RedisPubSub | null = null;
  private logger = createLogger({
    component: "PricingEngineService",
    operationType: "pricing-calculation",
  });

  // Singleton instance
  private static instance: PricingEngineService | null = null;

  constructor(pubsub?: RedisPubSub) {
    this.engine = new PricingEngine();
    this.repository = new PricingRulesRepository();
    this.pubsub = pubsub || null;
  }

  /**
   * Get singleton instance of the pricing engine service
   */
  static getInstance(pubsub?: RedisPubSub): PricingEngineService {
    if (!PricingEngineService.instance) {
      PricingEngineService.instance = new PricingEngineService(pubsub);
      // Initialize in background
      PricingEngineService.instance.initialize().catch((error) => {
        const logger = createLogger({ component: "PricingEngineService" });
        logger.error("Failed to initialize pricing engine", error as Error, {
          operationType: "pricing-engine-init",
        });
      });
    }
    return PricingEngineService.instance;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  static resetInstance(): void {
    PricingEngineService.instance = null;
  }

  /**
   * Initialize the engine with active rules from the database
   * This should be called once during startup and periodically to refresh rules
   */
  async initialize(): Promise<void> {
    return withPerformanceLogging(
      this.logger,
      "initialize-pricing-engine",
      async () => {
        await this.loadRules();
      }
    );
  }

  /**
   * Calculate price with optional streaming support
   * @param input - Pricing engine input
   * @param streaming - Enable real-time step streaming via WebSocket
   */
  async calculatePrice(
    input: PricingEngineInput,
    streaming = false
  ): Promise<PricingEngineOutput> {
    // Ensure rules are loaded
    await this.ensureRulesLoaded();

    return withPerformanceLogging(
      this.logger,
      "calculate-price",
      async () => {
        if (!streaming) {
          // Non-streaming calculation - use legacy method
          return await this.engine.calculatePrice(input);
        }

        // Streaming calculation - emit each step via PubSub
        if (!this.pubsub) {
          this.logger.warn(
            "Streaming requested but PubSub not available, falling back to non-streaming",
            {
              correlationId: input.metadata.correlationId,
            }
          );
          return await this.engine.calculatePrice(input);
        }

        const generator = this.engine.calculatePriceSteps(input);
        let finalResult: PricingEngineOutput | null = null;

        try {
          // Process all steps and capture the final result
          let result = await generator.next();

          while (!result.done) {
            const step = result.value;

            // Log step for debugging
            this.logger.debug("Publishing pricing pipeline step", {
              correlationId: input.metadata.correlationId,
              stepName: step.name,
              operationType: "pricing-pipeline-publish",
            });

            // Publish step to PubSub for real-time streaming
            await publishEvent(
              this.pubsub,
              PubSubEvents.PRICING_PIPELINE_STEP,
              {
                correlationId: input.metadata.correlationId,
                name: step.name,
                timestamp: step.timestamp.toISOString(),
                state: step.state,
                appliedRules: step.appliedRules || [],
                debug: step.debug || {},
              }
            );

            // Get next step
            result = await generator.next();
          }

          // The final value is the PricingEngineOutput
          finalResult = result.value;
        } catch (error) {
          this.logger.error(
            "Error during streaming calculation",
            error as Error,
            {
              correlationId: input.metadata.correlationId,
              operationType: "streaming-calculation",
            }
          );
          throw error;
        }

        if (!finalResult) {
          throw new Error("Failed to get final result from pricing engine");
        }

        return finalResult;
      },
      {
        bundleCount: input.context.bundles?.length || 0,
        requestedDuration: input.request.duration,
        streaming,
      }
    );
  }

  /**
   * Reload rules from database
   * Call this when rules are updated
   */
  async reloadRules(): Promise<void> {
    this.logger.info("Reloading pricing rules");

    // Clear engine rules
    this.engine.clearRules();

    // Load fresh rules
    await this.loadRules();
  }

  /**
   * Get all loaded rules (for debugging/admin UI)
   */
  getLoadedRules() {
    // Note: The new PricingEngine doesn't separate system/business rules
    // This method is kept for backward compatibility
    return {
      all: [], // TODO: Implement rules getter in new PricingEngine
      system: [],
      business: [],
    };
  }

  /**
   * Validate a pricing engine input (useful for API validation)
   */
  validateInput(input: PricingEngineInput): string[] {
    const errors: string[] = [];

    if (!input.context.bundles || input.context.bundles.length === 0) {
      errors.push("At least one bundle is required");
    } else {
      // Validate each bundle
      input.context.bundles.forEach((bundle, index) => {
        if (!bundle.name) errors.push(`Bundle ${index}: name is required`);
        if (!bundle.basePrice || bundle.basePrice < 0) {
          errors.push(`Bundle ${index}: basePrice must be a positive number`);
        }
        if (!bundle.validityInDays || bundle.validityInDays < 1) {
          errors.push(`Bundle ${index}: validityInDays must be at least 1`);
        }
      });
    }

    if (!input.request.duration || input.request.duration < 1) {
      errors.push("Requested duration must be at least 1 day");
    }

    if (!input.metadata?.correlationId) {
      errors.push("Correlation ID is required for tracking");
    }

    return errors;
  }

  private async loadRules(): Promise<void> {
    // Load from database
    this.logger.info("Loading rules from database");

    let activeRules = await this.repository.findActiveRules();

    // If no rules exist, create default system rules
    if (activeRules.length === 0) {
      this.logger.info(
        "No pricing rules found, initializing default system rules"
      );

      await this.repository.initializeDefaultRules();

      // Reload rules after creating defaults
      activeRules = await this.repository.findActiveRules();

      this.logger.info("Default system rules initialized", {
        loadedCount: activeRules.length,
      });
    }

    this.engine.addRules(activeRules);

    this.logger.info("Rules loaded from database", {
      totalCount: activeRules.length,
    });
  }

  private async ensureRulesLoaded(): Promise<void> {
    // TODO: Implement rules count check in new PricingEngine
    // For now, always try to load rules if not loaded yet
    try {
      await this.loadRules();
    } catch (error) {
      this.logger.warn(
        "Failed to ensure rules loaded, continuing with empty rules",
        {
          error: (error as Error).message,
        }
      );
    }
  }
}
