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
  // Context - External dependencies and configuration
  context: {
    bundles: Bundle[];
    customer: UserContext;  // Note: fix typo from 'costumer'
    payment: PaymentContext;
    rules: PricingRule[];
    date: Date;
  };

  // Request - What the client is asking for
  request: {
    duration: number;
    countryISO: string;  // Make required
    paymentMethod: PaymentMethod;
    dataType: 'unlimited' | 'fixed';  // Make required
    promo?: string;
  };

  // Processing - Derived/computed values during pipeline execution
  processing: {
    steps: PipelineStep[];
    selectedBundle: Bundle;
    previousBundle?: Bundle;
    region: string;  // Derived from countryISO
    group: string;   // Derived from bundle selection
  };

  // Response - Final output to the client
  response: {
    unusedDays: number;
    selectedBundle: Bundle;
    pricing: PricingBreakdown;
    appliedRules: PricingRule[];
  };

  // Metadata - Tracking and debugging
  metadata: {
    correlationId: string;
    timestamp: Date;
    version?: string;
    [key: string]: any;
  };
}

export type PricingEngineInput = Pick<
  PricingEngineState,
  "context" | "request" | "metadata"
>;

export type PricingEngineOutput = Pick<PricingEngineState, "response" | "processing" | "metadata">;

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
