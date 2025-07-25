import { createLogger } from "@esim-go/utils";
import type {
  PricingEngineInput,
  PricingEngineOutput,
  PricingEngineState,
  PipelineStep,
  PricingRule,
  Bundle,
  PaymentMethod,
  DataType,
  PricingBreakdown,
  RuleAction,
} from "./rules-engine-types";
import { ActionType } from "./rules-engine-types";

// Module-level logger for stateless operation
const logger = createLogger({
  component: "PricingEngine",
  operationType: "price-calculation",
});

// Rule categories for the new pipeline
export enum RuleCategory {
  DISCOUNT = 'DISCOUNT',
  CONSTRAINT = 'CONSTRAINT', 
  FEE = 'FEE',
  BUNDLE_ADJUSTMENT = 'BUNDLE_ADJUSTMENT'
}

export class PricingEngine {
  private rules: PricingRule[] = [];

  /**
   * Add rules to the engine
   */
  addRules(rules: PricingRule[]): void {
    this.rules = [...this.rules, ...rules];
    // Sort by priority (higher priority first)
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Clear all rules from the engine
   */
  clearRules(): void {
    this.rules = [];
  }

  /**
   * Main async generator for step-by-step pricing calculation
   */
  async *calculatePriceSteps(input: PricingEngineInput): AsyncGenerator<PipelineStep, PricingEngineOutput> {
    const correlationId = input.metadata.correlationId;
    
    logger.info("Starting step-by-step price calculation", {
      correlationId,
      operationType: "price-calculation-pipeline",
    });

    // Initialize state
    let state: PricingEngineState = {
      ...input,
      selectedBundle: null as any, // Will be set in step 1
      pricing: null as any, // Will be set during pipeline
      steps: [],
      unusedDays: 0,
      country: input.request.countryISO || '',
      region: input.request.region || '',
      group: input.request.group || '',
      dataType: input.request.dataType || 'DEFAULT' as any,
    };

    // Step 1: Bundle Selection
    const bundleStep = await this.selectBundle(state);
    state = { ...state, ...bundleStep.state };
    state.steps.push(bundleStep);
    yield bundleStep;

    // Step 2: Bundle Adjustments
    const adjustmentStep = await this.applyBundleAdjustments(state);
    state = { ...state, ...adjustmentStep.state };
    state.steps.push(adjustmentStep);
    yield adjustmentStep;

    // Step 3: Apply Discounts
    const discountStep = await this.applyDiscounts(state);
    state = { ...state, ...discountStep.state };
    state.steps.push(discountStep);
    yield discountStep;

    // Step 4: Apply Constraints
    const constraintStep = await this.applyConstraints(state);
    state = { ...state, ...constraintStep.state };
    state.steps.push(constraintStep);
    yield constraintStep;

    // Step 5: Apply Fees
    const feeStep = await this.applyFees(state);
    state = { ...state, ...feeStep.state };
    state.steps.push(feeStep);
    yield feeStep;

    // Final step: Compile results
    const finalStep = await this.compileFinalResults(state);
    state = { ...state, ...finalStep.state };
    state.steps.push(finalStep);
    yield finalStep;

    logger.info("Completed step-by-step price calculation", {
      correlationId,
      totalSteps: state.steps.length,
      finalPrice: state.pricing?.finalRevenue,
      operationType: "price-calculation-pipeline",
    });

    // Return final output
    return {
      ...state,
      appliedRules: this.extractAppliedRules(state.steps)
    } as PricingEngineOutput;
  }

  /**
   * Step 1: Bundle Selection
   */
  private async selectBundle(state: PricingEngineState): Promise<PipelineStep> {
    logger.debug("Executing bundle selection step", {
      correlationId: state.metadata.correlationId,
      requestedDuration: state.request.duration,
      availableBundles: state.bundles.length,
    });

    // Find the best matching bundle
    const selectedBundle = this.findOptimalBundle(state.bundles, state.request.duration);
    const unusedDays = Math.max(0, selectedBundle.validityInDays - state.request.duration);

    return {
      name: 'BUNDLE_SELECTION',
      timestamp: new Date(),
      state: {
        selectedBundle,
        unusedDays,
        country: selectedBundle.countries[0] || state.country,
        region: selectedBundle.region || state.region,
        group: selectedBundle.groups[0] || state.group,
      },
      debug: {
        reason: selectedBundle.validityInDays === state.request.duration ? "exact_match" : "next_available",
        unusedDays,
      }
    };
  }

  /**
   * Step 2: Bundle Adjustments
   */
  private async applyBundleAdjustments(state: PricingEngineState): Promise<PipelineStep> {
    logger.debug("Executing bundle adjustments step", {
      correlationId: state.metadata.correlationId,
      bundleId: state.selectedBundle?.name,
    });

    // Apply bundle-specific adjustments (e.g., proration for unused days)
    const appliedRules: string[] = [];
    let adjustedPricing = this.initializePricing(state.selectedBundle);

    // Find bundle adjustment rules
    const bundleAdjustmentRules = this.filterRulesByCategory(RuleCategory.BUNDLE_ADJUSTMENT);
    
    for (const rule of bundleAdjustmentRules) {
      if (this.evaluateRuleConditions(rule, state)) {
        adjustedPricing = this.applyRuleActions(rule, adjustedPricing, state);
        appliedRules.push(rule.id);
      }
    }

    return {
      name: 'BUNDLE_ADJUSTMENT',
      timestamp: new Date(),
      state: {
        pricing: adjustedPricing,
      },
      appliedRules,
      debug: {
        basePrice: state.selectedBundle.basePrice,
        adjustedPrice: adjustedPricing.costPlus,
      }
    };
  }

  /**
   * Step 3: Apply Discounts
   */
  private async applyDiscounts(state: PricingEngineState): Promise<PipelineStep> {
    logger.debug("Executing discounts step", {
      correlationId: state.metadata.correlationId,
    });

    const appliedRules: string[] = [];
    let discountedPricing = { ...state.pricing! };

    // Find discount rules
    const discountRules = this.filterRulesByCategory(RuleCategory.DISCOUNT);
    
    for (const rule of discountRules) {
      if (this.evaluateRuleConditions(rule, state)) {
        discountedPricing = this.applyRuleActions(rule, discountedPricing, state);
        appliedRules.push(rule.id);
      }
    }

    return {
      name: 'APPLY_DISCOUNTS',
      timestamp: new Date(),
      state: {
        pricing: discountedPricing,
      },
      appliedRules,
      debug: {
        originalSubtotal: state.pricing!.costPlus,
        discountedSubtotal: discountedPricing.costPlus,
        totalDiscount: discountedPricing.discountValue,
      }
    };
  }

  /**
   * Step 4: Apply Constraints
   */
  private async applyConstraints(state: PricingEngineState): Promise<PipelineStep> {
    logger.debug("Executing constraints step", {
      correlationId: state.metadata.correlationId,
    });

    const appliedRules: string[] = [];
    let constrainedPricing = { ...state.pricing! };

    // Find constraint rules (minimum profit, minimum price, etc.)
    const constraintRules = this.filterRulesByCategory(RuleCategory.CONSTRAINT);
    
    for (const rule of constraintRules) {
      if (this.evaluateRuleConditions(rule, state)) {
        constrainedPricing = this.applyRuleActions(rule, constrainedPricing, state);
        appliedRules.push(rule.id);
      }
    }

    return {
      name: 'APPLY_CONSTRAINTS',
      timestamp: new Date(),
      state: {
        pricing: constrainedPricing,
      },
      appliedRules,
      debug: {
        constraintsApplied: appliedRules.length,
      }
    };
  }

  /**
   * Step 5: Apply Fees
   */
  private async applyFees(state: PricingEngineState): Promise<PipelineStep> {
    logger.debug("Executing fees step", {
      correlationId: state.metadata.correlationId,
      paymentMethod: state.payment.method,
    });

    const appliedRules: string[] = [];
    let finalPricing = { ...state.pricing! };

    // Find fee rules (processing fees, payment method fees, etc.)
    const feeRules = this.filterRulesByCategory(RuleCategory.FEE);
    
    for (const rule of feeRules) {
      if (this.evaluateRuleConditions(rule, state)) {
        finalPricing = this.applyRuleActions(rule, finalPricing, state);
        appliedRules.push(rule.id);
      }
    }

    return {
      name: 'APPLY_FEES',
      timestamp: new Date(),
      state: {
        pricing: finalPricing,
      },
      appliedRules,
      debug: {
        priceBeforeFees: state.pricing!.priceAfterDiscount,
        finalPrice: finalPricing.finalRevenue,
        totalFees: finalPricing.processingCost,
      }
    };
  }

  /**
   * Final step: Compile results
   */
  private async compileFinalResults(state: PricingEngineState): Promise<PipelineStep> {
    // Final validation and cleanup
    const finalPricing = { ...state.pricing! };
    
    // Ensure all calculations are complete
    finalPricing.finalRevenue = finalPricing.priceAfterDiscount + finalPricing.processingCost;
    finalPricing.netProfit = finalPricing.finalRevenue - finalPricing.cost - finalPricing.processingCost;

    return {
      name: 'FINALIZE',
      timestamp: new Date(),
      state: {
        pricing: finalPricing,
      },
      debug: {
        finalPrice: finalPricing.finalRevenue,
        profit: finalPricing.netProfit,
        calculationComplete: true,
      }
    };
  }

  /**
   * Legacy method that uses the new pipeline internally
   */
  async calculatePrice(request: PricingEngineInput): Promise<PricingEngineOutput> {
    // Use the new pipeline but consume all steps to get final result
    const generator = this.calculatePriceSteps(request);
    let result = await generator.next();
    
    // Consume all steps
    while (!result.done) {
      result = await generator.next();
    }
    
    return result.value;
  }
  
  /**
   * Calculate pricing for multiple items in a single call
   */
  async calculateBulkPrices(requests: PricingEngineInput[]): Promise<PricingEngineOutput[]> {
    logger.info("Starting bulk price calculation", {
      requestCount: requests.length,
      operationType: "bulk-price-calculation",
    });

    const results: PricingEngineOutput[] = [];
    
    // Process each request sequentially to avoid overwhelming the system
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      const correlationId = request.metadata.correlationId;
      
      try {
        const result = await this.calculatePrice(request);
        results.push(result);
        
        logger.debug(`Bulk calculation progress: ${i + 1}/${requests.length}`, {
          correlationId,
          contextIndex: i,
          operationType: "bulk-price-calculation",
        });
      } catch (error) {
        logger.error(`Failed to calculate price for request ${i}`, error as Error, {
          correlationId,
          contextIndex: i,
          operationType: "bulk-price-calculation",
        });
        throw new Error(
          `Bulk pricing failed at index ${i}: ${(error as Error).message}`
        );
      }
    }

    logger.info("Bulk price calculation completed", {
      requestCount: requests.length,
      successCount: results.length,
      operationType: "bulk-price-calculation",
    });

    return results;
  }

