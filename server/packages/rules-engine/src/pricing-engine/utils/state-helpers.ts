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
    context: {
      ...input.context,
      customer: input.context.customer, // Ensure we use 'customer' not 'costumer'
    },
    request: {
      duration: input.request.duration,
      countryISO: input.request.countryISO, // Required field
      paymentMethod: input.request.paymentMethod,
      dataType: input.request.dataType, // Required field
      promo: input.request.promo,
    },
    processing: {
      steps: [],
      selectedBundle: null as any,
      previousBundle: undefined,
      region: "", // Will be derived from countryISO
      group: "", // Will be derived from bundle selection
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
      ...(input.metadata || {}),
      correlationId: input.metadata?.correlationId || generateCorrelationId(),
      timestamp: input.metadata?.timestamp || new Date(),
      version: input.metadata?.version,
    },
  } as PricingEngineState;
};

/**
 * Create output from final state
 */
export const createOutput: OutputCreator = (state) => {
  return {
    response: typedPick("response", state),
    processing: typedPick("processing", state),
    metadata: typedPick("metadata", state),
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
 * Strongly-typed dot.set wrapper
 * @param path - Dot notation path that must be valid for the given object type
 * @param value - Value to set at the path
 * @param obj - Object to set in
 */
export function typedSet<T extends object, P extends Path<T>>(
  path: P,
  value: PathValue<T, P>,
  obj: T
): void {
  dot.set(path, value, obj);
}

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
    typedSet("response.selectedBundle", selectedBundle, draft);
    typedSet("response.unusedDays", unusedDays, draft);

    // Update processing
    typedSet("processing.selectedBundle", selectedBundle, draft);
    typedSet("processing.region", selectedBundle.region || "", draft);
    typedSet("processing.group", selectedBundle.groups?.[0] || "", draft);
  });
};

/**
 * Type-safe dot notation path builder
 */
type Path<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}` | `${K}.${Path<T[K]>}`
        : `${K}`;
    }[keyof T & string]
  : never;

/**
 * Type-safe value getter for a path
 */
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never;

/**
 * Strongly-typed dot.pick wrapper
 * @param path - Dot notation path that must be valid for the given object type
 * @param obj - Object to pick from
 * @returns The value at the given path with proper typing
 */
export function typedPick<T extends object, P extends Path<T>>(
  path: P,
  obj: T
): PathValue<T, P> {
  return dot.pick(path, obj) as PathValue<T, P>;
}

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

/**
 * Calculate computed business fields for admin-friendly rules
 */
export const calculateComputedFields = (
  selectedBundle: Bundle,
  previousBundle: Bundle | undefined,
  requestedDuration: number,
  unusedDays: number,
  selectedPricing?: PricingBreakdown,
  previousPricing?: PricingBreakdown
): {
  markupDifference: number;
  unusedDaysDiscountPerDay: number;
  bundleUpgrade: boolean;
  effectiveDiscount: number;
} => {
  // Calculate markup difference
  const selectedMarkup = selectedPricing?.markup || 0;
  const previousMarkup = previousPricing?.markup || 0;
  const markupDifference = selectedMarkup - previousMarkup;
  
  // Calculate bundle upgrade status
  const bundleUpgrade = selectedBundle.validityInDays > requestedDuration;
  
  // Calculate discount per unused day
  let unusedDaysDiscountPerDay = 0;
  if (unusedDays > 0 && markupDifference > 0) {
    unusedDaysDiscountPerDay = markupDifference / unusedDays;
  }
  
  // Calculate effective discount amount
  const effectiveDiscount = unusedDaysDiscountPerDay * unusedDays;
  
  return {
    markupDifference,
    unusedDaysDiscountPerDay,
    bundleUpgrade,
    effectiveDiscount,
  };
};