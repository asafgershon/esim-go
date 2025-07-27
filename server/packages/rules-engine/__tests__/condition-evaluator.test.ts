import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '../src/conditions/evaluator';
import { ConditionOperator } from '../src/generated/types';
import type { RuleCondition } from '../src/generated/types';

describe('ConditionEvaluator', () => {
  describe('String conditions', () => {
    it('should evaluate equals condition', () => {
      const condition: RuleCondition = {
        field: 'country',
        operator: ConditionOperator.Equals,
        value: 'US'
      };

      expect(evaluateCondition(condition, { country: 'US' })).toBe(true);
      expect(evaluateCondition(condition, { country: 'CA' })).toBe(false);
      expect(evaluateCondition(condition, {})).toBe(false);
    });

    it('should evaluate not equals condition', () => {
      const condition: RuleCondition = {
        field: 'country',
        operator: ConditionOperator.NotEquals,
        value: 'US'
      };

      expect(evaluateCondition(condition, { country: 'CA' })).toBe(true);
      expect(evaluateCondition(condition, { country: 'US' })).toBe(false);
      expect(evaluateCondition(condition, {})).toBe(true);
    });

    it('should evaluate in condition', () => {
      const condition: RuleCondition = {
        field: 'paymentMethod',
        operator: ConditionOperator.In,
        value: ['FOREIGN_CARD', 'AMEX', 'DISCOVER']
      };

      expect(evaluateCondition(condition, { paymentMethod: 'AMEX' })).toBe(true);
      expect(evaluateCondition(condition, { paymentMethod: 'FOREIGN_CARD' })).toBe(true);
      expect(evaluateCondition(condition, { paymentMethod: 'VISA' })).toBe(false);
      expect(evaluateCondition(condition, {})).toBe(false);
    });

    it('should evaluate not in condition', () => {
      const condition: RuleCondition = {
        field: 'paymentMethod',
        operator: ConditionOperator.NotIn,
        value: ['FOREIGN_CARD', 'AMEX']
      };

      expect(evaluateCondition(condition, { paymentMethod: 'VISA' })).toBe(true);
      expect(evaluateCondition(condition, { paymentMethod: 'AMEX' })).toBe(false);
      expect(evaluateCondition(condition, {})).toBe(true);
    });

    it('should evaluate contains condition', () => {
      const condition: RuleCondition = {
        field: 'bundleGroup',
        operator: ConditionOperator.Contains,
        value: 'Premium'
      };

      expect(evaluateCondition(condition, { bundleGroup: 'Premium Plus' })).toBe(true);
      expect(evaluateCondition(condition, { bundleGroup: 'Standard Premium' })).toBe(true);
      expect(evaluateCondition(condition, { bundleGroup: 'Standard' })).toBe(false);
      expect(evaluateCondition(condition, {})).toBe(false);
    });
  });

  describe('Numeric conditions', () => {
    it('should evaluate greater than condition', () => {
      const condition: RuleCondition = {
        field: 'duration',
        operator: ConditionOperator.GreaterThan,
        value: 10
      };

      expect(evaluateCondition(condition, { duration: 15 })).toBe(true);
      expect(evaluateCondition(condition, { duration: 10 })).toBe(false);
      expect(evaluateCondition(condition, { duration: 5 })).toBe(false);
      expect(evaluateCondition(condition, {})).toBe(false);
    });

    it('should evaluate less than condition', () => {
      const condition: RuleCondition = {
        field: 'duration',
        operator: ConditionOperator.LessThan,
        value: 30
      };

      expect(evaluateCondition(condition, { duration: 15 })).toBe(true);
      expect(evaluateCondition(condition, { duration: 30 })).toBe(false);
      expect(evaluateCondition(condition, { duration: 45 })).toBe(false);
      expect(evaluateCondition(condition, {})).toBe(false);
    });

    it('should evaluate greater than or equal condition', () => {
      const condition: RuleCondition = {
        field: 'cost',
        operator: ConditionOperator.GreaterThanOrEqual,
        value: 50
      };

      expect(evaluateCondition(condition, { cost: 60 })).toBe(true);
      expect(evaluateCondition(condition, { cost: 50 })).toBe(true);
      expect(evaluateCondition(condition, { cost: 40 })).toBe(false);
      expect(evaluateCondition(condition, {})).toBe(false);
    });

    it('should evaluate less than or equal condition', () => {
      const condition: RuleCondition = {
        field: 'profit',
        operator: ConditionOperator.LessThanOrEqual,
        value: 1.50
      };

      expect(evaluateCondition(condition, { profit: 1.00 })).toBe(true);
      expect(evaluateCondition(condition, { profit: 1.50 })).toBe(true);
      expect(evaluateCondition(condition, { profit: 2.00 })).toBe(false);
      expect(evaluateCondition(condition, {})).toBe(false);
    });

    it('should evaluate between condition', () => {
      const condition: RuleCondition = {
        field: 'duration',
        operator: ConditionOperator.Between,
        value: [7, 30]
      };

      expect(evaluateCondition(condition, { duration: 7 })).toBe(true);
      expect(evaluateCondition(condition, { duration: 15 })).toBe(true);
      expect(evaluateCondition(condition, { duration: 30 })).toBe(true);
      expect(evaluateCondition(condition, { duration: 5 })).toBe(false);
      expect(evaluateCondition(condition, { duration: 35 })).toBe(false);
      expect(evaluateCondition(condition, {})).toBe(false);
    });
  });

  describe('Boolean conditions', () => {
    it('should evaluate boolean equals condition', () => {
      const condition: RuleCondition = {
        field: 'isUnlimited',
        operator: ConditionOperator.Equals,
        value: true
      };

      expect(evaluateCondition(condition, { isUnlimited: true })).toBe(true);
      expect(evaluateCondition(condition, { isUnlimited: false })).toBe(false);
      expect(evaluateCondition(condition, {})).toBe(false);
    });

    it('should evaluate boolean not equals condition', () => {
      const condition: RuleCondition = {
        field: 'isActive',
        operator: ConditionOperator.NotEquals,
        value: false
      };

      expect(evaluateCondition(condition, { isActive: true })).toBe(true);
      expect(evaluateCondition(condition, { isActive: false })).toBe(false);
      expect(evaluateCondition(condition, {})).toBe(true);
    });
  });

  describe('Existence conditions', () => {
    it('should evaluate exists condition', () => {
      const condition: RuleCondition = {
        field: 'promotionCode',
        operator: ConditionOperator.Exists,
        value: true
      };

      expect(evaluateCondition(condition, { promotionCode: 'SAVE10' })).toBe(true);
      expect(evaluateCondition(condition, { promotionCode: '' })).toBe(true);
      expect(evaluateCondition(condition, { promotionCode: null })).toBe(false);
      expect(evaluateCondition(condition, { promotionCode: undefined })).toBe(false);
      expect(evaluateCondition(condition, {})).toBe(false);
    });

    it('should evaluate not exists condition', () => {
      const condition: RuleCondition = {
        field: 'discountCode',
        operator: ConditionOperator.NotExists,
        value: true
      };

      expect(evaluateCondition(condition, { discountCode: null })).toBe(true);
      expect(evaluateCondition(condition, { discountCode: undefined })).toBe(true);
      expect(evaluateCondition(condition, {})).toBe(true);
      expect(evaluateCondition(condition, { discountCode: 'CODE123' })).toBe(false);
      expect(evaluateCondition(condition, { discountCode: '' })).toBe(false);
    });
  });

  describe('Nested field conditions', () => {
    it('should evaluate nested field with dot notation', () => {
      const condition: RuleCondition = {
        field: 'user.isFirstPurchase',
        operator: ConditionOperator.Equals,
        value: true
      };

      expect(evaluateCondition(condition, { user: { isFirstPurchase: true } })).toBe(true);
      expect(evaluateCondition(condition, { user: { isFirstPurchase: false } })).toBe(false);
      expect(evaluateCondition(condition, { user: {} })).toBe(false);
      expect(evaluateCondition(condition, {})).toBe(false);
    });

    it('should evaluate deeply nested fields', () => {
      const condition: RuleCondition = {
        field: 'bundle.metadata.tags',
        operator: ConditionOperator.Contains,
        value: 'promotional'
      };

      const context = {
        bundle: {
          metadata: {
            tags: ['seasonal', 'promotional', 'limited']
          }
        }
      };

      expect(evaluateCondition(condition, context)).toBe(true);
      expect(evaluateCondition(condition, { bundle: { metadata: { tags: ['regular'] } } })).toBe(false);
      expect(evaluateCondition(condition, { bundle: {} })).toBe(false);
    });

    it('should handle array contains on nested arrays', () => {
      const condition: RuleCondition = {
        field: 'customer.segments',
        operator: ConditionOperator.Contains,
        value: 'vip'
      };

      expect(evaluateCondition(condition, { 
        customer: { segments: ['regular', 'vip', 'premium'] } 
      })).toBe(true);
      
      expect(evaluateCondition(condition, { 
        customer: { segments: ['regular', 'premium'] } 
      })).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle null values', () => {
      const condition: RuleCondition = {
        field: 'discount',
        operator: ConditionOperator.Equals,
        value: null
      };

      expect(evaluateCondition(condition, { discount: null })).toBe(true);
      expect(evaluateCondition(condition, { discount: 0 })).toBe(false);
      expect(evaluateCondition(condition, {})).toBe(false);
    });

    it('should handle undefined values', () => {
      const condition: RuleCondition = {
        field: 'customField',
        operator: ConditionOperator.Equals,
        value: undefined
      };

      expect(evaluateCondition(condition, { customField: undefined })).toBe(true);
      expect(evaluateCondition(condition, {})).toBe(true); // Missing field is undefined
      expect(evaluateCondition(condition, { customField: null })).toBe(false);
    });

    it('should handle empty strings', () => {
      const condition: RuleCondition = {
        field: 'description',
        operator: ConditionOperator.Equals,
        value: ''
      };

      expect(evaluateCondition(condition, { description: '' })).toBe(true);
      expect(evaluateCondition(condition, { description: ' ' })).toBe(false);
      expect(evaluateCondition(condition, {})).toBe(false);
    });

    it('should handle zero values', () => {
      const condition: RuleCondition = {
        field: 'price',
        operator: ConditionOperator.Equals,
        value: 0
      };

      expect(evaluateCondition(condition, { price: 0 })).toBe(true);
      expect(evaluateCondition(condition, { price: 0.00 })).toBe(true);
      expect(evaluateCondition(condition, { price: null })).toBe(false);
      expect(evaluateCondition(condition, {})).toBe(false);
    });
  });

  describe('Type coercion', () => {
    it('should coerce string numbers for numeric comparisons', () => {
      const condition: RuleCondition = {
        field: 'quantity',
        operator: ConditionOperator.GreaterThan,
        value: 10
      };

      // Should handle string numbers
      expect(evaluateCondition(condition, { quantity: '15' })).toBe(true);
      expect(evaluateCondition(condition, { quantity: '5' })).toBe(false);
    });

    it('should handle numeric strings in equals comparison', () => {
      const condition: RuleCondition = {
        field: 'code',
        operator: ConditionOperator.Equals,
        value: '123'
      };

      expect(evaluateCondition(condition, { code: 123 })).toBe(true);
      expect(evaluateCondition(condition, { code: '123' })).toBe(true);
    });
  });

  describe('Invalid conditions', () => {
    it('should return false for invalid operator', () => {
      const condition: RuleCondition = {
        field: 'value',
        operator: 'INVALID' as ConditionOperator,
        value: 10
      };

      expect(evaluateCondition(condition, { value: 10 })).toBe(false);
    });

    it('should handle missing field gracefully', () => {
      const condition: RuleCondition = {
        field: '',
        operator: ConditionOperator.Equals,
        value: 'test'
      };

      expect(evaluateCondition(condition, { '': 'test' })).toBe(true);
      expect(evaluateCondition(condition, {})).toBe(false);
    });

    it('should handle invalid between values', () => {
      const condition: RuleCondition = {
        field: 'value',
        operator: ConditionOperator.Between,
        value: 'invalid' // Should be array
      };

      expect(evaluateCondition(condition, { value: 10 })).toBe(false);
    });
  });
});