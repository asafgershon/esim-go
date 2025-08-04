import { produce } from "immer";
import type {
  PricingEngineState,
  PricingEngineInput,
  PricingEngineOutput,
  Bundle,
  PricingBreakdown,
  PricingRule,
} from "../../rules-engine-types";
import type { PipelineStepResult } from "../types";
import { ValidationError } from "../errors";

/**
 * Immutable state builder for pricing engine
 */
export class StateBuilder {
  private state: PricingEngineState;
  
  constructor(state: PricingEngineState) {
    this.state = state;
  }
  
  /**
   * Create a new StateBuilder from input
   */
  static fromInput(input: PricingEngineInput): StateBuilder {
    const correlationId = input.metadata?.correlationId || StateBuilder.generateCorrelationId();
    
    const initialState: PricingEngineState = {
      context: {
        bundles: input.context.bundles || [],
        customer: input.context.customer,
        payment: input.context.payment,
        rules: input.context.rules || [],
        date: input.context.date || new Date(),
      },
      request: {
        duration: input.request.duration,
        countryISO: input.request.countryISO,
        paymentMethod: input.request.paymentMethod,
        dataType: input.request.dataType,
        promo: input.request.promo,
      },
      processing: {
        steps: [],
        selectedBundle: null as any,
        previousBundle: undefined,
        region: "",
        group: "",
        // Initialize computed business fields
        markupDifference: 0,
        unusedDaysDiscountPerDay: 0,
        bundleUpgrade: false,
        effectiveDiscount: 0,
      },
      response: {
        unusedDays: 0,
        selectedBundle: null as any,
        pricing: null as any,
        appliedRules: [],
      },
      metadata: {
        correlationId,
        timestamp: new Date(),
        version: input.metadata?.version,
      },
    };
    
    return new StateBuilder(initialState);
  }
  
  /**
   * Get the current state (immutable)
   */
  getState(): PricingEngineState {
    return this.state;
  }
  
  /**
   * Set selected bundle and update related fields
   */
  withSelectedBundle(bundle: Bundle, unusedDays: number = 0): StateBuilder {
    return this.update(draft => {
      draft.response.selectedBundle = bundle;
      draft.response.unusedDays = unusedDays;
      draft.processing.selectedBundle = bundle;
      draft.processing.region = bundle.region || "";
      draft.processing.group = bundle.groups?.[0] || "";
      
      // Initialize pricing if not already set
      if (!draft.response.pricing) {
        draft.response.pricing = StateBuilder.createInitialPricing(bundle);
      }
    });
  }
  
  /**
   * Set previous bundle for comparison
   */
  withPreviousBundle(bundle: Bundle): StateBuilder {
    return this.update(draft => {
      draft.processing.previousBundle = bundle;
    });
  }
  
  /**
   * Update pricing breakdown
   */
  withPricing(updater: (pricing: PricingBreakdown) => void): StateBuilder {
    return this.update(draft => {
      if (!draft.response.pricing) {
        throw new ValidationError(
          "Cannot update pricing before bundle selection",
          "response.pricing",
          null,
          draft.metadata?.correlationId
        );
      }
      updater(draft.response.pricing);
    });
  }
  
  /**
   * Add a step result to the processing history
   */
  withStepResult(stepResult: PipelineStepResult): StateBuilder {
    return this.update(draft => {
      draft.processing.steps.push(stepResult);
    });
  }
  
  /**
   * Set applied rules
   */
  withAppliedRules(rules: PricingRule[]): StateBuilder {
    return this.update(draft => {
      draft.response.appliedRules = rules;
    });
  }
  
  /**
   * Update context information
   */
  withContext(updater: (context: PricingEngineState['context']) => void): StateBuilder {
    return this.update(draft => {
      updater(draft.context);
    });
  }
  
  /**
   * Update request information
   */
  withRequest(updater: (request: PricingEngineState['request']) => void): StateBuilder {
    return this.update(draft => {
      updater(draft.request);
    });
  }
  
  /**
   * Update metadata
   */
  withMetadata(updater: (metadata: PricingEngineState['metadata']) => void): StateBuilder {
    return this.update(draft => {
      updater(draft.metadata);
    });
  }