  // Helper methods

  private findOptimalBundle(bundles: Bundle[], requestedDuration: number): Bundle {
    // Try exact match first
    const exactMatch = bundles.find(b => b.validityInDays === requestedDuration);
    if (exactMatch) return exactMatch;

    // Find smallest bundle that covers the requested duration
    const suitableBundles = bundles
      .filter(b => b.validityInDays >= requestedDuration)
      .sort((a, b) => a.validityInDays - b.validityInDays);

    if (suitableBundles.length > 0) {
      return suitableBundles[0];
    }

    // Fallback to largest bundle if none can cover the duration
    const sortedBundles = bundles.sort((a, b) => b.validityInDays - a.validityInDays);
    return sortedBundles[0];
  }

  private initializePricing(bundle: Bundle): PricingBreakdown {
    return {
      cost: bundle.basePrice,
      costPlus: bundle.basePrice,
      priceAfterDiscount: bundle.basePrice,
      processingCost: 0,
      processingRate: 0,
      finalRevenue: bundle.basePrice,
      netProfit: 0,
      totalCost: bundle.basePrice,
      discountPerDay: 0,
      // Required fields with defaults
      bundle: null as any, // Will be populated later
      country: null as any, // Will be populated later
      currency: bundle.currency,
      duration: bundle.validityInDays,
      discountRate: 0,
      discountValue: 0,
      appliedRules: [],
      discounts: [],
    };
  }

