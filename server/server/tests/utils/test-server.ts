import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/federation';
import { gql } from 'graphql-tag';
import { readFileSync } from 'fs';
import { join } from 'path';
import { resolvers } from '../../src/resolvers';
import type { Context } from '../../src/context/types';

// Load GraphQL schema
const typeDefs = gql(
  readFileSync(join(__dirname, '../../schema.graphql'), 'utf8')
);

// Load AirHalo schema if it exists
let airHaloTypeDefs: any = null;
try {
  airHaloTypeDefs = gql(
    readFileSync(join(__dirname, '../../schemas/airhalo.graphql'), 'utf8')
  );
} catch (error) {
  // AirHalo schema not found, ignore
}

export interface TestServerDependencies {
  airHaloClient?: any;
  supabaseClient?: any;
  repositories?: any;
  services?: any;
}

export async function buildTestServer(
  dependencies: TestServerDependencies = {}
): Promise<ApolloServer<Context>> {
  // Combine type definitions
  const allTypeDefs = airHaloTypeDefs ? [typeDefs, airHaloTypeDefs] : [typeDefs];

  const server = new ApolloServer<Context>({
    schema: buildSubgraphSchema({
      typeDefs: allTypeDefs,
      resolvers,
    }),
    introspection: true,
    plugins: [
      // Test plugins if needed
    ],
  });

  await server.start();

  // Create context function that uses test dependencies
  server.contextValue = () => ({
    user: null,
    services: {
      airHaloClient: dependencies.airHaloClient || null,
      supabaseClient: dependencies.supabaseClient || null,
      ...dependencies.services,
    },
    repositories: dependencies.repositories || {},
    // Add other context properties as needed
  } as Context);

  return server;
}

// Helper function to create a test context
export function createTestContext(
  overrides: Partial<Context> = {}
): Context {
  return {
    user: null,
    services: {
      airHaloClient: null,
      supabaseClient: null,
    },
    repositories: {},
    ...overrides,
  } as Context;
}

// Mock factory for AirHalo client
export function createMockAirHaloClient() {
  return {
    getPackages: jest.fn(() => Promise.resolve({ data: [] })),
    getCompatibleDevices: jest.fn(() => Promise.resolve({ data: [] })),
    placeOrder: jest.fn(() => Promise.resolve({ data: {} })),
    getOrders: jest.fn(() => Promise.resolve({ data: [] })),
    getOrderById: jest.fn(() => Promise.resolve({ data: {} })),
    searchPackages: jest.fn(() => Promise.resolve([])),
    findSimilarPackages: jest.fn(() => Promise.resolve([])),
  };
}

// Helper to wait for async operations in tests
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock data factories
export const testDataFactory = {
  airHaloPackage: (overrides = {}) => ({
    id: 'test-pkg-1',
    title: 'Test Package',
    slug: 'test-package',
    image: {
      url: 'https://example.com/test.jpg',
      width: 300,
      height: 200,
    },
    operators: [
      {
        id: 'test-op-1',
        title: 'Test Operator',
        type: 'MNO',
        countries: [
          {
            id: 'test',
            title: 'Test Country',
            slug: 'test-country',
          },
        ],
        packages: [
          {
            id: 'test-sub-pkg-1',
            type: 'LOCAL',
            title: '1GB Test',
            short_info: '1GB for testing',
            data: 1024,
            amount: 1024,
            day: 7,
            is_unlimited: false,
            voice: 'N/A',
            text: 'N/A',
            price: { value: 10.0, currency: 'USD' },
            net_price: { value: 8.0, currency: 'USD' },
            prices: {
              net_price: { value: 8.0, currency: 'USD' },
              recommended_retail_price: { value: 12.0, currency: 'USD' },
            },
            qr_installation: true,
            manual_installation: true,
            is_fair_usage_policy: false,
            fair_usage_policy: null,
          },
        ],
        coverages: [
          {
            networks: [
              { name: 'TestNet', type: '4G' },
            ],
          },
        ],
        apn: {
          name: 'internet',
          username: '',
          password: '',
          ios: {
            name: 'internet',
            username: '',
            password: '',
          },
        },
      },
    ],
    ...overrides,
  }),

  airHaloCompatibleDevice: (overrides = {}) => ({
    manufacturer: 'Test Brand',
    model: 'Test Device',
    esim_support: true,
    ...overrides,
  }),

  airHaloApiResponse: (data: any[], overrides = {}) => ({
    data,
    links: {
      first: 'https://api.test.com/packages?page=1',
      last: 'https://api.test.com/packages?page=1',
      prev: null,
      next: null,
    },
    meta: {
      current_page: 1,
      from: 1,
      last_page: 1,
      path: 'https://api.test.com/packages',
      per_page: 20,
      to: data.length,
      total: data.length,
    },
    ...overrides,
  }),
};