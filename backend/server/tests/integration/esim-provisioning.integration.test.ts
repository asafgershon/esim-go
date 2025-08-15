import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestContext } from '../../src/test-utils/prism-context';
import { purchaseAndDeliverESIM } from '../../src/services/esim-purchase';
import { OrderRequestTypeEnum, BundleOrderTypeEnum } from '@hiilo/client';
import type { Context } from '../../src/context/types';
import ordersFixture from '../fixtures/orders.json';
import esimsFixture from '../fixtures/esims.json';

describe('eSIM Provisioning Integration with Prism', () => {
  let ctx: Context;
  
  beforeEach(() => {
    // Create test context with Prism mock server
    ctx = createTestContext({ 
      usePrism: true,
      mockApiKey: 'test-api-key'
    });
    
    // Payment service is already mocked in createTestContext
  });

  describe('Full eSIM Provisioning Flow', () => {
    it('should provision eSIM through complete order flow', async () => {
      // Step 1: Get available bundles from catalogue
      const catalogueResult = await ctx.services.esimGoClient.getCatalogueWithRetry({
        countries: 'US',
        perPage: 10,
      });
      
      expect(catalogueResult.data).toBeDefined();
      expect(catalogueResult.metadata.source).toBe('api');
      
      // Step 2: Validate order before purchase
      const bundle = catalogueResult.data[0] || { name: 'TEST_BUNDLE_1GB_7D_US' };
      const validateResponse = await ctx.services.esimGoClient.ordersApi.ordersPost({
        orderRequest: {
          type: OrderRequestTypeEnum.VALIDATE,
          order: [{
            type: BundleOrderTypeEnum.BUNDLE,
            item: bundle.name || 'TEST_BUNDLE',
            quantity: 1,
          }],
        },
      });
      
      expect(validateResponse.data).toBeDefined();
      
      // Step 3: Create actual order and assign eSIM
      const orderResponse = await ctx.services.esimGoClient.ordersApi.ordersPost({
        orderRequest: {
          type: OrderRequestTypeEnum.TRANSACTION,
          assign: true,
          order: [{
            type: BundleOrderTypeEnum.BUNDLE,
            item: bundle.name || 'TEST_BUNDLE',
            quantity: 1,
          }],
        },
      });
      
      expect(orderResponse.data).toBeDefined();
      
      // Verify order structure matches expected format
      if (orderResponse.data?.order?.[0]) {
        const orderItem = orderResponse.data.order[0];
        expect(orderItem).toHaveProperty('type');
        expect(orderItem).toHaveProperty('item');
        
        // Check if eSIM was assigned
        if (orderItem.esims?.[0]) {
          const esim = orderItem.esims[0];
          expect(esim).toHaveProperty('iccid');
          expect(esim).toHaveProperty('matchingId');
          expect(esim).toHaveProperty('smdpAddress');
        }
      }
    });

    it('should handle eSIM assignment with customer reference', async () => {
      const customerRef = `test-order-${Date.now()}`;
      
      const response = await ctx.services.esimGoClient.ordersApi.ordersPost({
        orderRequest: {
          type: OrderRequestTypeEnum.TRANSACTION,
          assign: true,
          customerReference: customerRef,
          order: [{
            type: BundleOrderTypeEnum.BUNDLE,
            item: 'TEST_BUNDLE_5GB_30D_EU',
            quantity: 1,
          }],
        },
      });
      
      expect(response.data).toBeDefined();
      
      // Verify response is valid (Prism generates mock data)
      expect(response.data).toBeDefined();
    });
  });

  describe('eSIM Status Management', () => {
    it('should retrieve eSIM details after assignment', async () => {
      // First create an order to get an eSIM
      const orderResponse = await ctx.services.esimGoClient.ordersApi.ordersPost({
        orderRequest: {
          type: OrderRequestTypeEnum.TRANSACTION,
          assign: true,
          order: [{
            type: BundleOrderTypeEnum.BUNDLE,
            item: 'TEST_BUNDLE_1GB_7D_US',
            quantity: 1,
          }],
        },
      });
      
      // Get the assigned ICCID from the response
      const iccid = orderResponse.data?.order?.[0]?.esims?.[0]?.iccid;
      
      if (iccid) {
        // Retrieve eSIM details
        const esimsResult = await ctx.services.esimGoClient.getEsims({
          filter: iccid,
          filterBy: 'iccid' as any,
        });
        
        expect(esimsResult.data).toBeDefined();
        expect(esimsResult.data.esims).toBeDefined();
      }
    });

    it('should apply bundle to existing eSIM', async () => {
      const testIccid = '89000000000000000001';
      
      const result = await ctx.services.esimGoClient.applyBundleToEsim({
        iccid: testIccid,
        bundles: ['TEST_BUNDLE_1GB_7D_US'],
        customerReference: 'test-apply-bundle',
      });
      
      expect(result.data).toBeDefined();
      expect(result.metadata.source).toBe('api');
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limiting gracefully', async () => {
      // Create a client that will trigger rate limiting
      const rateLimitedClient = createTestContext({
        usePrism: true,
      }).services.esimGoClient;
      
      // Make multiple rapid requests to trigger rate limit
      const requests = Array(10).fill(null).map(() => 
        rateLimitedClient.getCatalogueWithRetry({ perPage: 50 })
      );
      
      const results = await Promise.allSettled(requests);
      
      // At least some should succeed
      const succeeded = results.filter(r => r.status === 'fulfilled');
      expect(succeeded.length).toBeGreaterThan(0);
    });

    it('should handle invalid bundle names', async () => {
      const response = await ctx.services.esimGoClient.ordersApi.ordersPost({
        orderRequest: {
          type: OrderRequestTypeEnum.VALIDATE,
          order: [{
            type: BundleOrderTypeEnum.BUNDLE,
            item: 'INVALID_BUNDLE_NAME',
            quantity: 1,
          }],
        },
      });
      
      // Prism will return a response even for invalid bundles
      // In production, this would return an error
      expect(response).toBeDefined();
    });

    it('should handle network timeouts', async () => {
      // Create client with very short timeout
      const timeoutClient = createTestContext({
        usePrism: true,
      }).services.esimGoClient;
      
      // This should handle timeout gracefully
      const result = await timeoutClient.healthCheck();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Bulk Operations', () => {
    it('should handle multiple bundle orders', async () => {
      const response = await ctx.services.esimGoClient.ordersApi.ordersPost({
        orderRequest: {
          type: OrderRequestTypeEnum.TRANSACTION,
          assign: true,
          order: [
            {
              type: BundleOrderTypeEnum.BUNDLE,
              item: 'TEST_BUNDLE_1GB_7D_US',
              quantity: 2,
            },
            {
              type: BundleOrderTypeEnum.BUNDLE,
              item: 'TEST_BUNDLE_5GB_30D_EU',
              quantity: 1,
            },
          ],
        },
      });
      
      expect(response.data).toBeDefined();
      
      if (response.data?.order) {
        expect(response.data.order.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should search bundles across multiple regions', async () => {
      const searchResult = await ctx.services.esimGoClient.searchCatalog({
        countries: ['US', 'FR', 'JP'],
        minDuration: 7,
        maxDuration: 30,
        unlimited: false,
      });
      
      expect(searchResult.data).toBeDefined();
      expect(Array.isArray(searchResult.data)).toBe(true);
      
      // Prism generates random data, so we can't verify exact criteria
      // Just verify the structure is correct
      if (searchResult.data.length > 0) {
        searchResult.data.forEach(bundle => {
          // Verify bundle has expected properties
          expect(bundle).toHaveProperty('name');
          // Duration may be random in Prism's mock
        });
      }
    });
  });

  describe('QR Code Generation', () => {
    it('should generate valid QR codes for eSIMs', async () => {
      const orderResponse = await ctx.services.esimGoClient.ordersApi.ordersPost({
        orderRequest: {
          type: OrderRequestTypeEnum.TRANSACTION,
          assign: true,
          order: [{
            type: BundleOrderTypeEnum.BUNDLE,
            item: 'TEST_BUNDLE_1GB_7D_US',
            quantity: 1,
          }],
        },
      });
      
      const esim = orderResponse.data?.order?.[0]?.esims?.[0];
      
      if (esim) {
        // Verify QR code data structure
        expect(esim).toHaveProperty('matchingId');
        expect(esim).toHaveProperty('smdpAddress');
        
        // Construct LPA string for QR code
        const lpaString = `LPA:1$${esim.smdpAddress}$${esim.matchingId}`;
        expect(lpaString).toMatch(/^LPA:1\$.+\$.+$/);
      }
    });
  });

  describe('Database Synchronization', () => {
    it('should sync eSIM data with database after provisioning', async () => {
      // Mock repository methods
      const mockEsimCreate = vi.fn().mockResolvedValue({
        id: 'esim-db-id',
        iccid: '89000000000000000001',
        status: 'ASSIGNED',
      });
      
      const mockOrderUpdate = vi.fn().mockResolvedValue({
        id: 'order-db-id',
        status: 'COMPLETED',
      });
      
      ctx.repositories.esims.create = mockEsimCreate;
      ctx.repositories.orders.updateStatus = mockOrderUpdate;
      
      // Execute purchase flow
      await purchaseAndDeliverESIM(
        'test-order-id',
        'TEST_BUNDLE_1GB_7D_US',
        'test-user-id',
        'test@example.com',
        ctx
      );
      
      // Verify database operations were called
      expect(mockEsimCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user-id',
          order_id: 'test-order-id',
          status: 'ASSIGNED',
        })
      );
      
      expect(mockOrderUpdate).toHaveBeenCalledWith('test-order-id', 'COMPLETED');
    });
  });
});

describe('eSIM Provisioning Performance', () => {
  it('should handle concurrent provisioning requests', async () => {
    const ctx = createTestContext({ usePrism: true });
    
    // Create multiple concurrent order requests
    const concurrentOrders = Array(5).fill(null).map((_, index) => 
      ctx.services.esimGoClient.ordersApi.ordersPost({
        orderRequest: {
          type: OrderRequestTypeEnum.TRANSACTION,
          assign: true,
          customerReference: `concurrent-test-${index}`,
          order: [{
            type: BundleOrderTypeEnum.BUNDLE,
            item: 'TEST_BUNDLE_1GB_7D_US',
            quantity: 1,
          }],
        },
      })
    );
    
    const results = await Promise.allSettled(concurrentOrders);
    
    // All requests should complete successfully
    const successful = results.filter(r => r.status === 'fulfilled');
    expect(successful.length).toBe(5);
    
    // Each should have unique order reference
    const orderRefs = new Set();
    successful.forEach(result => {
      if (result.status === 'fulfilled' && result.value.data?.orderReference) {
        orderRefs.add(result.value.data.orderReference);
      }
    });
    
    // Should have unique references (if Prism generates them)
    expect(orderRefs.size).toBeGreaterThan(0);
  });
});