import { createLogger } from "@esim-go/utils";
import type {
  Bundle,
  PipelineStep,
  PricingBreakdown,
  PricingEngineInput,
  PricingEngineOutput,
  PricingEngineState,
  PricingRule,
} from "./rules-engine-types";
import { ActionType, RuleCategory } from "./rules-engine-types";

// Helper to generate correlation ID
function generateCorrelationId(): string {
  return `pricing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Module-level logger for stateless operation
const logger = createLogger({
  component: "PricingEngine",
  operationType: "price-calculation",
});

export class PricingEngine {
  private rules: PricingRule[] = [];

  /**
   * Add rules to the engine
   */
  addRules(rules: PricingRule[]): void {
    logger.info("Adding rules to pricing engine", {
      rulesCount: rules.length,
      ruleNames: rules.map((r) => r.name),
      ruleCategories: rules.map((r) => r.category),
      ruleActions: rules.map((r) => r.actions.map((a) => a.type)),
    });

    this.rules = [...this.rules, ...rules];
    // Sort by priority (higher priority first)
    this.rules.sort((a, b) => b.priority - a.priority);

    logger.info("Rules added and sorted", {
      totalRules: this.rules.length,
      rulesPriority: this.rules.map((r) => ({
        name: r.name,
        priority: r.priority,
      })),
    });
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
  async *calculatePriceSteps(
    input: PricingEngineInput
  ): AsyncGenerator<PipelineStep, PricingEngineOutput> {
    const correlationId = input.metadata?.correlationId || generateCorrelationId();

    logger.info("Starting step-by-step price calculation", {
      correlationId,
      operationType: "price-calculation-pipeline",
    });

    // Initialize state with new structure
    let state: PricingEngineState = {
      context: input.context,
      request: {
        duration: input.request?.duration || 0,
        paymentMethod: input.request?.paymentMethod || input.request?.paymentMethod,
        promo: input.request?.promo,
        countryISO: input.request?.countryISO,
        region: input.request?.region,
        group: input.request?.group,
        dataType: input.request?.dataType as 'unlimited' | 'fixed' | undefined,
      },
      response: {
        unusedDays: 0,
        selectedBundle: null as any,
        pricing: null as any,
        rules: [],
      },
      state: {
        steps: [],
        country: input.request?.countryISO || "",
        selectedBundle: null as any,
        pricing: null as any,
        region: input.request?.region || "",
        data: input.request?.dataType as 'unlimited' | 'fixed' || 'fixed',
        group: input.request?.group || "",
      },
      metadata: {
        ...(input.metadata || {}),
        correlationId: input.metadata?.correlationId || generateCorrelationId(),
      },
    };

    // Step 1: Bundle Selection
    const bundleStep = await this.selectBundle(state);
    state = { ...state, ...bundleStep.state };
    state.state.steps.push(bundleStep);
    yield bundleStep;

    // Step 2: Bundle Adjustments
    const adjustmentStep = await this.applyBundleAdjustments(state);
    state = { ...state, ...adjustmentStep.state };
    state.state.steps.push(adjustmentStep);
    yield adjustmentStep;

    // Step 3: Apply Discounts
    const discountStep = await this.applyDiscounts(state);
    state = { ...state, ...discountStep.state };
    state.state.steps.push(discountStep);
    yield discountStep;

    // Step 3.5: Apply Unused Days Discount
    const unusedDaysStep = await this.applyUnusedDaysDiscount(state);
    state = { ...state, ...unusedDaysStep.state };
    state.state.steps.push(unusedDaysStep);
    yield unusedDaysStep;

    // Step 4: Apply Constraints
    const constraintStep = await this.applyConstraints(state);
    state = { ...state, ...constraintStep.state };
    state.state.steps.push(constraintStep);
    yield constraintStep;

    // Step 5: Apply Fees
    const feeStep = await this.applyFees(state);
    state = { ...state, ...feeStep.state };
    state.state.steps.push(feeStep);
    yield feeStep;

    // Final step: Compile results
    const finalStep = await this.compileFinalResults(state);
    state = { ...state, ...finalStep.state };
    state.state.steps.push(finalStep);
    yield finalStep;

    logger.info("Completed step-by-step price calculation", {
      correlationId,
      totalSteps: state.state.steps.length,
      finalPrice: state.state.pricing?.finalRevenue,
      operationType: "price-calculation-pipeline",
    });

    // Extract applied rules and add to response
    const appliedRules = this.extractAppliedRules(state.state.steps);
    
    // Return final output with only response, state, and metadata
    return {
      response: {
        ...state.response,
        rules: appliedRules,
      },
      state: state.state,
      metadata: state.metadata,
    } as PricingEngineOutput;
  }

  /**
   * Step 1: Bundle Selection
   */
  private async selectBundle(state: PricingEngineState): Promise<PipelineStep> {
    logger.debug("Executing bundle selection step", {
      correlationId: state.metadata.correlationId,
      requestedDuration: state.request.duration,
      availableBundles: state.context.bundles.length,
    });

    // Find the best matching bundle
    const selectedBundle = this.findOptimalBundle(
      state.context.bundles,
      state.request.duration
    );
    const unusedDays = Math.max(
      0,
      selectedBundle.validityInDays - state.request.duration
    );

    // Update state objects
    const stateUpdate: Partial<PricingEngineState> = {
      response: {
        ...state.response,
        selectedBundle,
        unusedDays,
      },
      state: {
        ...state.state,
        selectedBundle,
        country: selectedBundle.countries?.[0] || state.state.country,
        region: selectedBundle.region || state.state.region,
        group: selectedBundle.groups?.[0] || state.state.group,
        data: selectedBundle.isUnlimited ? 'unlimited' : 'fixed',
      },
    };

    return {
      name: "BUNDLE_SELECTION",
      timestamp: new Date(),
      state: stateUpdate,
      debug: {
        reason:
          selectedBundle.validityInDays === state.request.duration
            ? "exact_match"
            : "next_available",
        unusedDays,
      },
    };
  }

  /**
   * Step 2: Bundle Adjustments
   */
  private async applyBundleAdjustments(
    state: PricingEngineState
  ): Promise<PipelineStep> {
    logger.debug("Executing bundle adjustments step", {
      correlationId: state.metadata.correlationId,
      bundleId: state.state.selectedBundle?.name,
    });

    // Apply bundle-specific adjustments (e.g., proration for unused days)
    const appliedRules: string[] = [];
    let adjustedPricing = this.initializePricing(state.state.selectedBundle);

    // Find bundle adjustment rules
    const bundleAdjustmentRules = this.filterRulesByCategory(
      RuleCategory.BundleAdjustment
    );

    for (const rule of bundleAdjustmentRules) {
      if (this.evaluateRuleConditions(rule, state)) {
        adjustedPricing = this.applyRuleActions(rule, adjustedPricing, state);
        appliedRules.push(rule.id);
      }
    }

    return {
      name: "BUNDLE_ADJUSTMENT",
      timestamp: new Date(),
      state: {
        state: {
          ...state.state,
          pricing: adjustedPricing,
        },
        response: {
          ...state.response,
          pricing: adjustedPricing,
        },
      },
      appliedRules,
      debug: {
        basePrice: state.state.selectedBundle.basePrice,
        adjustedPrice: adjustedPricing.totalCost,
      },
    };
  }

  /**
   * Step 3: Apply Discounts
   */
  private async applyDiscounts(
    state: PricingEngineState
  ): Promise<PipelineStep> {
    logger.debug("Executing discounts step", {
      correlationId: state.metadata.correlationId,
    });

    const appliedRules: string[] = [];
    let discountedPricing = { ...state.state.pricing! };

    // Find discount rules
    const discountRules = this.filterRulesByCategory(RuleCategory.Discount);

    logger.debug("Discount rules analysis", {
      correlationId: state.metadata.correlationId,
      totalRulesInEngine: this.rules.length,
      discountRulesFound: discountRules.length,
      discountRuleNames: discountRules.map((r) => r.name),
      discountRuleCategories: discountRules.map((r) => r.category),
      discountRuleActive: discountRules.map((r) => r.isActive),
      pricingBeforeDiscounts: {
        totalCost: state.state.pricing!.totalCost,
        priceAfterDiscount: state.state.pricing!.priceAfterDiscount,
        discountValue: state.state.pricing!.discountValue,
      },
    });

    for (const rule of discountRules) {
      logger.debug("Evaluating discount rule", {
        correlationId: state.metadata.correlationId,
        ruleName: rule.name,
        ruleId: rule.id,
        ruleCategory: rule.category,
        isActive: rule.isActive,
        conditions: rule.conditions,
        actions: rule.actions.map((a) => ({ type: a.type, value: a.value })),
      });

      if (this.evaluateRuleConditions(rule, state)) {
        logger.debug("Discount rule conditions passed, applying actions", {
          correlationId: state.metadata.correlationId,
          ruleName: rule.name,
          pricingBeforeActions: {
            totalCost: discountedPricing.totalCost,
            priceAfterDiscount: discountedPricing.priceAfterDiscount,
            discountValue: discountedPricing.discountValue,
            discountRate: discountedPricing.discountRate,
          },
        });

        discountedPricing = this.applyRuleActions(
          rule,
          discountedPricing,
          state
        );
        appliedRules.push(rule.id);

        logger.debug("Discount rule actions applied", {
          correlationId: state.metadata.correlationId,
          ruleName: rule.name,
          pricingAfterActions: {
            totalCost: discountedPricing.totalCost,
            priceAfterDiscount: discountedPricing.priceAfterDiscount,
            discountValue: discountedPricing.discountValue,
            discountRate: discountedPricing.discountRate,
          },
        });
      } else {
        logger.debug("Discount rule conditions failed", {
          correlationId: state.metadata.correlationId,
          ruleName: rule.name,
        });
      }
    }

    logger.debug("Discounts step completed", {
      correlationId: state.metadata.correlationId,
      appliedRulesCount: appliedRules.length,
      appliedRuleNames: appliedRules,
      finalDiscountValue: discountedPricing.discountValue,
      finalDiscountRate: discountedPricing.discountRate,
      finalPriceAfterDiscount: discountedPricing.priceAfterDiscount,
    });

    return {
      name: "APPLY_DISCOUNTS",
      timestamp: new Date(),
      state: {
        state: {
          ...state.state,
          pricing: discountedPricing,
        },
        response: {
          ...state.response,
          pricing: discountedPricing,
        },
      },
      appliedRules,
      debug: {
        originalSubtotal: state.state.pricing!.totalCost,
        discountedSubtotal: discountedPricing.totalCost,
        totalDiscount: discountedPricing.discountValue,
      },
    };
  }

  /**
   * Step 3.5: Apply Unused Days Discount
   */
  private async applyUnusedDaysDiscount(
    state: PricingEngineState
  ): Promise<PipelineStep> {
    logger.debug("Executing unused days discount step", {
      correlationId: state.metadata.correlationId,
      unusedDays: state.response.unusedDays,
      requestedDuration: state.request.duration,
      selectedBundleDuration: state.response.selectedBundle?.validityInDays,
    });

    // If no unused days, skip
    if ((state.response.unusedDays || 0) <= 0) {
      return {
        name: "APPLY_UNUSED_DAYS_DISCOUNT",
        timestamp: new Date(),
        state: {
          state: {
            ...state.state,
            pricing: state.state.pricing,
          },
        },
        appliedRules: [],
        debug: {
          unusedDays: state.response.unusedDays || 0,
          discountPerDay: 0,
          totalUnusedDiscount: 0,
          message: "No unused days discount needed",
        },
      };
    }

    try {
      // Calculate discount per day based on markup difference formula
      const discountPerDay = await this.calculateUnusedDayDiscount(
        state.context.bundles,
        state.response.selectedBundle!,
        state.request.duration
      );

      if (discountPerDay <= 0) {
        return {
          name: "APPLY_UNUSED_DAYS_DISCOUNT",
          timestamp: new Date(),
          state: {
            state: {
              ...state.state,
              pricing: state.state.pricing,
            },
          },
          appliedRules: [],
          debug: {
            unusedDays: state.response.unusedDays || 0,
            discountPerDay: 0,
            totalUnusedDiscount: 0,
            message: "No discount per day calculated",
          },
        };
      }

      // Apply unused days discount
      const totalUnusedDiscount = discountPerDay * (state.response.unusedDays || 0);
      const updatedPricing = { ...state.state.pricing! };

      // Add to existing discount
      updatedPricing.discountValue =
        (updatedPricing.discountValue || 0) + totalUnusedDiscount;
      updatedPricing.discountPerDay = discountPerDay;
      updatedPricing.priceAfterDiscount =
        updatedPricing.totalCost - updatedPricing.discountValue;

      logger.debug("Applied unused days discount", {
        correlationId: state.metadata.correlationId,
        unusedDays: state.response.unusedDays,
        discountPerDay,
        totalUnusedDiscount,
        newTotalDiscount: updatedPricing.discountValue,
        newPriceAfterDiscount: updatedPricing.priceAfterDiscount,
      });

      return {
        name: "APPLY_UNUSED_DAYS_DISCOUNT",
        timestamp: new Date(),
        state: {
          state: {
            ...state.state,
            pricing: updatedPricing,
          },
          response: {
            ...state.response,
            pricing: updatedPricing,
          },
        },
        appliedRules: [
          `unused-days-${state.response.unusedDays}d-@${discountPerDay.toFixed(2)}`,
        ],
        debug: {
          unusedDays: state.response.unusedDays || 0,
          discountPerDay,
          totalUnusedDiscount,
          message: `Applied ${
            state.response.unusedDays
          } unused days discount at $${discountPerDay.toFixed(2)}/day`,
        },
      };
    } catch (error) {
      logger.error("Failed to calculate unused days discount", error as Error, {
        correlationId: state.metadata.correlationId,
        unusedDays: state.response.unusedDays,
        operationType: "unused-days-discount",
      });

      return {
        name: "APPLY_UNUSED_DAYS_DISCOUNT",
        timestamp: new Date(),
        state: {
          state: {
            ...state.state,
            pricing: state.state.pricing,
          },
        },
        appliedRules: [],
        debug: {
          unusedDays: state.response.unusedDays || 0,
          discountPerDay: 0,
          totalUnusedDiscount: 0,
          error: (error as Error).message,
          message: "Failed to calculate unused days discount",
        },
      };
    }
  }

  /**
   * Step 4: Apply Constraints
   */
  private async applyConstraints(
    state: PricingEngineState
  ): Promise<PipelineStep> {
    logger.debug("Executing constraints step", {
      correlationId: state.metadata.correlationId,
    });

    const appliedRules: string[] = [];
    let constrainedPricing = { ...state.state.pricing! };

    // Find constraint rules (minimum profit, minimum price, etc.)
    const constraintRules = this.filterRulesByCategory(RuleCategory.Constraint);

    for (const rule of constraintRules) {
      if (this.evaluateRuleConditions(rule, state)) {
        constrainedPricing = this.applyRuleActions(
          rule,
          constrainedPricing,
          state
        );
        appliedRules.push(rule.id);
      }
    }

    return {
      name: "APPLY_CONSTRAINTS",
      timestamp: new Date(),
      state: {
        state: {
          ...state.state,
          pricing: constrainedPricing,
        },
        response: {
          ...state.response,
          pricing: constrainedPricing,
        },
      },
      appliedRules,
      debug: {
        constraintsApplied: appliedRules.length,
      },
    };
  }

  /**
   * Step 5: Apply Fees
   */
  private async applyFees(state: PricingEngineState): Promise<PipelineStep> {
    logger.debug("Executing fees step", {
      correlationId: state.metadata.correlationId,
      paymentMethod: state.context.payment?.method,
    });

    const appliedRules: string[] = [];
    let finalPricing = { ...state.state.pricing! };

    // Find fee rules (processing fees, payment method fees, etc.)
    const feeRules = this.filterRulesByCategory(RuleCategory.Fee);

    logger.debug("Fee rules analysis", {
      correlationId: state.metadata.correlationId,
      totalRulesInEngine: this.rules.length,
      feeRulesFound: feeRules.length,
      feeRuleNames: feeRules.map((r) => r.name),
      feeRuleCategories: feeRules.map((r) => r.category),
      feeRuleActive: feeRules.map((r) => r.isActive),
      paymentMethodInState: state.context.payment?.method,
      paymentFieldValue: this.getFieldValue("context.payment.method", state),
    });

    for (const rule of feeRules) {
      logger.debug("Evaluating fee rule", {
        correlationId: state.metadata.correlationId,
        ruleName: rule.name,
        ruleId: rule.id,
        ruleCategory: rule.category,
        isActive: rule.isActive,
        conditions: rule.conditions,
        actions: rule.actions.map((a) => ({ type: a.type, value: a.value })),
      });

      if (this.evaluateRuleConditions(rule, state)) {
        logger.debug("Fee rule conditions passed, applying actions", {
          correlationId: state.metadata.correlationId,
          ruleName: rule.name,
          pricingBeforeActions: {
            priceAfterDiscount: finalPricing.priceAfterDiscount,
            processingRate: finalPricing.processingRate,
            processingCost: finalPricing.processingCost,
          },
        });

        finalPricing = this.applyRuleActions(rule, finalPricing, state);
        appliedRules.push(rule.id);

        logger.debug("Fee rule actions applied", {
          correlationId: state.metadata.correlationId,
          ruleName: rule.name,
          pricingAfterActions: {
            priceAfterDiscount: finalPricing.priceAfterDiscount,
            processingRate: finalPricing.processingRate,
            processingCost: finalPricing.processingCost,
            finalRevenue: finalPricing.finalRevenue,
          },
        });
      } else {
        logger.debug("Fee rule conditions failed", {
          correlationId: state.metadata.correlationId,
          ruleName: rule.name,
        });
      }
    }

    logger.debug("Fees step completed", {
      correlationId: state.metadata.correlationId,
      appliedRulesCount: appliedRules.length,
      appliedRuleNames: appliedRules,
      finalProcessingRate: finalPricing.processingRate,
      finalProcessingCost: finalPricing.processingCost,
      finalRevenue: finalPricing.finalRevenue,
    });

    return {
      name: "APPLY_FEES",
      timestamp: new Date(),
      state: {
        state: {
          ...state.state,
          pricing: finalPricing,
        },
        response: {
          ...state.response,
          pricing: finalPricing,
        },
      },
      appliedRules,
      debug: {
        priceBeforeFees: state.state.pricing!.priceAfterDiscount,
        finalPrice: finalPricing.finalRevenue,
        totalFees: finalPricing.processingCost,
      },
    };
  }

  /**
   * Final step: Compile results
   */
  private async compileFinalResults(
    state: PricingEngineState
  ): Promise<PipelineStep> {
    // Final validation and cleanup
    const finalPricing = { ...state.state.pricing! };

    // Ensure all calculations are complete
    // finalRevenue = what customer pays (before processing fee deduction)
    finalPricing.finalRevenue = finalPricing.priceAfterDiscount;

    // revenueAfterProcessing = bottom line revenue after processing fees are deducted
    finalPricing.revenueAfterProcessing =
      finalPricing.priceAfterDiscount - finalPricing.processingCost;
    finalPricing.totalCostBeforeProcessing =
      finalPricing.priceAfterDiscount - finalPricing.processingCost;

    // Net profit is what we keep after paying the supplier cost
    // Processing fees are passed to the payment processor, not kept as profit
    finalPricing.netProfit =
      finalPricing.priceAfterDiscount - finalPricing.cost;

    return {
      name: "FINALIZE",
      timestamp: new Date(),
      state: {
        state: {
          ...state.state,
          pricing: finalPricing,
        },
        response: {
          ...state.response,
          pricing: finalPricing,
        },
      },
      debug: {
        finalPrice: finalPricing.finalRevenue,
        profit: finalPricing.netProfit,
        calculationComplete: true,
      },
    };
  }

  /**
   * Legacy method that uses the new pipeline internally
   */
  async calculatePrice(
    request: PricingEngineInput
  ): Promise<PricingEngineOutput> {
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
  async calculateBulkPrices(
    requests: PricingEngineInput[]
  ): Promise<PricingEngineOutput[]> {
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
        logger.error(
          `Failed to calculate price for request ${i}`,
          error as Error,
          {
            correlationId,
            contextIndex: i,
            operationType: "bulk-price-calculation",
          }
        );
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

  private findOptimalBundle(
    bundles: Bundle[],
    requestedDuration: number
  ): Bundle {
    // Try exact match first
    const exactMatch = bundles.find(
      (b) => b.validityInDays === requestedDuration
    );
    if (exactMatch) return exactMatch;

    // Find smallest bundle that covers the requested duration
    const suitableBundles = bundles
      .filter((b) => b.validityInDays >= requestedDuration)
      .sort((a, b) => a.validityInDays - b.validityInDays);

    if (suitableBundles.length > 0) {
      return suitableBundles[0];
    }

    // Fallback to largest bundle if none can cover the duration
    const sortedBundles = bundles.sort(
      (a, b) => b.validityInDays - a.validityInDays
    );
    return sortedBundles[0];
  }

  private initializePricing(bundle: Bundle): PricingBreakdown {
    return {
      cost: bundle.basePrice,
      markup: 0, // Markup starts at 0
      totalCost: bundle.basePrice, // Initially equals base cost
      priceAfterDiscount: bundle.basePrice,
      processingCost: 0,
      processingRate: 0,
      finalRevenue: bundle.basePrice, // What customer pays
      revenueAfterProcessing: bundle.basePrice, // What we receive after processing fees
      totalCostBeforeProcessing: bundle.basePrice,
      netProfit: 0,
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
    // Filter rules by category and active status
    return this.rules.filter(
      (rule) =>
        (rule.isActive === undefined || rule.isActive === true) && 
        rule.category?.toUpperCase() === category.toUpperCase()
    );
  }

  private evaluateRuleConditions(
    rule: PricingRule,
    state: PricingEngineState
  ): boolean {
    logger.debug("Evaluating rule conditions", {
      ruleName: rule.name,
      ruleCategory: rule.category,
      isActive: rule.isActive,
      conditionsCount: rule.conditions?.length || 0,
      conditions: rule.conditions,
    });

    // Rule must be active (default to true if not specified)
    if (rule.isActive === false) {
      logger.debug("Rule is not active, skipping", { ruleName: rule.name });
      return false;
    }

    // If no conditions, rule always applies
    if (!rule.conditions || rule.conditions.length === 0) {
      logger.debug("Rule has no conditions, applying", { ruleName: rule.name });
      return true;
    }

    // DEBUG: Log the complete engine state structure for the first condition
    if (rule.conditions.length > 0 && rule.name.includes("1 day Markup")) {
      logger.info("🔍 COMPLETE ENGINE STATE STRUCTURE", {
        ruleName: rule.name,
        contextBundles: state.context.bundles?.map(b => ({
          name: b.name,
          groups: b.groups,
          isUnlimited: b.isUnlimited,
          validityInDays: b.validityInDays
        })),
        contextPayment: state.context.payment,
        request: state.request,
        responseSelectedBundle: state.response.selectedBundle ? {
          name: state.response.selectedBundle.name,  
          groups: state.response.selectedBundle.groups,
          isUnlimited: state.response.selectedBundle.isUnlimited,
          validityInDays: state.response.selectedBundle.validityInDays
        } : null,
        stateData: state.state,
        operationType: "engine-state-debug"
      });
    }

    // Evaluate all conditions - all must pass (AND logic)
    for (const condition of rule.conditions) {
      const result = this.evaluateCondition(condition, state);
      
      // Enhanced debug logging with more field paths tested
      const debugFieldPaths = {
        'context.bundles[0].groups': state.context.bundles?.[0]?.groups,
        'request.group': state.request.group,
        'request.duration': state.request.duration,
        'state.group': state.state.group,
        'state.duration': state.state.duration,
        'response.selectedBundle.groups': state.response.selectedBundle?.groups,
        'response.selectedBundle.isUnlimited': state.response.selectedBundle?.isUnlimited,
        'bundleGroup': (state as any).bundleGroup,
        'group': (state as any).group,
        'duration': (state as any).duration,
        'isUnlimited': (state as any).isUnlimited
      };

      logger.debug("🔍 Enhanced condition evaluation", {
        ruleName: rule.name,
        condition,
        result,
        requestedFieldValue: this.getFieldValue(condition.field, state),
        availableFieldPaths: debugFieldPaths,
        conditionField: condition.field,
        conditionValue: condition.value,
        actualBundleData: {
          selectedBundle: state.response.selectedBundle?.name,
          bundleGroups: state.response.selectedBundle?.groups,
          stateGroup: state.state.group,
          requestGroup: state.request.group,
        },
      });

      if (!result) {
        logger.debug("Condition failed, rule will not apply", {
          ruleName: rule.name,
          condition,
        });
        return false;
      }
    }

    logger.debug("All conditions passed, rule will apply", {
      ruleName: rule.name,
    });
    return true;
  }

  private evaluateCondition(
    condition: any,
    state: PricingEngineState
  ): boolean {
    // Get the field value from state
    const fieldValue = this.getFieldValue(condition.field, state);
    const conditionValue = condition.value;

    // Special debug logging for payment method conditions
    if (condition.field === "context.payment.method" || condition.field === "payment.method") {
      logger.debug("Payment method condition evaluation", {
        conditionField: condition.field,
        conditionOperator: condition.operator,
        conditionValue: conditionValue,
        conditionValueType: typeof conditionValue,
        fieldValue: fieldValue,
        fieldValueType: typeof fieldValue,
        paymentMethodInState: state.context.payment?.method,
        strictEquality: fieldValue === conditionValue,
        looseEquality: fieldValue == conditionValue,
      });
    }

    // Compare based on operator
    switch (condition.operator) {
      case "EQUALS":
        // Use flexible matching for group-related fields
        if (this.isGroupField(condition.field)) {
          return this.compareGroupNames(fieldValue, conditionValue);
        }
        return fieldValue === conditionValue;
      case "NOT_EQUALS":
        // Use flexible matching for group-related fields
        if (this.isGroupField(condition.field)) {
          return !this.compareGroupNames(fieldValue, conditionValue);
        }
        return fieldValue !== conditionValue;
      case "GREATER_THAN":
        return Number(fieldValue) > Number(conditionValue);
      case "LESS_THAN":
        return Number(fieldValue) < Number(conditionValue);
      case "GREATER_THAN_OR_EQUAL":
        return Number(fieldValue) >= Number(conditionValue);
      case "LESS_THAN_OR_EQUAL":
        return Number(fieldValue) <= Number(conditionValue);
      case "IN":
        if (Array.isArray(conditionValue)) {
          // Use flexible matching for group-related fields
          if (this.isGroupField(condition.field)) {
            return conditionValue.some((value) =>
              this.compareGroupNames(fieldValue, value)
            );
          }
          return conditionValue.includes(fieldValue);
        }
        return false;
      case "NOT_IN":
        if (Array.isArray(conditionValue)) {
          // Use flexible matching for group-related fields
          if (this.isGroupField(condition.field)) {
            return !conditionValue.some((value) =>
              this.compareGroupNames(fieldValue, value)
            );
          }
          return !conditionValue.includes(fieldValue);
        }
        return true;
      default:
        // Unknown operator, default to true
        return true;
    }
  }

  private getFieldValue(field: string, state: PricingEngineState): any {
    // Parse dot notation to navigate nested objects
    const parts = field.split(".");
    let value: any = state;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Normalize group name for flexible matching
   * Removes quotes, spaces, hyphens, commas and converts to lowercase
   */
  private normalizeGroupName(value: string): string {
    return value
      .toLowerCase() // Convert to lowercase
      .replace(/["\s\-,]+/g, "") // Remove quotes, spaces, hyphens, commas
      .trim(); // Remove leading/trailing whitespace
  }

  /**
   * Check if a field name is group-related and should use flexible matching
   */
  private isGroupField(fieldName: string): boolean {
    return fieldName.toLowerCase().includes("group");
  }

  /**
   * Compare group names using flexible matching
   * Falls back to strict equality for non-string values
   */
  private compareGroupNames(fieldValue: any, conditionValue: any): boolean {
    if (typeof fieldValue !== "string" || typeof conditionValue !== "string") {
      return fieldValue === conditionValue; // Fallback to strict equality
    }

    const normalizedField = this.normalizeGroupName(fieldValue);
    const normalizedCondition = this.normalizeGroupName(conditionValue);

    logger.debug("Using flexible group name matching", {
      originalField: fieldValue,
      originalCondition: conditionValue,
      normalizedField,
      normalizedCondition,
      match: normalizedField === normalizedCondition,
    });

    return normalizedField === normalizedCondition;
  }

  private applyRuleActions(
    rule: PricingRule,
    pricing: PricingBreakdown,
    state: PricingEngineState
  ): PricingBreakdown {
    logger.debug("Applying rule actions", {
      ruleName: rule.name,
      actionsCount: rule.actions.length,
      actions: rule.actions.map((a) => ({ type: a.type, value: a.value })),
      currentPricing: {
        cost: pricing.cost,
        markup: pricing.markup,
        totalCost: pricing.totalCost,
        priceAfterDiscount: pricing.priceAfterDiscount,
      },
    });

    const newPricing = { ...pricing };

    for (const action of rule.actions) {
      logger.debug("Processing action", {
        ruleName: rule.name,
        actionType: action.type,
        actionValue: action.value,
        actionTypeEnum: ActionType.AddMarkup,
        isAddMarkup: action.type === ActionType.AddMarkup,
      });

      switch (action.type) {
        case ActionType.AddMarkup:
          logger.debug("Applying markup action", {
            ruleName: rule.name,
            markupValueBefore: newPricing.markup,
            actionValue: action.value,
            markupValueAfter: newPricing.markup + action.value,
          });

          newPricing.markup += action.value;
          newPricing.totalCost = newPricing.cost + newPricing.markup;
          // Update price after discount if no discounts have been applied yet
          if (newPricing.discountValue === 0) {
            newPricing.priceAfterDiscount = newPricing.totalCost;
          }

          logger.debug("Markup action applied", {
            ruleName: rule.name,
            newMarkup: newPricing.markup,
            newTotalCost: newPricing.totalCost,
            newPriceAfterDiscount: newPricing.priceAfterDiscount,
          });
          break;
        case ActionType.ApplyDiscountPercentage:
          logger.debug("Applying percentage discount action", {
            ruleName: rule.name,
            actionValue: action.value,
            actionValueType: typeof action.value,
            totalCost: newPricing.totalCost,
            discountValueBefore: newPricing.discountValue,
            discountRateBefore: newPricing.discountRate,
            priceAfterDiscountBefore: newPricing.priceAfterDiscount,
          });

          const discountAmount = newPricing.totalCost * (action.value / 100);
          newPricing.discountValue += discountAmount;
          newPricing.discountRate =
            (newPricing.discountValue / newPricing.totalCost) * 100;
          newPricing.priceAfterDiscount =
            newPricing.totalCost - newPricing.discountValue;

          logger.debug("Percentage discount action applied", {
            ruleName: rule.name,
            discountPercentage: action.value,
            discountAmount: discountAmount,
            discountValueAfter: newPricing.discountValue,
            discountRateAfter: newPricing.discountRate,
            priceAfterDiscountAfter: newPricing.priceAfterDiscount,
            calculationCheck: `${newPricing.totalCost} * ${action.value}% = ${discountAmount}`,
          });
          break;
        case ActionType.SetProcessingRate:
          logger.debug("Applying processing rate action", {
            ruleName: rule.name,
            actionValue: action.value,
            actionValueType: typeof action.value,
            processingRateBefore: newPricing.processingRate,
            processingCostBefore: newPricing.processingCost,
            priceAfterDiscount: newPricing.priceAfterDiscount,
          });

          newPricing.processingRate = action.value / 100;
          newPricing.processingCost =
            newPricing.priceAfterDiscount * newPricing.processingRate;

          logger.debug("Processing rate action applied", {
            ruleName: rule.name,
            processingRateAfter: newPricing.processingRate,
            processingCostAfter: newPricing.processingCost,
            calculationCheck: `${newPricing.priceAfterDiscount} * ${newPricing.processingRate} = ${newPricing.processingCost}`,
          });
          break;
        case ActionType.SetMinimumProfit:
          // Calculate current profit (revenue after all costs)
          // Note: priceAfterDiscount should already include markups and discounts
          const currentProfit = newPricing.priceAfterDiscount - newPricing.cost;

          // If current profit is below minimum, adjust the price
          if (currentProfit < action.value) {
            // Calculate the minimum required price to achieve target profit
            const requiredPrice = newPricing.cost + action.value;

            // Only adjust if the current price is below the required price
            if (newPricing.priceAfterDiscount < requiredPrice) {
              newPricing.priceAfterDiscount = requiredPrice;

              // Recalculate discount values to reflect the adjustment
              const totalDiscount =
                newPricing.totalCost - newPricing.priceAfterDiscount;
              newPricing.discountValue = Math.max(0, totalDiscount);
              newPricing.discountRate =
                newPricing.totalCost > 0
                  ? (newPricing.discountValue / newPricing.totalCost) * 100
                  : 0;

              // Update net profit
              newPricing.netProfit =
                newPricing.priceAfterDiscount - newPricing.cost;
            }
          }
          break;
        case ActionType.SetMinimumPrice:
          // Ensure final price doesn't go below a minimum threshold
          if (newPricing.priceAfterDiscount < action.value) {
            newPricing.priceAfterDiscount = action.value;

            // Recalculate discount values
            const totalDiscount =
              newPricing.totalCost - newPricing.priceAfterDiscount;
            newPricing.discountValue = Math.max(0, totalDiscount);
            newPricing.discountRate =
              newPricing.totalCost > 0
                ? (newPricing.discountValue / newPricing.totalCost) * 100
                : 0;
          }
          break;
      }
    }

    return newPricing;
  }

  private extractAppliedRules(steps: PipelineStep[]): PricingRule[] {
    const appliedRuleIds = steps.flatMap((step) => step.appliedRules || []);
    return this.rules.filter((rule) => appliedRuleIds.includes(rule.id));
  }

  /**
   * Calculate discount per unused day based on markup difference formula
   * Formula: (selectedBundlePrice - previousBundlePrice) / (selectedDuration - previousDuration)
   */
  private async calculateUnusedDayDiscount(
    availableBundles: Bundle[],
    selectedBundle: Bundle,
    requestedDuration: number
  ): Promise<number> {
    try {
      // Find all bundles in the same group/category
      const sameCategoryBundles = availableBundles.filter(
        (bundle) =>
          bundle.groups.some((group) =>
            selectedBundle.groups.includes(group)
          ) &&
          bundle.countries.some((country) =>
            selectedBundle.countries.includes(country)
          )
      );

      // Get all available durations, sorted
      const availableDurations = sameCategoryBundles
        .map((bundle) => bundle.validityInDays)
        .filter((duration, index, arr) => arr.indexOf(duration) === index) // unique
        .sort((a, b) => a - b);

      // Find the previous duration (closest duration less than requested)
      const previousDuration = availableDurations
        .filter((duration) => duration < requestedDuration)
        .pop(); // Get the largest duration that's still less than requested

      if (!previousDuration) {
        logger.debug("No previous duration found for unused days calculation", {
          requestedDuration,
          selectedDuration: selectedBundle.validityInDays,
          availableDurations,
          operationType: "unused-days-discount",
        });
        return 0;
      }

      // Find the previous bundle
      const previousBundle = sameCategoryBundles.find(
        (bundle) => bundle.validityInDays === previousDuration
      );

      if (!previousBundle) {
        logger.debug("No previous bundle found for unused days calculation", {
          previousDuration,
          operationType: "unused-days-discount",
        });
        return 0;
      }

      // Calculate discount per day using the markup difference formula
      // Formula: (selectedBundlePrice - previousBundlePrice) / (selectedDuration - previousDuration)
      const priceDifference =
        selectedBundle.basePrice - previousBundle.basePrice;
      const daysDifference =
        selectedBundle.validityInDays - previousBundle.validityInDays;

      if (daysDifference <= 0) {
        logger.debug("Invalid days difference for unused days calculation", {
          selectedDuration: selectedBundle.validityInDays,
          previousDuration: previousBundle.validityInDays,
          daysDifference,
          operationType: "unused-days-discount",
        });
        return 0;
      }

      const discountPerDay = priceDifference / daysDifference;

      logger.debug("Calculated unused days discount per day", {
        selectedBundle: selectedBundle.name,
        selectedPrice: selectedBundle.basePrice,
        selectedDuration: selectedBundle.validityInDays,
        previousBundle: previousBundle.name,
        previousPrice: previousBundle.basePrice,
        previousDuration: previousBundle.validityInDays,
        priceDifference,
        daysDifference,
        discountPerDay,
        operationType: "unused-days-discount",
      });

      return Math.max(0, discountPerDay); // Ensure non-negative discount
    } catch (error) {
      logger.error("Error calculating unused days discount", error as Error, {
        selectedBundle: selectedBundle.name,
        requestedDuration,
        operationType: "unused-days-discount",
      });
      return 0;
    }
  }
}
