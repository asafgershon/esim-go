import { beforeEach, describe, expect, it } from 'vitest';
import { PricingEngine } from '../src/pricing-engine';
import { ActionType, ConditionOperator, PaymentMethod, RuleCategory, type Bundle, type PricingEngineInput, type PricingRule } from '../src/rules-engine-types';

describe('Africa Region 10% Discount', () => {
  let pricingEngine: PricingEngine;
  
  // Test bundles from different African countries
  const africaBundles: Bundle[] = [
    {
      name: 'South Africa 2GB 7D',
      description: '2GB for 7 days in South Africa',
      groups: ['Standard Fixed'],
      validityInDays: 7,
      dataAmountMB: 2000,
      dataAmountReadable: '2GB',
      isUnlimited: false,
      countries: ['ZA'],
      region: 'Africa',
      speed: ['4G'],
      currency: 'USD',
      basePrice: 12.00
    },
    {
      name: 'Nigeria 5GB 14D',
      description: '5GB for 14 days in Nigeria',
      groups: ['Premium'],
      validityInDays: 14,
      dataAmountMB: 5000,
      dataAmountReadable: '5GB',
      isUnlimited: false,
      countries: ['NG'],
      region: 'Africa',
      speed: ['4G', '5G'],
      currency: 'USD',
      basePrice: 25.00
    },
    {
      name: 'Kenya Unlimited 30D',
      description: 'Unlimited data for 30 days in Kenya',
      groups: ['Standard Unlimited'],
      validityInDays: 30,
      dataAmountMB: null,
      dataAmountReadable: 'Unlimited',
      isUnlimited: true,
      countries: ['KE'],
      region: 'Africa',
      speed: ['4G', '5G'],
      currency: 'USD',
      basePrice: 45.00
    }
  ];

  // Non-Africa bundle for comparison
  const europeanBundle: Bundle = {
    name: 'France 3GB 7D',
    description: '3GB for 7 days in France',
    groups: ['Standard Fixed'],
    validityInDays: 7,
    dataAmountMB: 3000,
    dataAmountReadable: '3GB',
    isUnlimited: false,
    countries: ['FR'],
    region: 'Europe',
    speed: ['4G', '5G'],
    currency: 'USD',
    basePrice: 15.00
  };

  const createPricingInput = (bundle: Bundle): PricingEngineInput => ({
    context: {
      bundles: [bundle],
      customer: {
        id: 'test-customer',
        segment: 'default'
      },
      payment: {
        method: PaymentMethod.IsraeliCard,
        promo: undefined
      },
      rules: [],
      date: new Date()
    },
    request: {
      duration: bundle.validityInDays,
      countryISO: bundle.countries[0],
      paymentMethod: PaymentMethod.IsraeliCard,
      dataType: bundle.isUnlimited ? 'unlimited' : 'fixed',
      promo: undefined
    },
    metadata: {
      correlationId: `test-africa-discount-${bundle.countries[0]}`,
      timestamp: new Date()
    }
  });

  beforeEach(() => {
    pricingEngine = new PricingEngine();
  });

  describe('Africa Region 10% Discount Rule', () => {
    it('should apply 10% discount to all bundles in Africa region', async () => {
      // Create 10% discount rule for Africa region
      const africaDiscountRule: PricingRule = {
        id: 'africa-discount',
        category: RuleCategory.Discount,
        name: '10% Africa Region Discount',
        description: '10% discount for all bundles in Africa region',
        conditions: [
          {
            field: 'processing.region',
            operator: ConditionOperator.Equals,
            value: 'Africa',
            type: 'string'
          }
        ],
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

      pricingEngine.clearRules();
      pricingEngine.addRules([africaDiscountRule]);

      // Test South Africa bundle: $12 - 10% = $10.80
      const southAfricaResult = await pricingEngine.calculatePrice(
        createPricingInput(africaBundles[0])
      );

      expect(southAfricaResult.response.pricing.cost).toBe(12.00);
      expect(southAfricaResult.response.pricing.totalCost).toBe(12.00);
      expect(southAfricaResult.response.pricing.discountValue).toBeCloseTo(1.20, 2); // 10% of $12
      expect(southAfricaResult.response.pricing.discountRate).toBeCloseTo(10, 1);
      expect(southAfricaResult.response.pricing.priceAfterDiscount).toBe(10.80); // $12 - $1.20
      expect(southAfricaResult.response.pricing.finalRevenue).toBe(10.80);

      // Test Nigeria bundle: $25 - 10% = $22.50
      const nigeriaResult = await pricingEngine.calculatePrice(
        createPricingInput(africaBundles[1])
      );

      expect(nigeriaResult.response.pricing.cost).toBe(25.00);
      expect(nigeriaResult.response.pricing.totalCost).toBe(25.00);
      expect(nigeriaResult.response.pricing.discountValue).toBeCloseTo(2.50, 2); // 10% of $25
      expect(nigeriaResult.response.pricing.discountRate).toBeCloseTo(10, 1);
      expect(nigeriaResult.response.pricing.priceAfterDiscount).toBe(22.50); // $25 - $2.50
      expect(nigeriaResult.response.pricing.finalRevenue).toBe(22.50);

      // Test Kenya bundle: $45 - 10% = $40.50
      const kenyaResult = await pricingEngine.calculatePrice(
        createPricingInput(africaBundles[2])
      );

      expect(kenyaResult.response.pricing.cost).toBe(45.00);
      expect(kenyaResult.response.pricing.totalCost).toBe(45.00);
      expect(kenyaResult.response.pricing.discountValue).toBeCloseTo(4.50, 2); // 10% of $45
      expect(kenyaResult.response.pricing.discountRate).toBeCloseTo(10, 1);
      expect(kenyaResult.response.pricing.priceAfterDiscount).toBe(40.50); // $45 - $4.50
      expect(kenyaResult.response.pricing.finalRevenue).toBe(40.50);
    });

    it('should NOT apply Africa discount to non-Africa regions', async () => {
      // Create 10% discount rule for Africa region
      const africaDiscountRule: PricingRule = {
        id: 'africa-discount',
        category: RuleCategory.Discount,
        name: '10% Africa Region Discount',
        description: '10% discount for all bundles in Africa region',
        conditions: [
          {
            field: 'processing.region',
            operator: ConditionOperator.Equals,
            value: 'Africa',
            type: 'string'
          }
        ],
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

      pricingEngine.clearRules();
      pricingEngine.addRules([africaDiscountRule]);

      // Test European bundle should NOT get the discount
      const europeResult = await pricingEngine.calculatePrice(
        createPricingInput(europeanBundle)
      );

      expect(europeResult.response.pricing.cost).toBe(15.00);
      expect(europeResult.response.pricing.totalCost).toBe(15.00);
      expect(europeResult.response.pricing.discountValue).toBe(0); // No discount applied
      expect(europeResult.response.pricing.discountRate).toBe(0);
      expect(europeResult.response.pricing.priceAfterDiscount).toBe(15.00); // No discount
      expect(europeResult.response.pricing.finalRevenue).toBe(15.00);
    });

    it('should work with processing fees and other rules', async () => {
      // Create Africa discount rule
      const africaDiscountRule: PricingRule = {
        id: 'africa-discount',
        category: RuleCategory.Discount,
        name: '10% Africa Region Discount',
        description: '10% discount for all bundles in Africa region',
        conditions: [
          {
            field: 'processing.region',
            operator: ConditionOperator.Equals,
            value: 'Africa',
            type: 'string'
          }
        ],
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

      // Add processing fee rule
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
      pricingEngine.addRules([africaDiscountRule, processingFeeRule]);

      // Test South Africa bundle with discount + processing fee
      const result = await pricingEngine.calculatePrice(
        createPricingInput(africaBundles[0])
      );

      // Expected calculation:
      // Cost: $12
      // 10% discount: $1.20, Price after discount: $10.80
      // Processing fee: $10.80 * 2.9% = $0.3132
      // Final revenue: $10.80 (what customer pays)
      // Revenue after processing: $10.80 - $0.3132 = $10.4868

      expect(result.response.pricing.cost).toBe(12.00);
      expect(result.response.pricing.discountValue).toBeCloseTo(1.20, 2);
      expect(result.response.pricing.priceAfterDiscount).toBe(10.80);
      expect(result.response.pricing.processingCost).toBeCloseTo(0.31, 2);
      expect(result.response.pricing.finalRevenue).toBe(10.80); // What customer pays
      expect(result.response.pricing.revenueAfterProcessing).toBeCloseTo(10.49, 2); // What we receive
    });

    it('should work with bundle-specific markup rules', async () => {
      // Create Africa discount rule
      const africaDiscountRule: PricingRule = {
        id: 'africa-discount',
        category: RuleCategory.Discount,
        name: '10% Africa Region Discount',
        description: '10% discount for all bundles in Africa region',
        conditions: [
          {
            field: 'processing.region',
            operator: ConditionOperator.Equals,
            value: 'Africa',
            type: 'string'
          }
        ],
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

      // Add markup rule for Premium bundles
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
      pricingEngine.addRules([africaDiscountRule, premiumMarkupRule]);

      // Test Nigeria Premium bundle: $25 + $3 markup = $28, then 10% discount = $25.20
      const result = await pricingEngine.calculatePrice(
        createPricingInput(africaBundles[1]) // Nigeria Premium bundle
      );

      expect(result.response.pricing.cost).toBe(25.00);
      expect(result.response.pricing.markup).toBe(3.00);
      expect(result.response.pricing.totalCost).toBe(28.00); // $25 + $3
      expect(result.response.pricing.discountValue).toBeCloseTo(2.80, 2); // 10% of $28
      expect(result.response.pricing.discountRate).toBeCloseTo(10, 1);
      expect(result.response.pricing.priceAfterDiscount).toBe(25.20); // $28 - $2.80
      expect(result.response.pricing.finalRevenue).toBe(25.20);
    });
  });
});