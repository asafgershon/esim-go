import type { ActionType, RuleAction } from '../../types';

export interface ActionResult {
  type: ActionType;
  value: number;
  appliedValue?: number;
  metadata?: Record<string, any>;
}

export interface PricingState {
  baseCost: number;
  markup: number;
  subtotal: number;
  discounts: Array<{
    ruleName: string;
    amount: number;
    type: 'percentage' | 'fixed';
  }>;
  processingRate: number;
  discountPerUnusedDay: number;
  unusedDays?: number;
}

export abstract class BaseActionExecutor {
  abstract execute(action: RuleAction, state: PricingState, ruleName: string): ActionResult;
  
  protected calculatePercentageDiscount(baseAmount: number, percentage: number): number {
    return baseAmount * (percentage / 100);
  }
  
  protected ensureMinimumPrice(price: number): number {
    // Ensure price never goes below $0.01
    return Math.max(0.01, price);
  }
}