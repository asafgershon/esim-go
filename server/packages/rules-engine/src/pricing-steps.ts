import type { DiscountApplication } from './types';

export enum PricingStepType {
  BUNDLE_SELECTION = 'BUNDLE_SELECTION',
  INITIALIZATION = 'INITIALIZATION',
  SYSTEM_RULE_EVALUATION = 'SYSTEM_RULE_EVALUATION',
  SYSTEM_RULE_APPLICATION = 'SYSTEM_RULE_APPLICATION',
  SUBTOTAL_CALCULATION = 'SUBTOTAL_CALCULATION',
  BUSINESS_RULE_EVALUATION = 'BUSINESS_RULE_EVALUATION',
  BUSINESS_RULE_APPLICATION = 'BUSINESS_RULE_APPLICATION',
  UNUSED_DAYS_CALCULATION = 'UNUSED_DAYS_CALCULATION',
  FINAL_CALCULATION = 'FINAL_CALCULATION',
  PROFIT_VALIDATION = 'PROFIT_VALIDATION',
  COMPLETED = 'COMPLETED'
}

export interface BasePricingStep {
  type: PricingStepType;
  timestamp: Date;
  message: string;
}

export interface BundleSelectionStep extends BasePricingStep {
  type: PricingStepType.BUNDLE_SELECTION;
  data: {
    requestedDuration: number;
    availableBundles: Array<{
      id: string;
      name: string;
      duration: number;
      cost: number;
    }>;
    selectedBundle: {
      id: string;
      name: string;
      duration: number;
      reason: 'exact_match' | 'next_available' | 'best_value';
    };
    unusedDays: number;
  };
}

export interface InitializationStep extends BasePricingStep {
  type: PricingStepType.INITIALIZATION;
  data: {
    baseCost: number;
    bundleId: string;
    duration: number;
    country: string;
  };
}

export interface RuleEvaluationStep extends BasePricingStep {
  type: PricingStepType.SYSTEM_RULE_EVALUATION | PricingStepType.BUSINESS_RULE_EVALUATION;
  data: {
    rule: any; // Using any to avoid circular dependency issues
    matched: boolean;
    reason?: string;
  };
}

export interface RuleApplicationStep extends BasePricingStep {
  type: PricingStepType.SYSTEM_RULE_APPLICATION | PricingStepType.BUSINESS_RULE_APPLICATION;
  data: {
    rule: any; // Using any to avoid circular dependency issues
    impact: number;
    newState: {
      markup?: number;
      processingRate?: number;
      discounts?: DiscountApplication[];
    };
  };
}

export interface SubtotalCalculationStep extends BasePricingStep {
  type: PricingStepType.SUBTOTAL_CALCULATION;
  data: {
    baseCost: number;
    markup: number;
    subtotal: number;
  };
}

export interface UnusedDaysCalculationStep extends BasePricingStep {
  type: PricingStepType.UNUSED_DAYS_CALCULATION;
  data: {
    unusedDays: number;
    discountPerDay: number;
    totalDiscount: number;
    calculationMethod?: string;
  };
}

export interface FinalCalculationStep extends BasePricingStep {
  type: PricingStepType.FINAL_CALCULATION;
  data: {
    totalDiscount: number;
    priceAfterDiscount: number;
    processingFee: number;
    finalPrice: number;
    profit: number;
  };
}

export interface ProfitValidationStep extends BasePricingStep {
  type: PricingStepType.PROFIT_VALIDATION;
  data: {
    profit: number;
    minimumRequired: number;
    isValid: boolean;
    warning?: string;
  };
}

export interface CompletedStep extends BasePricingStep {
  type: PricingStepType.COMPLETED;
  data: {
    finalPrice: number;
    appliedRulesCount: number;
  };
}

export type PricingStep = 
  | BundleSelectionStep
  | InitializationStep
  | RuleEvaluationStep
  | RuleApplicationStep
  | SubtotalCalculationStep
  | UnusedDaysCalculationStep
  | FinalCalculationStep
  | ProfitValidationStep
  | CompletedStep;