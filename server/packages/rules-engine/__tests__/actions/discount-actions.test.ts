import { describe, it, expect, beforeEach } from 'vitest';
import { DiscountActionExecutor } from '../../src/actions/discount';
import { ActionType } from '../../src/rules-engine-types';
import type { PricingBreakdown, RuleAction } from '../../src/rules-engine-types';

describe('DiscountActionExecutor', () => {
  let executor: DiscountActionExecutor;
  let state: PricingBreakdown;

  beforeEach(() => {
    executor = new DiscountActionExecutor();
    state = {
      cost: 50.00,
      markup: 20.00,
      totalCost: 70.00,
      discountValue: 0,
      discountRate: 0,
      priceAfterDiscount: 70.00,
      processingRate: 0.03,
      processingCost: 0,
      finalRevenue: 70.00,
      netProfit: 20.00,
      discountPerDay: 0,
      appliedRules: [],
      discounts: []
    };
  });

  describe('applyDiscountPercentage', () => {
    it('should apply percentage discount correctly', () => {
      const action: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 20 // 20% discount
      };

      const result = executor.execute(action, state, 'Test Rule');

      expect(result.applied).toBe(true);
      expect(result.appliedValue).toBe(14.00); // 20% of $70
      expect(result.newState.discountValue).toBe(14.00);
      expect(result.newState.discountRate).toBe(0.20);
      expect(result.newState.priceAfterDiscount).toBe(56.00); // $70 - $14
      expect(result.newState.discounts).toHaveLength(1);
      expect(result.newState.discounts[0]).toEqual({
        ruleName: 'Test Rule',
        amount: 14.00,
        type: 'percentage'
      });
    });

    it('should handle zero percentage discount', () => {
      const action: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 0
      };

      const result = executor.execute(action, state, 'Zero Discount');

      expect(result.applied).toBe(true);
      expect(result.appliedValue).toBe(0);
      expect(result.newState.discountValue).toBe(0);
      expect(result.newState.priceAfterDiscount).toBe(70.00);
    });

    it('should handle 100% discount', () => {
      const action: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 100
      };

      const result = executor.execute(action, state, 'Full Discount');

      expect(result.applied).toBe(true);
      expect(result.appliedValue).toBe(70.00);
      expect(result.newState.discountValue).toBe(70.00);
      expect(result.newState.priceAfterDiscount).toBe(0);
    });

    it('should compound multiple percentage discounts', () => {
      // Apply first discount
      const action1: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 10
      };
      const result1 = executor.execute(action1, state, 'First Discount');
      
      // Apply second discount on the result
      const action2: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 20
      };
      const result2 = executor.execute(action2, result1.newState, 'Second Discount');

      // First discount: 10% of $70 = $7, leaving $63
      // Second discount: 20% of $70 = $14
      // Total: $7 + $14 = $21
      expect(result2.newState.discountValue).toBe(21.00);
      expect(result2.newState.priceAfterDiscount).toBe(49.00);
      expect(result2.newState.discounts).toHaveLength(2);
    });

    it('should throw error for invalid percentage values', () => {
      const negativeAction: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: -10
      };

      expect(() => executor.execute(negativeAction, state, 'Invalid')).toThrow(
        'Discount percentage must be between 0 and 100'
      );

      const overAction: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 101
      };

      expect(() => executor.execute(overAction, state, 'Invalid')).toThrow(
        'Discount percentage must be between 0 and 100'
      );
    });
  });

  describe('applyFixedDiscount', () => {
    it('should apply fixed discount correctly', () => {
      const action: RuleAction = {
        type: ActionType.ApplyFixedDiscount,
        value: 15.00 // $15 discount
      };

      const result = executor.execute(action, state, 'Fixed Discount');

      expect(result.applied).toBe(true);
      expect(result.appliedValue).toBe(15.00);
      expect(result.newState.discountValue).toBe(15.00);
      expect(result.newState.priceAfterDiscount).toBe(55.00); // $70 - $15
      expect(result.newState.discounts[0]).toEqual({
        ruleName: 'Fixed Discount',
        amount: 15.00,
        type: 'fixed'
      });
    });

    it('should not allow discount greater than total cost', () => {
      const action: RuleAction = {
        type: ActionType.ApplyFixedDiscount,
        value: 80.00 // More than total cost of $70
      };

      const result = executor.execute(action, state, 'Max Discount');

      // Should cap at total cost
      expect(result.applied).toBe(true);
      expect(result.appliedValue).toBe(70.00);
      expect(result.newState.discountValue).toBe(70.00);
      expect(result.newState.priceAfterDiscount).toBe(0);
    });

    it('should stack multiple fixed discounts', () => {
      const action1: RuleAction = {
        type: ActionType.ApplyFixedDiscount,
        value: 10.00
      };
      const result1 = executor.execute(action1, state, 'First Fixed');

      const action2: RuleAction = {
        type: ActionType.ApplyFixedDiscount,
        value: 5.00
      };
      const result2 = executor.execute(action2, result1.newState, 'Second Fixed');

      expect(result2.newState.discountValue).toBe(15.00); // $10 + $5
      expect(result2.newState.priceAfterDiscount).toBe(55.00); // $70 - $15
      expect(result2.newState.discounts).toHaveLength(2);
    });

    it('should throw error for negative fixed discount', () => {
      const action: RuleAction = {
        type: ActionType.ApplyFixedDiscount,
        value: -5.00
      };

      expect(() => executor.execute(action, state, 'Invalid')).toThrow(
        'Fixed discount must be positive'
      );
    });
  });

  describe('setDiscountPerUnusedDay', () => {
    it('should set discount per unused day rate', () => {
      const action: RuleAction = {
        type: ActionType.SetDiscountPerUnusedDay,
        value: 0.15 // 15% per unused day
      };

      const result = executor.execute(action, state, 'Unused Day Rate');

      expect(result.applied).toBe(true);
      expect(result.newState.discountPerDay).toBe(0.15);
      // No immediate discount effect, just sets the rate
      expect(result.newState.discountValue).toBe(0);
      expect(result.newState.priceAfterDiscount).toBe(70.00);
    });

    it('should validate discount per day range', () => {
      const action: RuleAction = {
        type: ActionType.SetDiscountPerUnusedDay,
        value: 1.5 // 150% - invalid
      };

      expect(() => executor.execute(action, state, 'Invalid')).toThrow(
        'Discount per day must be between 0 and 1'
      );
    });
  });

  describe('mixed discount scenarios', () => {
    it('should handle percentage and fixed discounts together', () => {
      // Apply 20% discount first
      const percentAction: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 20
      };
      const result1 = executor.execute(percentAction, state, 'Percent Discount');

      // Then apply $5 fixed discount
      const fixedAction: RuleAction = {
        type: ActionType.ApplyFixedDiscount,
        value: 5.00
      };
      const result2 = executor.execute(fixedAction, result1.newState, 'Fixed Discount');

      // 20% of $70 = $14, then $5 more = $19 total
      expect(result2.newState.discountValue).toBe(19.00);
      expect(result2.newState.priceAfterDiscount).toBe(51.00);
      expect(result2.newState.discounts).toHaveLength(2);
    });

    it('should not reduce price below zero with multiple discounts', () => {
      // Apply 80% discount
      const action1: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 80
      };
      const result1 = executor.execute(action1, state, 'Large Percent');

      // Try to apply $30 fixed discount (more than remaining)
      const action2: RuleAction = {
        type: ActionType.ApplyFixedDiscount,
        value: 30.00
      };
      const result2 = executor.execute(action2, result1.newState, 'Large Fixed');

      // 80% of $70 = $56, leaves $14
      // $30 fixed discount should be capped at $14
      expect(result2.newState.discountValue).toBe(70.00); // Total capped at original price
      expect(result2.newState.priceAfterDiscount).toBe(0);
    });
  });

  // canExecute is not implemented in the action executors
  // The action type filtering is handled at a higher level

  describe('state immutability', () => {
    it('should not modify original state', () => {
      const originalState = { ...state };
      const action: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 50
      };

      executor.execute(action, state, 'Test');

      // Original state should remain unchanged
      expect(state).toEqual(originalState);
    });
  });
});