  /**
   * Update computed business fields automatically
   */
  withComputedFields(): StateBuilder {
    return this.update(draft => {
      if (!draft.processing.selectedBundle || !draft.response.pricing) {
        return; // Can't compute without selected bundle and pricing
      }

      const selectedBundle = draft.processing.selectedBundle;
      const previousBundle = draft.processing.previousBundle;
      const requestedDuration = draft.request.duration;
      const unusedDays = draft.response.unusedDays;
      const selectedPricing = draft.response.pricing;
      const previousPricing = previousBundle?.pricingBreakdown;

      // Calculate computed fields
      const selectedMarkup = selectedPricing?.markup || 0;
      const previousMarkup = previousPricing?.markup || 0;
      const markupDifference = selectedMarkup - previousMarkup;
      
      const bundleUpgrade = selectedBundle.validityInDays > requestedDuration;
      
      let unusedDaysDiscountPerDay = 0;
      if (unusedDays > 0 && markupDifference > 0) {
        unusedDaysDiscountPerDay = markupDifference / unusedDays;
      }
      
      const effectiveDiscount = unusedDaysDiscountPerDay * unusedDays;

      // Update processing fields
      draft.processing.markupDifference = markupDifference;
      draft.processing.unusedDaysDiscountPerDay = unusedDaysDiscountPerDay;
      draft.processing.bundleUpgrade = bundleUpgrade;
      draft.processing.effectiveDiscount = effectiveDiscount;
    });
  }
  
  /**
   * Generic state updater
   */
  update(updater: (draft: PricingEngineState) => void): StateBuilder {
    const newState = produce(this.state, updater);
    return new StateBuilder(newState);
  }
  
  /**
   * Create final output from current state
   */
  toOutput(): PricingEngineOutput {
    return {
      response: this.state.response,
      processing: this.state.processing,
      metadata: this.state.metadata,
    };
  }
  
  /**
   * Validate the current state
   */
  validate(): void {
    const correlationId = this.state.metadata?.correlationId;
    
    if (!this.state.request.countryISO) {
      throw new ValidationError(
        "Country ISO is required",
        "request.countryISO",
        this.state.request.countryISO,
        correlationId
      );
    }
    
    if (!this.state.request.dataType) {
      throw new ValidationError(
        "Data type is required",
        "request.dataType",
        this.state.request.dataType,
        correlationId
      );
    }
    
    if (this.state.request.duration <= 0) {
      throw new ValidationError(
        "Duration must be positive",
        "request.duration",
        this.state.request.duration,
        correlationId
      );
    }
  }
  
  /**
   * Create initial pricing breakdown for a bundle
   */
  private static createInitialPricing(bundle: Bundle): PricingBreakdown {
    return {
      cost: bundle.basePrice,
      markup: 0,
      totalCost: bundle.basePrice,
      priceAfterDiscount: bundle.basePrice,
      processingCost: 0,
      processingRate: 0,
      finalRevenue: bundle.basePrice,
      revenueAfterProcessing: bundle.basePrice,
      finalPrice: bundle.basePrice,
      totalCostBeforeProcessing: bundle.basePrice,
      netProfit: 0,
      discountPerDay: 0,
      bundle: null as any,
      country: null as any,
      currency: bundle.currency,
      duration: bundle.validityInDays,
      discountRate: 0,
      discountValue: 0,
      appliedRules: [],
      discounts: [],
    };
  }
  
  /**
   * Generate a correlation ID for tracking
   */
  private static generateCorrelationId(): string {
    return `pricing-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

/**
 * Result builder for pipeline step results
 */
export class ResultBuilder {
  private result: Partial<PipelineStepResult>;
  
  constructor(stepName: string) {
    this.result = {
      name: stepName,
      timestamp: new Date(),
      appliedRules: [],
      debug: {},
    };
  }
  
  /**
   * Set the updated state
   */
  withState(state: PricingEngineState): ResultBuilder {
    this.result.state = state;
    return this;
  }
  
  /**
   * Add applied rule IDs
   */
  withAppliedRules(ruleIds: string[]): ResultBuilder {
    this.result.appliedRules = ruleIds;
    return this;
  }
  
  /**
   * Add debug information
   */
  withDebugInfo(debugInfo: Record<string, any>): ResultBuilder {
    this.result.debug = { ...this.result.debug, ...debugInfo };
    return this;
  }
  
  /**
   * Build the final result
   */
  build(): PipelineStepResult {
    if (!this.result.state) {
      throw new Error("State is required for pipeline step result");
    }
    
    return this.result as PipelineStepResult;
  }
}