import { describe, it, expect, vi } from 'vitest';
import { PricingService } from '../../../src/services/pricing.service';
import { GraphQLError } from 'graphql';

describe('PricingService - Cost Validation Edge Cases', () => {
  describe('minimum profit margin validation', () => {
    it('should enforce $1.50 minimum profit margin', async () => {
      const mockCatalogueAPI = {
        searchPlans: vi.fn().mockResolvedValue({
          bundles: [{
            name: 'Test Bundle 30 days',
            duration: 30,
            price: 20.00,
            bundleGroup: 'Standard - Unlimited Essential',
            dataAmount: -1,
            countries: [{ iso: 'TEST' }],
            baseCountry: { region: 'test' }
          }],
          totalCount: 1
        })
      };

      const mockConfigRepository = {
        findMatchingConfiguration: vi.fn().mockResolvedValue({
          discountRate: 0,
          discountPerDay: 0.50, // 50% discount per unused day
          processingRate: 0.014
        })
      };

      vi.spyOn(PricingService, 'getFixedMarkup').mockResolvedValue(5.00);

      // Request 15 days, will use 30-day bundle with 15 unused days
      // Discount: (15/30) * 0.50 = 0.25 = 25% discount
      // Total before discount: 20 + 5 = 25
      // Total after discount: 25 * (1 - 0.25) = 18.75
      // Minimum allowed: 20 + 1.50 = 21.50
      // Should fail: 18.75 < 21.50

      await expect(
        PricingService.getPricingConfig(
          'TEST',
          15,
          mockCatalogueAPI,
          mockConfigRepository
        )
      ).rejects.toMatchObject({
        message: expect.stringContaining('insufficient profit margin'),
        extensions: {
          code: 'INSUFFICIENT_PROFIT_MARGIN',
          calculatedPrice: 18.75,
          minimumPrice: 21.50,
          profitShortfall: 2.75
        }
      });
    });

    it('should allow pricing at exactly $1.50 profit margin', async () => {
      const mockCatalogueAPI = {
        searchPlans: vi.fn().mockResolvedValue({
          bundles: [{
            name: 'Test Bundle 20 days',
            duration: 20,
            price: 10.00,
            bundleGroup: 'Standard - Unlimited Essential',
            dataAmount: -1,
            countries: [{ iso: 'TEST' }],
            baseCountry: { region: 'test' }
          }],
          totalCount: 1
        })
      };

      const mockConfigRepository = {
        findMatchingConfiguration: vi.fn().mockResolvedValue({
          discountRate: 0,
          discountPerDay: 0.25, // 25% discount per unused day
          processingRate: 0.014
        })
      };

      // Calculate markup to get exactly $1.50 profit after discount
      // Need: finalPrice = 10 + 1.50 = 11.50
      // With 5 unused days: (5/20) * 0.25 = 0.0625 = 6.25% discount
      // Before discount price needed: 11.50 / (1 - 0.0625) = 12.27
      // So markup needed: 12.27 - 10 = 2.27
      vi.spyOn(PricingService, 'getFixedMarkup').mockResolvedValue(2.27);

      const result = await PricingService.getPricingConfig(
        'TEST',
        15,
        mockCatalogueAPI,
        mockConfigRepository
      );

      expect(result.cost).toBe(10.00);
      expect(result.totalCost).toBeCloseTo(11.50, 2);
      // Should be just above minimum (10 + 1.50)
      expect(result.totalCost).toBeGreaterThanOrEqual(11.50);
    });
  });

  describe('extreme discount scenarios', () => {
    it('should handle 90% discount per day rate', async () => {
      const mockCatalogueAPI = {
        searchPlans: vi.fn().mockResolvedValue({
          bundles: [{
            name: 'Premium Bundle 30 days',
            duration: 30,
            price: 100.00,
            bundleGroup: 'Standard - Unlimited Plus',
            dataAmount: -1,
            countries: [{ iso: 'PREMIUM' }],
            baseCountry: { region: 'premium' }
          }],
          totalCount: 1
        })
      };

      const mockConfigRepository = {
        findMatchingConfiguration: vi.fn().mockResolvedValue({
          discountRate: 0,
          discountPerDay: 0.90, // 90% discount per unused day
          processingRate: 0.014
        })
      };

      vi.spyOn(PricingService, 'getFixedMarkup').mockResolvedValue(50.00);

      // Request 1 day, will use 30-day bundle with 29 unused days
      // Discount: (29/30) * 0.90 = 0.87 = 87% discount
      // Total before discount: 100 + 50 = 150
      // Total after discount: 150 * (1 - 0.87) = 19.50
      // Minimum allowed: 100 + 1.50 = 101.50
      // Should fail dramatically: 19.50 << 101.50

      await expect(
        PricingService.getPricingConfig(
          'PREMIUM',
          1,
          mockCatalogueAPI,
          mockConfigRepository
        )
      ).rejects.toMatchObject({
        extensions: {
          code: 'INSUFFICIENT_PROFIT_MARGIN',
          calculatedPrice: 19.50,
          minimumPrice: 101.50,
          profitShortfall: 82.00
        }
      });
    });

    it('should handle very low cost bundles', async () => {
      const mockCatalogueAPI = {
        searchPlans: vi.fn().mockResolvedValue({
          bundles: [{
            name: 'Budget Bundle 7 days',
            duration: 7,
            price: 0.50, // Very low cost
            bundleGroup: 'Standard Fixed',
            dataAmount: 100,
            countries: [{ iso: 'BUDGET' }],
            baseCountry: { region: 'budget' }
          }],
          totalCount: 1
        })
      };

      const mockConfigRepository = {
        findMatchingConfiguration: vi.fn().mockResolvedValue({
          discountRate: 0,
          discountPerDay: 0.50,
          processingRate: 0.014
        })
      };

      vi.spyOn(PricingService, 'getFixedMarkup').mockResolvedValue(1.00);

      // Request 3 days, will use 7-day bundle with 4 unused days
      // Discount: (4/7) * 0.50 = 0.286 = 28.6% discount
      // Total before discount: 0.50 + 1.00 = 1.50
      // Total after discount: 1.50 * (1 - 0.286) = 1.07
      // Minimum allowed: 0.50 + 1.50 = 2.00
      // Should fail: 1.07 < 2.00

      await expect(
        PricingService.getPricingConfig(
          'BUDGET',
          3,
          mockCatalogueAPI,
          mockConfigRepository
        )
      ).rejects.toMatchObject({
        extensions: {
          code: 'INSUFFICIENT_PROFIT_MARGIN',
          calculatedPrice: expect.closeTo(1.07, 2),
          minimumPrice: 2.00
        }
      });
    });

    it('should handle zero markup scenario', async () => {
      const mockCatalogueAPI = {
        searchPlans: vi.fn().mockResolvedValue({
          bundles: [{
            name: 'Zero Markup Bundle 10 days',
            duration: 10,
            price: 5.00,
            bundleGroup: 'Standard - Unlimited Essential',
            dataAmount: -1,
            countries: [{ iso: 'ZERO' }],
            baseCountry: { region: 'test' }
          }],
          totalCount: 1
        })
      };

      const mockConfigRepository = {
        findMatchingConfiguration: vi.fn().mockResolvedValue({
          discountRate: 0,
          discountPerDay: 0.30,
          processingRate: 0.014
        })
      };

      vi.spyOn(PricingService, 'getFixedMarkup').mockResolvedValue(0.00); // Zero markup

      // Request 5 days, will use 10-day bundle with 5 unused days
      // Discount: (5/10) * 0.30 = 0.15 = 15% discount
      // Total before discount: 5 + 0 = 5
      // Total after discount: 5 * (1 - 0.15) = 4.25
      // Minimum allowed: 5 + 1.50 = 6.50
      // Should fail: 4.25 < 6.50

      await expect(
        PricingService.getPricingConfig(
          'ZERO',
          5,
          mockCatalogueAPI,
          mockConfigRepository
        )
      ).rejects.toMatchObject({
        extensions: {
          code: 'INSUFFICIENT_PROFIT_MARGIN',
          calculatedPrice: 4.25,
          minimumPrice: 6.50
        }
      });
    });
  });

  describe('boundary conditions', () => {
    it('should handle exactly 100% discount scenario', async () => {
      const mockCatalogueAPI = {
        searchPlans: vi.fn().mockResolvedValue({
          bundles: [{
            name: 'Full Discount Bundle 2 days',
            duration: 2,
            price: 10.00,
            bundleGroup: 'Standard - Unlimited Essential',
            dataAmount: -1,
            countries: [{ iso: 'FULL' }],
            baseCountry: { region: 'test' }
          }],
          totalCount: 1
        })
      };

      const mockConfigRepository = {
        findMatchingConfiguration: vi.fn().mockResolvedValue({
          discountRate: 0,
          discountPerDay: 1.00, // 100% discount per unused day
          processingRate: 0.014
        })
      };

      vi.spyOn(PricingService, 'getFixedMarkup').mockResolvedValue(10.00);

      // Request 1 day, will use 2-day bundle with 1 unused day
      // Discount: (1/2) * 1.00 = 0.50 = 50% discount
      // Total before discount: 10 + 10 = 20
      // Total after discount: 20 * (1 - 0.50) = 10
      // Minimum allowed: 10 + 1.50 = 11.50
      // Should fail: 10 < 11.50

      await expect(
        PricingService.getPricingConfig(
          'FULL',
          1,
          mockCatalogueAPI,
          mockConfigRepository
        )
      ).rejects.toMatchObject({
        extensions: {
          code: 'INSUFFICIENT_PROFIT_MARGIN',
          calculatedPrice: 10.00,
          minimumPrice: 11.50
        }
      });
    });

    it('should handle high cost high discount scenario', async () => {
      const mockCatalogueAPI = {
        searchPlans: vi.fn().mockResolvedValue({
          bundles: [{
            name: 'Enterprise Bundle 365 days',
            duration: 365,
            price: 1000.00,
            bundleGroup: 'Enterprise',
            dataAmount: -1,
            countries: [{ iso: 'ENT' }],
            baseCountry: { region: 'enterprise' }
          }],
          totalCount: 1
        })
      };

      const mockConfigRepository = {
        findMatchingConfiguration: vi.fn().mockResolvedValue({
          discountRate: 0,
          discountPerDay: 0.60, // 60% discount per unused day
          processingRate: 0.014
        })
      };

      vi.spyOn(PricingService, 'getFixedMarkup').mockResolvedValue(200.00);

      // Request 30 days, will use 365-day bundle with 335 unused days
      // Discount: (335/365) * 0.60 = 0.551 = 55.1% discount
      // Total before discount: 1000 + 200 = 1200
      // Total after discount: 1200 * (1 - 0.551) = 538.80
      // Minimum allowed: 1000 + 1.50 = 1001.50
      // Should fail: 538.80 < 1001.50

      await expect(
        PricingService.getPricingConfig(
          'ENT',
          30,
          mockCatalogueAPI,
          mockConfigRepository
        )
      ).rejects.toMatchObject({
        extensions: {
          code: 'INSUFFICIENT_PROFIT_MARGIN',
          profitShortfall: expect.any(Number)
        }
      });
    });

    it('should allow maximum safe discount without violating profit margin', async () => {
      const cost = 20.00;
      const markup = 10.00;
      const unusedRatio = 0.5; // 50% unused days
      
      // Calculate maximum safe discount rate
      // Need: (cost + markup) * (1 - unusedRatio * discountRate) >= cost + 1.50
      // 30 * (1 - 0.5 * discountRate) >= 21.50
      // 30 - 15 * discountRate >= 21.50
      // 8.50 >= 15 * discountRate
      // discountRate <= 0.567 (56.7%)

      const mockCatalogueAPI = {
        searchPlans: vi.fn().mockResolvedValue({
          bundles: [{
            name: 'Safe Discount Bundle 20 days',
            duration: 20,
            price: cost,
            bundleGroup: 'Standard - Unlimited Essential',
            dataAmount: -1,
            countries: [{ iso: 'SAFE' }],
            baseCountry: { region: 'test' }
          }],
          totalCount: 1
        })
      };

      const mockConfigRepository = {
        findMatchingConfiguration: vi.fn().mockResolvedValue({
          discountRate: 0,
          discountPerDay: 0.56, // Just under maximum safe rate
          processingRate: 0.014
        })
      };

      vi.spyOn(PricingService, 'getFixedMarkup').mockResolvedValue(markup);

      // Request 10 days, will use 20-day bundle with 10 unused days (50%)
      const result = await PricingService.getPricingConfig(
        'SAFE',
        10,
        mockCatalogueAPI,
        mockConfigRepository
      );

      expect(result.cost).toBe(20.00);
      expect(result.totalCost).toBeCloseTo(21.60, 2); // Just above minimum
      expect(result.totalCost).toBeGreaterThan(21.50); // cost + 1.50
    });
  });
});