  private filterRulesByCategory(category: RuleCategory): PricingRule[] {
    // For now, return all rules - in a real implementation, rules would have categories
    // This is a placeholder until rule categorization is implemented
    return this.rules.filter(rule => rule.isActive);
  }

  private evaluateRuleConditions(rule: PricingRule, state: PricingEngineState): boolean {
    // Simplified condition evaluation - in a real implementation, this would be more sophisticated
    return rule.isActive;
  }

  private applyRuleActions(rule: PricingRule, pricing: PricingBreakdown, state: PricingEngineState): PricingBreakdown {
    // Simplified action application - in a real implementation, this would handle different action types
    const newPricing = { ...pricing };
    
    for (const action of rule.actions) {
      switch (action.type) {
        case ActionType.AddMarkup:
          newPricing.costPlus += action.value;
          break;
        case ActionType.ApplyDiscountPercentage:
          const discountAmount = newPricing.costPlus * (action.value / 100);
          newPricing.discountValue += discountAmount;
          newPricing.discountRate = (newPricing.discountValue / newPricing.costPlus) * 100;
          newPricing.priceAfterDiscount = newPricing.costPlus - newPricing.discountValue;
          break;
        case ActionType.SetProcessingRate:
          newPricing.processingRate = action.value / 100;
          newPricing.processingCost = newPricing.priceAfterDiscount * newPricing.processingRate;
          break;
      }
    }

    return newPricing;
  }

  private extractAppliedRules(steps: PipelineStep[]): PricingRule[] {
    const appliedRuleIds = steps.flatMap(step => step.appliedRules || []);
    return this.rules.filter(rule => appliedRuleIds.includes(rule.id));
  }
}