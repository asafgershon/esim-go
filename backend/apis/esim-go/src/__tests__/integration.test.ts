import { describe, it, expect } from 'vitest';
import { createPrismClient } from '../testing/mock-config';
import { OrderRequestTypeEnum, BundleOrderTypeEnum } from '../generated';

describe('ESimGoClient Integration Tests', () => {
  const client = createPrismClient();

  describe('Full Order Flow', () => {
    it('should complete a full order flow', async () => {
      // Step 1: Get catalogue
      const catalogueResult = await client.getCatalogueWithRetry({
        countries: 'US',
        perPage: 5,
      });
      
      expect(catalogueResult.data).toBeDefined();
      const firstBundle = catalogueResult.data[0];
      
      if (!firstBundle) {
        console.warn('No bundles returned from catalogue');
        return;
      }

      // Step 2: Place an order
      const orderResponse = await client.ordersApi.ordersPost({
        orderRequest: {
          type: OrderRequestTypeEnum.VALIDATE,
          order: [{
            type: BundleOrderTypeEnum.BUNDLE,
            item: firstBundle.name || 'TEST_BUNDLE',
            quantity: 1,
          }],
        },
      });

      expect(orderResponse.data).toBeDefined();
      
      // Step 3: If validation passed, place actual order
      if (orderResponse.data) {
        const actualOrder = await client.ordersApi.ordersPost({
          orderRequest: {
            type: OrderRequestTypeEnum.TRANSACTION,
            assign: true,
            order: [{
              type: BundleOrderTypeEnum.BUNDLE,
              item: firstBundle.name || 'TEST_BUNDLE',
              quantity: 1,
            }],
          },
        });

        expect(actualOrder.data).toBeDefined();
      }
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = [
        client.getCatalogueWithRetry({ countries: 'US' }),
        client.getCatalogueWithRetry({ countries: 'EU' }),
        client.getCatalogueWithRetry({ countries: 'ASIA' }),
        client.getOrganizationGroups(),
      ];

      const results = await Promise.allSettled(requests);
      
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(result.value).toBeDefined();
          expect(result.value.metadata).toBeDefined();
        }
      });
    });
  });

  describe('Bundle Search and Filtering', () => {
    it('should search bundles by multiple criteria', async () => {
      const searchResult = await client.searchCatalog({
        countries: ['US', 'CA', 'MX'],
        minDuration: 7,
        maxDuration: 30,
        unlimited: false,
      });

      expect(searchResult).toBeDefined();
      expect(searchResult.data).toBeDefined();
      expect(Array.isArray(searchResult.data)).toBe(true);

      // If bundles are returned, verify they match criteria
      if (searchResult.data.length > 0) {
        searchResult.data.forEach(bundle => {
          if (bundle.duration) {
            expect(bundle.duration).toBeGreaterThanOrEqual(7);
            expect(bundle.duration).toBeLessThanOrEqual(30);
          }
        });
      }
    });

    it('should handle empty search results gracefully', async () => {
      const searchResult = await client.searchCatalog({
        countries: ['XX'], // Non-existent country code
      });

      expect(searchResult).toBeDefined();
      expect(searchResult.data).toBeDefined();
      expect(Array.isArray(searchResult.data)).toBe(true);
    });
  });
});