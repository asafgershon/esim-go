import type { RuleAction } from '../generated/types';
import { BaseActionExecutor, type ActionResult, type PricingState } from './base';

export class DiscountActionExecutor extends BaseActionExecutor {
  execute(action: RuleAction, state: PricingState, ruleName: string): ActionResult {
    switch (action.type) {
      case 'APPLY_DISCOUNT_PERCENTAGE':
        return this.applyPercentageDiscount(action, state, ruleName);
      
      case 'APPLY_FIXED_DISCOUNT':
        return this.applyFixedDiscount(action, state, ruleName);
      
      case 'SET_DISCOUNT_PER_UNUSED_DAY':
        return this.setDiscountPerUnusedDay(action, state);
      
      default:
        throw new Error(`Unknown discount action type: ${action.type}`);
    }
  }
  
  private applyPercentageDiscount(action: RuleAction, state: PricingState, ruleName: string): ActionResult {
    const discountAmount = this.calculatePercentageDiscount(state.subtotal, action.value);
    
    state.discounts.push({
      ruleName,
      amount: discountAmount,
      type: 'percentage'
    });
    
    return {
      type: action.type,
      value: action.value,
      appliedValue: discountAmount,
      metadata: {
        percentage: action.value,
        baseAmount: state.subtotal
      }
    };
  }
  
  private applyFixedDiscount(action: RuleAction, state: PricingState, ruleName: string): ActionResult {
    // Fixed discount cannot exceed the subtotal
    const discountAmount = Math.min(action.value, state.subtotal);
    
    state.discounts.push({
      ruleName,
      amount: discountAmount,
      type: 'fixed'
    });
    
    return {
      type: action.type,
      value: action.value,
      appliedValue: discountAmount,
      metadata: {
        requestedAmount: action.value,
        appliedAmount: discountAmount
      }
    };
  }
  
  private setDiscountPerUnusedDay(action: RuleAction, state: PricingState): ActionResult {
    state.discountPerUnusedDay = action.value / 100; // Convert percentage to decimal
    
    return {
      type: action.type,
      value: action.value,
      metadata: {
        rate: action.value,
        decimal: state.discountPerUnusedDay
      }
    };
  }
}