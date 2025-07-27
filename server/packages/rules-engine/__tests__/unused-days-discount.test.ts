import { beforeEach, describe, expect, it } from 'vitest';
import { PricingEngine } from '../src/pricing-engine';
import { PaymentMethod, type Bundle, type PricingEngineInput } from '../src/rules-engine-types';

describe('Unused Days Discount', () => {
  let pricingEngine: PricingEngine;
  
  // Test bundles with different durations - simulating real bundle catalog
  const testBundles: Bundle[] = [
    {
      name: 'Spain 1GB 5D',
      description: '1GB for 5 days in Spain',
      groups: ['Standard Fixed'],
      validityInDays: 5,
      dataAmountMB: 1000,
      dataAmountReadable: '1GB',
      isUnlimited: false,
      countries: ['ES'],
      region: 'Europe',
      speed: ['4G'],
      currency: 'USD',
      basePrice: 8.00
    },
    {
      name: 'Spain 2GB 10D',
      description: '2GB for 10 days in Spain',
      groups: ['Standard Fixed'],
      validityInDays: 10,
      dataAmountMB: 2000,
      dataAmountReadable: '2GB',
      isUnlimited: false,
      countries: ['ES'],
      region: 'Europe',
      speed: ['4G'],
      currency: 'USD',
      basePrice: 15.00
    },
    {
      name: 'Spain 3GB 15D',
      description: '3GB for 15 days in Spain',
      groups: ['Standard Fixed'],
      validityInDays: 15,
      dataAmountMB: 3000,
      dataAmountReadable: '3GB',
      isUnlimited: false,
      countries: ['ES'],
      region: 'Europe',
      speed: ['4G'],
      currency: 'USD',
      basePrice: 25.00
    },
    {
      name: 'Spain 5GB 30D',
      description: '5GB for 30 days in Spain',
      groups: ['Standard Fixed'],
      validityInDays: 30,
      dataAmountMB: 5000,
      dataAmountReadable: '5GB',
      isUnlimited: false,
      countries: ['ES'],
      region: 'Europe',
      speed: ['4G'],
      currency: 'USD',
      basePrice: 45.00
    }
  ];

  const createPricingInput = (requestedDuration: number): PricingEngineInput => ({
    bundles: testBundles,
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
      duration: requestedDuration,
      paymentMethod: PaymentMethod.IsraeliCard,
      countryISO: 'ES',
      region: 'Europe',
      dataType: 'DEFAULT' as any
    },
    steps: [],
    unusedDays: 0,
    country: 'ES',
    region: 'Europe',
    group: 'Standard Fixed',
    dataType: 'DEFAULT' as any,
    metadata: {
      correlationId: `test-unused-days-${requestedDuration}d`
    }
  });

  beforeEach(() => {
    pricingEngine = new PricingEngine();
  });

  describe('Basic Unused Days Discount Calculation', () => {
    it('should apply unused days discount when user wants 13 days (between 10d and 15d)', async () => {
      const result = await pricingEngine.calculatePrice(createPricingInput(13));

      // Expected logic:
      // - User wants: 13 days
      // - Available: 5d($8), 10d($15), 15d($25), 30d($45)
      // - Selected: 15d bundle ($25)
      // - Previous: 10d bundle ($15)
      // - Unused days: 15 - 13 = 2 days
      // - Discount per day: ($25 - $15) / (15 - 10) = $10 / 5 = $2/day
      // - Total unused discount: 2 days * $2/day = $4
      // - Final price: $25 - $4 = $21

      expect(result.selectedBundle?.name).toBe('Spain 3GB 15D');
      expect(result.selectedBundle?.validityInDays).toBe(15);
      expect(result.unusedDays).toBe(2); // 15 - 13
      
      expect(result.pricing.cost).toBe(25.00);
      expect(result.pricing.totalCost).toBe(25.00);
      expect(result.pricing.discountPerDay).toBeCloseTo(2.00, 2); // ($25-$15)/(15-10) = $2/day
      expect(result.pricing.discountValue).toBeCloseTo(4.00, 2); // 2 unused days * $2/day
      expect(result.pricing.priceAfterDiscount).toBeCloseTo(21.00, 2); // $25 - $4
      expect(result.pricing.finalRevenue).toBeCloseTo(21.00, 2);
    });

    it('should apply unused days discount when user wants 7 days (between 5d and 10d)', async () => {
      const result = await pricingEngine.calculatePrice(createPricingInput(7));

      // Expected logic:
      // - User wants: 7 days
      // - Available: 5d($8), 10d($15), 15d($25), 30d($45)
      // - Selected: 10d bundle ($15)
      // - Previous: 5d bundle ($8)
      // - Unused days: 10 - 7 = 3 days
      // - Discount per day: ($15 - $8) / (10 - 5) = $7 / 5 = $1.40/day
      // - Total unused discount: 3 days * $1.40/day = $4.20
      // - Final price: $15 - $4.20 = $10.80

      expect(result.selectedBundle?.name).toBe('Spain 2GB 10D');
      expect(result.selectedBundle?.validityInDays).toBe(10);
      expect(result.unusedDays).toBe(3); // 10 - 7
      
      expect(result.pricing.cost).toBe(15.00);
      expect(result.pricing.totalCost).toBe(15.00);
      expect(result.pricing.discountPerDay).toBeCloseTo(1.40, 2); // ($15-$8)/(10-5) = $1.40/day
      expect(result.pricing.discountValue).toBeCloseTo(4.20, 2); // 3 unused days * $1.40/day
      expect(result.pricing.priceAfterDiscount).toBeCloseTo(10.80, 2); // $15 - $4.20
      expect(result.pricing.finalRevenue).toBeCloseTo(10.80, 2);
    });

    it('should apply unused days discount when user wants 20 days (between 15d and 30d)', async () => {
      const result = await pricingEngine.calculatePrice(createPricingInput(20));

      // Expected logic:
      // - User wants: 20 days
      // - Available: 5d($8), 10d($15), 15d($25), 30d($45)
      // - Selected: 30d bundle ($45)
      // - Previous: 15d bundle ($25)
      // - Unused days: 30 - 20 = 10 days
      // - Discount per day: ($45 - $25) / (30 - 15) = $20 / 15 = $1.33/day
      // - Total unused discount: 10 days * $1.33/day = $13.33
      // - Final price: $45 - $13.33 = $31.67

      expect(result.selectedBundle?.name).toBe('Spain 5GB 30D');
      expect(result.selectedBundle?.validityInDays).toBe(30);
      expect(result.unusedDays).toBe(10); // 30 - 20
      
      expect(result.pricing.cost).toBe(45.00);
      expect(result.pricing.totalCost).toBe(45.00);
      expect(result.pricing.discountPerDay).toBeCloseTo(1.33, 2); // ($45-$25)/(30-15) = $1.33/day
      expect(result.pricing.discountValue).toBeCloseTo(13.33, 2); // 10 unused days * $1.33/day
      expect(result.pricing.priceAfterDiscount).toBeCloseTo(31.67, 2); // $45 - $13.33
      expect(result.pricing.finalRevenue).toBeCloseTo(31.67, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should NOT apply unused days discount for exact duration match', async () => {
      const result = await pricingEngine.calculatePrice(createPricingInput(15));

      // User wants exactly 15 days, bundle is 15 days - no unused days
      expect(result.selectedBundle?.validityInDays).toBe(15);
      expect(result.unusedDays).toBe(0);
      
      expect(result.pricing.discountPerDay).toBe(0);
      expect(result.pricing.discountValue).toBe(0);
      expect(result.pricing.priceAfterDiscount).toBe(25.00); // No discount
      expect(result.pricing.finalRevenue).toBe(25.00);
    });

    it('should NOT apply unused days discount when no previous bundle exists', async () => {
      const result = await pricingEngine.calculatePrice(createPricingInput(2));

      // User wants 2 days, selected bundle is 5d (smallest available)
      // No previous bundle exists for 5d, so no unused days discount
      expect(result.selectedBundle?.validityInDays).toBe(5);
      expect(result.unusedDays).toBe(3); // 5 - 2
      
      expect(result.pricing.discountPerDay).toBe(0); // No previous bundle to calculate from
      expect(result.pricing.discountValue).toBe(0);
      expect(result.pricing.priceAfterDiscount).toBe(8.00); // No discount
      expect(result.pricing.finalRevenue).toBe(8.00);
    });

    it('should handle user requesting more than maximum available duration', async () => {
      const result = await pricingEngine.calculatePrice(createPricingInput(45));

      // User wants 45 days, largest bundle is 30d
      // Should select 30d bundle but no unused days discount (user gets less than requested)
      expect(result.selectedBundle?.validityInDays).toBe(30);
      expect(result.unusedDays).toBe(0); // User gets 30d but wanted 45d - no unused days
      
      expect(result.pricing.discountPerDay).toBe(0);
      expect(result.pricing.discountValue).toBe(0);
      expect(result.pricing.priceAfterDiscount).toBe(45.00);
      expect(result.pricing.finalRevenue).toBe(45.00);
    });
  });

  describe('Integration with Other Rules', () => {
    it('should combine unused days discount with markup rules', async () => {
      // Add a markup rule
      const markupRule = {
        id: 'spain-markup',
        category: 'BUNDLE_ADJUSTMENT' as any,
        name: 'Spain Markup',
        description: '$3 markup for Spain bundles',
        conditions: [
          {
            field: 'country',
            operator: 'EQUALS' as any,
            value: 'ES',
            type: 'string'
          }
        ],
        actions: [
          {
            type: 'ADD_MARKUP' as any,
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
      pricingEngine.addRules([markupRule]);

      const result = await pricingEngine.calculatePrice(createPricingInput(13));

      // Expected logic:
      // - Selected: 15d bundle ($25) + $3 markup = $28 total cost
      // - Previous: 10d bundle ($15) + $3 markup = $18 total cost  
      // - Discount per day: ($28 - $18) / (15 - 10) = $10 / 5 = $2/day
      // - Unused days discount: 2 days * $2/day = $4
      // - Final price: $28 - $4 = $24

      expect(result.pricing.cost).toBe(25.00);
      expect(result.pricing.markup).toBe(3.00);
      expect(result.pricing.totalCost).toBe(28.00); // $25 + $3
      expect(result.pricing.discountPerDay).toBeCloseTo(2.00, 2); // Same as before since markup is consistent
      expect(result.pricing.discountValue).toBeCloseTo(4.00, 2);
      expect(result.pricing.priceAfterDiscount).toBeCloseTo(24.00, 2); // $28 - $4
      expect(result.pricing.finalRevenue).toBeCloseTo(24.00, 2);
    });

    it('should combine unused days discount with percentage discount rules', async () => {
      // Add a percentage discount rule
      const discountRule = {
        id: 'europe-discount',
        category: 'DISCOUNT' as any,
        name: 'Europe 15% Discount',
        description: '15% discount for Europe region',
        conditions: [
          {
            field: 'region',
            operator: 'EQUALS' as any,
            value: 'Europe',
            type: 'string'
          }
        ],
        actions: [
          {
            type: 'APPLY_DISCOUNT_PERCENTAGE' as any,
            value: 15
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
      pricingEngine.addRules([discountRule]);

      const result = await pricingEngine.calculatePrice(createPricingInput(13));

      // The actual behavior might be different - percentage discount is applied to total cost first
      // Let's check what's actually happening:
      // - Total cost: $25
      // - 15% Europe discount: $25 * 15% = $3.75
      // - Price after percentage discount: $25 - $3.75 = $21.25
      // - Then unused days discount: 2 days * $2/day = $4
      // - Total discount: $3.75 + $4 = $7.75
      // - Final price: $25 - $7.75 = $17.25

      expect(result.pricing.cost).toBe(25.00);
      expect(result.pricing.totalCost).toBe(25.00);
      expect(result.pricing.discountPerDay).toBeCloseTo(2.00, 2);
      
      // Based on actual behavior - percentage discount applied first, then unused days discount
      expect(result.pricing.discountValue).toBeCloseTo(7.75, 2); // $3.75 (15%) + $4 (unused days)
      expect(result.pricing.priceAfterDiscount).toBeCloseTo(17.25, 2); // $25 - $7.75
      expect(result.pricing.finalRevenue).toBeCloseTo(17.25, 2);
    });
  });

  describe('Complex Pricing Scenarios', () => {
    it('should handle user scenario: 13 days request with markup and processing fees', async () => {
      // Add markup and processing fee rules
      const markupRule = {
        id: 'spain-markup',
        category: 'BUNDLE_ADJUSTMENT' as any,
        name: 'Spain Markup',
        description: '$2 markup for Spain bundles',
        conditions: [
          {
            field: 'country',
            operator: 'EQUALS' as any,
            value: 'ES',
            type: 'string'
          }
        ],
        actions: [
          {
            type: 'ADD_MARKUP' as any,
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

      const processingFeeRule = {
        id: 'processing-fee',
        category: 'FEE' as any,
        name: '2.9% Processing Fee',
        description: '2.9% processing fee',
        conditions: [],
        actions: [
          {
            type: 'SET_PROCESSING_RATE' as any,
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

      const result = await pricingEngine.calculatePrice(createPricingInput(13));

      // Expected calculation:
      // 1. Selected: 15d bundle ($25) + $2 markup = $27 total cost
      // 2. Previous: 10d bundle ($15) + $2 markup = $17 total cost
      // 3. Discount per day: ($27 - $17) / (15 - 10) = $10 / 5 = $2/day  
      // 4. Unused days discount: 2 days * $2/day = $4
      // 5. Price after discount: $27 - $4 = $23
      // 6. Processing fee: $23 * 2.9% = $0.667
      // 7. Final revenue: $23 (what customer pays)
      // 8. Revenue after processing: $23 - $0.667 = $22.333

      expect(result.pricing.cost).toBe(25.00);
      expect(result.pricing.markup).toBe(2.00);
      expect(result.pricing.totalCost).toBe(27.00);
      expect(result.pricing.discountPerDay).toBeCloseTo(2.00, 2);
      expect(result.pricing.discountValue).toBeCloseTo(4.00, 2);
      expect(result.pricing.priceAfterDiscount).toBeCloseTo(23.00, 2);
      expect(result.pricing.processingCost).toBeCloseTo(0.667, 3);
      expect(result.pricing.finalRevenue).toBeCloseTo(23.00, 2); // What customer pays
      expect(result.pricing.revenueAfterProcessing).toBeCloseTo(22.333, 3); // What we receive
    });
  });
});