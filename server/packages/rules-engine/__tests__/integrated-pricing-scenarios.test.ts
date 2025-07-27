import { beforeEach, describe, expect, it } from 'vitest';
import { PricingEngine } from '../src/pricing-engine';
import { ActionType, ConditionOperator, PaymentMethod, RuleCategory, type Bundle, type PricingEngineInput, type PricingRule } from '../src/rules-engine-types';

describe('Integrated Pricing Scenarios', () => {
  let pricingEngine: PricingEngine;
  
  // Test bundles
  const testBundles: Bundle[] = [
    {
      name: 'Albania 7 Days 1GB',
      description: 'Albania bundle for 7 days with 1GB data',
      groups: ['Standard Fixed'],
      validityInDays: 7,
      dataAmountMB: 1000,
      dataAmountReadable: '1GB',
      isUnlimited: false,
      countries: ['AL'],
      region: 'Europe',
      speed: ['4G', '5G'],
      currency: 'USD',
      basePrice: 5.00 // Cost from supplier
    },
    {
      name: 'USA 30 Days Unlimited',
      description: 'USA bundle for 30 days with unlimited data',
      groups: ['Standard - Unlimited Plus'],
      validityInDays: 30,
      dataAmountMB: -1, // Unlimited
      dataAmountReadable: 'Unlimited',
      isUnlimited: true,
      countries: ['US'],
      region: 'North America',
      speed: ['4G', '5G'],
      currency: 'USD',
      basePrice: 50.00 // Cost from supplier
    }
  ];

  // Base pricing input
  const createPricingInput = (bundle: Bundle, duration: number = bundle.validityInDays): PricingEngineInput => ({
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
      duration,
      paymentMethod: PaymentMethod.IsraeliCard,
      countryISO: bundle.countries[0],
      region: bundle.region || '',
      dataType: 'DEFAULT' as any
    },
    steps: [],
    unusedDays: 0,
    country: bundle.countries[0],
    region: bundle.region || '',
    group: bundle.groups[0],
    dataType: 'DEFAULT' as any,
    metadata: {
      correlationId: `test-${Date.now()}`
    }
  });

  beforeEach(() => {
    pricingEngine = new PricingEngine();
  });

  describe('Scenario 1: Basic Markup + Minimum Profit Constraint', () => {
    it('should apply markup and respect minimum profit constraint', async () => {
      // Define rules
      const markupRule: PricingRule = {
        id: 'standard-markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Standard Markup',
        description: 'Add 20% markup to all bundles',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 1.00 // $1 markup on $5 bundle (20%)
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
        name: 'Minimum Profit Constraint',
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
      pricingEngine.addRules([markupRule, minProfitRule]);

      const result = await pricingEngine.calculatePrice(createPricingInput(testBundles[0]));

      // Albania bundle: cost $5
      // With $1 markup: $6 (profit = $1)
      // But minimum profit is $2, so price should be $7
      expect(result.pricing.cost).toBe(5.00);
      expect(result.pricing.markup).toBe(1.00);
      expect(result.pricing.totalCost).toBe(6.00);
      expect(result.pricing.priceAfterDiscount).toBe(7.00); // Adjusted for min profit
      expect(result.pricing.netProfit).toBe(2.00);
    });

    it('should handle case where markup already exceeds minimum profit', async () => {
      // Define rules with higher markup
      const highMarkupRule: PricingRule = {
        id: 'high-markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Premium Markup',
        description: 'Add 60% markup to premium bundles',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 30.00 // $30 markup on $50 bundle (60%)
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
        name: 'Minimum Profit Constraint',
        description: 'Ensure minimum $10 profit',
        conditions: [],
        actions: [
          {
            type: ActionType.SetMinimumProfit,
            value: 10.00
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
      pricingEngine.addRules([highMarkupRule, minProfitRule]);

      const result = await pricingEngine.calculatePrice(createPricingInput(testBundles[1]));

      // USA bundle: cost $50
      // With $30 markup: $80 (profit = $30)
      // Profit already exceeds minimum of $10, so no adjustment needed
      expect(result.pricing.cost).toBe(50.00);
      expect(result.pricing.markup).toBe(30.00);
      expect(result.pricing.totalCost).toBe(80.00);
      expect(result.pricing.priceAfterDiscount).toBe(80.00); // No adjustment needed
      expect(result.pricing.netProfit).toBe(30.00);
    });
  });

  describe('Scenario 2: Country-Specific Rules', () => {
    it('should apply different markups based on country', async () => {
      // Albania-specific markup
      const albaniaMarkup: PricingRule = {
        id: 'albania-markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Albania Markup',
        description: 'Special markup for Albania',
        conditions: [
          {
            field: 'country',
            operator: ConditionOperator.Equals,
            value: 'AL',
            type: 'string'
          }
        ],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 0.60 // Lower markup for Albania
          }
        ],
        priority: 150,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      // USA-specific markup
      const usaMarkup: PricingRule = {
        id: 'usa-markup',
        category: RuleCategory.BundleAdjustment,
        name: 'USA Premium Markup',
        description: 'Premium markup for USA',
        conditions: [
          {
            field: 'country',
            operator: ConditionOperator.Equals,
            value: 'US',
            type: 'string'
          }
        ],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 35.00 // Higher markup for USA
          }
        ],
        priority: 150,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      // Global minimum profit
      const minProfitRule: PricingRule = {
        id: 'global-min-profit',
        category: RuleCategory.Constraint,
        name: 'Global Minimum Profit',
        description: 'Ensure minimum $1.50 profit globally',
        conditions: [],
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

      pricingEngine.clearRules();
      pricingEngine.addRules([albaniaMarkup, usaMarkup, minProfitRule]);

      // Test Albania pricing
      const albaniaResult = await pricingEngine.calculatePrice(createPricingInput(testBundles[0]));
      expect(albaniaResult.pricing.cost).toBe(5.00);
      expect(albaniaResult.pricing.markup).toBe(0.60);
      expect(albaniaResult.pricing.priceAfterDiscount).toBe(6.50); // Adjusted to meet min profit
      expect(albaniaResult.pricing.netProfit).toBe(1.50);

      // Test USA pricing
      const usaResult = await pricingEngine.calculatePrice(createPricingInput(testBundles[1]));
      expect(usaResult.pricing.cost).toBe(50.00);
      expect(usaResult.pricing.markup).toBe(35.00);
      expect(usaResult.pricing.priceAfterDiscount).toBe(85.00);
      expect(usaResult.pricing.netProfit).toBe(35.00);
    });
  });

  describe('Scenario 3: Processing Fees on Top', () => {
    it('should add processing fees after profit calculation', async () => {
      const markupRule: PricingRule = {
        id: 'markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Standard Markup',
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

      const minProfitRule: PricingRule = {
        id: 'min-profit',
        category: RuleCategory.Constraint,
        name: 'Minimum Profit',
        description: 'Ensure minimum $1.50 profit',
        conditions: [],
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

      const processingFeeRule: PricingRule = {
        id: 'processing-fee',
        category: RuleCategory.Fee,
        name: 'Card Processing Fee',
        description: 'Credit card processing fee',
        conditions: [],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 2.9 // 2.9% processing fee
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
      pricingEngine.addRules([markupRule, minProfitRule, processingFeeRule]);

      const result = await pricingEngine.calculatePrice(createPricingInput(testBundles[0]));

      // Albania bundle: cost $5
      // With $2 markup: $7 (profit = $2, exceeds minimum)
      // Processing fee: $7 * 2.9% = $0.203
      expect(result.pricing.cost).toBe(5.00);
      expect(result.pricing.markup).toBe(2.00);
      expect(result.pricing.totalCost).toBe(7.00);
      expect(result.pricing.priceAfterDiscount).toBe(7.00);
      expect(result.pricing.netProfit).toBe(2.00);
      expect(result.pricing.processingCost).toBeCloseTo(0.203, 2);
      expect(result.pricing.finalRevenue).toBe(7.00); // What customer pays
      expect(result.pricing.revenueAfterProcessing).toBeCloseTo(6.797, 2); // What we receive
    });
  });

  describe('Scenario 4: Discounts with Constraints', () => {
    it('should limit discounts to maintain minimum profit', async () => {
      const markupRule: PricingRule = {
        id: 'markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Standard Markup',
        description: 'Add 100% markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 5.00 // $5 markup on $5 bundle
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
        id: 'promo-discount',
        category: RuleCategory.Discount,
        name: 'Promotional Discount',
        description: '30% off',
        conditions: [],
        actions: [
          {
            type: ActionType.ApplyDiscountPercentage,
            value: 30 // 30% discount
          }
        ],
        priority: 500,
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
        description: 'Ensure minimum $1.50 profit',
        conditions: [],
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

      pricingEngine.clearRules();
      pricingEngine.addRules([markupRule, discountRule, minProfitRule]);

      const result = await pricingEngine.calculatePrice(createPricingInput(testBundles[0]));

      // Albania bundle: cost $5
      // With $5 markup: $10
      // 30% discount would be $3, making price $7 (profit = $2)
      // Since profit exceeds minimum, full discount applies
      expect(result.pricing.cost).toBe(5.00);
      expect(result.pricing.markup).toBe(5.00);
      expect(result.pricing.totalCost).toBe(10.00);
      expect(result.pricing.discountValue).toBe(3.00);
      expect(result.pricing.priceAfterDiscount).toBe(7.00);
      expect(result.pricing.netProfit).toBe(2.00); // Still above minimum
    });

    it('should override excessive discounts to maintain minimum profit', async () => {
      const smallMarkupRule: PricingRule = {
        id: 'small-markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Small Markup',
        description: 'Add small markup',
        conditions: [],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 1.00 // Only $1 markup
          }
        ],
        priority: 100,
        isActive: true,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      const heavyDiscountRule: PricingRule = {
        id: 'heavy-discount',
        category: RuleCategory.Discount,
        name: 'Clearance Discount',
        description: '70% off',
        conditions: [],
        actions: [
          {
            type: ActionType.ApplyDiscountPercentage,
            value: 70 // 70% discount
          }
        ],
        priority: 500,
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
      pricingEngine.addRules([smallMarkupRule, heavyDiscountRule, minProfitRule]);

      const result = await pricingEngine.calculatePrice(createPricingInput(testBundles[0]));

      // Albania bundle: cost $5
      // With $1 markup: $6
      // 70% discount would be $4.20, making price $1.80 (loss!)
      // Minimum profit constraint ensures price is at least $7
      expect(result.pricing.cost).toBe(5.00);
      expect(result.pricing.markup).toBe(1.00);
      expect(result.pricing.totalCost).toBe(6.00);
      expect(result.pricing.priceAfterDiscount).toBe(7.00); // Adjusted for min profit
      expect(result.pricing.netProfit).toBe(2.00);
      expect(result.pricing.discountValue).toBeLessThan(4.20); // Discount was limited
    });
  });

  describe('Scenario 5: Multiple Rules of Same Type', () => {
    it('should accumulate multiple markups', async () => {
      const baseMarkup: PricingRule = {
        id: 'base-markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Base Markup',
        description: 'Base markup for all bundles',
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

      const regionMarkup: PricingRule = {
        id: 'europe-markup',
        category: RuleCategory.BundleAdjustment,
        name: 'Europe Region Markup',
        description: 'Additional markup for Europe',
        conditions: [
          {
            field: 'region',
            operator: ConditionOperator.Equals,
            value: 'Europe',
            type: 'string'
          }
        ],
        actions: [
          {
            type: ActionType.AddMarkup,
            value: 0.50
          }
        ],
        priority: 110,
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
        description: 'Ensure minimum profit',
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
      pricingEngine.addRules([baseMarkup, regionMarkup, minProfitRule]);

      const result = await pricingEngine.calculatePrice(createPricingInput(testBundles[0]));

      // Albania (Europe) bundle: cost $5
      // Base markup: $1
      // Europe markup: $0.50
      // Total markup: $1.50
      expect(result.pricing.cost).toBe(5.00);
      expect(result.pricing.markup).toBe(1.50); // Combined markups
      expect(result.pricing.totalCost).toBe(6.50);
      expect(result.pricing.priceAfterDiscount).toBe(6.50);
      expect(result.pricing.netProfit).toBe(1.50); // Exceeds minimum
    });
  });
});