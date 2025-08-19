import { ESimGoClient } from '@hiilo/esim-go';
import type { Context } from '../context/types';
import {
  CheckoutSessionRepository,
  OrderRepository,
  ESIMRepository,
  UserRepository,
  BundleRepository,
  TenantRepository,
} from '../repositories';
import type { SupabaseClient } from '@supabase/supabase-js';
import { vi } from 'vitest';

export interface TestContextOptions {
  usePrism?: boolean;
  prismPort?: number;
  mockApiKey?: string;
  supabaseClient?: SupabaseClient;
}

export function createTestContext(options: TestContextOptions = {}): Context {
  const {
    usePrism = process.env.USE_PRISM_MOCK === 'true',
    prismPort = 4011,
    mockApiKey = 'test-api-key',
    supabaseClient,
  } = options;

  // Create eSIM Go client
  const esimGoClient = usePrism
    ? new ESimGoClient({
        baseUrl: `http://localhost:${prismPort}`,
        apiKey: mockApiKey,
        retryAttempts: 0,
      })
    : createMockESimGoClient();

  // Create mock Supabase client if not provided
  const db = supabaseClient || createMockSupabaseClient();

  // Create test context
  const context: Context = {
    auth: {
      // Mock auth context for tests
      user: { id: 'test-user-id', email: 'test@example.com' } as any,
      isAuthenticated: true,
      getUser: vi.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com' }),
      supabaseAdmin: db,
    } as any,
    services: {
      db,
      redis: createMockRedis() as any,
      syncs: createMockCatalogSync() as any,
      esimGoClient,
      easycardPayment: createMockPaymentService() as any,
    },
    repositories: {
      checkoutSessions: new CheckoutSessionRepository(db),
      orders: new OrderRepository(db),
      esims: new ESIMRepository(db),
      users: new UserRepository(db),
      bundles: new BundleRepository(db),
      tenants: new TenantRepository(db),
      // Add other repositories as needed
    } as any,
    datasources: {} as any,
    dataloaders: {} as any,
  };

  return context;
}

function createMockESimGoClient() {
  return {
    getCatalogueWithRetry: vi.fn().mockResolvedValue({
      data: [],
      metadata: {
        requestId: 'mock-request-id',
        timestamp: new Date().toISOString(),
        cached: false,
        source: 'mock',
      },
    }),
    getOrganizationGroups: vi.fn().mockResolvedValue({
      data: [],
      metadata: {
        requestId: 'mock-request-id',
        timestamp: new Date().toISOString(),
        cached: false,
        source: 'mock',
      },
    }),
    applyBundleToEsim: vi.fn().mockResolvedValue({
      data: {
        esims: [{
          iccid: 'mock-iccid',
          matchingId: 'mock-matching-id',
        }],
      },
      metadata: {
        requestId: 'mock-request-id',
        timestamp: new Date().toISOString(),
        cached: false,
        source: 'mock',
      },
    }),
    getEsims: vi.fn().mockResolvedValue({
      data: { esims: [] },
      metadata: {
        requestId: 'mock-request-id',
        timestamp: new Date().toISOString(),
        cached: false,
        source: 'mock',
      },
    }),
    searchCatalog: vi.fn().mockResolvedValue({
      data: [],
      metadata: {
        requestId: 'mock-request-id',
        timestamp: new Date().toISOString(),
        cached: false,
        source: 'mock',
      },
    }),
    healthCheck: vi.fn().mockResolvedValue(true),
    ordersApi: {
      ordersPost: vi.fn().mockResolvedValue({
        data: {
          orderReference: 'mock-order-ref',
          status: 'COMPLETED',
        },
      }),
    },
  };
}

function createMockSupabaseClient() {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  };
}

function createMockRedis() {
  return {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
  };
}

function createMockCatalogSync() {
  return {
    syncCatalog: vi.fn(),
    getLastSync: vi.fn(),
  };
}

function createMockPaymentService() {
  return {
    default: {
      initialize: vi.fn(),
      createPaymentIntent: vi.fn().mockResolvedValue({
        success: true,
        paymentIntentId: 'mock-payment-intent',
      }),
      confirmPayment: vi.fn().mockResolvedValue({
        success: true,
      }),
      getSupportedPaymentMethods: vi.fn().mockReturnValue(['card']),
      getProviderName: vi.fn().mockReturnValue('mock-provider'),
    },
  };
}