import { produce } from "immer";
import * as dot from "dot-object";
import type {
  PricingEngineInput,
  PricingEngineState,
  PricingEngineOutput,
  Bundle,
  PricingBreakdown,
} from "../../rules-engine-types";
import type { StateInitializer, OutputCreator } from "../types";

/**
 * Generate a correlation ID for tracking
 */
export const generateCorrelationId = (): string => {
  return `pricing-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Initialize the pricing engine state from input
 */
export const initializeState: StateInitializer = (input) => {
  return {
    context: input.context,
    request: {
      duration: input.request?.duration || 0,
      paymentMethod: input.request?.paymentMethod,
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
      data: (input.request?.dataType || "fixed") as 'unlimited' | 'fixed',
      group: input.request?.group || "",
    },
    metadata: {
      ...(input.metadata || {}),
      correlationId: input.metadata?.correlationId || generateCorrelationId(),
    },
  } as PricingEngineState;
};

/**
 * Create output from final state
 */
export const createOutput: OutputCreator = (state) => {
  return {
    response: dot.pick("response", state) as any,
    state: dot.pick("state", state) as any,
    metadata: dot.pick("metadata", state) as any,
  };
};

/**
 * Initialize pricing breakdown for a bundle
 */
export const initializePricing = (bundle: Bundle): PricingBreakdown => {
  return {
    cost: bundle.basePrice,
    markup: 0,
    totalCost: bundle.basePrice,
    priceAfterDiscount: bundle.basePrice,
    processingCost: 0,
    processingRate: 0,
    finalRevenue: bundle.basePrice,
    revenueAfterProcessing: bundle.basePrice,
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
};

/**
 * Update state with selected bundle information
 */
export const updateStateWithBundle = (
  state: PricingEngineState,
  selectedBundle: Bundle,
  unusedDays: number
): PricingEngineState => {
  return produce(state, (draft) => {
    // Update response
    dot.set("response.selectedBundle", selectedBundle, draft);
    dot.set("response.unusedDays", unusedDays, draft);

    // Update state
    dot.set("state.selectedBundle", selectedBundle, draft);
    dot.set("state.country", selectedBundle.countries?.[0] || state.state.country, draft);
    dot.set("state.region", selectedBundle.region || state.state.region, draft);
    dot.set("state.group", selectedBundle.groups?.[0] || state.state.group, draft);
    dot.set("state.data", selectedBundle.isUnlimited ? "unlimited" : "fixed", draft);
  });
};

/**
 * Get field value from state using dot notation
 */
export const getFieldValue = (field: string, state: any): any => {
  return dot.pick(field, state);
};

/**
 * Set field value in state using dot notation
 */
export const setFieldValue = (field: string, value: any, state: any): void => {
  dot.set(field, value, state);
};