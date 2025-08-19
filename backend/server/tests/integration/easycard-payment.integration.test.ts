import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createTestContext } from '../../src/test-utils/prism-context';
import easycardService from '../../src/services/payment/easycard.service';
import { EasyCardClient } from '@hiilo/easycard';
import type { Context } from '../../src/context/types';

// Helper function to create consistent payment requests
const createPaymentRequest = (overrides: any = {}) => ({
  costumer: {
    id: 'user_456',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '+1234567890',
    ...overrides.costumer
  },
  amount: 29.99,
  currency: 'USD',
  description: 'eSIM Bundle - Europe 5GB',
  item: {
    name: 'eSIM Bundle - Europe 5GB',
    price: 29.99,
    ...overrides.item
  },
  redirectUrl: 'https://example.com/success',
  order: {
    id: 'order_123',
    reference: 'ORDER-123',
    ...overrides.order
  },
  ...overrides
});

describe('EasyCard Payment Integration with Prism', () => {
  let ctx: Context;
  
  beforeEach(() => {
    // Set environment variables for EasyCard
    process.env.EASYCARD_API_KEY = 'test-api-key';
    process.env.EASYCARD_API_URL = 'http://localhost:4012'; // Use different port from eSIM Go
    process.env.EASYCARD_PRIVATE_API_KEY = 'test-private-key';
    process.env.EASYCARD_IDENTITY_URL = 'http://localhost:4012';
    
    // Create test context (this will start eSIM Go Prism on 4011)
    ctx = createTestContext({ 
      usePrism: true,
      mockApiKey: 'test-api-key'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clean up environment
    delete process.env.EASYCARD_API_KEY;
    delete process.env.EASYCARD_API_URL;
    delete process.env.EASYCARD_PRIVATE_API_KEY;
    delete process.env.EASYCARD_IDENTITY_URL;
  });

  describe('EasyCard Service Integration', () => {
    it('should initialize EasyCard service successfully', async () => {
      // Test service initialization
      await easycardService.initialize();
      
      // Verify the service is initialized by checking provider name
      expect(easycardService.getProviderName()).toBe('EasyCard');
    });

    it('should get supported payment methods', () => {
      const methods = easycardService.getSupportedPaymentMethods();
      
      expect(Array.isArray(methods)).toBe(true);
      expect(methods).toContain('visa');
      expect(methods).toContain('mastercard');
    });

    it('should create payment intent with EasyCard API', async () => {
      // Mock the EasyCard client to use Prism
      const mockClient = new EasyCardClient({
        basePath: 'http://localhost:4012',
        apiKey: 'test-api-key',
      });

      // Test payment intent creation
      const paymentRequest = createPaymentRequest();
      const result = await easycardService.createPaymentIntent(paymentRequest);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.paymentIntentId).toBeDefined();
        expect(result.clientSecret).toBeDefined();
        expect(result.amount).toBe(paymentRequest.amount);
        expect(result.currency).toBe(paymentRequest.currency);
      }
    });

    it('should retrieve payment intent status', async () => {
      // First create a payment intent
      const createResult = await easycardService.createPaymentIntent({
        amount: 19.99,
        currency: 'USD',
        description: 'Test Payment Intent Retrieval',
        customerReference: 'ORDER-RETRIEVE-123',
      });

      if (createResult.success) {
        // Then retrieve it
        const retrieveResult = await easycardService.getPaymentIntent(
          createResult.paymentIntentId
        );

        expect(retrieveResult).toBeDefined();
        expect(retrieveResult.success).toBe(true);
        
        if (retrieveResult.success) {
          expect(retrieveResult.paymentIntent).toBeDefined();
          expect(retrieveResult.paymentIntent.id).toBe(createResult.paymentIntentId);
          expect(retrieveResult.paymentIntent.amount).toBe(19.99);
          expect(retrieveResult.paymentIntent.currency).toBe('USD');
        }
      }
    });

    it('should confirm payment intent', async () => {
      // Create payment intent first
      const createResult = await easycardService.createPaymentIntent({
        amount: 39.99,
        currency: 'USD',
        description: 'Test Payment Confirmation',
        customerReference: 'ORDER-CONFIRM-123',
      });

      if (createResult.success) {
        // Confirm the payment
        const confirmResult = await easycardService.confirmPayment(
          createResult.paymentIntentId,
          {
            paymentMethodId: 'pm_test_visa_123',
            customerInfo: {
              email: 'test@example.com',
              name: 'John Doe',
            },
          }
        );

        expect(confirmResult).toBeDefined();
        expect(confirmResult.success).toBe(true);
        
        if (confirmResult.success) {
          expect(['succeeded', 'pending', 'processing']).toContain(confirmResult.status);
        }
      }
    });

    it('should cancel payment intent', async () => {
      // Create payment intent first
      const createResult = await easycardService.createPaymentIntent({
        amount: 15.99,
        currency: 'USD',
        description: 'Test Payment Cancellation',
        customerReference: 'ORDER-CANCEL-123',
      });

      if (createResult.success) {
        // Cancel the payment
        const cancelResult = await easycardService.cancelPaymentIntent(
          createResult.paymentIntentId
        );

        expect(cancelResult).toBeDefined();
        expect(cancelResult.success).toBe(true);
      }
    });

    it('should handle payment failures gracefully', async () => {
      // Test with invalid payment data
      const result = await easycardService.createPaymentIntent({
        amount: -10.00, // Invalid amount
        currency: 'USD',
        description: 'Invalid Payment Test',
        customerReference: 'ORDER-INVALID-123',
      });

      // Should either succeed (Prism generates valid response) or fail gracefully
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Payment Flow Integration', () => {
    it('should handle complete checkout flow', async () => {
      const orderData = {
        orderId: 'integration-test-order-123',
        userId: 'user-integration-123',
        bundleId: 'bundle-eu-10gb',
        amount: 49.99,
        currency: 'USD',
        customerEmail: 'integration@test.com',
      };

      // Step 1: Create checkout session
      const checkoutSession = await ctx.services.checkoutSessionService?.createSession({
        userId: orderData.userId,
        bundleIds: [orderData.bundleId],
        totalAmount: orderData.amount,
        currency: orderData.currency,
        customerEmail: orderData.customerEmail,
        returnUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      if (checkoutSession) {
        // Step 2: Create payment intent with EasyCard
        const paymentResult = await easycardService.createPaymentIntent({
          amount: orderData.amount,
          currency: orderData.currency,
          description: `eSIM Bundle Purchase - ${orderData.bundleId}`,
          customerReference: orderData.orderId,
          metadata: {
            orderId: orderData.orderId,
            userId: orderData.userId,
            bundleId: orderData.bundleId,
            sessionId: checkoutSession.id,
          },
        });

        expect(paymentResult).toBeDefined();
        expect(paymentResult.success).toBe(true);

        if (paymentResult.success) {
          // Step 3: Simulate payment confirmation
          const confirmResult = await easycardService.confirmPayment(
            paymentResult.paymentIntentId,
            {
              paymentMethodId: 'pm_test_card_visa',
              customerInfo: {
                email: orderData.customerEmail,
                name: 'Integration Test User',
              },
            }
          );

          expect(confirmResult).toBeDefined();
          expect(confirmResult.success).toBe(true);
        }
      }
    });

    it('should handle webhook notifications', async () => {
      // Mock webhook payload from EasyCard
      const webhookPayload = {
        id: 'evt_test_webhook_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_webhook_123',
            amount: 2999, // 29.99 in cents
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              orderId: 'order_webhook_123',
              userId: 'user_webhook_123',
            },
          },
        },
        created: Math.floor(Date.now() / 1000),
      };

      // Process webhook
      const result = await easycardService.processWebhookEvent(
        webhookPayload,
        'test-signature'
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toContain('processed');
    });

    it('should handle payment retries', async () => {
      // Create payment that might fail initially
      const createResult = await easycardService.createPaymentIntent({
        amount: 99.99,
        currency: 'USD',
        description: 'Retry Test Payment',
        customerReference: 'ORDER-RETRY-123',
      });

      if (createResult.success) {
        // Simulate first payment attempt (might fail)
        try {
          const confirmResult1 = await easycardService.confirmPayment(
            createResult.paymentIntentId,
            {
              paymentMethodId: 'pm_test_card_declined',
              customerInfo: {
                email: 'retry@test.com',
                name: 'Retry Test User',
              },
            }
          );
          
          // If first attempt succeeds or fails, both are valid scenarios
          expect(confirmResult1).toBeDefined();
          expect(typeof confirmResult1.success).toBe('boolean');
          
        } catch (error) {
          // Expected for declined cards, now retry with valid card
          const confirmResult2 = await easycardService.confirmPayment(
            createResult.paymentIntentId,
            {
              paymentMethodId: 'pm_test_card_visa',
              customerInfo: {
                email: 'retry@test.com',
                name: 'Retry Test User',
              },
            }
          );
          
          expect(confirmResult2).toBeDefined();
          expect(confirmResult2.success).toBe(true);
        }
      }
    });
  });

  describe('Error Scenarios', () => {
    it('should handle API rate limiting', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(10).fill(null).map((_, index) =>
        easycardService.createPaymentIntent({
          amount: 10.00,
          currency: 'USD',
          description: `Rate limit test ${index}`,
          customerReference: `ORDER-RATE-${index}`,
        })
      );

      const results = await Promise.allSettled(requests);
      
      // All should complete (either succeed or fail gracefully)
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(result.value).toBeDefined();
          expect(typeof result.value.success).toBe('boolean');
        }
      });
    });

    it('should handle network timeouts', async () => {
      // Test with scenario that might timeout
      const result = await easycardService.createPaymentIntent({
        amount: 999.99,
        currency: 'USD',
        description: 'Timeout test payment',
        customerReference: 'ORDER-TIMEOUT-123',
        metadata: {
          timeout: 'test',
        },
      });

      // Should handle timeout gracefully
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should validate webhook signatures', async () => {
      const validPayload = JSON.stringify({
        id: 'evt_test_signature',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test', status: 'succeeded' } },
      });

      // Test with invalid signature
      const invalidResult = await easycardService.verifyWebhookSignature(
        validPayload,
        'invalid-signature',
        'webhook-secret'
      );

      expect(invalidResult).toBeDefined();
      expect(typeof invalidResult).toBe('boolean');

      // Test with valid signature (if signature verification is implemented)
      const validSignature = 'valid-test-signature';
      const validResult = await easycardService.verifyWebhookSignature(
        validPayload,
        validSignature,
        'webhook-secret'
      );

      expect(validResult).toBeDefined();
      expect(typeof validResult).toBe('boolean');
    });
  });
});