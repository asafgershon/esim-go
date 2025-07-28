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
  bundles: Bundle[];
  costumer: UserContext;
  payment: PaymentContext;
  rules: PricingRule[];
  date: Date;

  // Request
  request: {
    duration: number;
    paymentMethod: PaymentMethod;
    promo?: string;
    countryISO?: string;
    region?: string;
    group?: string;
    dataType?: DataType;
  };

  steps: PipelineStep[];

  // Response
  unusedDays: number;
  country: string;
  region: string;
  group: string;
  dataType: DataType;
  selectedBundle: Bundle;
  pricing: PricingBreakdown;

  // Metadata
  metadata: {
    correlationId: string;
    [key: string]: any;
  };
}

export type PricingEngineInput = Omit<
  PricingEngineState,
  "selectedBundle" | "pricing"
>;

export type PricingEngineOutput = PricingEngineState & {
  appliedRules: PricingRule[];
};

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
