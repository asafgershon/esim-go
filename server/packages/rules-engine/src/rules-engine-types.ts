// Extended types specific to the rules engine
import type {
  PricingRule,
  PricingRuleCalculation as BasePricingRuleCalculation,
  Bundle,
  RuleAction,
  PaymentMethod,
  DataType,
  PricingBreakdown,
} from "./generated/types";

export * from "./generated/types";


// NEW organized context
interface UserContext {
  id: string;
  segment: string;
}

interface PaymentContext {
  method: PaymentMethod;
  promo?: string;
}

export interface PricingEngineState {
  // Context
  bundles: Bundle[];
  costumer: UserContext;
  payment: PaymentContext;
  rules: PricingRule[];

  // Request
  request: {
    duration: number;
    paymentMethod: PaymentMethod;
    promo?: string;
    countryISO?: string;
    region?: string;
    group?: string;
    dataType?: DataType;
  },

  steps: string[];

  // Response
  unusedDays: number;
  country: string;
  region: string;
  group: string;
  dataType: DataType;
  selectedBundle: Bundle;
  pricing: PricingBreakdown
}

export type PricingEngineInput = Omit<PricingEngineState, "selectedBundle" | 'pricing'>;

export type PricingEngineOutput = PricingEngineState & {
  appliedRules: PricingRule[];
  steps: string[];
}

export interface PricingEngine {
  /**
   * Calculate pricing for a given request
   */
  calculatePrice(request: PricingEngineInput): Promise<PricingEngineOutput>;
  
  /**
   * Calculate pricing for multiple items in a single call
   */
  calculateBulkPrices(requests: PricingEngineInput[]): Promise<PricingEngineOutput[]>;
}

//  ------ OLD CONTEXT ------
// Pricing context for rule evaluation
export interface PricingContext {
  // Available bundles to choose from
  availableBundles: Bundle[];
  // The duration the customer requested
  requestedDuration: number;

  // User information
  user?: {
    id: string;
    isNew?: boolean;
    isFirstPurchase?: boolean;
    purchaseCount?: number;
    segment?: string;
  };

  // Payment and timing
  paymentMethod: string;
  currentDate: Date;

  // These fields will be populated after bundle selection
  bundle?: Bundle; // Selected bundle
  country?: string; // Same as bundle.countryId
  region?: string; // Same as bundle.regionId
  bundleGroup?: string; // Same as bundle.group
  duration?: number; // Same as bundle.duration
}

// Extended pricing calculation result
export interface PricingCalculation
  extends Omit<BasePricingRuleCalculation, "selectedBundle"> {
  // Bundle selection information
  selectedBundle: {
    id: string;
    name: string;
    duration: number;
    reason: "exact_match" | "next_available" | "best_value";
  };
  // Metadata that can include additional calculation details
  metadata?: {
    discountPerUnusedDay?: number;
    unusedDays?: number;
    [key: string]: any;
  };
}

// Rule evaluation result
export interface RuleEvaluationResult {
  matches: boolean;
  appliedActions: RuleAction[];
  metadata?: Record<string, any>;
}

// Rule validation error
export interface RuleValidationError {
  field: string;
  message: string;
}

// Rule conflict information
export interface RuleConflict {
  rule1: PricingRule;
  rule2: PricingRule;
  reason: string;
}
