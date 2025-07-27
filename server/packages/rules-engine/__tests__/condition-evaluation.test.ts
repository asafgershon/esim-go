import { describe, it, expect, beforeEach } from 'vitest';
import { PricingEngine } from '../src/pricing-engine';
import { ConditionOperator, ActionType, RuleCategory } from '../src/generated/types';
import type { PricingRule, Bundle } from '../src/generated/types';

describe('Condition Evaluation in PricingEngine', () => {
  let pricingEngine: PricingEngine;
  
  const mockBundle: Bundle = {
    id: 'bundle-1',
    name: 'Test Bundle',
    countries: ['US'],
    duration: '10',
    validityInDays: 10,
    data: '5GB',
    price: 25.00,
    currency: 'USD',
    speed: 'Standard',
    networks: ['T-Mobile'],
    bundleGroup: 'Standard',
    region: 'North America',
    isUnlimited: false
  };

  beforeEach(() => {
    pricingEngine = new PricingEngine();
  });

  describe('String conditions', () => {
    it('should evaluate equals condition for country', async () => {
      const rule: PricingRule = {
        id: 'test-rule',
        name: 'US Discount',
        category: RuleCategory.Discount,
        isActive: true,
        priority: 100,
        conditions: [{
          field: 'country',
          operator: ConditionOperator.Equals,
          value: 'US'
        }],
        actions: [{
          type: ActionType.ApplyDiscountPercentage,
          value: 10,
          metadata: {}
        }]
      };

      const result = await pricingEngine.calculatePrice({
        bundle: mockBundle,
        country: 'US',
        duration: 10,
        rules: [rule],
        metadata: {
          correlationId: 'test-condition-eval'
        }
      });

      // Rule should apply
      expect(result.appliedRules).toContain('US Discount');
      expect(result.pricing.discountValue).toBeGreaterThan(0);
    });

    it('should not apply rule when country does not match', async () => {
      const rule: PricingRule = {
        id: 'test-rule',
        name: 'US Discount',
        category: RuleCategory.Discount,
        isActive: true,
        priority: 100,
        conditions: [{
          field: 'country',
          operator: ConditionOperator.Equals,
          value: 'US'
        }],
        actions: [{
          type: ActionType.ApplyDiscountPercentage,
          value: 10,
          metadata: {}
        }]
      };

      const result = await pricingEngine.calculatePrice({
        bundle: mockBundle,
        country: 'CA', // Different country
        duration: 10,
        rules: [rule],
        metadata: {
          correlationId: 'test-condition-eval'
        }
      });

      // Rule should not apply
      expect(result.appliedRules).not.toContain('US Discount');
      expect(result.pricing.discountValue).toBe(0);
    });

    it('should evaluate IN operator for payment method', async () => {
      const rule: PricingRule = {
        id: 'test-rule',
        name: 'Foreign Card Fee',
        category: RuleCategory.Fee,
        isActive: true,
        priority: 100,
        conditions: [{
          field: 'payment.method',
          operator: ConditionOperator.In,
          value: ['FOREIGN_CARD', 'AMEX']
        }],
        actions: [{
          type: ActionType.SetProcessingRate,
          value: 5,
          metadata: {}
        }]
      };

      const result = await pricingEngine.calculatePrice({
        bundle: mockBundle,
        country: 'US',
        duration: 10,
        payment: {
          method: 'AMEX',
          currency: 'USD'
        },
        rules: [rule],
        metadata: {
          correlationId: 'test-condition-eval'
        }
      });

      // Rule should apply
      expect(result.appliedRules).toContain('Foreign Card Fee');
      expect(result.pricing.processingRate).toBe(0.05);
    });
  });

  describe('Numeric conditions', () => {
    it('should evaluate greater than condition for duration', async () => {
      const rule: PricingRule = {
        id: 'test-rule',
        name: 'Long Duration Discount',
        category: RuleCategory.Discount,
        isActive: true,
        priority: 100,
        conditions: [{
          field: 'duration',
          operator: ConditionOperator.GreaterThan,
          value: 7
        }],
        actions: [{
          type: ActionType.ApplyDiscountPercentage,
          value: 15,
          metadata: {}
        }]
      };

      const result = await pricingEngine.calculatePrice({
        bundle: mockBundle,
        country: 'US',
        duration: 10, // Greater than 7
        rules: [rule],
        metadata: {
          correlationId: 'test-condition-eval'
        }
      });

      // Rule should apply
      expect(result.appliedRules).toContain('Long Duration Discount');
      expect(result.pricing.discountValue).toBeGreaterThan(0);
    });

    it('should evaluate less than condition', async () => {
      const rule: PricingRule = {
        id: 'test-rule',
        name: 'Short Duration Markup',
        category: RuleCategory.BundleAdjustment,
        isActive: true,
        priority: 100,
        conditions: [{
          field: 'duration',
          operator: ConditionOperator.LessThan,
          value: 7
        }],
        actions: [{
          type: ActionType.AddMarkup,
          value: 5,
          metadata: {}
        }]
      };

      const result = await pricingEngine.calculatePrice({
        bundle: mockBundle,
        country: 'US',
        duration: 5, // Less than 7
        rules: [rule],
        metadata: {
          correlationId: 'test-condition-eval'
        }
      });

      // Rule should apply
      expect(result.appliedRules).toContain('Short Duration Markup');
      expect(result.pricing.markup).toBeGreaterThan(0);
    });
  });

  describe('Bundle field conditions', () => {
    it('should evaluate bundle group condition', async () => {
      const rule: PricingRule = {
        id: 'test-rule',
        name: 'Premium Bundle Discount',
        category: RuleCategory.Discount,
        isActive: true,
        priority: 100,
        conditions: [{
          field: 'bundle.bundleGroup',
          operator: ConditionOperator.Equals,
          value: 'Standard'
        }],
        actions: [{
          type: ActionType.ApplyDiscountPercentage,
          value: 20,
          metadata: {}
        }]
      };

      const result = await pricingEngine.calculatePrice({
        bundle: mockBundle,
        country: 'US',
        duration: 10,
        rules: [rule],
        metadata: {
          correlationId: 'test-condition-eval'
        }
      });

      // Rule should apply
      expect(result.appliedRules).toContain('Premium Bundle Discount');
      expect(result.pricing.discountValue).toBeGreaterThan(0);
    });

    it('should evaluate bundle region condition', async () => {
      const rule: PricingRule = {
        id: 'test-rule',
        name: 'North America Discount',
        category: RuleCategory.Discount,
        isActive: true,
        priority: 100,
        conditions: [{
          field: 'bundle.region',
          operator: ConditionOperator.Equals,
          value: 'North America'
        }],
        actions: [{
          type: ActionType.ApplyDiscountPercentage,
          value: 10,
          metadata: {}
        }]
      };

      const result = await pricingEngine.calculatePrice({
        bundle: mockBundle,
        country: 'US',
        duration: 10,
        rules: [rule],
        metadata: {
          correlationId: 'test-condition-eval'
        }
      });

      // Rule should apply
      expect(result.appliedRules).toContain('North America Discount');
    });
  });

  describe('Multiple conditions (AND logic)', () => {
    it('should apply rule only when all conditions match', async () => {
      const rule: PricingRule = {
        id: 'test-rule',
        name: 'US Long Duration Discount',
        category: RuleCategory.Discount,
        isActive: true,
        priority: 100,
        conditions: [
          {
            field: 'country',
            operator: ConditionOperator.Equals,
            value: 'US'
          },
          {
            field: 'duration',
            operator: ConditionOperator.GreaterThan,
            value: 7
          }
        ],
        actions: [{
          type: ActionType.ApplyDiscountPercentage,
          value: 25,
          metadata: {}
        }]
      };

      // Should apply when both conditions match
      const result1 = await pricingEngine.calculatePrice({
        bundle: mockBundle,
        country: 'US',
        duration: 10,
        rules: [rule],
        metadata: {
          correlationId: 'test-condition-eval'
        }
      });

      expect(result1.appliedRules).toContain('US Long Duration Discount');

      // Should not apply when only one condition matches
      const result2 = await pricingEngine.calculatePrice({
        bundle: mockBundle,
        country: 'CA', // Different country
        duration: 10,
        rules: [rule],
        metadata: {
          correlationId: 'test-condition-eval'
        }
      });

      expect(result2.appliedRules).not.toContain('US Long Duration Discount');

      // Should not apply when neither condition matches
      const result3 = await pricingEngine.calculatePrice({
        bundle: mockBundle,
        country: 'CA',
        duration: 5,
        rules: [rule],
        metadata: {
          correlationId: 'test-condition-eval'
        }
      });

      expect(result3.appliedRules).not.toContain('US Long Duration Discount');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing field gracefully', async () => {
      const rule: PricingRule = {
        id: 'test-rule',
        name: 'User Segment Discount',
        category: RuleCategory.Discount,
        isActive: true,
        priority: 100,
        conditions: [{
          field: 'user.segment', // Field not provided in request
          operator: ConditionOperator.Equals,
          value: 'VIP'
        }],
        actions: [{
          type: ActionType.ApplyDiscountPercentage,
          value: 30,
          metadata: {}
        }]
      };

      const result = await pricingEngine.calculatePrice({
        bundle: mockBundle,
        country: 'US',
        duration: 10,
        rules: [rule],
        metadata: {
          correlationId: 'test-condition-eval'
        }
        // No user field provided
      });

      // Rule should not apply when field is missing
      expect(result.appliedRules).not.toContain('User Segment Discount');
    });

    it('should handle numeric comparison with string values', async () => {
      const rule: PricingRule = {
        id: 'test-rule',
        name: 'Duration Discount',
        category: RuleCategory.Discount,
        isActive: true,
        priority: 100,
        conditions: [{
          field: 'duration',
          operator: ConditionOperator.GreaterThan,
          value: '7' // String value
        }],
        actions: [{
          type: ActionType.ApplyDiscountPercentage,
          value: 15,
          metadata: {}
        }]
      };

      const result = await pricingEngine.calculatePrice({
        bundle: mockBundle,
        country: 'US',
        duration: 10,
        rules: [rule],
        metadata: {
          correlationId: 'test-condition-eval'
        }
      });

      // Should handle string to number conversion
      expect(result.appliedRules).toContain('Duration Discount');
    });
  });

  describe('Rule priority and ordering', () => {
    it('should apply rules in priority order', async () => {
      const highPriorityRule: PricingRule = {
        id: 'high-priority',
        name: 'High Priority Discount',
        category: RuleCategory.Discount,
        isActive: true,
        priority: 200,
        conditions: [{
          field: 'country',
          operator: ConditionOperator.Equals,
          value: 'US'
        }],
        actions: [{
          type: ActionType.ApplyDiscountPercentage,
          value: 20,
          metadata: {}
        }]
      };

      const lowPriorityRule: PricingRule = {
        id: 'low-priority',
        name: 'Low Priority Discount',
        category: RuleCategory.Discount,
        isActive: true,
        priority: 50,
        conditions: [{
          field: 'country',
          operator: ConditionOperator.Equals,
          value: 'US'
        }],
        actions: [{
          type: ActionType.ApplyDiscountPercentage,
          value: 10,
          metadata: {}
        }]
      };

      const result = await pricingEngine.calculatePrice({
        bundle: mockBundle,
        country: 'US',
        duration: 10,
        rules: [lowPriorityRule, highPriorityRule], // Order shouldn't matter
        metadata: {
          correlationId: 'test-priority-order'
        }
      });

      // Both rules should apply, but in priority order
      const appliedRules = result.appliedRules;
      const highPriorityIndex = appliedRules.indexOf('High Priority Discount');
      const lowPriorityIndex = appliedRules.indexOf('Low Priority Discount');
      
      expect(highPriorityIndex).toBeLessThan(lowPriorityIndex);
    });
  });

  describe('Complex nested conditions', () => {
    it('should evaluate deeply nested fields', async () => {
      const rule: PricingRule = {
        id: 'test-rule',
        name: 'VIP User Discount',
        category: RuleCategory.Discount,
        isActive: true,
        priority: 100,
        conditions: [{
          field: 'user.profile.tier',
          operator: ConditionOperator.Equals,
          value: 'VIP'
        }],
        actions: [{
          type: ActionType.ApplyDiscountPercentage,
          value: 50,
          metadata: {}
        }]
      };

      const result = await pricingEngine.calculatePrice({
        bundle: mockBundle,
        country: 'US',
        duration: 10,
        user: {
          profile: {
            tier: 'VIP'
          }
        },
        rules: [rule],
        metadata: {
          correlationId: 'test-condition-eval'
        }
      });

      // Rule should apply
      expect(result.appliedRules).toContain('VIP User Discount');
    });
  });
});