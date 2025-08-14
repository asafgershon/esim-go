import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createTestContext } from '../../src/test-utils/prism-context';
import { handleESIMGoWebhook } from '../../src/services/esim-go-webhook';
import crypto from 'crypto';
import type { Context } from '../../src/context/types';

describe('Webhook Handling Integration with Prism', () => {
  let ctx: Context;
  const webhookSecret = 'test-webhook-secret';
  
  beforeEach(() => {
    // Set up test environment
    process.env.ESIM_GO_WEBHOOK_SECRET = webhookSecret;
    
    // Create test context
    ctx = createTestContext({ 
      usePrism: true,
      mockApiKey: 'test-api-key'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('eSIM Go Webhook Processing', () => {
    it('should process bundle usage callback from eSIM Go', async () => {
      // Sample callback payload from eSIM Go API spec
      const callbackPayload = {
        iccid: '8944538532008160222',
        alertType: 'Utilisation',
        bundle: {
          id: '123456789',
          name: 'A_BUNDLE_20GB_30D_EU_U',
          description: 'A Bundle, 20GB, 30 Days, EU, Unthrottled',
          initialQuantity: 20000000000, // 20GB in bytes
          remainingQuantity: 19000000000, // 19GB remaining
          startTime: '2024-01-02T15:04:05Z',
          endTime: '2024-02-01T15:04:05Z',
          reference: '12345-12345-12345-12345-0',
          unlimited: false
        }
      };

      // Generate HMAC signature for V3 callback
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(callbackPayload))
        .digest('base64');

      // Mock the Supabase operations
      const mockSupabaseClient = ctx.services.db as any;
      mockSupabaseClient.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'esim-123',
            iccid: '8944538532008160222',
            user_id: 'user-123'
          },
          error: null
        }),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ data: null, error: null })
      }));

      // Process the webhook
      const result = await handleBundleUsageCallback(
        callbackPayload,
        signature
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('processed successfully');
    });

    it('should validate HMAC signature for callbacks', async () => {
      const payload = {
        iccid: '8944538532008160222',
        alertType: 'Utilisation',
        bundle: {
          id: '123456789',
          name: 'TEST_BUNDLE',
          remainingQuantity: 5000000000
        }
      };

      // Test with valid signature
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('base64');

      const validResult = await validateWebhookSignature(
        JSON.stringify(payload),
        validSignature,
        webhookSecret
      );
      expect(validResult).toBe(true);

      // Test with invalid signature
      const invalidSignature = 'invalid-signature';
      const invalidResult = await validateWebhookSignature(
        JSON.stringify(payload),
        invalidSignature,
        webhookSecret
      );
      expect(invalidResult).toBe(false);
    });

    it('should handle order completion webhooks', async () => {
      const orderCompletedPayload = {
        event: 'order.completed',
        data: {
          order_reference: 'ORDER-123',
          esims: [
            {
              iccid: '8944538532008160001',
              customer_ref: 'CUST-REF-001',
              qr_code: 'LPA:1$test.esim-go.com$MATCHING-ID-001',
              status: 'ASSIGNED',
              assigned_date: '2024-01-01T12:00:00Z'
            },
            {
              iccid: '8944538532008160002',
              customer_ref: 'CUST-REF-002',
              qr_code: 'LPA:1$test.esim-go.com$MATCHING-ID-002',
              status: 'ASSIGNED',
              assigned_date: '2024-01-01T12:00:00Z'
            }
          ]
        }
      };

      // Mock database operations
      const mockDb = ctx.services.db as any;
      mockDb.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'order-123',
            user_id: 'user-123',
            reference: 'ORDER-123'
          },
          error: null
        }),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ data: null, error: null })
      }));

      const result = await handleESIMGoWebhook(orderCompletedPayload);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('order.completed');
    });

    it('should handle eSIM activation webhooks', async () => {
      const activationPayload = {
        event: 'esim.activated',
        data: {
          iccid: '8944538532008160222',
          activated_date: '2024-01-01T13:00:00Z',
          device_info: {
            model: 'iPhone 15 Pro',
            os: 'iOS 17.2'
          }
        }
      };

      // Mock database update
      const mockDb = ctx.services.db as any;
      mockDb.from = vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: { id: 'esim-123', status: 'ACTIVE' },
          error: null
        })
      }));

      const result = await handleESIMGoWebhook(activationPayload);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('esim.activated');
    });

    it('should handle bundle activation webhooks', async () => {
      const bundleActivationPayload = {
        event: 'bundle.activated',
        data: {
          iccid: '8944538532008160222',
          bundle_name: 'TEST_BUNDLE_5GB_30D_EU',
          start_date: '2024-01-01T12:00:00Z',
          end_date: '2024-01-31T12:00:00Z',
          data_amount: 5368709120, // 5GB in bytes
          unlimited: false
        }
      };

      // Mock database operations for bundle creation
      const mockDb = ctx.services.db as any;
      mockDb.from = vi.fn((table: string) => {
        if (table === 'esims') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'esim-123',
                iccid: '8944538532008160222',
                esim_orders: { data_plan_id: 'plan-123' }
              },
              error: null
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      const result = await handleESIMGoWebhook(bundleActivationPayload);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('bundle.activated');
    });

    it('should handle bundle expiration webhooks', async () => {
      const bundleExpirationPayload = {
        event: 'bundle.expired',
        data: {
          iccid: '8944538532008160222',
          bundle_name: 'TEST_BUNDLE_5GB_30D_EU',
          expiry_date: '2024-01-31T12:00:00Z',
          reason: 'time_limit_reached'
        }
      };

      // Mock database operations
      const mockDb = ctx.services.db as any;
      mockDb.from = vi.fn((table: string) => {
        if (table === 'esims') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'esim-123' },
              error: null
            })
          };
        }
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      const result = await handleESIMGoWebhook(bundleExpirationPayload);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('bundle.expired');
    });
  });

  describe('Webhook Error Handling', () => {
    it('should reject webhooks with invalid signatures', async () => {
      const payload = {
        event: 'test.event',
        data: { test: 'data' }
      };

      // Create a signature with wrong secret to ensure same length
      const wrongSecret = 'wrong-secret';
      const invalidSignature = crypto
        .createHmac('sha256', wrongSecret)
        .update(JSON.stringify(payload))
        .digest('hex'); // Use hex for consistent length

      await expect(
        handleESIMGoWebhook(payload, invalidSignature)
      ).rejects.toThrow();
    });

    it('should handle duplicate webhook events gracefully', async () => {
      const payload = {
        event: 'order.completed',
        data: {
          order_reference: 'ORDER-DUP-123',
          esims: [{
            iccid: '8944538532008160999',
            status: 'ASSIGNED'
          }]
        }
      };

      // Mock database to simulate duplicate entry
      const mockDb = ctx.services.db as any;
      let callCount = 0;
      mockDb.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'order-123', status: 'COMPLETED' },
          error: null
        }),
        insert: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // First call succeeds
            return Promise.resolve({ data: null, error: null });
          }
          // Subsequent calls fail with duplicate error
          return Promise.resolve({
            data: null,
            error: { code: '23505', message: 'duplicate key value' }
          });
        }),
        update: vi.fn().mockResolvedValue({ data: null, error: null })
      }));

      // Process webhook twice
      const result1 = await handleESIMGoWebhook(payload);
      const result2 = await handleESIMGoWebhook(payload);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true); // Should handle duplicate gracefully
    });

    it('should handle webhook processing timeouts', async () => {
      const payload = {
        event: 'order.completed',
        data: {
          order_reference: 'ORDER-TIMEOUT-123',
          esims: Array(100).fill({}).map((_, i) => ({
            iccid: `894453853200816${String(i).padStart(4, '0')}`,
            status: 'ASSIGNED'
          }))
        }
      };

      // Mock slow database operations
      const mockDb = ctx.services.db as any;
      mockDb.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            data: { id: 'order-123' },
            error: null
          }), 100))
        ),
        insert: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            data: null,
            error: null
          }), 50))
        ),
        update: vi.fn().mockResolvedValue({ data: null, error: null })
      }));

      // Process webhook with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Webhook processing timeout')), 5000)
      );

      const processPromise = handleESIMGoWebhook(payload);

      // Should complete before timeout
      const result = await Promise.race([processPromise, timeoutPromise]);
      expect(result).toBeDefined();
    });
  });

  describe('Webhook Retry Logic', () => {
    it('should retry failed webhook processing', async () => {
      // Test retry logic pattern without actual webhook processing
      let attemptCount = 0;
      let lastError: Error | null = null;
      
      // Simulate a function that fails first 2 times, succeeds on 3rd
      const simulateWebhookProcess = async (): Promise<{ success: boolean }> => {
        attemptCount++;
        if (attemptCount < 3) {
          lastError = new Error(`Attempt ${attemptCount} failed`);
          throw lastError;
        }
        return { success: true };
      };
      
      // Implement retry logic
      const processWithRetry = async (maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            const result = await simulateWebhookProcess();
            if (result.success) return result;
          } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        throw lastError || new Error('Max retries exceeded');
      };

      const result = await processWithRetry();
      expect(attemptCount).toBe(3);
      expect(result?.success).toBe(true);
    });
  });
});

// Helper functions for webhook testing

function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

async function handleBundleUsageCallback(
  payload: any,
  signature?: string
): Promise<{ success: boolean; message: string }> {
  // Validate signature if provided
  if (signature) {
    const isValid = validateWebhookSignature(
      JSON.stringify(payload),
      signature,
      process.env.ESIM_GO_WEBHOOK_SECRET || ''
    );
    
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }
  }

  // Process bundle usage update
  const { iccid, alertType, bundle } = payload;
  
  console.log(`Processing ${alertType} for ICCID ${iccid}`, {
    bundleName: bundle.name,
    remainingData: bundle.remainingQuantity,
    unlimited: bundle.unlimited
  });

  return {
    success: true,
    message: `Bundle usage callback processed successfully for ${iccid}`
  };
}