import { EasyCardClient } from '../client';
import type { EasyCardClientConfig } from '../client';

export const PRISM_MOCK_CONFIG: EasyCardClientConfig = {
  basePath: 'http://localhost:4012',
  apiKey: 'test-api-key',
};

export function createPrismClient(config?: Partial<EasyCardClientConfig>): EasyCardClient {
  return new EasyCardClient({
    ...PRISM_MOCK_CONFIG,
    ...config,
  });
}

export const MOCK_RESPONSES = {
  token: {
    success: {
      access_token: 'mock.jwt.token.for.testing',
      token_type: 'Bearer',
      expires_in: 3600,
    },
  },
  paymentIntent: {
    create: {
      status: 'SUCCESS',
      data: {
        paymentIntentID: 'pi_mock_1234567890',
        amount: 29.99,
        currency: 'USD',
        status: 'pending',
        description: 'Test Payment',
        customerReference: 'ORDER-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          orderId: 'order_123',
          userId: 'user_456',
        },
      },
      message: 'Payment intent created successfully',
    },
    get: {
      status: 'SUCCESS',
      data: {
        paymentIntentID: 'pi_mock_1234567890',
        amount: 29.99,
        currency: 'USD',
        status: 'succeeded',
        description: 'Test Payment',
        customerReference: 'ORDER-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          orderId: 'order_123',
          userId: 'user_456',
        },
      },
      message: 'Payment intent retrieved successfully',
    },
  },
  transactions: {
    list: {
      data: [
        {
          id: 'txn_mock_123',
          paymentIntentId: 'pi_mock_1234567890',
          amount: 29.99,
          currency: 'USD',
          status: 'completed',
          createdAt: new Date().toISOString(),
          processedAt: new Date().toISOString(),
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    },
  },
  webhook: {
    verify: {
      valid: true,
      message: 'Signature is valid',
    },
  },
};