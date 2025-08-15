import { ESimGoClient } from '../client';
import type { ESimGoClientConfig } from '../types';

export const PRISM_MOCK_CONFIG: ESimGoClientConfig = {
  baseUrl: 'http://localhost:4010/v2.4',
  apiKey: 'test-api-key',
  timeout: 5000,
  retryAttempts: 0, // Disable retries for tests
};

export function createPrismClient(config?: Partial<ESimGoClientConfig>): ESimGoClient {
  return new ESimGoClient({
    ...PRISM_MOCK_CONFIG,
    ...config,
  });
}

export function createMockClient(config?: Partial<ESimGoClientConfig>): ESimGoClient {
  const mockConfig: ESimGoClientConfig = {
    baseUrl: 'http://localhost:4010/v2.4',
    apiKey: 'mock-api-key',
    timeout: 5000,
    retryAttempts: 0,
    ...config,
  };

  return new ESimGoClient(mockConfig);
}

export const MOCK_RESPONSES = {
  catalogue: {
    success: [
      {
        name: 'TEST_BUNDLE_1GB_7D_US',
        displayName: 'Test Bundle - 1GB, 7 Days, US',
        dataAmount: 1024,
        duration: 7,
        price: 10.00,
        currency: 'USD',
        countries: [
          {
            name: 'United States',
            iso: 'US',
          },
        ],
      },
      {
        name: 'TEST_BUNDLE_5GB_30D_EU',
        displayName: 'Test Bundle - 5GB, 30 Days, EU',
        dataAmount: 5120,
        duration: 30,
        price: 35.00,
        currency: 'USD',
        countries: [
          {
            name: 'France',
            iso: 'FR',
          },
          {
            name: 'Germany',
            iso: 'DE',
          },
        ],
      },
    ],
  },
  order: {
    success: {
      orderReference: 'TEST-ORDER-123',
      status: 'COMPLETED',
      order: [
        {
          type: 'BUNDLE',
          item: 'TEST_BUNDLE_1GB_7D_US',
          quantity: 1,
          esims: [
            {
              iccid: '89000000000000000001',
              matchingId: 'TEST-MATCH-ID-123',
              smdpAddress: 'test.esim-go.com',
              confirmationCode: 'TEST123',
              qrCode: 'LPA:1$test.esim-go.com$TEST-MATCH-ID-123',
            },
          ],
        },
      ],
    },
  },
  esim: {
    assigned: {
      iccid: '89000000000000000001',
      status: 'ASSIGNED',
      matchingId: 'TEST-MATCH-ID-123',
      smdpAddress: 'test.esim-go.com',
      bundles: [
        {
          name: 'TEST_BUNDLE_1GB_7D_US',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          dataRemaining: 1024,
        },
      ],
    },
  },
};