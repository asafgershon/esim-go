import { produce } from "immer";
import * as dot from "dot-object";
import type {
  PricingEngineInput,
  PricingEngineOutput,
  PricingEngineState,
  PricingRule,
} from "../rules-engine-types";
import type { PipelineStep, PipelineStepResult } from "./types";
import { createLogger } from "@esim-go/utils";

// Import all pipeline steps
import { bundleSelectionStep } from "./steps/bundle-selection";
import { bundleAdjustmentStep } from "./steps/bundle-adjustment";
import { discountApplicationStep } from "./steps/discount-application";
import { unusedDaysDiscountStep } from "./steps/unused-days-discount";
import { constraintApplicationStep } from "./steps/constraint-application";
import { feeApplicationStep } from "./steps/fee-application";
import { resultCompilationStep } from "./steps/result-compilation";

// Import utilities
import { initializeState, createOutput } from "./utils/state-helpers";
import { sortRulesByPriority, extractAppliedRuleIds, getAppliedRules } from "./utils/rule-matcher";

// Define the pipeline steps in order
const pipelineSteps: PipelineStep[] = [
  bundleSelectionStep,
  bundleAdjustmentStep,
  discountApplicationStep,
  unusedDaysDiscountStep,
  constraintApplicationStep,
  feeApplicationStep,
  resultCompilationStep,
];

// Module-level logger
const logger = createLogger({
  component: "PricingEngine",
  operationType: "price-calculation",
});

/**
 * Create a pricing engine instance with the given rules
 */
export const createPricingEngine = (initialRules: PricingRule[] = []) => {
  let rules = sortRulesByPriority([...initialRules]);

  return {
    /**
     * Add rules to the engine
     */
    addRules(newRules: PricingRule[]): void {
      logger.info("Adding rules to pricing engine", {
        rulesCount: newRules.length,
        ruleNames: newRules.map(r => r.name),
      });

      rules = sortRulesByPriority([...rules, ...newRules]);

      logger.info("Rules added and sorted", {
        totalRules: rules.length,
      });
    },

    /**
     * Clear all rules from the engine
     */
    clearRules(): void {
      rules = [];
      logger.info("All rules cleared from pricing engine");
    },

    /**
     * Get current rules
     */
    getRules(): PricingRule[] {
      return [...rules];
    },

    /**
     * Main async generator for step-by-step pricing calculation
     */
    async *calculatePriceSteps(
      input: PricingEngineInput
    ): AsyncGenerator<PipelineStepResult, PricingEngineOutput> {
      const correlationId = dot.pick("metadata.correlationId", input) || 
        dot.pick("context.requestId", input);

      logger.info("Starting step-by-step price calculation", {
        correlationId,
        operationType: "price-calculation-pipeline",
      });

      // Initialize state
      let state = initializeState(input);

      // Execute each step in the pipeline
      for (const step of pipelineSteps) {
        logger.debug(`Executing step: ${step.name}`, {
          correlationId,
          step: step.name,
        });

        const result = await step.execute(state, rules);
        
        // Update state with step results
        state = produce(state, draft => {
          // Merge the step's state changes - do a proper deep merge
          if (result.state) {
            // Manually merge to avoid frozen object issues
            if (result.state.context) draft.context = result.state.context;
            if (result.state.request) draft.request = result.state.request;
            if (result.state.response) {
              draft.response = {
                ...draft.response,
                ...result.state.response
              };
            }
            if (result.state.state) {
              draft.state = {
                ...draft.state,
                ...result.state.state,
                steps: draft.state.steps // Preserve existing steps
              };
            }
            if (result.state.metadata) {
              draft.metadata = {
                ...draft.metadata,
                ...result.state.metadata
              };
            }
          }
          
          // Add step to history
          draft.state.steps.push(result);
        });

        yield result;
      }

      logger.info("Completed step-by-step price calculation", {
        correlationId,
        totalSteps: pipelineSteps.length,
        finalPrice: dot.pick("state.pricing.finalRevenue", state),
      });

      // Extract applied rules
      const appliedRuleIds = extractAppliedRuleIds(dot.pick("state.steps", state) || []);
      const appliedRules = getAppliedRules(rules, appliedRuleIds);

      // Update response with applied rules
      state = produce(state, draft => {
        draft.response.rules = appliedRules;
      });

      // Return final output
      return createOutput(state);
    },

    /**
     * Calculate price synchronously (consumes all steps)
     */
    async calculatePrice(input: PricingEngineInput): Promise<PricingEngineOutput> {
      const generator = this.calculatePriceSteps(input);
      let result = await generator.next();

      // Consume all steps
      while (!result.done) {
        result = await generator.next();
      }

      return result.value;
    },

    /**
     * Calculate pricing for multiple items
     */
    async calculateBulkPrices(
      requests: PricingEngineInput[]
    ): Promise<PricingEngineOutput[]> {
      logger.info("Starting bulk price calculation", {
        requestCount: requests.length,
      });

      const results: PricingEngineOutput[] = [];

      // Process each request
      for (let i = 0; i < requests.length; i++) {
        const request = requests[i];
        const correlationId = dot.pick("metadata.correlationId", request);

        try {
          const result = await this.calculatePrice(request);
          results.push(result);

          logger.debug(`Bulk calculation progress: ${i + 1}/${requests.length}`, {
            correlationId,
            contextIndex: i,
          });
        } catch (error) {
          logger.error(`Failed to calculate price for request ${i}`, error as Error, {
            correlationId,
            contextIndex: i,
          });
          throw new Error(
            `Bulk pricing failed at index ${i}: ${(error as Error).message}`
          );
        }
      }

      logger.info("Bulk price calculation completed", {
        requestCount: requests.length,
        successCount: results.length,
      });

      return results;
    },
  };
};

// Export types for external use
export * from "./types";