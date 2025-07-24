import { describe, it, expect, beforeEach } from 'vitest';
import { PricingRuleEngine, PricingContext, CreatePricingRuleInput, RuleType } from '../../src';

describe('Advanced Pricing Cases', () => {
  let engine: PricingRuleEngine;

  beforeEach(() => {
    engine = new PricingRuleEngine();
  });

  describe('Country-wide percentage discounts with per-bundle markup', () => {
    beforeEach(() => {
      // Setup system markup rules for different durations
      const systemMarkupRules: CreatePricingRuleInput[] = [
        {
          type: 'SYSTEM_MARKUP' as RuleType,
          name: 'Standard Fixed 10-Day Markup',
          description: 'Markup for 10-day Standard Fixed bundles',
          conditions: [
            { field: 'bundleGroup', operator: 'EQUALS', value: 'Standard Fixed' },
            { field: 'duration', operator: 'EQUALS', value: 10 }
          ],
          actions: [
            { type: 'ADD_MARKUP', value: 22.00 }
          ],
          priority: 1000,
          isActive: true,
          isEditable: false
        },
        {
          type: 'SYSTEM_MARKUP' as RuleType,
          name: 'Standard Fixed 15-Day Markup',
          description: 'Markup for 15-day Standard Fixed bundles',
          conditions: [
            { field: 'bundleGroup', operator: 'EQUALS', value: 'Standard Fixed' },
            { field: 'duration', operator: 'EQUALS', value: 15 }
          ],
          actions: [
            { type: 'ADD_MARKUP', value: 27.00 }
          ],
          priority: 1000,
          isActive: true,
          isEditable: false
        }
      ];

      // Setup country-wide percentage discount
      const countryDiscountRule: CreatePricingRuleInput = {
        type: 'DISCOUNT',
        name: 'Israel 20% Country Discount',
        description: '20% discount for all bundles in Israel',
        conditions: [
          { field: 'country', operator: 'EQUALS', value: 'IL' }
        ],
        actions: [
          { type: 'APPLY_DISCOUNT_PERCENTAGE', value: 20 }
        ],
        priority: 500,
        isActive: true,
        isEditable: true
      };

      // Setup processing fee
      const processingFeeRule: CreatePricingRuleInput = {
        type: 'SYSTEM_PROCESSING',
        name: 'Israeli Card Processing Fee',
        description: 'Processing fee for Israeli cards',
        conditions: [
          { field: 'paymentMethod', operator: 'EQUALS', value: 'ISRAELI_CARD' }
        ],
        actions: [
          { type: 'SET_PROCESSING_RATE', value: 3.5 }
        ],
        priority: 1000,
        isActive: true,
        isEditable: false
      };

      engine.addSystemRules(systemMarkupRules);
      engine.addRules([countryDiscountRule]);
      engine.addSystemRules([processingFeeRule]);
    });

    it('should apply 20% discount across country with per-bundle markup', async () => {
      const context: PricingContext = {
        bundle: {
          id: 'israel-15day-bundle',
          name: 'Israel 15-Day Bundle',
          group: 'Standard Fixed',
          duration: 15,
          cost: 25.00, // Base cost
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

      const result = await engine.calculatePrice(context);

      // Expected calculation:
      // Base cost: $25.00
      // Markup: $27.00 (15-day Standard Fixed markup)
      // Subtotal: $25.00 + $27.00 = $52.00
      // 20% discount: $52.00 * 0.20 = $10.40
      // Price after discount: $52.00 - $10.40 = $41.60
      // Processing fee: $41.60 * 0.035 = $1.456 ≈ $1.46
      // Final price: $41.60 + $1.46 = $43.06
      // Final revenue: $43.06 - $25.00 = $18.06
      // Revenue after processing: $43.06 - $1.46 - $25.00 = $16.60

      expect(result.baseCost).toBe(25.00);
      expect(result.markup).toBe(27.00);
      expect(result.subtotal).toBe(52.00);
      expect(result.totalDiscount).toBeCloseTo(10.40, 2);
      expect(result.priceAfterDiscount).toBeCloseTo(41.60, 2);
      expect(result.processingFee).toBeCloseTo(1.46, 2);
      expect(result.finalPrice).toBeCloseTo(43.06, 2);
      expect(result.finalRevenue).toBeCloseTo(18.06, 2);
      expect(result.revenueAfterProcessing).toBeCloseTo(16.60, 2);
      expect(result.profit).toBeCloseTo(16.60, 2);

      // Should have applied the discount
      const israelDiscount = result.discounts.find(d => d.ruleName === 'Israel 20% Country Discount');
      expect(israelDiscount).toBeDefined();
      expect(israelDiscount?.amount).toBeCloseTo(10.40, 2);
      expect(israelDiscount?.type).toBe('percentage');
    });

    it('should calculate max recommended price as cost + $1.50', async () => {
      const context: PricingContext = {
        bundle: {
          id: 'test-bundle',
          name: 'Test Bundle',
          group: 'Standard Fixed',
          duration: 10,
          cost: 30.00,
          countryId: 'IL',
          countryName: 'Israel',
          regionId: 'middle-east',
          regionName: 'Middle East',
          isUnlimited: false,
          dataAmount: '5GB'
        },
        paymentMethod: 'ISRAELI_CARD',
        currentDate: new Date(),
        country: 'IL',
        region: 'middle-east',
        bundleGroup: 'Standard Fixed',
        duration: 10
      };

      const result = await engine.calculatePrice(context);

      // Max recommended price should be cost + $1.50
      expect(result.maxRecommendedPrice).toBe(31.50); // $30.00 + $1.50
    });

    it('should calculate how much percentage discount can be given while maintaining $1.50 profit', async () => {
      const context: PricingContext = {
        bundle: {
          id: 'test-bundle',
          name: 'Test Bundle',
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

      const result = await engine.calculatePrice(context);

      // Calculation for max discount percentage:
      // Subtotal: $25.00 + $27.00 = $52.00
      // Processing rate: 3.5%
      // To maintain $1.50 minimum profit after processing:
      // Required revenue after processing: $25.00 + $1.50 = $26.50
      // Required price after discount: $26.50 / (1 - 0.035) = $26.50 / 0.965 ≈ $27.46
      // Max discount amount: $52.00 - $27.46 = $24.54
      // Max discount percentage: ($24.54 / $52.00) * 100 ≈ 47.19%

      expect(result.maxDiscountPercentage).toBeCloseTo(47.19, 1);
    });
  });

  describe('Markup-based unused day discount formula', () => {
    beforeEach(() => {
      // Setup markup rules for the formula testing
      const markupRules: CreatePricingRuleInput[] = [
        {
          type: 'SYSTEM_MARKUP' as RuleType,
          name: 'Standard Fixed 10-Day Markup',
          conditions: [
            { field: 'bundleGroup', operator: 'EQUALS', value: 'Standard Fixed' },
            { field: 'duration', operator: 'EQUALS', value: 10 }
          ],
          actions: [
            { type: 'ADD_MARKUP', value: 22.00 }
          ],
          priority: 1000,
          isActive: true,
          isEditable: false
        },
        {
          type: 'SYSTEM_MARKUP' as RuleType,
          name: 'Standard Fixed 15-Day Markup',
          conditions: [
            { field: 'bundleGroup', operator: 'EQUALS', value: 'Standard Fixed' },
            { field: 'duration', operator: 'EQUALS', value: 15 }
          ],
          actions: [
            { type: 'ADD_MARKUP', value: 27.00 }
          ],
          priority: 1000,
          isActive: true,
          isEditable: false
        }
      ];

      engine.addSystemRules(markupRules);
    });

    it('should apply markup-based unused day discount: 13 days usage of 15-day bundle', async () => {
      const context: PricingContext = {
        bundle: {
          id: 'test-15day-bundle',
          name: 'Test 15-Day Bundle',
          group: 'Standard Fixed',
          duration: 15,
          cost: 20.00,
          countryId: 'US',
          countryName: 'United States',
          regionId: 'north-america',
          regionName: 'North America',
          isUnlimited: false,
          dataAmount: '8GB'
        },
        requestedDuration: 13, // User only needs 13 days
        paymentMethod: 'FOREIGN_CARD',
        currentDate: new Date(),
        country: 'US',
        region: 'north-america',
        bundleGroup: 'Standard Fixed',
        duration: 15
      };

      const result = await engine.calculatePrice(context);

      // Expected calculation for unused day discount:
      // Selected bundle (15-day) markup: $27.00
      // Previous bundle (10-day) markup: $22.00
      // Markup difference: $27.00 - $22.00 = $5.00
      // Days difference: 15 - 10 = 5 days
      // Discount per day: $5.00 / 5 = $1.00 per day
      // Unused days: 15 - 13 = 2 days
      // Unused days discount: $1.00 * 2 = $2.00

      expect(result.baseCost).toBe(20.00);
      expect(result.markup).toBe(27.00);
      expect(result.subtotal).toBe(47.00);

      // Check if unused days discount was applied
      const unusedDaysDiscount = result.discounts.find(d => 
        d.ruleName.includes('Unused Days Discount')
      );
      expect(unusedDaysDiscount).toBeDefined();
      expect(unusedDaysDiscount?.amount).toBeCloseTo(2.00, 2);
    });

    it('should calculate discount per day correctly for different duration gaps', async () => {
      // Test the calculateUnusedDayDiscount method directly
      const selectedBundleMarkup = 27.00; // 15-day markup
      const selectedBundleDuration = 15;
      const requestedDuration = 12;
      const bundleGroup = 'Standard Fixed';

      const discountPerDay = await engine.calculateUnusedDayDiscount(
        selectedBundleMarkup,
        selectedBundleDuration,
        requestedDuration,
        bundleGroup
      );

      // Should find 10-day bundle as previous duration for 12 days request
      // Markup difference: $27.00 - $22.00 = $5.00
      // Days difference: 15 - 10 = 5 days
      // Discount per day: $5.00 / 5 = $1.00
      expect(discountPerDay).toBeCloseTo(1.00, 2);
    });
  });

  describe('Revenue calculation accuracy', () => {
    beforeEach(() => {
      const basicRules: CreatePricingRuleInput[] = [
        {
          type: 'SYSTEM_MARKUP' as RuleType,
          name: 'Basic Markup',
          conditions: [],
          actions: [{ type: 'ADD_MARKUP', value: 15.00 }],
          priority: 1000,
          isActive: true,
          isEditable: false
        },
        {
          type: 'SYSTEM_PROCESSING',
          name: 'Basic Processing Fee',
          conditions: [],
          actions: [{ type: 'SET_PROCESSING_RATE', value: 4.0 }],
          priority: 1000,
          isActive: true,
          isEditable: false
        }
      ];

      engine.addSystemRules(basicRules);
    });

    it('should calculate revenue correctly: final revenue = final payment - cost', async () => {
      const context: PricingContext = {
        bundle: {
          id: 'revenue-test-bundle',
          name: 'Revenue Test Bundle',
          group: 'Standard Fixed',
          duration: 7,
          cost: 30.00, // Base cost
          countryId: 'US',
          countryName: 'United States',
          regionId: 'north-america',
          regionName: 'North America',
          isUnlimited: false,
          dataAmount: '5GB'
        },
        paymentMethod: 'FOREIGN_CARD',
        currentDate: new Date(),
        country: 'US',
        region: 'north-america',
        bundleGroup: 'Standard Fixed',
        duration: 7
      };

      const result = await engine.calculatePrice(context);

      // Expected calculation:
      // Base cost: $30.00
      // Markup: $15.00
      // Subtotal: $30.00 + $15.00 = $45.00
      // No discounts applied
      // Price after discount: $45.00
      // Processing fee: $45.00 * 0.04 = $1.80
      // Final price: $45.00 + $1.80 = $46.80
      // Final revenue: $46.80 - $30.00 = $16.80 (what we get from final payment minus cost)
      // Revenue after processing: $46.80 - $1.80 - $30.00 = $15.00 (bottom line after all deductions)

      expect(result.baseCost).toBe(30.00);
      expect(result.markup).toBe(15.00);
      expect(result.subtotal).toBe(45.00);
      expect(result.priceAfterDiscount).toBe(45.00);
      expect(result.processingFee).toBeCloseTo(1.80, 2);
      expect(result.finalPrice).toBeCloseTo(46.80, 2);
      expect(result.finalRevenue).toBeCloseTo(16.80, 2); // Final payment - cost
      expect(result.revenueAfterProcessing).toBeCloseTo(15.00, 2); // Bottom line
      expect(result.profit).toBeCloseTo(15.00, 2); // Same as revenue after processing
    });

    it('should handle edge case: revenue after processing is the bottom line', async () => {
      const context: PricingContext = {
        bundle: {
          id: 'edge-case-bundle',
          name: 'Edge Case Bundle',
          group: 'Standard Fixed',
          duration: 1,
          cost: 50.00, // High base cost
          countryId: 'US',
          countryName: 'United States',
          regionId: 'north-america',
          regionName: 'North America',
          isUnlimited: false,
          dataAmount: '1GB'
        },
        paymentMethod: 'FOREIGN_CARD',
        currentDate: new Date(),
        country: 'US',
        region: 'north-america',
        bundleGroup: 'Standard Fixed',
        duration: 1
      };

      const result = await engine.calculatePrice(context);

      // Verify that revenue after processing is indeed the bottom line
      const expectedRevenueAfterProcessing = result.finalPrice - result.processingFee - result.baseCost;
      expect(result.revenueAfterProcessing).toBeCloseTo(expectedRevenueAfterProcessing, 2);
      
      // Profit should equal revenue after processing
      expect(result.profit).toBeCloseTo(result.revenueAfterProcessing, 2);
      
      // Final revenue should be higher than revenue after processing (doesn't account for processing fee)
      expect(result.finalRevenue).toBeGreaterThan(result.revenueAfterProcessing);
    });
  });

  describe('Multiple discount interactions', () => {
    beforeEach(() => {
      const multipleRules: CreatePricingRuleInput[] = [
        // System markup
        {
          type: 'SYSTEM_MARKUP' as RuleType,
          name: 'Test Markup',
          conditions: [],
          actions: [{ type: 'ADD_MARKUP', value: 20.00 }],
          priority: 1000,
          isActive: true,
          isEditable: false
        },
        // Country discount
        {
          type: 'DISCOUNT',
          name: 'Country Discount',
          conditions: [{ field: 'country', operator: 'EQUALS', value: 'FR' }],
          actions: [{ type: 'APPLY_DISCOUNT_PERCENTAGE', value: 15 }],
          priority: 500,
          isActive: true,
          isEditable: true
        },
        // Bundle group discount
        {
          type: 'DISCOUNT',
          name: 'Bundle Group Discount',
          conditions: [{ field: 'bundleGroup', operator: 'EQUALS', value: 'Standard Fixed' }],
          actions: [{ type: 'APPLY_FIXED_DISCOUNT', value: 5.00 }],
          priority: 400,
          isActive: true,
          isEditable: true
        }
      ];

      engine.addSystemRules([multipleRules[0]]);
      engine.addRules([multipleRules[1], multipleRules[2]]);
    });

    it('should stack multiple discounts correctly', async () => {
      const context: PricingContext = {
        bundle: {
          id: 'multiple-discount-bundle',
          name: 'Multiple Discount Bundle',
          group: 'Standard Fixed',
          duration: 7,
          cost: 25.00,
          countryId: 'FR',
          countryName: 'France',
          regionId: 'europe',
          regionName: 'Europe',
          isUnlimited: false,
          dataAmount: '3GB'
        },
        paymentMethod: 'FOREIGN_CARD',
        currentDate: new Date(),
        country: 'FR',
        region: 'europe',
        bundleGroup: 'Standard Fixed',
        duration: 7
      };

      const result = await engine.calculatePrice(context);

      // Expected calculation:
      // Base cost: $25.00
      // Markup: $20.00
      // Subtotal: $25.00 + $20.00 = $45.00
      // Country discount (15%): $45.00 * 0.15 = $6.75
      // Bundle group discount (fixed): $5.00
      // Total discount: $6.75 + $5.00 = $11.75
      // Price after discount: $45.00 - $11.75 = $33.25

      expect(result.subtotal).toBe(45.00);
      expect(result.totalDiscount).toBeCloseTo(11.75, 2);
      expect(result.priceAfterDiscount).toBeCloseTo(33.25, 2);
      
      // Should have both discounts applied
      expect(result.discounts).toHaveLength(2);
      
      const countryDiscount = result.discounts.find(d => d.ruleName === 'Country Discount');
      expect(countryDiscount?.amount).toBeCloseTo(6.75, 2);
      expect(countryDiscount?.type).toBe('percentage');
      
      const bundleDiscount = result.discounts.find(d => d.ruleName === 'Bundle Group Discount');
      expect(bundleDiscount?.amount).toBe(5.00);
      expect(bundleDiscount?.type).toBe('fixed');
    });
  });
});