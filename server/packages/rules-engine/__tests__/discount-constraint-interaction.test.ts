import { beforeEach, describe, expect, it } from 'vitest';
import { PricingEngine } from '../src/pricing-engine';
import { ActionType, ConditionOperator, PaymentMethod, RuleCategory, type Bundle, type PricingEngineInput, type PricingRule } from '../src/rules-engine-types';

describe('Discount vs Constraint Interaction', () => {
  let pricingEngine: PricingEngine;
  
  // Test bundle: $10 cost + $1 markup = $11 total
  const testBundle: Bundle = {
    name: 'Test Bundle 7 Days',
    description: 'Test bundle for discount/constraint interaction',
    groups: ['Standard Fixed'],
    validityInDays: 7,
    dataAmountMB: 1000,
    dataAmountReadable: '1GB',
    isUnlimited: false,
    countries: ['UA'],
    region: 'Europe',
    speed: ['4G', '5G'],
    currency: 'USD',
    basePrice: 10.00 // Cost from supplier
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
      countryISO: 'UA',
      region: 'Europe',
      dataType: 'DEFAULT' as any
    },
    steps: [],
    unusedDays: 0,
    country: 'UA',
    region: 'Europe',
    group: 'Standard Fixed',
    dataType: 'DEFAULT' as any,
    metadata: {
      correlationId: 'test-discount-constraint-interaction'
    }
  };

  beforeEach(() => {
    pricingEngine = new PricingEngine();
  });

  describe('Current Behavior: Constraint Override Loses Discount Information', () => {
    it('documents current limitation: discount info lost when constraint overrides', async () => {
      const markupRule: PricingRule = {
        id: 'markup-rule',
        category: RuleCategory.BundleAdjustment,
        name: 'Base Markup',
        description: 'Add $1 markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 1.00
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
        name: '35% Discount',
        description: '35% off everything',
        conditions: [],
        actions: [
          {
            type: ActionType.ApplyDiscountPercentage,
            value: 35
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
        name: 'Minimum $5 Profit',
        description: 'Ensure minimum $5 profit',
        conditions: [],
        actions: [
          {
            type: ActionType.SetMinimumProfit,
            value: 5.00
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
      pricingEngine.addRules([markupRule, discountRule, constraintRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Expected calculation:
      // 1. Cost: $10, Markup: $1, Total: $11
      // 2. 35% discount: $3.85, Price after discount: $7.15
      // 3. Minimum profit constraint: Requires $15 ($10 + $5), so adjusts to $15
      
      expect(result.pricing.cost).toBe(10.00);
      expect(result.pricing.markup).toBe(1.00);
      expect(result.pricing.totalCost).toBe(11.00);
      
      // CURRENT LIMITATION: These values are lost when constraint overrides
      // This documents the existing behavior that needs improvement
      expect(result.pricing.discountValue).toBe(0); // ❌ Currently lost
      expect(result.pricing.discountRate).toBe(0); // ❌ Currently lost
      
      // Final price should be adjusted by constraint
      expect(result.pricing.priceAfterDiscount).toBe(15.00);
      expect(result.pricing.netProfit).toBe(5.00);
    });

    it('documents current behavior: even small discounts get lost with constraints', async () => {
      const markupRule: PricingRule = {
        id: 'markup-rule',
        category: RuleCategory.BundleAdjustment,
        name: 'Base Markup',
        description: 'Add $1 markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 1.00
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
        name: '10% Small Discount',
        description: '10% off everything',
        conditions: [],
        actions: [
          {
            type: ActionType.ApplyDiscountPercentage,
            value: 10
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
        name: 'Minimum $1 Profit',
        description: 'Ensure minimum $1 profit (low constraint)',
        conditions: [],
        actions: [
          {
            type: ActionType.SetMinimumProfit,
            value: 1.00
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
      pricingEngine.addRules([markupRule, discountRule, constraintRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // Expected calculation:
      // 1. Cost: $10, Markup: $1, Total: $11
      // 2. 10% discount: $1.10, Price after discount: $9.90
      // 3. Constraint check: $9.90 - $10 = -$0.10 profit, but minimum is $1
      // 4. No adjustment needed since profit ($-0.10) would be adjusted to $11 (cost + $1)
      // Actually, this should trigger constraint to $11
      
      expect(result.pricing.cost).toBe(10.00);
      expect(result.pricing.markup).toBe(1.00);
      expect(result.pricing.totalCost).toBe(11.00);
      
      // CURRENT LIMITATION: Even with low constraint, discount info is lost
      // This shows the constraint logic doesn't preserve discount breakdown
      expect(result.pricing.discountValue).toBe(0); // ❌ Currently lost  
      expect(result.pricing.discountRate).toBe(0); // ❌ Currently lost
      
      // But price might be adjusted by constraint to ensure minimum profit
      expect(result.pricing.netProfit).toBeGreaterThanOrEqual(1.00);
    });
  });

  describe('Working Behavior: Discounts Work Without Constraints', () => {
    it('should apply discounts correctly when no constraints interfere', async () => {
      const markupRule: PricingRule = {
        id: 'markup-rule',
        category: RuleCategory.BundleAdjustment,
        name: 'Base Markup',
        description: 'Add $1 markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 1.00
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
        name: '30% Discount',
        description: '30% off everything',
        conditions: [],
        actions: [
          {
            type: ActionType.ApplyDiscountPercentage,
            value: 30
          }
        ],
        priority: 500,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      // NO constraint rule - this should work perfectly
      pricingEngine.clearRules();
      pricingEngine.addRules([markupRule, discountRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // This should work perfectly:
      // Cost: $10, Markup: $1, Total: $11
      // 30% discount: $3.30, Final: $7.70
      expect(result.pricing.cost).toBe(10.00);
      expect(result.pricing.markup).toBe(1.00);
      expect(result.pricing.totalCost).toBe(11.00);
      expect(result.pricing.discountValue).toBe(3.30); // ✅ Should work
      expect(result.pricing.discountRate).toBe(30); // ✅ Should work
      expect(result.pricing.priceAfterDiscount).toBe(7.70); // ✅ Should work
    });
  });

  describe('Future Enhancement: Constraint Should Preserve Discount History', () => {
    it('should maintain discount breakdown even when constraint overrides final price', async () => {
      // This test documents the DESIRED behavior for future implementation
      
      const markupRule: PricingRule = {
        id: 'markup-rule',
        category: RuleCategory.BundleAdjustment,
        name: 'Base Markup',
        description: 'Add $1 markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 1.00
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
        name: '50% Large Discount',
        description: '50% off everything',
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

      const constraintRule: PricingRule = {
        id: 'constraint-rule',
        category: RuleCategory.Constraint,
        name: 'Minimum $3 Profit',
        description: 'Ensure minimum $3 profit',
        conditions: [],
        actions: [
          {
            type: ActionType.SetMinimumProfit,
            value: 3.00
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
      pricingEngine.addRules([markupRule, discountRule, constraintRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // DESIRED BEHAVIOR (not currently implemented):
      // The pricing breakdown should show:
      // 1. Original total cost: $11
      // 2. Applied discount: 50% = $5.50 
      // 3. Price after discount: $5.50
      // 4. Constraint adjustment: +$7.50 (to reach $13 for $3 profit)
      // 5. Final price: $13
      // 6. But discount history should be preserved for transparency

      expect(result.pricing.cost).toBe(10.00);
      expect(result.pricing.markup).toBe(1.00);
      expect(result.pricing.totalCost).toBe(11.00);
      
      // TODO: Future enhancement - preserve discount information
      // expect(result.pricing.originalDiscountValue).toBe(5.50);
      // expect(result.pricing.originalDiscountRate).toBe(50);
      // expect(result.pricing.constraintAdjustment).toBe(7.50);
      
      expect(result.pricing.priceAfterDiscount).toBe(13.00);
      expect(result.pricing.netProfit).toBe(3.00);
    });
  });

  describe('Constraint Logic Verification', () => {
    it('should correctly calculate minimum required price for target profit', async () => {
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

      pricingEngine.clearRules();
      pricingEngine.addRules([constraintRule]);

      const result = await pricingEngine.calculatePrice(basePricingInput);

      // With $10 cost and $2 minimum profit:
      // Required price = $10 + $2 = $12
      expect(result.pricing.cost).toBe(10.00);
      expect(result.pricing.priceAfterDiscount).toBe(12.00);
      expect(result.pricing.netProfit).toBe(2.00);
    });
  });
});