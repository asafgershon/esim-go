import { beforeEach, describe, expect, it } from 'vitest';
import { PricingEngine } from '../src/pricing-engine';
import { ActionType, ConditionOperator, PaymentMethod, RuleCategory, type Bundle, type PricingEngineInput, type PricingRule } from '../src/rules-engine-types';

describe('Minimum Profit Constraint', () => {
  let pricingEngine: PricingEngine;
  
  // Test bundle
  const testBundle: Bundle = {
    name: 'Test Bundle 7 Days',
    description: 'Test bundle for pricing',
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

  // Minimum profit rule
  const minimumProfitRule: PricingRule = {
    id: 'min-profit-rule',
    category: RuleCategory.Constraint,
    name: 'Minimum Profit Margin',
    description: 'Ensures minimum profit of $1.50 per bundle',
    conditions: [
      {
        field: 'bundle.id',
        operator: ConditionOperator.NotEquals,
        value: '', // Apply to all bundles
        type: 'string'
      }
    ],
    actions: [
      {
        type: ActionType.SetMinimumProfit,
        value: 1.50
      }
    ],
    priority: 900,
    isActive: true,
    isEditable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  };

  // Base pricing input
  const basePricingInput: PricingEngineInput = {
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
      correlationId: 'test-correlation-id'
    }
  };

  beforeEach(() => {
    pricingEngine = new PricingEngine();
  });

  describe('Basic Minimum Profit Enforcement', () => {
    it('should enforce minimum profit when no other rules apply', async () => {
      pricingEngine.clearRules();
      pricingEngine.addRules([minimumProfitRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Bundle cost is $10, minimum profit is $1.50
      // So price should be at least $11.50
      expect(result.pricing.priceAfterDiscount).toBe(11.50);
      expect(result.pricing.netProfit).toBe(1.50);
      expect(result.pricing.cost).toBe(10.00);
    });

    it('should not adjust price when profit already exceeds minimum', async () => {
      // Add markup rule that creates $5 profit
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
      pricingEngine.addRules([markupRule, minimumProfitRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Cost $10 + markup $5 = $15 (profit = $5, which is > $1.50)
      expect(result.pricing.priceAfterDiscount).toBe(15.00);
      expect(result.pricing.netProfit).toBe(5.00);
    });
  });

  describe('Minimum Profit with Discounts', () => {
    it('should limit discount to maintain minimum profit', async () => {
      // 50% discount rule
      const discountRule: PricingRule = {
        id: 'discount-rule',
        category: RuleCategory.Discount,
        name: 'Heavy Discount',
        description: '50% off',
        conditions: [],
        actions: [
          {
            type: ActionType.ApplyDiscountPercentage,
            value: 50 // 50% discount
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
      pricingEngine.addRules([discountRule, minimumProfitRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Base cost is $10
      // 50% discount would make it $5, but that's below cost
      // Minimum profit constraint should ensure price is at least $11.50
      expect(result.pricing.priceAfterDiscount).toBe(11.50);
      expect(result.pricing.netProfit).toBe(1.50);
      expect(result.pricing.discountValue).toBeLessThan(5.00); // Discount should be limited
    });

    it('should handle multiple discounts while maintaining profit', async () => {
      const discount1: PricingRule = {
        id: 'discount-1',
        category: RuleCategory.Discount,
        name: 'First Time Discount',
        description: '20% off',
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

      const discount2: PricingRule = {
        id: 'discount-2',
        category: RuleCategory.Discount,
        name: 'Promo Discount',
        description: '10% off',
        conditions: [],
        actions: [
          {
            type: ActionType.ApplyDiscountPercentage,
            value: 10
          }
        ],
        priority: 400,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      pricingEngine.clearRules();
      pricingEngine.addRules([discount1, discount2, minimumProfitRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Should maintain minimum profit despite multiple discounts
      expect(result.pricing.priceAfterDiscount).toBeGreaterThanOrEqual(11.50);
      expect(result.pricing.netProfit).toBeGreaterThanOrEqual(1.50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero cost bundles', async () => {
      const freeBundleInput = {
        ...basePricingInput,
        bundles: [{
          ...testBundle,
          basePrice: 0 // Free bundle from supplier
        }]
      };

      pricingEngine.clearRules();
      pricingEngine.addRules([minimumProfitRule]);

      const result = await pricingEngine.calculatePrice(freeBundleInput);

      // Even free bundles should have minimum profit
      expect(result.pricing.priceAfterDiscount).toBe(1.50);
      expect(result.pricing.netProfit).toBe(1.50);
      expect(result.pricing.cost).toBe(0);
    });

    it('should handle very high cost bundles', async () => {
      const expensiveBundleInput = {
        ...basePricingInput,
        bundles: [{
          ...testBundle,
          basePrice: 1000 // Very expensive bundle
        }]
      };

      pricingEngine.clearRules();
      pricingEngine.addRules([minimumProfitRule]);

      const result = await pricingEngine.calculatePrice(expensiveBundleInput);

      // Should add minimum profit to high cost
      expect(result.pricing.priceAfterDiscount).toBe(1001.50);
      expect(result.pricing.netProfit).toBe(1.50);
    });

    it('should handle negative markup scenarios', async () => {
      // This simulates a configuration error where markup is negative
      const negativeMarkupRule: PricingRule = {
        id: 'negative-markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Negative Markup',
        description: 'Subtract from price',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: -5.00 // Negative markup
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
      pricingEngine.addRules([negativeMarkupRule, minimumProfitRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Cost $10 - markup $5 = $5, but minimum profit should make it $11.50
      expect(result.pricing.priceAfterDiscount).toBe(11.50);
      expect(result.pricing.netProfit).toBe(1.50);
    });
  });

  describe('Minimum Profit with Processing Fees', () => {
    it('should calculate profit correctly with processing fees', async () => {
      // Add processing fee rule
      const processingFeeRule: PricingRule = {
        id: 'processing-fee',
        category: RuleCategory.Fee,
        name: 'Card Processing Fee',
        description: 'Credit card fee',
        conditions: [],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 2.9 // 2.9% fee
          }
        ],
        priority: 50,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      pricingEngine.clearRules();
      pricingEngine.addRules([minimumProfitRule, processingFeeRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Profit should be calculated before processing fees
      expect(result.pricing.netProfit).toBe(1.50);
      expect(result.pricing.priceAfterDiscount).toBe(11.50);
      
      // Processing fee is calculated but not added to finalRevenue
      const expectedProcessingFee = 11.50 * 0.029;
      expect(result.pricing.processingCost).toBeCloseTo(expectedProcessingFee, 2);
      expect(result.pricing.finalRevenue).toBe(11.50); // What customer pays
      expect(result.pricing.revenueAfterProcessing).toBeCloseTo(11.50 - expectedProcessingFee, 2); // What we receive
    });
  });

  describe('Multiple Constraint Interactions', () => {
    it('should respect both minimum profit and minimum price constraints', async () => {
      const minimumPriceRule: PricingRule = {
        id: 'min-price-rule',
        category: RuleCategory.Constraint,
        name: 'Minimum Price',
        description: 'Minimum $20 price',
        conditions: [],
        actions: [
          {
            type: ActionType.SetMinimumPrice,
            value: 20.00
          }
        ],
        priority: 950,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      pricingEngine.clearRules();
      pricingEngine.addRules([minimumProfitRule, minimumPriceRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Cost is $10, minimum profit would require $11.50
      // But minimum price is $20, so that should win
      expect(result.pricing.priceAfterDiscount).toBe(20.00);
      expect(result.pricing.netProfit).toBe(10.00); // $20 - $10 cost
    });

    it('should handle conflicting constraints gracefully', async () => {
      // Create a higher minimum profit rule
      const higherProfitRule: PricingRule = {
        id: 'higher-profit-rule',
        category: RuleCategory.Constraint,
        name: 'Premium Minimum Profit',
        description: 'Ensures minimum profit of $5.00',
        conditions: [],
        actions: [
          {
            type: ActionType.SetMinimumProfit,
            value: 5.00
          }
        ],
        priority: 950, // Higher priority than default rule
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      pricingEngine.clearRules();
      pricingEngine.addRules([minimumProfitRule, higherProfitRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Higher priority rule should win
      expect(result.pricing.priceAfterDiscount).toBe(15.00); // $10 + $5
      expect(result.pricing.netProfit).toBe(5.00);
    });
  });

  describe('Rule Priority and Order', () => {
    it('should apply constraint rules after discounts', async () => {
      const heavyDiscountRule: PricingRule = {
        id: 'heavy-discount',
        category: RuleCategory.Discount,
        name: 'Clearance Sale',
        description: '80% off',
        conditions: [],
        actions: [
          {
            type: ActionType.ApplyDiscountPercentage,
            value: 80
          }
        ],
        priority: 500,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      const markupRule: PricingRule = {
        id: 'markup',
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

      pricingEngine.clearRules();
      pricingEngine.addRules([heavyDiscountRule, markupRule, minimumProfitRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Cost: $10
      // After markup: $20
      // After 80% discount: $4 (which is below cost!)
      // Minimum profit constraint should kick in: $11.50
      expect(result.pricing.priceAfterDiscount).toBe(11.50);
      expect(result.pricing.netProfit).toBe(1.50);
    });
  });
});