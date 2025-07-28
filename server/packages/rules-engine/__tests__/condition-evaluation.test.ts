import { describe, it, expect, beforeEach } from 'vitest';
import { PricingEngine } from '../src/pricing-engine';
import { ConditionOperator, ActionType, RuleCategory, PaymentMethod } from '../src/generated/types';
import type { PricingRule, Bundle, PricingEngineInput } from '../src/rules-engine-types';

describe('Condition Evaluation in PricingEngine', () => {
  let pricingEngine: PricingEngine;
  
  const mockBundle: Bundle = {
    id: 'bundle-1',
    name: 'Test Bundle',
    countries: ['US'],
    duration: 10,
    validityInDays: 10,
    dataAmountReadable: '5GB',
    dataAmountMB: 5000,
    basePrice: 25.00,
    currency: 'USD',
    speed: ['4G'],
    networks: ['T-Mobile'],
    groups: ['Standard Fixed'],
    region: 'North America',
    isUnlimited: false,
    description: 'Test bundle for North America'
  };
  
  const createPricingRequest = (overrides: any = {}): PricingEngineInput => {
    return {
      bundles: overrides.bundles || [mockBundle],
      costumer: overrides.user || {},
      payment: overrides.payment || { method: 'CARD' as PaymentMethod, currency: 'USD' },
      rules: [], // Rules are loaded via addRules, not in the request
      request: {
        duration: overrides.duration || 10,
        paymentMethod: (overrides.payment?.method || 'CARD') as PaymentMethod,
        countryISO: overrides.country || 'US',
        region: overrides.region,
        group: overrides.group,
        dataType: overrides.dataType || 'LIMITED'
      },
      steps: [],
      unusedDays: 0,
      country: '',
      region: '',
      group: '',
      dataType: 'LIMITED' as any,
      metadata: overrides.metadata || {
        correlationId: 'test-default'
      }
    };
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

      // Add rule to engine
      pricingEngine.addRules([rule]);

      const result = await pricingEngine.calculatePrice(
        createPricingRequest({
          country: 'US',
          duration: 10,
          metadata: {
            correlationId: 'test-us-equals'
          }
        })
      );

      // Rule should apply
      expect(result.appliedRules.some(r => r.name === 'US Discount')).toBe(true);
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

      // Use a bundle for a different country
      const canadaBundle: Bundle = {
        ...mockBundle,
        countries: ['CA'],
        region: 'North America'
      };

      // Add rule to engine
      pricingEngine.addRules([rule]);

      const result = await pricingEngine.calculatePrice(
        createPricingRequest({
          bundles: [canadaBundle],
          country: 'CA', // Different country
          duration: 10,
          metadata: {
            correlationId: 'test-ca-not-match'
          }
        })
      );

      // Rule should not apply
      expect(result.appliedRules.some(r => r.name === 'US Discount')).toBe(false);
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

      // Add rule to engine
      pricingEngine.addRules([rule]);

      const result = await pricingEngine.calculatePrice(
        createPricingRequest({
          country: 'US',
          duration: 10,
          payment: {
            method: 'AMEX' as PaymentMethod,
            currency: 'USD'
          },
          metadata: {
            correlationId: 'test-in-operator'
          }
        })
      );

      // Rule should apply
      expect(result.appliedRules.some(r => r.name === 'Foreign Card Fee')).toBe(true);
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
          field: 'request.duration',
          operator: ConditionOperator.GreaterThan,
          value: 7
        }],
        actions: [{
          type: ActionType.ApplyDiscountPercentage,
          value: 15,
          metadata: {}
        }]
      };

      // Add rule to engine
      pricingEngine.addRules([rule]);

      const result = await pricingEngine.calculatePrice(
        createPricingRequest({
          country: 'US',
          duration: 10, // Greater than 7
          metadata: {
            correlationId: 'test-gt-duration'
          }
        })
      );

      // Rule should apply
      expect(result.appliedRules.some(r => r.name === 'Long Duration Discount')).toBe(true);
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
          field: 'request.duration',
          operator: ConditionOperator.LessThan,
          value: 7
        }],
        actions: [{
          type: ActionType.AddMarkup,
          value: 5,
          metadata: {}
        }]
      };

      // Add rule to engine
      pricingEngine.addRules([rule]);

      const result = await pricingEngine.calculatePrice(
        createPricingRequest({
          country: 'US',
          duration: 5, // Less than 7
          metadata: {
            correlationId: 'test-lt-duration'
          }
        })
      );

      // Rule should apply
      expect(result.appliedRules.some(r => r.name === 'Short Duration Markup')).toBe(true);
      expect(result.pricing.markup).toBeGreaterThan(0);
    });
  });

  describe('Bundle field conditions', () => {
    it('should evaluate bundle group condition', async () => {
      const rule: PricingRule = {
        id: 'test-rule',
        name: 'Standard Bundle Discount',
        category: RuleCategory.Discount,
        isActive: true,
        priority: 100,
        conditions: [{
          field: 'group', // Use simplified field path since group is set in state
          operator: ConditionOperator.Equals,
          value: 'Standard Fixed'
        }],
        actions: [{
          type: ActionType.ApplyDiscountPercentage,
          value: 20,
          metadata: {}
        }]
      };

      // Add rule to engine
      pricingEngine.addRules([rule]);

      const result = await pricingEngine.calculatePrice(
        createPricingRequest({
          country: 'US',
          duration: 10,
          group: 'Standard Fixed', // Set the group explicitly
          metadata: {
            correlationId: 'test-bundle-group'
          }
        })
      );

      // Rule should apply
      expect(result.appliedRules.some(r => r.name === 'Standard Bundle Discount')).toBe(true);
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
          field: 'selectedBundle.region',
          operator: ConditionOperator.Equals,
          value: 'North America'
        }],
        actions: [{
          type: ActionType.ApplyDiscountPercentage,
          value: 10,
          metadata: {}
        }]
      };

      // Add rule to engine
      pricingEngine.addRules([rule]);

      const result = await pricingEngine.calculatePrice(
        createPricingRequest({
          country: 'US',
          duration: 10,
          metadata: {
            correlationId: 'test-region'
          }
        })
      );

      // Rule should apply
      expect(result.appliedRules.some(r => r.name === 'North America Discount')).toBe(true);
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
          field: 'costumer.segment', // Field not provided in request
          operator: ConditionOperator.Equals,
          value: 'VIP'
        }],
        actions: [{
          type: ActionType.ApplyDiscountPercentage,
          value: 30,
          metadata: {}
        }]
      };

      // Add rule to engine
      pricingEngine.addRules([rule]);

      const result = await pricingEngine.calculatePrice(
        createPricingRequest({
          country: 'US',
          duration: 10,
          metadata: {
            correlationId: 'test-missing-field'
          }
          // No user field provided
        })
      );

      // Rule should not apply when field is missing
      expect(result.appliedRules.some(r => r.name === 'User Segment Discount')).toBe(false);
    });
  });
});