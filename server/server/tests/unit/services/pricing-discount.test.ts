import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PricingService } from '../../../src/services/pricing.service';
import { GraphQLError } from 'graphql';

describe('PricingService - Discount Per Day', () => {
  describe('calculatePricing with discount per day', () => {
    it('should apply default 10% discount per day for unused days', () => {
      const result = PricingService.calculatePricing(
        'UL essential 15 days',
        'Austria',
        15,
        {
          cost: 10.00,
          costPlus: 10.00,
          totalCost: 18.00, // Already has 10% discount applied (2 days unused)
          discountRate: 0,
          processingRate: 0.014,
          bundleInfo: {
            originalDuration: 15,
            requestedDuration: 13,
            unusedDays: 2,
            unusedDaysDiscount: 13.33, // (2/15) * 100 = 13.33%
            esimGoPrice: 10.00
          }
        }
      );

      expect(result.cost).toBe(10.00);
      expect(result.costPlus).toBe(10.00);
      expect(result.totalCost).toBe(18.00);
      expect(result.priceAfterDiscount).toBe(18.00);
      expect(result.processingCost).toBeCloseTo(0.252, 2);
      expect(result.finalRevenue).toBeCloseTo(17.75, 2);
      expect(result.netProfit).toBeCloseTo(-0.25, 2);
    });

    it('should apply custom discount per day rate when configured', () => {
      const result = PricingService.calculatePricing(
        'UL essential 30 days',
        'Germany',
        30,
        {
          cost: 15.00,
          costPlus: 10.00,
          totalCost: 22.50, // 10% discount for 3 unused days with 20% rate
          discountRate: 0,
          processingRate: 0.014,
          bundleInfo: {
            originalDuration: 30,
            requestedDuration: 27,
            unusedDays: 3,
            unusedDaysDiscount: 10, // (3/30) * 100 = 10%
            esimGoPrice: 15.00
          }
        }
      );

      expect(result.totalCost).toBe(22.50);
      expect(result.finalRevenue).toBeCloseTo(22.18, 2);
    });

    it('should not apply discount when no unused days', () => {
      const result = PricingService.calculatePricing(
        'UL essential 7 days',
        'France',
        7,
        {
          cost: 5.00,
          costPlus: 10.00,
          totalCost: 15.00,
          discountRate: 0,
          processingRate: 0.014,
          bundleInfo: {
            originalDuration: 7,
            requestedDuration: 7,
            unusedDays: 0,
            unusedDaysDiscount: 0,
            esimGoPrice: 5.00
          }
        }
      );

      expect(result.totalCost).toBe(15.00);
      expect(result.priceAfterDiscount).toBe(15.00);
    });
  });

  describe('getPricingConfig - cost validation', () => {
    let mockCatalogueAPI: any;
    let mockConfigRepository: any;
    let mockPricingAPI: any;

    beforeEach(() => {
      mockCatalogueAPI = {
        searchPlans: vi.fn()
      };
      mockConfigRepository = {
        findMatchingConfiguration: vi.fn()
      };
      mockPricingAPI = {
        getBundlePricing: vi.fn()
      };
    });

    it('should throw INSUFFICIENT_PROFIT_MARGIN error when price is below cost + $1.50', async () => {
      // Mock catalog API to return a bundle
      mockCatalogueAPI.searchPlans.mockResolvedValue({
        bundles: [{
          name: 'Austria Unlimited Essential 15 days',
          duration: 15,
          price: 50.00,
          bundleGroup: 'Standard - Unlimited Essential',
          dataAmount: -1,
          countries: [{ iso: 'AT' }],
          baseCountry: { region: 'europe' }
        }],
        totalCount: 1
      });

      // Mock config with very high discount rate (80%)
      mockConfigRepository.findMatchingConfiguration.mockResolvedValue({
        discountRate: 0,
        discountPerDay: 0.80, // 80% discount per unused day
        processingRate: 0.014
      });

      // Mock pricing API response
      mockPricingAPI.getBundlePricing.mockResolvedValue({
        basePrice: 50.00
      });

      // Mock getFixedMarkup to return $10
      vi.spyOn(PricingService, 'getFixedMarkup').mockResolvedValue(10.00);

      // Request 10 days, will use 15-day bundle with 5 unused days
      // With 80% discount per day: (5/15) * 0.80 = 0.267 = 26.7% discount
      // Total cost before discount: 50 + 10 = 60
      // Total cost after discount: 60 * (1 - 0.267) = 43.98
      // Minimum allowed: 50 + 1.50 = 51.50
      // Should throw error as 43.98 < 51.50

      await expect(
        PricingService.getPricingConfig(
          'AT',
          10,
          mockCatalogueAPI,
          mockConfigRepository,
          'israeli_card',
          mockPricingAPI
        )
      ).rejects.toThrow(GraphQLError);

      await expect(
        PricingService.getPricingConfig(
          'AT',
          10,
          mockCatalogueAPI,
          mockConfigRepository,
          'israeli_card',
          mockPricingAPI
        )
      ).rejects.toMatchObject({
        message: expect.stringContaining('insufficient profit margin'),
        extensions: {
          code: 'INSUFFICIENT_PROFIT_MARGIN'
        }
      });
    });

    it('should allow pricing when profit margin is sufficient', async () => {
      // Mock catalog API to return a bundle
      mockCatalogueAPI.searchPlans.mockResolvedValue({
        bundles: [{
          name: 'Austria Unlimited Essential 15 days',
          duration: 15,
          price: 10.00,
          bundleGroup: 'Standard - Unlimited Essential',
          dataAmount: -1,
          countries: [{ iso: 'AT' }],
          baseCountry: { region: 'europe' }
        }],
        totalCount: 1
      });

      // Mock config with moderate discount rate (20%)
      mockConfigRepository.findMatchingConfiguration.mockResolvedValue({
        discountRate: 0,
        discountPerDay: 0.20, // 20% discount per unused day
        processingRate: 0.014
      });

      // Mock pricing API response
      mockPricingAPI.getBundlePricing.mockResolvedValue({
        basePrice: 10.00
      });

      // Mock getFixedMarkup to return $10
      vi.spyOn(PricingService, 'getFixedMarkup').mockResolvedValue(10.00);

      // Request 10 days, will use 15-day bundle with 5 unused days
      // With 20% discount per day: (5/15) * 0.20 = 0.067 = 6.7% discount
      // Total cost before discount: 10 + 10 = 20
      // Total cost after discount: 20 * (1 - 0.067) = 18.66
      // Minimum allowed: 10 + 1.50 = 11.50
      // Should succeed as 18.66 > 11.50

      const result = await PricingService.getPricingConfig(
        'AT',
        10,
        mockCatalogueAPI,
        mockConfigRepository,
        'israeli_card',
        mockPricingAPI
      );

      expect(result.cost).toBe(10.00);
      expect(result.costPlus).toBe(10.00);
      expect(result.totalCost).toBeCloseTo(18.67, 2);
      expect(result.bundleInfo?.unusedDays).toBe(5);
      expect(result.bundleInfo?.unusedDaysDiscount).toBeCloseTo(6.7, 1);
    });

    it('should use default discount per day rate when not configured', async () => {
      // Mock catalog API to return a bundle
      mockCatalogueAPI.searchPlans.mockResolvedValue({
        bundles: [{
          name: 'France Unlimited Essential 20 days',
          duration: 20,
          price: 12.00,
          bundleGroup: 'Standard - Unlimited Essential',
          dataAmount: -1,
          countries: [{ iso: 'FR' }],
          baseCountry: { region: 'europe' }
        }],
        totalCount: 1
      });

      // Mock config without discountPerDay (should use default 0.10)
      mockConfigRepository.findMatchingConfiguration.mockResolvedValue({
        discountRate: 0,
        processingRate: 0.014
        // discountPerDay is undefined, should use default
      });

      // Mock pricing API response
      mockPricingAPI.getBundlePricing.mockResolvedValue({
        basePrice: 12.00
      });

      // Mock getFixedMarkup to return $10
      vi.spyOn(PricingService, 'getFixedMarkup').mockResolvedValue(10.00);

      // Request 15 days, will use 20-day bundle with 5 unused days
      // With default 10% discount per day: (5/20) * 0.10 = 0.025 = 2.5% discount
      // Total cost before discount: 12 + 10 = 22
      // Total cost after discount: 22 * (1 - 0.025) = 21.45

      const result = await PricingService.getPricingConfig(
        'FR',
        15,
        mockCatalogueAPI,
        mockConfigRepository,
        'israeli_card',
        mockPricingAPI
      );

      expect(result.totalCost).toBeCloseTo(21.45, 2);
      expect(result.bundleInfo?.unusedDaysDiscount).toBeCloseTo(2.5, 1);
    });
  });

  describe('edge cases', () => {
    it('should handle zero cost bundles', () => {
      const result = PricingService.calculatePricing(
        'Test bundle',
        'Test country',
        7,
        {
          cost: 0,
          costPlus: 10.00,
          totalCost: 10.00,
          discountRate: 0,
          processingRate: 0.014
        }
      );

      expect(result.cost).toBe(0);
      expect(result.totalCost).toBe(10.00);
      expect(result.netProfit).toBeCloseTo(-0.14, 2);
    });

    it('should handle 100% discount per day rate edge case', () => {
      // This is an extreme case that should likely be prevented in validation
      const result = PricingService.calculatePricing(
        'Test bundle',
        'Test country',
        10,
        {
          cost: 20.00,
          costPlus: 10.00,
          totalCost: 15.00, // 50% discount applied (half unused days with 100% rate)
          discountRate: 0,
          processingRate: 0.014,
          bundleInfo: {
            originalDuration: 20,
            requestedDuration: 10,
            unusedDays: 10,
            unusedDaysDiscount: 50, // (10/20) * 100 = 50%
            esimGoPrice: 20.00
          }
        }
      );

      expect(result.totalCost).toBe(15.00);
      expect(result.priceAfterDiscount).toBe(15.00);
    });

    it('should handle fractional unused days correctly', () => {
      const result = PricingService.calculatePricing(
        'Test bundle',
        'Test country',
        13,
        {
          cost: 8.50,
          costPlus: 10.00,
          totalCost: 17.76, // Calculated with (2/15) * 0.10 = 1.33% discount
          discountRate: 0,
          processingRate: 0.014,
          bundleInfo: {
            originalDuration: 15,
            requestedDuration: 13,
            unusedDays: 2,
            unusedDaysDiscount: 13.33,
            esimGoPrice: 8.50
          }
        }
      );

      expect(result.totalCost).toBe(17.76);
      expect(result.finalRevenue).toBeCloseTo(17.51, 2);
    });
  });
});