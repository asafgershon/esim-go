import { beforeEach, describe, expect, it } from 'vitest';
import { PricingEngine } from '../src/pricing-engine';
import { ActionType, ConditionOperator, PaymentMethod, RuleCategory, type Bundle, type PricingEngineInput, type PricingRule } from '../src/rules-engine-types';

describe('Country-Wide Discount with Bundle-Specific Markup', () => {
  let pricingEngine: PricingEngine;
  
  // Test bundles for Ukraine
  const ukraineBundles: Bundle[] = [
    {
      name: 'Ukraine 1GB 7D',
      description: '1GB for 7 days in Ukraine',
      groups: ['Standard Fixed'],
      validityInDays: 7,
      dataAmountMB: 1000,
      dataAmountReadable: '1GB',
      isUnlimited: false,
      countries: ['UA'],
      region: 'Europe',
      speed: ['4G'],
      currency: 'USD',
      basePrice: 5.00
    },
    {
      name: 'Ukraine Premium 5GB 7D',
      description: 'Premium 5GB for 7 days in Ukraine',
      groups: ['Premium'],
      validityInDays: 7,
      dataAmountMB: 5000,
      dataAmountReadable: '5GB',
      isUnlimited: false,
      countries: ['UA'],
      region: 'Europe',
      speed: ['4G', '5G'],
      currency: 'USD',
      basePrice: 15.00
    },
    {
      name: 'Ukraine Unlimited 7D',
      description: 'Unlimited data for 7 days in Ukraine',
      groups: ['Standard Unlimited'],
      validityInDays: 7,
      dataAmountMB: null,
      dataAmountReadable: 'Unlimited',
      isUnlimited: true,
      countries: ['UA'],
      region: 'Europe',
      speed: ['4G', '5G'],
      currency: 'USD',
      basePrice: 20.00
    }
  ];

  const createPricingInput = (bundle: Bundle): PricingEngineInput => ({
    bundles: [bundle],
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
    group: bundle.groups[0],
    dataType: 'DEFAULT' as any,
    metadata: {
      correlationId: `test-${bundle.name.replace(/\s+/g, '-').toLowerCase()}`
    }
  });

  beforeEach(() => {
    pricingEngine = new PricingEngine();
  });

  describe('Basic Country Discount + Bundle Markup Scenario', () => {
    it('should apply 20% country discount and specific bundle markup correctly', async () => {
      // 20% discount across all Ukraine bundles
      const countryDiscountRule: PricingRule = {
        id: 'ukraine-discount',
        category: RuleCategory.Discount,
        name: '20% Ukraine Discount',
        description: '20% discount for all Ukraine bundles',
        conditions: [
          {
            field: 'country',
            operator: ConditionOperator.Equals,
            value: 'UA',
            type: 'string'
          }
        ],
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

      // $3 markup only for Premium bundles
      const premiumMarkupRule: PricingRule = {
        id: 'premium-markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Premium Bundle Markup',
        description: '$3 markup for premium bundles',
        conditions: [
          {
            field: 'group',
            operator: ConditionOperator.Equals,
            value: 'Premium',
            type: 'string'
          }
        ],
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

      pricingEngine.clearRules();
      pricingEngine.addRules([countryDiscountRule, premiumMarkupRule]);

      // Test Standard bundle (gets discount only)
      const standardResult = await pricingEngine.calculatePrice(
        createPricingInput(ukraineBundles[0])
      );

      expect(standardResult.pricing.cost).toBe(5.00);
      expect(standardResult.pricing.markup).toBe(0); // No markup for standard
      expect(standardResult.pricing.totalCost).toBe(5.00);
      expect(standardResult.pricing.discountValue).toBe(1.00); // 20% of $5
      expect(standardResult.pricing.discountRate).toBe(20);
      expect(standardResult.pricing.priceAfterDiscount).toBe(4.00); // $5 - $1

      // Test Premium bundle (gets both markup and discount)
      const premiumResult = await pricingEngine.calculatePrice(
        createPricingInput(ukraineBundles[1])
      );

      expect(premiumResult.pricing.cost).toBe(15.00);
      expect(premiumResult.pricing.markup).toBe(3.00); // Premium markup
      expect(premiumResult.pricing.totalCost).toBe(18.00); // $15 + $3
      expect(premiumResult.pricing.discountValue).toBe(3.60); // 20% of $18
      expect(premiumResult.pricing.discountRate).toBe(20);
      expect(premiumResult.pricing.priceAfterDiscount).toBe(14.40); // $18 - $3.60

      // Test Unlimited bundle (gets discount only)
      const unlimitedResult = await pricingEngine.calculatePrice(
        createPricingInput(ukraineBundles[2])
      );

      expect(unlimitedResult.pricing.cost).toBe(20.00);
      expect(unlimitedResult.pricing.markup).toBe(0); // No markup for unlimited
      expect(unlimitedResult.pricing.totalCost).toBe(20.00);
      expect(unlimitedResult.pricing.discountValue).toBe(4.00); // 20% of $20
      expect(unlimitedResult.pricing.discountRate).toBe(20);
      expect(unlimitedResult.pricing.priceAfterDiscount).toBe(16.00); // $20 - $4
    });
  });

  describe('Multiple Bundle-Specific Markups', () => {
    it('should handle different markups for different bundle types', async () => {
      const countryDiscountRule: PricingRule = {
        id: 'ukraine-discount',
        category: RuleCategory.Discount,
        name: '20% Ukraine Discount',
        description: '20% discount for all Ukraine bundles',
        conditions: [
          {
            field: 'country',
            operator: ConditionOperator.Equals,
            value: 'UA',
            type: 'string'
          }
        ],
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

      const premiumMarkupRule: PricingRule = {
        id: 'premium-markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Premium Bundle Markup',
        description: '$5 markup for premium bundles',
        conditions: [
          {
            field: 'group',
            operator: ConditionOperator.Equals,
            value: 'Premium',
            type: 'string'
          }
        ],
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

      const unlimitedMarkupRule: PricingRule = {
        id: 'unlimited-markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Unlimited Bundle Markup',
        description: '$2 markup for unlimited bundles',
        conditions: [
          {
            field: 'group',
            operator: ConditionOperator.Equals,
            value: 'Standard Unlimited',
            type: 'string'
          }
        ],
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

      pricingEngine.clearRules();
      pricingEngine.addRules([countryDiscountRule, premiumMarkupRule, unlimitedMarkupRule]);

      // Standard bundle: Only discount
      const standardResult = await pricingEngine.calculatePrice(
        createPricingInput(ukraineBundles[0])
      );
      expect(standardResult.pricing.markup).toBe(0);
      expect(standardResult.pricing.priceAfterDiscount).toBe(4.00); // $5 * 80%

      // Premium bundle: $5 markup + 20% discount
      const premiumResult = await pricingEngine.calculatePrice(
        createPricingInput(ukraineBundles[1])
      );
      expect(premiumResult.pricing.markup).toBe(5.00);
      expect(premiumResult.pricing.totalCost).toBe(20.00); // $15 + $5
      expect(premiumResult.pricing.priceAfterDiscount).toBe(16.00); // $20 * 80%

      // Unlimited bundle: $2 markup + 20% discount
      const unlimitedResult = await pricingEngine.calculatePrice(
        createPricingInput(ukraineBundles[2])
      );
      expect(unlimitedResult.pricing.markup).toBe(2.00);
      expect(unlimitedResult.pricing.totalCost).toBe(22.00); // $20 + $2
      expect(unlimitedResult.pricing.priceAfterDiscount).toBe(17.60); // $22 * 80%
    });
  });

  describe('Edge Cases & Conditions', () => {
    it('should handle bundle with no matching markup rule', async () => {
      const countryDiscountRule: PricingRule = {
        id: 'ukraine-discount',
        category: RuleCategory.Discount,
        name: '20% Ukraine Discount',
        description: '20% discount for all Ukraine bundles',
        conditions: [
          {
            field: 'country',
            operator: ConditionOperator.Equals,
            value: 'UA',
            type: 'string'
          }
        ],
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

      // Only markup for Premium, not Standard Fixed
      const premiumOnlyMarkupRule: PricingRule = {
        id: 'premium-only-markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Premium Only Markup',
        description: '$10 markup only for premium bundles',
        conditions: [
          {
            field: 'group',
            operator: ConditionOperator.Equals,
            value: 'Premium',
            type: 'string'
          }
        ],
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
      pricingEngine.addRules([countryDiscountRule, premiumOnlyMarkupRule]);

      // Standard bundle should get discount but no markup
      const standardResult = await pricingEngine.calculatePrice(
        createPricingInput(ukraineBundles[0])
      );

      expect(standardResult.pricing.cost).toBe(5.00);
      expect(standardResult.pricing.markup).toBe(0); // No matching markup rule
      expect(standardResult.pricing.totalCost).toBe(5.00);
      expect(standardResult.pricing.discountValue).toBe(1.00);
      expect(standardResult.pricing.priceAfterDiscount).toBe(4.00);
    });

    it('should handle wrong country (no discount) but matching bundle markup', async () => {
      // Discount only for Poland, not Ukraine
      const polandDiscountRule: PricingRule = {
        id: 'poland-discount',
        category: RuleCategory.Discount,
        name: '20% Poland Discount',
        description: '20% discount for Poland bundles only',
        conditions: [
          {
            field: 'country',
            operator: ConditionOperator.Equals,
            value: 'PL', // Poland, not Ukraine
            type: 'string'
          }
        ],
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

      // Markup for Premium bundles regardless of country
      const premiumMarkupRule: PricingRule = {
        id: 'premium-markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Premium Bundle Markup',
        description: '$3 markup for premium bundles',
        conditions: [
          {
            field: 'group',
            operator: ConditionOperator.Equals,
            value: 'Premium',
            type: 'string'
          }
        ],
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

      pricingEngine.clearRules();
      pricingEngine.addRules([polandDiscountRule, premiumMarkupRule]);

      // Ukraine Premium bundle should get markup but no discount
      const premiumResult = await pricingEngine.calculatePrice(
        createPricingInput(ukraineBundles[1])
      );

      expect(premiumResult.pricing.cost).toBe(15.00);
      expect(premiumResult.pricing.markup).toBe(3.00); // Markup applies
      expect(premiumResult.pricing.totalCost).toBe(18.00);
      expect(premiumResult.pricing.discountValue).toBe(0); // No discount for Ukraine
      expect(premiumResult.pricing.discountRate).toBe(0);
      expect(premiumResult.pricing.priceAfterDiscount).toBe(18.00); // No discount applied
    });
  });

  describe('Rule Priority Impact', () => {
    it('should apply rules in correct order: markup first, then discount', async () => {
      const countryDiscountRule: PricingRule = {
        id: 'ukraine-discount',
        category: RuleCategory.Discount,
        name: '20% Ukraine Discount',
        description: '20% discount for all Ukraine bundles',
        conditions: [
          {
            field: 'country',
            operator: ConditionOperator.Equals,
            value: 'UA',
            type: 'string'
          }
        ],
        actions: [
          {
            type: ActionType.ApplyDiscountPercentage,
            value: 20
          }
        ],
        priority: 500, // Discount priority
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      const premiumMarkupRule: PricingRule = {
        id: 'premium-markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Premium Bundle Markup',
        description: '$5 markup for premium bundles',
        conditions: [
          {
            field: 'group',
            operator: ConditionOperator.Equals,
            value: 'Premium',
            type: 'string'
          }
        ],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 5.00
          }
        ],
        priority: 100, // Bundle adjustment priority
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      pricingEngine.clearRules();
      pricingEngine.addRules([countryDiscountRule, premiumMarkupRule]);

      const result = await pricingEngine.calculatePrice(
        createPricingInput(ukraineBundles[1])
      );

      // Verify correct order of operations:
      // 1. Base cost: $15
      // 2. Markup applied: $15 + $5 = $20 (total cost)
      // 3. 20% discount applied: $20 * 0.20 = $4 discount
      // 4. Final price: $20 - $4 = $16

      expect(result.pricing.cost).toBe(15.00);
      expect(result.pricing.markup).toBe(5.00);
      expect(result.pricing.totalCost).toBe(20.00); // After markup
      expect(result.pricing.discountValue).toBe(4.00); // 20% of total cost
      expect(result.pricing.priceAfterDiscount).toBe(16.00); // After discount
    });
  });
});