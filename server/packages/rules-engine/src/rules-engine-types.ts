// Extended types specific to the rules engine
import type {
  PricingRule as BasePricingRule,
  PricingRuleCalculation as BasePricingRuleCalculation,
  Bundle,
  RuleAction,
} from "./generated/types";

export * from "./generated/types";

// Extended PricingRule interface with Date objects instead of strings
export interface PricingRule
  extends Omit<
    BasePricingRule,
    "validFrom" | "validUntil" | "createdAt" | "updatedAt"
  > {
  validFrom?: Date;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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
