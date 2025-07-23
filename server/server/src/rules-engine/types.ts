import type { 
  RuleType, 
  ConditionOperator, 
  ActionType,
  RuleCondition,
  RuleAction,
  PricingRule as GraphQLPricingRule,
  PricingRuleCalculation,
  PaymentMethod
} from '../types';

export { RuleType, ConditionOperator, ActionType };

export interface PricingRule extends Omit<GraphQLPricingRule, 'validFrom' | 'validUntil' | 'createdAt' | 'updatedAt'> {
  validFrom?: Date;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bundle {
  id: string;
  name: string;
  group: string;
  duration: number;
  cost: number;
  countryId: string;
  countryName: string;
  regionId: string;
  regionName: string;
  isUnlimited: boolean;
  dataAmount: string;
}

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

export interface PricingCalculation {
  baseCost: number;
  markup: number;
  subtotal: number;
  discounts: Array<{
    ruleName: string;
    amount: number;
    type: 'percentage' | 'fixed';
  }>;
  totalDiscount: number;
  priceAfterDiscount: number;
  processingFee: number;
  processingRate: number;
  finalPrice: number;
  finalRevenue: number; // What you get after payment (finalPrice - processingFee - baseCost)
  revenueAfterProcessing: number; // Bottom line (finalPrice - processingFee)
  profit: number;
  maxRecommendedPrice: number; // baseCost + $1.50
  maxDiscountPercentage: number; // Maximum discount percentage while maintaining minimum profit
  appliedRules: Array<{
    id: string;
    name: string;
    type: RuleType;
    impact: number;
  }>;
  // Bundle selection information
  selectedBundle: {
    bundleId: string;
    bundleName: string;
    duration: number;
    reason: 'exact_match' | 'next_available' | 'best_value';
  };
  // Metadata that can include additional calculation details
  metadata?: {
    discountPerUnusedDay?: number;
    unusedDays?: number;
    [key: string]: any;
  };
}

export interface RuleEvaluationResult {
  matches: boolean;
  appliedActions: RuleAction[];
  metadata?: Record<string, any>;
}

export interface RuleValidationError {
  field: string;
  message: string;
}

export interface RuleConflict {
  rule1: PricingRule;
  rule2: PricingRule;
  reason: string;
}