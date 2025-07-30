/**
 * Legacy pricing engine wrapper
 * This file maintains backward compatibility while using the new functional implementation
 */

import type {
  PricingEngineInput,
  PricingEngineOutput,
  PricingRule,
  PipelineStep,
} from "./rules-engine-types";
import { createPricingEngine } from "./pricing-engine/index";

export class PricingEngine {
  private engine: ReturnType<typeof createPricingEngine>;

  constructor() {
    this.engine = createPricingEngine();
  }

  /**
   * Add rules to the engine
   */
  addRules(rules: PricingRule[]): void {
    this.engine.addRules(rules);
  }

  /**
   * Clear all rules from the engine
   */
  clearRules(): void {
    this.engine.clearRules();
  }

  /**
   * Main async generator for step-by-step pricing calculation
   */
  async *calculatePriceSteps(
    input: PricingEngineInput
  ): AsyncGenerator<PipelineStep, PricingEngineOutput> {
    // Use the new engine's generator
    const generator = this.engine.calculatePriceSteps(input);
    let result = await generator.next();

    while (!result.done) {
      // Convert the new format to the legacy format if needed
      yield result.value as PipelineStep;
      result = await generator.next();
    }

    return result.value;
  }

  /**
   * Legacy method that uses the new pipeline internally
   */
  async calculatePrice(
    request: PricingEngineInput
  ): Promise<PricingEngineOutput> {
    return this.engine.calculatePrice(request);
  }

  /**
   * Calculate pricing for multiple items in a single call
   */
  async calculateBulkPrices(
    requests: PricingEngineInput[]
  ): Promise<PricingEngineOutput[]> {
    return this.engine.calculateBulkPrices(requests);
  }
}