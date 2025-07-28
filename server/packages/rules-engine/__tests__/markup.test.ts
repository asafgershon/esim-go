import { beforeEach, describe, expect, it } from 'vitest';
import { PricingEngine } from '../src/pricing-engine';
import { ActionType, PaymentMethod, RuleCategory, type Bundle, type PricingEngineInput, type PricingRule } from '../src/rules-engine-types';
import { convertToNewInputStructure } from './test-helpers';

describe('Markup Functionality', () => {
  let pricingEngine: PricingEngine;
  
  // Test bundle
  const testBundle: Bundle = {
    name: 'Test Bundle',
    description: 'Test bundle for markup',
    groups: ['Standard Fixed'],
    validityInDays: 7,
    dataAmountMB: 1000,
    dataAmountReadable: '1GB',
    isUnlimited: false,
    countries: ['US'],
    region: 'North America',
    speed: ['4G', '5G'],
    currency: 'USD',
    basePrice: 10.00 // Cost from supplier
  };

  // Base pricing input
  const basePricingInput: PricingEngineInput = convertToNewInputStructure({
    bundles: [testBundle],
    costumer: {
      id: 'test-customer',
      segment: 'default'
    },
    payment: {
      method: PaymentMethod.IsraeliCard,
      promo: undefined
    },
    rules: [],
    request: {
      duration: 7,
      paymentMethod: PaymentMethod.IsraeliCard,
      countryISO: 'US',
      region: 'North America',
      dataType: 'DEFAULT' as any
    },
    steps: [],
    unusedDays: 0,
    country: 'US',
    region: 'North America',
    group: 'Standard Fixed',
    dataType: 'DEFAULT' as any,
    metadata: {
      correlationId: 'test-markup'
    }
  });

  beforeEach(() => {
    pricingEngine = new PricingEngine();
  });

  describe('Basic Markup Application', () => {
    it('should apply a simple fixed markup', async () => {
      const markupRule: PricingRule = {
        id: 'markup-rule',
        category: RuleCategory.BundleAdjustment,
        name: 'Standard Markup',
        description: 'Add $5 markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 5.00
          }
        ],
        priority: 100,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      pricingEngine.clearRules();
      pricingEngine.addRules([markupRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Verify markup is correctly applied
      expect(result.response.pricing.cost).toBe(10.00); // Base cost unchanged
      expect(result.response.pricing.markup).toBe(5.00); // Markup added
      expect(result.response.pricing.totalCost).toBe(15.00); // cost + markup
      expect(result.response.pricing.priceAfterDiscount).toBe(15.00); // No discount, so equals totalCost
      expect(result.response.pricing.netProfit).toBe(5.00); // Profit = price - cost
    });

    it('should handle multiple markup rules', async () => {
      const markup1: PricingRule = {
        id: 'markup-1',
        category: RuleCategory.BundleAdjustment,
        name: 'Base Markup',
        description: 'Add $3 base markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 3.00
          }
        ],
        priority: 100,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      const markup2: PricingRule = {
        id: 'markup-2',
        category: RuleCategory.BundleAdjustment,
        name: 'Premium Markup',
        description: 'Add $2 premium markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 2.00
          }
        ],
        priority: 90,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      pricingEngine.clearRules();
      pricingEngine.addRules([markup1, markup2]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Markups should be cumulative
      expect(result.response.pricing.markup).toBe(5.00); // 3 + 2
      expect(result.response.pricing.totalCost).toBe(15.00); // 10 + 5
    });

    it('should start with zero markup when no rules apply', async () => {
      pricingEngine.clearRules();

      const result = await pricingEngine.calculatePrice(basePricingInput);

      expect(result.response.pricing.cost).toBe(10.00);
      expect(result.response.pricing.markup).toBe(0); // No markup
      expect(result.response.pricing.totalCost).toBe(10.00); // Same as cost
      expect(result.response.pricing.netProfit).toBe(0); // No profit without markup
    });
  });

  describe('Markup with Discounts', () => {
    it('should calculate discount from total cost after markup', async () => {
      const markupRule: PricingRule = {
        id: 'markup-rule',
        category: RuleCategory.BundleAdjustment,
        name: 'Standard Markup',
        description: 'Add $10 markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 10.00
          }
        ],
        priority: 100,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      const discountRule: PricingRule = {
        id: 'discount-rule',
        category: RuleCategory.Discount,
        name: '20% Discount',
        description: '20% off total',
        conditions: [],
        actions: [
          {
            type: ActionType.ApplyDiscountPercentage,
            value: 20
          }
        ],
        priority: 500,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      pricingEngine.clearRules();
      pricingEngine.addRules([markupRule, discountRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Cost: $10, Markup: $10, Total: $20
      // 20% discount on $20 = $4 discount
      expect(result.response.pricing.cost).toBe(10.00);
      expect(result.response.pricing.markup).toBe(10.00);
      expect(result.response.pricing.totalCost).toBe(20.00);
      expect(result.response.pricing.discountValue).toBe(4.00); // 20% of $20
      expect(result.response.pricing.priceAfterDiscount).toBe(16.00); // $20 - $4
      expect(result.response.pricing.netProfit).toBe(6.00); // $16 - $10 cost
    });

    it('should maintain positive profit with markup even after heavy discounts', async () => {
      const markupRule: PricingRule = {
        id: 'markup-rule',
        category: RuleCategory.BundleAdjustment,
        name: 'High Markup',
        description: 'Add $20 markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 20.00
          }
        ],
        priority: 100,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      const discountRule: PricingRule = {
        id: 'discount-rule',
        category: RuleCategory.Discount,
        name: '50% Discount',
        description: '50% off total',
        conditions: [],
        actions: [
          {
            type: ActionType.ApplyDiscountPercentage,
            value: 50
          }
        ],
        priority: 500,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      pricingEngine.clearRules();
      pricingEngine.addRules([markupRule, discountRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Cost: $10, Markup: $20, Total: $30
      // 50% discount on $30 = $15 discount
      expect(result.response.pricing.totalCost).toBe(30.00);
      expect(result.response.pricing.discountValue).toBe(15.00);
      expect(result.response.pricing.priceAfterDiscount).toBe(15.00);
      expect(result.response.pricing.netProfit).toBe(5.00); // Still profitable
    });
  });

  describe('Markup with Constraints', () => {
    it('should respect minimum profit constraint regardless of markup', async () => {
      const smallMarkupRule: PricingRule = {
        id: 'small-markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Small Markup',
        description: 'Add $0.50 markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 0.50
          }
        ],
        priority: 100,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      const minProfitRule: PricingRule = {
        id: 'min-profit',
        category: RuleCategory.Constraint,
        name: 'Minimum Profit',
        description: 'Ensure $2 minimum profit',
        conditions: [],
        actions: [
          {
            type: ActionType.SetMinimumProfit,
            value: 2.00
          }
        ],
        priority: 900,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      pricingEngine.clearRules();
      pricingEngine.addRules([smallMarkupRule, minProfitRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Markup only adds $0.50, but min profit requires $2
      expect(result.response.pricing.markup).toBe(0.50); // Original markup preserved
      expect(result.response.pricing.totalCost).toBe(10.50);
      expect(result.response.pricing.priceAfterDiscount).toBe(12.00); // Adjusted for min profit
      expect(result.response.pricing.netProfit).toBe(2.00); // Minimum profit enforced
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero markup', async () => {
      const zeroMarkupRule: PricingRule = {
        id: 'zero-markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Zero Markup',
        description: 'No markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 0
          }
        ],
        priority: 100,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      pricingEngine.clearRules();
      pricingEngine.addRules([zeroMarkupRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      expect(result.response.pricing.markup).toBe(0);
      expect(result.response.pricing.totalCost).toBe(10.00);
      expect(result.response.pricing.netProfit).toBe(0);
    });

    it('should handle very large markups', async () => {
      const largeMarkupRule: PricingRule = {
        id: 'large-markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Large Markup',
        description: 'Add $1000 markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 1000.00
          }
        ],
        priority: 100,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      pricingEngine.clearRules();
      pricingEngine.addRules([largeMarkupRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      expect(result.response.pricing.markup).toBe(1000.00);
      expect(result.response.pricing.totalCost).toBe(1010.00);
      expect(result.response.pricing.priceAfterDiscount).toBe(1010.00);
      expect(result.response.pricing.netProfit).toBe(1000.00);
    });

    it('should calculate correct percentages with markup', async () => {
      const markupRule: PricingRule = {
        id: 'markup-rule',
        category: RuleCategory.BundleAdjustment,
        name: 'Standard Markup',
        description: 'Add $5 markup (50% on $10 cost)',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 5.00
          }
        ],
        priority: 100,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      pricingEngine.clearRules();
      pricingEngine.addRules([markupRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      const markupPercentage = (result.response.pricing.markup / result.response.pricing.cost) * 100;
      expect(markupPercentage).toBe(50); // 50% markup on cost
      
      const profitMargin = (result.response.pricing.netProfit / result.response.pricing.totalCost) * 100;
      expect(profitMargin).toBeCloseTo(33.33, 2); // 33.33% profit margin
    });
  });
});