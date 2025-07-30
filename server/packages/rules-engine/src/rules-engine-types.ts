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

export interface PipelineStep {
  name: string;
  timestamp: Date;
  state: Partial<PricingEngineState>;
  appliedRules?: string[]; // Rule IDs applied in this step
  debug?: any; // Optional debug information
}

export interface PricingEngineState {
  // Context

  context: {
    bundles: Bundle[]; // Bundles provided by the client
    costumer: UserContext; // Costumer provided by the client
    payment: PaymentContext; // Payment method and promo code
    rules: PricingRule[]; // Rules provided by the client
    date: Date; // Today's date (used for rule evaluation)
  };

  // Client request to calculate pricing
  request: {
    duration: number;
    paymentMethod: PaymentMethod;
    promo?: string;
    countryISO?: string;
    region?: string;
    group?: string;
    dataType?: 'unlimited' | 'fixed';
  };


  response: {
    unusedDays: number;
    selectedBundle: Bundle;
    pricing: PricingBreakdown;
    rules: PricingRule[];
  };
  
  state: {
    steps: PipelineStep[];
    country: string;
    selectedBundle: Bundle;
    previousBundle?: Bundle;
    pricing: PricingBreakdown;
    region: string;
    data: 'unlimited' | 'fixed';
    group: string;
  }

  // Metadata
  metadata: {
    correlationId: string;
    [key: string]: any;
  };
}

export type PricingEngineInput = Pick<
  PricingEngineState,
  "context" | "request" | "metadata"
>;

export type PricingEngineOutput = Pick<PricingEngineState, "response" | "state" | "metadata">;

export interface PricingEngine {
  /**
   * Calculate pricing for a given request
   */
  calculatePrice(request: PricingEngineInput): Promise<PricingEngineOutput>;

  /**
   * Calculate pricing for multiple items in a single call
   */
  calculateBulkPrices(
    requests: PricingEngineInput[]
  ): Promise<PricingEngineOutput[]>;
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
