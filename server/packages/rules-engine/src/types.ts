// Core type definitions for the rules engine
// These are copied from the main GraphQL types to make the package independent

export enum RuleType {
  BusinessDiscount = 'BUSINESS_DISCOUNT',
  BusinessMinimumProfit = 'BUSINESS_MINIMUM_PROFIT',
  Promotion = 'PROMOTION',
  Segment = 'SEGMENT',
  SystemMarkup = 'SYSTEM_MARKUP',
  SystemMinimumPrice = 'SYSTEM_MINIMUM_PRICE',
  SystemProcessing = 'SYSTEM_PROCESSING'
}

export enum ConditionOperator {
  Between = 'BETWEEN',
  Equals = 'EQUALS',
  Exists = 'EXISTS',
  GreaterThan = 'GREATER_THAN',
  In = 'IN',
  LessThan = 'LESS_THAN',
  NotEquals = 'NOT_EQUALS',
  NotExists = 'NOT_EXISTS',
  NotIn = 'NOT_IN'
}

export enum ActionType {
  AddMarkup = 'ADD_MARKUP',
  ApplyDiscountPercentage = 'APPLY_DISCOUNT_PERCENTAGE',
  ApplyFixedDiscount = 'APPLY_FIXED_DISCOUNT',
  SetDiscountPerUnusedDay = 'SET_DISCOUNT_PER_UNUSED_DAY',
  SetMinimumPrice = 'SET_MINIMUM_PRICE',
  SetMinimumProfit = 'SET_MINIMUM_PROFIT',
  SetProcessingRate = 'SET_PROCESSING_RATE'
}

export enum PaymentMethod {
  Amex = 'AMEX',
  Bit = 'BIT',
  Diners = 'DINERS',
  ForeignCard = 'FOREIGN_CARD',
  IsraeliCard = 'ISRAELI_CARD'
}

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  type?: string | null;
  value: any;
}

export interface RuleAction {
  type: ActionType;
  value: number;
  metadata?: Record<string, any> | null;
}

export interface PricingRule {
  __typename?: 'PricingRule';
  id: string;
  type: RuleType;
  name: string;
  description?: string | null;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  isActive: boolean;
  isEditable: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePricingRuleInput {
  type: RuleType;
  name: string;
  description?: string | null;
  conditions: RuleConditionInput[];
  actions: RuleActionInput[];
  priority: number;
  isActive?: boolean | null;
  validFrom?: string | null;
  validUntil?: string | null;
}

export interface RuleConditionInput {
  field: string;
  operator: ConditionOperator;
  type?: string | null;
  value: any;
}

export interface RuleActionInput {
  type: ActionType;
  value: number;
  metadata?: Record<string, any> | null;
}

export interface AppliedRule {
  id: string;
  name: string;
  type: RuleType;
  impact: number;
}

export interface DiscountApplication {
  ruleName: string;
  amount: number;
  type: string;
}

export interface PricingRuleCalculation {
  baseCost: number;
  markup: number;
  subtotal: number;
  discounts: DiscountApplication[];
  totalDiscount: number;
  priceAfterDiscount: number;
  processingFee: number;
  processingRate: number;
  finalPrice: number;
  finalRevenue: number;
  revenueAfterProcessing: number;
  profit: number;
  maxRecommendedPrice: number;
  maxDiscountPercentage: number;
  appliedRules: AppliedRule[];
  selectedBundle: {
    id: string;
    name: string;
    duration: number;
    reason: 'exact_match' | 'next_available' | 'best_value';
  };
  metadata?: {
    discountPerUnusedDay?: number;
    unusedDays?: number;
    [key: string]: any;
  };
}