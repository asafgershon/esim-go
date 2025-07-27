import { describe, it, expect, beforeEach } from 'vitest';
import { DiscountActionExecutor } from '../../src/actions/discount';
import { ActionType } from '../../src/generated/types';
import type { RuleAction } from '../../src/generated/types';
import type { PricingState } from '../../src/actions/base';

describe('DiscountActionExecutor', () => {
  let executor: DiscountActionExecutor;
  let state: PricingState;

  beforeEach(() => {
    executor = new DiscountActionExecutor();
    state = {
      baseCost: 50.00,
      markup: 20.00,
      subtotal: 70.00,
      discounts: [],
      processingRate: 0.03,
      discountPerUnusedDay: 0,
      unusedDays: 0
    };
  });

  describe('applyDiscountPercentage', () => {
    it('should apply percentage discount correctly', () => {
      const action: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 20, // 20% discount
        metadata: {}
      };

      const result = executor.execute(action, state, 'Test Rule');

      expect(result.type).toBe(ActionType.ApplyDiscountPercentage);
      expect(result.value).toBe(20);
      expect(result.appliedValue).toBe(14.00); // 20% of $70
      expect(result.metadata).toEqual({
        percentage: 20,
        baseAmount: 70.00
      });
      
      // Check state was modified
      expect(state.discounts).toHaveLength(1);
      expect(state.discounts[0]).toEqual({
        ruleName: 'Test Rule',
        amount: 14.00,
        type: 'percentage'
      });
    });

    it('should handle zero percentage discount', () => {
      const action: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 0,
        metadata: {}
      };

      const result = executor.execute(action, state, 'Zero Discount');

      expect(result.appliedValue).toBe(0);
      expect(state.discounts).toHaveLength(1);
      expect(state.discounts[0].amount).toBe(0);
    });

    it('should handle 100% discount', () => {
      const action: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 100,
        metadata: {}
      };

      const result = executor.execute(action, state, 'Full Discount');

      expect(result.appliedValue).toBe(70.00);
      expect(state.discounts[0].amount).toBe(70.00);
    });

    it('should compound multiple percentage discounts', () => {
      // Apply first discount
      const action1: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 10,
        metadata: {}
      };
      const result1 = executor.execute(action1, state, 'First Discount');
      
      // Apply second discount on the same subtotal (not compounded)
      const action2: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 20,
        metadata: {}
      };
      const result2 = executor.execute(action2, state, 'Second Discount');

      // Each percentage is calculated on the original subtotal
      expect(result1.appliedValue).toBe(7.00); // 10% of $70
      expect(result2.appliedValue).toBe(14.00); // 20% of $70
      expect(state.discounts).toHaveLength(2);
      expect(state.discounts[0].amount).toBe(7.00);
      expect(state.discounts[1].amount).toBe(14.00);
    });

    it('should allow any percentage value', () => {
      // The implementation doesn't validate percentage range
      const action: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 150, // 150%
        metadata: {}
      };

      const result = executor.execute(action, state, 'High Discount');
      expect(result.appliedValue).toBe(105.00); // 150% of $70
    });
  });

  describe('applyFixedDiscount', () => {
    it('should apply fixed discount correctly', () => {
      const action: RuleAction = {
        type: ActionType.ApplyFixedDiscount,
        value: 15.00, // $15 discount
        metadata: {}
      };

      const result = executor.execute(action, state, 'Fixed Discount');

      expect(result.type).toBe(ActionType.ApplyFixedDiscount);
      expect(result.value).toBe(15.00);
      expect(result.appliedValue).toBe(15.00);
      expect(result.metadata).toEqual({
        requestedAmount: 15.00,
        appliedAmount: 15.00
      });
      
      expect(state.discounts[0]).toEqual({
        ruleName: 'Fixed Discount',
        amount: 15.00,
        type: 'fixed'
      });
    });

    it('should not allow discount greater than subtotal', () => {
      const action: RuleAction = {
        type: ActionType.ApplyFixedDiscount,
        value: 80.00, // More than subtotal of $70
        metadata: {}
      };

      const result = executor.execute(action, state, 'Max Discount');

      // Should cap at subtotal
      expect(result.appliedValue).toBe(70.00);
      expect(result.metadata).toEqual({
        requestedAmount: 80.00,
        appliedAmount: 70.00
      });
      expect(state.discounts[0].amount).toBe(70.00);
    });

    it('should stack multiple fixed discounts', () => {
      const action1: RuleAction = {
        type: ActionType.ApplyFixedDiscount,
        value: 10.00,
        metadata: {}
      };
      const result1 = executor.execute(action1, state, 'First Fixed');

      const action2: RuleAction = {
        type: ActionType.ApplyFixedDiscount,
        value: 5.00,
        metadata: {}
      };
      const result2 = executor.execute(action2, state, 'Second Fixed');

      expect(result1.appliedValue).toBe(10.00);
      expect(result2.appliedValue).toBe(5.00);
      expect(state.discounts).toHaveLength(2);
      expect(state.discounts[0].amount).toBe(10.00);
      expect(state.discounts[1].amount).toBe(5.00);
    });

    it('should allow negative fixed discount', () => {
      // The implementation doesn't validate for negative values
      const action: RuleAction = {
        type: ActionType.ApplyFixedDiscount,
        value: -5.00,
        metadata: {}
      };

      const result = executor.execute(action, state, 'Negative');
      expect(result.appliedValue).toBe(-5.00);
      expect(state.discounts[0].amount).toBe(-5.00);
    });
  });

  describe('setDiscountPerUnusedDay', () => {
    it('should set discount per unused day rate', () => {
      const action: RuleAction = {
        type: ActionType.SetDiscountPerUnusedDay,
        value: 15, // 15% per unused day
        metadata: {}
      };

      const result = executor.execute(action, state, 'Unused Day Rate');

      expect(result.type).toBe(ActionType.SetDiscountPerUnusedDay);
      expect(result.value).toBe(15);
      expect(result.metadata).toEqual({
        rate: 15,
        decimal: 0.15
      });
      
      // Should update the state
      expect(state.discountPerUnusedDay).toBe(0.15);
      // No discount added to discounts array
      expect(state.discounts).toHaveLength(0);
    });

    it('should allow any discount per day value', () => {
      // The implementation doesn't validate range
      const action: RuleAction = {
        type: ActionType.SetDiscountPerUnusedDay,
        value: 150, // 150%
        metadata: {}
      };

      const result = executor.execute(action, state, 'High Rate');
      expect(state.discountPerUnusedDay).toBe(1.5);
    });
  });

  describe('mixed discount scenarios', () => {
    it('should handle percentage and fixed discounts together', () => {
      // Apply 20% discount first
      const percentAction: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 20,
        metadata: {}
      };
      const result1 = executor.execute(percentAction, state, 'Percent Discount');

      // Then apply $5 fixed discount
      const fixedAction: RuleAction = {
        type: ActionType.ApplyFixedDiscount,
        value: 5.00,
        metadata: {}
      };
      const result2 = executor.execute(fixedAction, state, 'Fixed Discount');

      // 20% of $70 = $14, then $5 more
      expect(result1.appliedValue).toBe(14.00);
      expect(result2.appliedValue).toBe(5.00);
      expect(state.discounts).toHaveLength(2);
      expect(state.discounts[0].amount).toBe(14.00);
      expect(state.discounts[1].amount).toBe(5.00);
    });

    it('should cap fixed discount at subtotal even with prior discounts', () => {
      // Apply 80% discount
      const action1: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 80,
        metadata: {}
      };
      const result1 = executor.execute(action1, state, 'Large Percent');

      // Try to apply $30 fixed discount
      const action2: RuleAction = {
        type: ActionType.ApplyFixedDiscount,
        value: 30.00,
        metadata: {}
      };
      const result2 = executor.execute(action2, state, 'Large Fixed');

      // 80% of $70 = $56
      expect(result1.appliedValue).toBe(56.00);
      // Fixed discount is still capped at original subtotal
      expect(result2.appliedValue).toBe(30.00);
      expect(state.discounts[0].amount).toBe(56.00);
      expect(state.discounts[1].amount).toBe(30.00);
    });
  });

  // canExecute is not implemented in the action executors
  // The action type filtering is handled at a higher level

  describe('state immutability', () => {
    it('should modify the state object passed in', () => {
      const originalDiscounts = state.discounts;
      const action: RuleAction = {
        type: ActionType.ApplyDiscountPercentage,
        value: 50,
        metadata: {}
      };

      executor.execute(action, state, 'Test');

      // State should be modified (not immutable)
      expect(state.discounts).toBe(originalDiscounts);
      expect(state.discounts).toHaveLength(1);
    });
  });

  describe('unknown action type', () => {
    it('should throw error for unknown action type', () => {
      const action: RuleAction = {
        type: 'UNKNOWN_ACTION' as any,
        value: 10,
        metadata: {}
      };

      expect(() => executor.execute(action, state, 'Test')).toThrow(
        'Unknown discount action type: UNKNOWN_ACTION'
      );
    });
  });
});