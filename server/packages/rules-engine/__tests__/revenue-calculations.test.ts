import { beforeEach, describe, expect, it } from 'vitest';
import { PricingEngine } from '../src/pricing-engine';
import { ActionType, ConditionOperator, PaymentMethod, RuleCategory, type Bundle, type PricingEngineInput, type PricingRule } from '../src/rules-engine-types';

describe('Revenue Calculations: finalRevenue vs revenueAfterProcessing', () => {
  let pricingEngine: PricingEngine;
  
  // Test bundle: $10 base cost
  const testBundle: Bundle = {
    name: 'Test Bundle 7 Days',
    description: 'Test bundle for revenue calculations',
    groups: ['Standard Fixed'],
    validityInDays: 7,
    dataAmountMB: 1000,
    dataAmountReadable: '1GB',
    isUnlimited: false,
    countries: ['US'],
    region: 'North America',
    speed: ['4G'],
    currency: 'USD',
    basePrice: 10.00 // Cost from supplier
  };

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
      correlationId: 'test-revenue-calculations'
    }
  };

  beforeEach(() => {
    pricingEngine = new PricingEngine();
  });

  describe('Basic Revenue Calculation', () => {
    it('should calculate finalRevenue (before processing) and revenueAfterProcessing correctly', async () => {
      const markupRule: PricingRule = {
        id: 'markup-rule',
        category: RuleCategory.BundleAdjustment,
        name: '$3 Markup',
        description: 'Add $3 markup',
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

      const processingFeeRule: PricingRule = {
        id: 'processing-fee',
        category: RuleCategory.Fee,
        name: '2.9% Processing Fee',
        description: '2.9% processing fee',
        conditions: [],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 2.9
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
      pricingEngine.addRules([markupRule, processingFeeRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Expected calculation:
      // Cost: $10, Markup: $3, Total: $13
      // Customer pays: $13 (finalRevenue)
      // Processing fee: $13 * 2.9% = $0.377
      // Revenue after processing: $13 - $0.377 = $12.623

      expect(result.pricing.cost).toBe(10.00);
      expect(result.pricing.markup).toBe(3.00);
      expect(result.pricing.priceAfterDiscount).toBe(13.00);
      expect(result.pricing.processingRate).toBeCloseTo(0.029, 3);
      expect(result.pricing.processingCost).toBeCloseTo(0.377, 3);
      
      // finalRevenue = what customer pays (before processing fee deduction)
      expect(result.pricing.finalRevenue).toBe(13.00);
      
      // revenueAfterProcessing = finalRevenue - processingCost
      expect(result.pricing.revenueAfterProcessing).toBeCloseTo(12.623, 3);
    });
  });

  describe('Revenue with Discounts', () => {
    it('should calculate revenues correctly when discounts are applied', async () => {
      const markupRule: PricingRule = {
        id: 'markup-rule',
        category: RuleCategory.BundleAdjustment,
        name: '$5 Markup',
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

      const discountRule: PricingRule = {
        id: 'discount-rule',
        category: RuleCategory.Discount,
        name: '20% Discount',
        description: '20% off everything',
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

      const processingFeeRule: PricingRule = {
        id: 'processing-fee',
        category: RuleCategory.Fee,
        name: '3% Processing Fee',
        description: '3% processing fee',
        conditions: [],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 3.0
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
      pricingEngine.addRules([markupRule, discountRule, processingFeeRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Expected calculation:
      // Cost: $10, Markup: $5, Total: $15
      // 20% discount: $3, Price after discount: $12
      // Customer pays: $12 (finalRevenue)
      // Processing fee: $12 * 3% = $0.36
      // Revenue after processing: $12 - $0.36 = $11.64

      expect(result.pricing.cost).toBe(10.00);
      expect(result.pricing.markup).toBe(5.00);
      expect(result.pricing.totalCost).toBe(15.00);
      expect(result.pricing.discountValue).toBe(3.00);
      expect(result.pricing.priceAfterDiscount).toBe(12.00);
      expect(result.pricing.processingCost).toBeCloseTo(0.36, 2);
      
      // finalRevenue = what customer pays (after discount, before processing fee deduction)
      expect(result.pricing.finalRevenue).toBe(12.00);
      
      // revenueAfterProcessing = finalRevenue - processingCost
      expect(result.pricing.revenueAfterProcessing).toBeCloseTo(11.64, 2);
    });
  });

  describe('Revenue with Different Payment Methods', () => {
    it('should calculate revenues correctly for high processing fee payment methods', async () => {
      const markupRule: PricingRule = {
        id: 'markup-rule',
        category: RuleCategory.BundleAdjustment,
        name: '$2 Markup',
        description: 'Add $2 markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 2.00
          }
        ],
        priority: 100,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      // High processing fee for AMEX
      const amexFeeRule: PricingRule = {
        id: 'amex-fee',
        category: RuleCategory.Fee,
        name: 'AMEX Processing Fee',
        description: '5% processing fee for AMEX',
        conditions: [
          {
            field: 'payment.method',
            operator: ConditionOperator.Equals,
            value: 'AMEX',
            type: 'string'
          }
        ],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 5.0
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
      pricingEngine.addRules([markupRule, amexFeeRule]);

      // Test with AMEX payment method
      const amexInput = {
        ...basePricingInput,
        payment: { method: PaymentMethod.Amex, promo: undefined },
        request: { ...basePricingInput.request, paymentMethod: PaymentMethod.Amex }
      };

      const result = await pricingEngine.calculatePrice(amexInput);

      // Expected calculation:
      // Cost: $10, Markup: $2, Total: $12
      // Customer pays: $12 (finalRevenue)
      // AMEX processing fee: $12 * 5% = $0.60
      // Revenue after processing: $12 - $0.60 = $11.40

      expect(result.pricing.cost).toBe(10.00);
      expect(result.pricing.markup).toBe(2.00);
      expect(result.pricing.priceAfterDiscount).toBe(12.00);
      expect(result.pricing.processingRate).toBe(0.05);
      expect(result.pricing.processingCost).toBeCloseTo(0.60, 2);
      
      // finalRevenue = what customer pays
      expect(result.pricing.finalRevenue).toBe(12.00);
      
      // revenueAfterProcessing = finalRevenue - processingCost  
      expect(result.pricing.revenueAfterProcessing).toBeCloseTo(11.40, 2);
    });
  });

  describe('Edge Cases: Zero and High Processing Fees', () => {
    it('should handle zero processing fees correctly', async () => {
      const markupRule: PricingRule = {
        id: 'markup-rule',
        category: RuleCategory.BundleAdjustment,
        name: '$4 Markup',
        description: 'Add $4 markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 4.00
          }
        ],
        priority: 100,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      // Zero processing fee
      const zeroFeeRule: PricingRule = {
        id: 'zero-fee',
        category: RuleCategory.Fee,
        name: 'No Processing Fee',
        description: '0% processing fee',
        conditions: [],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 0.0
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
      pricingEngine.addRules([markupRule, zeroFeeRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Expected calculation:
      // Cost: $10, Markup: $4, Total: $14
      // Customer pays: $14 (finalRevenue)
      // Processing fee: $14 * 0% = $0
      // Revenue after processing: $14 - $0 = $14

      expect(result.pricing.cost).toBe(10.00);
      expect(result.pricing.markup).toBe(4.00);
      expect(result.pricing.priceAfterDiscount).toBe(14.00);
      expect(result.pricing.processingRate).toBe(0);
      expect(result.pricing.processingCost).toBe(0);
      
      // With zero processing fee, both revenues should be equal
      expect(result.pricing.finalRevenue).toBe(14.00);
      expect(result.pricing.revenueAfterProcessing).toBe(14.00);
    });

    it('should handle very high processing fees correctly', async () => {
      const markupRule: PricingRule = {
        id: 'markup-rule',
        category: RuleCategory.BundleAdjustment,
        name: '$6 Markup',
        description: 'Add $6 markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 6.00
          }
        ],
        priority: 100,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      // Very high processing fee (10%)
      const highFeeRule: PricingRule = {
        id: 'high-fee',
        category: RuleCategory.Fee,
        name: 'High Processing Fee',
        description: '10% processing fee',
        conditions: [],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 10.0
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
      pricingEngine.addRules([markupRule, highFeeRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Expected calculation:
      // Cost: $10, Markup: $6, Total: $16
      // Customer pays: $16 (finalRevenue)
      // Processing fee: $16 * 10% = $1.60
      // Revenue after processing: $16 - $1.60 = $14.40

      expect(result.pricing.cost).toBe(10.00);
      expect(result.pricing.markup).toBe(6.00);
      expect(result.pricing.priceAfterDiscount).toBe(16.00);
      expect(result.pricing.processingRate).toBe(0.10);
      expect(result.pricing.processingCost).toBeCloseTo(1.60, 2);
      
      // finalRevenue = what customer pays
      expect(result.pricing.finalRevenue).toBe(16.00);
      
      // revenueAfterProcessing = finalRevenue - processingCost
      expect(result.pricing.revenueAfterProcessing).toBeCloseTo(14.40, 2);
    });
  });

  describe('Revenue vs Profit Distinction', () => {
    it('should distinguish between finalRevenue, revenueAfterProcessing, and netProfit correctly', async () => {
      const markupRule: PricingRule = {
        id: 'markup-rule',
        category: RuleCategory.BundleAdjustment,
        name: '$8 Markup',
        description: 'Add $8 markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 8.00
          }
        ],
        priority: 100,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      const processingFeeRule: PricingRule = {
        id: 'processing-fee',
        category: RuleCategory.Fee,
        name: '4% Processing Fee',
        description: '4% processing fee',
        conditions: [],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 4.0
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
      pricingEngine.addRules([markupRule, processingFeeRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Expected calculation breakdown:
      // Cost: $10 (what we pay to supplier)
      // Markup: $8 
      // Total: $18
      // Customer pays: $18 (finalRevenue)
      // Processing fee: $18 * 4% = $0.72 (goes to payment processor)
      // Revenue after processing: $18 - $0.72 = $17.28 (what we actually receive)
      // Net profit: $18 - $10 = $8 (revenue minus costs, excluding processing fees)

      expect(result.pricing.cost).toBe(10.00); // Supplier cost
      expect(result.pricing.markup).toBe(8.00); // Our markup
      expect(result.pricing.priceAfterDiscount).toBe(18.00); // What customer pays
      expect(result.pricing.processingCost).toBeCloseTo(0.72, 2); // Payment processor fee
      
      // Revenue calculations
      expect(result.pricing.finalRevenue).toBe(18.00); // What customer pays
      expect(result.pricing.revenueAfterProcessing).toBeCloseTo(17.28, 2); // What we receive
      
      // Profit calculation (should exclude processing fees from profit)
      expect(result.pricing.netProfit).toBe(8.00); // Revenue - supplier cost (not including processing)
    });
  });

  describe('Revenue Calculation with Complex Rule Interactions', () => {
    it('should calculate revenues correctly with markup + discount + constraint + processing fee', async () => {
      const markupRule: PricingRule = {
        id: 'markup-rule',
        category: RuleCategory.BundleAdjustment,
        name: '$3 Markup',
        description: 'Add $3 markup',
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

      const discountRule: PricingRule = {
        id: 'discount-rule',
        category: RuleCategory.Discount,
        name: '25% Discount',
        description: '25% off everything',
        conditions: [],
        actions: [
          {
            type: ActionType.ApplyDiscountPercentage,
            value: 25
          }
        ],
        priority: 500,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      const constraintRule: PricingRule = {
        id: 'constraint-rule',
        category: RuleCategory.Constraint,
        name: 'Minimum $2 Profit',
        description: 'Ensure minimum $2 profit',
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

      const processingFeeRule: PricingRule = {
        id: 'processing-fee',
        category: RuleCategory.Fee,
        name: '3.5% Processing Fee',
        description: '3.5% processing fee',
        conditions: [],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 3.5
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
      pricingEngine.addRules([markupRule, discountRule, constraintRule, processingFeeRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Expected calculation flow:
      // 1. Cost: $10, Markup: $3, Total: $13
      // 2. 25% discount: $3.25, Price after discount: $9.75
      // 3. Constraint check: $9.75 - $10 = -$0.25 profit (below $2 minimum)
      // 4. Constraint adjustment: Price adjusted to $12 (to ensure $2 profit)
      // 5. Customer pays: $12 (finalRevenue)
      // 6. Processing fee: $12 * 3.5% = $0.42
      // 7. Revenue after processing: $12 - $0.42 = $11.58

      expect(result.pricing.cost).toBe(10.00);
      expect(result.pricing.markup).toBe(3.00);
      expect(result.pricing.priceAfterDiscount).toBe(12.00); // Adjusted by constraint
      expect(result.pricing.netProfit).toBe(2.00); // Enforced by constraint
      expect(result.pricing.processingCost).toBeCloseTo(0.42, 2);
      
      // Revenue calculations
      expect(result.pricing.finalRevenue).toBe(12.00); // What customer pays
      expect(result.pricing.revenueAfterProcessing).toBeCloseTo(11.58, 2); // What we receive
    });
  });
});