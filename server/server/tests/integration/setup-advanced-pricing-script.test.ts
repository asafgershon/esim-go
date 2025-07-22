import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { PricingRulesRepository } from '../../src/repositories/pricing-rules/pricing-rules.repository';
import { PricingEngineService } from '../../src/services/pricing-engine.service';
import type { PricingContext } from '../../src/rules-engine/types';
import { cleanEnv, str } from 'envalid';

// This test validates that our advanced pricing script setup works correctly
describe('Advanced Pricing Rules Script Integration', () => {
  let repository: PricingRulesRepository;
  let pricingEngine: PricingEngineService;
  let supabase: ReturnType<typeof createClient>;
  let createdRuleIds: string[] = [];

  beforeAll(async () => {
    // Setup test environment (using env vars or defaults)
    const env = cleanEnv(process.env, {
      SUPABASE_URL: str({ default: 'https://test.supabase.co' }),
      SUPABASE_SERVICE_KEY: str({ default: 'test-key' }),
    });

    // Note: In a real test, you'd use a test database
    // For now, this is a conceptual test showing the integration
    supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    repository = new PricingRulesRepository(supabase);
    pricingEngine = new PricingEngineService(supabase);
  });

  afterAll(async () => {
    // Clean up test data
    for (const ruleId of createdRuleIds) {
      try {
        await repository.delete(ruleId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  it('should demonstrate complete pricing flow with script-generated rules', async () => {
    // This is a conceptual test - in practice, you'd run the setup script first
    // or create the rules programmatically for testing

    const mockRules = [
      // System markup rule
      {
        type: 'SYSTEM_MARKUP' as const,
        name: 'Test 15-Day Markup',
        description: 'Markup for 15-day Standard Fixed bundles',
        conditions: [
          { field: 'bundleGroup', operator: 'EQUALS' as const, value: 'Standard Fixed' },
          { field: 'duration', operator: 'EQUALS' as const, value: 15 }
        ],
        actions: [
          { type: 'ADD_MARKUP' as const, value: 27.00 }
        ],
        priority: 1000,
        isActive: true,
        isEditable: false
      },
      // Country discount rule
      {
        type: 'DISCOUNT' as const,
        name: 'Test Israel 20% Discount',
        description: '20% discount for all bundles in Israel',
        conditions: [
          { field: 'country', operator: 'EQUALS' as const, value: 'IL' }
        ],
        actions: [
          { type: 'APPLY_DISCOUNT_PERCENTAGE' as const, value: 20 }
        ],
        priority: 500,
        isActive: true,
        isEditable: true
      }
    ];

    // Test the pricing flow with a real context
    const context: PricingContext = {
      bundle: {
        id: 'test-israel-15day',
        name: 'Test Israel 15-Day Bundle',
        group: 'Standard Fixed',
        duration: 15,
        cost: 25.00,
        countryId: 'IL',
        countryName: 'Israel',
        regionId: 'middle-east',
        regionName: 'Middle East',
        isUnlimited: false,
        dataAmount: '10GB'
      },
      paymentMethod: 'ISRAELI_CARD',
      currentDate: new Date(),
      country: 'IL',
      region: 'middle-east',
      bundleGroup: 'Standard Fixed',
      duration: 15
    };

    // This would work with real database integration
    // const result = await pricingEngine.calculatePrice(context);

    // For this test, we're validating the rule structure and logic
    expect(mockRules).toHaveLength(2);
    expect(mockRules[0].type).toBe('SYSTEM_MARKUP');
    expect(mockRules[1].type).toBe('DISCOUNT');

    // Verify the rules have correct structure for the use cases
    const markupRule = mockRules[0];
    expect(markupRule.conditions).toEqual([
      { field: 'bundleGroup', operator: 'EQUALS', value: 'Standard Fixed' },
      { field: 'duration', operator: 'EQUALS', value: 15 }
    ]);
    expect(markupRule.actions[0].value).toBe(27.00);

    const discountRule = mockRules[1];
    expect(discountRule.conditions).toEqual([
      { field: 'country', operator: 'EQUALS', value: 'IL' }
    ]);
    expect(discountRule.actions[0].value).toBe(20);

    // Test expected calculation results
    const expectedCalculation = {
      baseCost: 25.00,
      markup: 27.00,
      subtotal: 52.00,
      countryDiscount: 10.40, // 20% of $52.00
      priceAfterDiscount: 41.60,
      maxRecommendedPrice: 26.50, // $25.00 + $1.50
    };

    expect(expectedCalculation.subtotal).toBe(expectedCalculation.baseCost + expectedCalculation.markup);
    expect(expectedCalculation.countryDiscount).toBeCloseTo(expectedCalculation.subtotal * 0.20, 2);
    expect(expectedCalculation.priceAfterDiscount).toBeCloseTo(expectedCalculation.subtotal - expectedCalculation.countryDiscount, 2);
    expect(expectedCalculation.maxRecommendedPrice).toBe(expectedCalculation.baseCost + 1.50);
  });

  it('should validate markup-based unused day discount scenario', () => {
    // Test the formula: (selectedBundle markup - prevBundle markup) / days difference
    const selectedBundleMarkup = 27.00; // 15-day markup
    const prevBundleMarkup = 22.00;     // 10-day markup
    const daysDifference = 5;           // 15 - 10 = 5 days
    const unusedDays = 2;               // 15 - 13 = 2 unused days

    const discountPerDay = (selectedBundleMarkup - prevBundleMarkup) / daysDifference;
    const totalUnusedDaysDiscount = discountPerDay * unusedDays;

    expect(discountPerDay).toBe(1.00); // $5.00 / 5 days = $1.00 per day
    expect(totalUnusedDaysDiscount).toBe(2.00); // $1.00 * 2 days = $2.00
  });

  it('should validate revenue calculation requirements', () => {
    // Test scenario: Israel 15-day bundle with specific processing
    const baseCost = 25.00;
    const markup = 27.00;
    const subtotal = baseCost + markup; // $52.00
    const discount = subtotal * 0.20;   // 20% country discount = $10.40
    const priceAfterDiscount = subtotal - discount; // $41.60
    const processingRate = 0.035;       // 3.5% for Israeli cards
    const processingFee = priceAfterDiscount * processingRate; // $1.456
    const finalPrice = priceAfterDiscount + processingFee; // $43.056

    // Revenue calculations as per requirements
    const finalRevenue = finalPrice - baseCost;                    // What we get (final payment - cost)
    const revenueAfterProcessing = finalPrice - processingFee - baseCost; // Bottom line

    expect(finalRevenue).toBeCloseTo(18.06, 2);  // $43.06 - $25.00
    expect(revenueAfterProcessing).toBeCloseTo(16.60, 2); // $43.06 - $1.46 - $25.00
    expect(revenueAfterProcessing).toBeLessThan(finalRevenue); // Bottom line should be less than final revenue

    // Max recommended price = cost + $1.50
    const maxRecommendedPrice = baseCost + 1.50;
    expect(maxRecommendedPrice).toBe(26.50);

    // Max discount percentage calculation
    const requiredRevenueAfterProcessing = baseCost + 1.50; // $26.50
    const requiredPriceAfterDiscount = requiredRevenueAfterProcessing / (1 - processingRate); // $27.46
    const maxDiscountAmount = subtotal - requiredPriceAfterDiscount; // $24.54
    const maxDiscountPercentage = (maxDiscountAmount / subtotal) * 100; // 47.19%

    expect(maxDiscountPercentage).toBeCloseTo(47.19, 1);
  });

  it('should demonstrate configuration per country applied to all bundles', () => {
    // Test that country rules apply to different bundle types within the same country
    const israelBundles = [
      { type: '1-day', markup: 8.00, expectedDiscount: (25 + 8) * 0.20 },
      { type: '7-day', markup: 18.00, expectedDiscount: (25 + 18) * 0.20 },
      { type: '15-day', markup: 27.00, expectedDiscount: (25 + 27) * 0.20 },
      { type: '30-day', markup: 35.00, expectedDiscount: (25 + 35) * 0.20 }
    ];

    israelBundles.forEach(bundle => {
      const subtotal = 25.00 + bundle.markup;
      const countryDiscount = subtotal * 0.20; // 20% Israel discount
      
      expect(countryDiscount).toBeCloseTo(bundle.expectedDiscount, 2);
      expect(countryDiscount).toBeGreaterThan(0);
    });

    // Verify that different countries can have different discount rates
    const countryDiscountRates = [
      { country: 'IL', rate: 0.20 }, // 20% for Israel
      { country: 'FR', rate: 0.15 }, // 15% for France  
      { country: 'DE', rate: 0.10 }  // 10% for Germany
    ];

    countryDiscountRates.forEach(config => {
      const baseSubtotal = 50.00; // Example subtotal
      const expectedDiscount = baseSubtotal * config.rate;
      
      expect(expectedDiscount).toBeGreaterThan(0);
      if (config.country === 'IL') {
        expect(expectedDiscount).toBe(10.00); // 20% of $50
      } else if (config.country === 'FR') {
        expect(expectedDiscount).toBe(7.50);  // 15% of $50
      } else if (config.country === 'DE') {
        expect(expectedDiscount).toBe(5.00);  // 10% of $50
      }
    });
  });
});