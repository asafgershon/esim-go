import type { PricingRule, AppliedRule, DiscountApplication } from '../types';

export enum PricingStepType {
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
    rule: PricingRule;
    matched: boolean;
    reason?: string;
  };
}

export interface RuleApplicationStep extends BasePricingStep {
  type: PricingStepType.SYSTEM_RULE_APPLICATION | PricingStepType.BUSINESS_RULE_APPLICATION;
  data: {
    rule: PricingRule;
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
  | InitializationStep
  | RuleEvaluationStep
  | RuleApplicationStep
  | SubtotalCalculationStep
  | UnusedDaysCalculationStep
  | FinalCalculationStep
  | ProfitValidationStep
  | CompletedStep;