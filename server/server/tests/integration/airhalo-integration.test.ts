import { describe, it, expect, beforeAll, afterAll, beforeEach, mock } from 'bun:test';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import request from 'supertest';
import { buildTestServer } from '../utils/test-server';
import type { Context } from '../../src/context/types';

// Mock AirHalo client
const mockAirHaloClient = {
  getPackages: mock(() => Promise.resolve({})),
  getCompatibleDevices: mock(() => Promise.resolve({})),
};

// Mock logger
mock.context('../../src/lib/logger', () => ({
  logger: {
    info: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    debug: mock(() => {}),
  },
}));

describe('AirHalo GraphQL Integration', () => {
  let app: express.Application;
  let server: ApolloServer<Context>;

  beforeAll(async () => {
    // Build test server with mocked dependencies
    server = await buildTestServer({
      airHaloClient: mockAirHaloClient,
    });

    app = express();
    app.use('/graphql', express.json(), expressMiddleware(server));
  });

  afterAll(async () => {
    await server?.stop();
  });

  beforeEach(() => {
    // Reset all mocks before each test
    Object.values(mockAirHaloClient).forEach(mockFn => mockFn.mockReset());
  });

  describe('airHaloPackages Query', () => {
    const AIRHALO_PACKAGES_QUERY = `
      query GetAirHaloPackages($filter: AirHaloPackageFilter) {
        airHaloPackages(filter: $filter) {
          data {
            id
            title
            slug
            image {
              url
              width
              height
            }
            operators {
              id
              title
              type
              countries {
                id
                title
                slug
              }
              packages {
                id
                type
                title
                shortInfo
                data
                amount
                day
                isUnlimited
                voice
                text
                price {
                  value
                  currency
                }
                netPrice {
                  value
                  currency
                }
                prices {
                  netPrice {
                    value
                    currency
                  }
                  recommendedRetailPrice {
                    value
                    currency
                  }
                }
                qrInstallation
                manualInstallation
                isFairUsagePolicy
                fairUsagePolicy
              }
              coverages {
                networks {
                  name
                  type
                }
              }
              apn {
                name
                username
                password
                ios {
                  name
                  username
                  password
                }
              }
            }
          }
          links {
            first
            last
            prev
            next
          }
          meta {
            currentPage
            from
            lastPage
            path
            perPage
            to
            total
          }
        }
      }
    `;

    it('should fetch packages successfully without filter', async () => {
      const mockResponse = {
        data: [
          {
            id: 'pkg-test-1',
            title: 'Test Package',
            slug: 'test-package',
            image: {
              url: 'https://example.com/test.jpg',
              width: 300,
              height: 200,
            },
            operators: [
              {
                id: 'op-test-1',
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
                    id: 'pkg-sub-1',
                    type: 'LOCAL',
                    title: '1GB Test',
                    short_info: '1GB for testing',
                    data: 1024,
                    amount: 1024,
                    day: 7,
                    is_unlimited: false,
                    voice: 'N/A',
                    text: 'N/A',
                    price: { value: 10.00, currency: 'USD' },
                    net_price: { value: 8.00, currency: 'USD' },
                    prices: {
                      net_price: { value: 8.00, currency: 'USD' },
                      recommended_retail_price: { value: 12.00, currency: 'USD' },
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
          },
        ],
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
          to: 1,
          total: 1,
        },
      };

      mockAirHaloClient.getPackages.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/graphql')
        .send({
          query: AIRHALO_PACKAGES_QUERY,
          variables: {},
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const { data } = response.body;
      expect(data.airHaloPackages.data).toHaveLength(1);
      expect(data.airHaloPackages.data[0]).toMatchObject({
        id: 'pkg-test-1',
        title: 'Test Package',
        slug: 'test-package',
        image: {
          url: 'https://example.com/test.jpg',
          width: 300,
          height: 200,
        },
      });

      expect(data.airHaloPackages.data[0].operators[0]).toMatchObject({
        id: 'op-test-1',
        title: 'Test Operator',
        type: 'MNO',
      });

      expect(data.airHaloPackages.data[0].operators[0].packages[0]).toMatchObject({
        id: 'pkg-sub-1',
        type: 'LOCAL',
        title: '1GB Test',
        shortInfo: '1GB for testing',
        data: 1024,
        amount: 1024,
        day: 7,
        isUnlimited: false,
        voice: 'N/A',
        text: 'N/A',
        price: { value: 10.00, currency: 'USD' },
        netPrice: { value: 8.00, currency: 'USD' },
        qrInstallation: true,
        manualInstallation: true,
        isFairUsagePolicy: false,
        fairUsagePolicy: null,
      });

      expect(mockAirHaloClient.getPackages).toHaveBeenCalledWith({
        limit: undefined,
        page: undefined,
        type: undefined,
        countries: undefined,
      });
    });

    it('should fetch packages with filters', async () => {
      mockAirHaloClient.getPackages.mockResolvedValue({ data: [] });

      const variables = {
        filter: {
          type: 'LOCAL',
          countries: ['US', 'CA'],
          limit: 10,
          page: 2,
        },
      };

      const response = await request(app)
        .post('/graphql')
        .send({
          query: AIRHALO_PACKAGES_QUERY,
          variables,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      expect(mockAirHaloClient.getPackages).toHaveBeenCalledWith({
        limit: 10,
        page: 2,
        type: 'local', // Should be lowercase
        countries: ['US', 'CA'],
      });
    });

    it('should handle API errors gracefully', async () => {
      mockAirHaloClient.getPackages.mockRejectedValue(new Error('API unavailable'));

      const response = await request(app)
        .post('/graphql')
        .send({
          query: AIRHALO_PACKAGES_QUERY,
          variables: {},
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toMatchObject({
        message: 'Failed to fetch AirHalo packages',
        extensions: { code: 'EXTERNAL_API_ERROR' },
      });
    });

    it('should return empty data when API returns no packages', async () => {
      mockAirHaloClient.getPackages.mockResolvedValue({
        data: [],
        links: null,
        meta: null,
      });

      const response = await request(app)
        .post('/graphql')
        .send({
          query: AIRHALO_PACKAGES_QUERY,
          variables: {},
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.airHaloPackages).toEqual({
        data: [],
        links: null,
        meta: null,
      });
    });
  });

  describe('airHaloCompatibleDevices Query', () => {
    const COMPATIBLE_DEVICES_QUERY = `
      query GetAirHaloCompatibleDevices {
        airHaloCompatibleDevices {
          data {
            manufacturer
            model
            esimSupport
          }
        }
      }
    `;

    it('should fetch compatible devices successfully', async () => {
      const mockResponse = {
        data: [
          {
            manufacturer: 'Apple',
            model: 'iPhone 14',
            esim_support: true,
          },
          {
            manufacturer: 'Samsung',
            model: 'Galaxy S23',
            esim_support: true,
          },
          {
            manufacturer: 'Google',
            model: 'Pixel 7',
            // esim_support missing - should default to true
          },
        ],
      };

      mockAirHaloClient.getCompatibleDevices.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/graphql')
        .send({
          query: COMPATIBLE_DEVICES_QUERY,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const { data } = response.body;
      expect(data.airHaloCompatibleDevices.data).toHaveLength(3);
      expect(data.airHaloCompatibleDevices.data).toEqual([
        { manufacturer: 'Apple', model: 'iPhone 14', esimSupport: true },
        { manufacturer: 'Samsung', model: 'Galaxy S23', esimSupport: true },
        { manufacturer: 'Google', model: 'Pixel 7', esimSupport: true }, // Default to true
      ]);

      expect(mockAirHaloClient.getCompatibleDevices).toHaveBeenCalled();
    });

    it('should handle empty devices response', async () => {
      mockAirHaloClient.getCompatibleDevices.mockResolvedValue({ data: [] });

      const response = await request(app)
        .post('/graphql')
        .send({
          query: COMPATIBLE_DEVICES_QUERY,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.airHaloCompatibleDevices.data).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockAirHaloClient.getCompatibleDevices.mockRejectedValue(new Error('Service timeout'));

      const response = await request(app)
        .post('/graphql')
        .send({
          query: COMPATIBLE_DEVICES_QUERY,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toMatchObject({
        message: 'Failed to fetch AirHalo compatible devices',
        extensions: { code: 'EXTERNAL_API_ERROR' },
      });
    });
  });

  describe('compareAirHaloPackages Query', () => {
    const COMPARE_PACKAGES_QUERY = `
      query CompareAirHaloPackages($countryCode: String!) {
        compareAirHaloPackages(countryCode: $countryCode) {
          id
          title
          slug
          operators {
            id
            title
            packages {
              id
              title
              price {
                value
                currency
              }
            }
          }
        }
      }
    `;

    it('should compare packages for a specific country', async () => {
      const mockResponse = {
        data: [
          {
            id: 'compare-pkg-1',
            title: 'UK Local Plans',
            slug: 'uk-local',
            operators: [
              {
                id: 'uk-op-1',
                title: 'EE UK',
                packages: [
                  {
                    id: 'uk-pkg-1',
                    title: '2GB UK',
                    price: { value: 15.0, currency: 'USD' },
                    net_price: { value: 12.0, currency: 'USD' },
                    prices: {
                      net_price: { value: 12.0, currency: 'USD' },
                      recommended_retail_price: { value: 18.0, currency: 'USD' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      mockAirHaloClient.getPackages.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/graphql')
        .send({
          query: COMPARE_PACKAGES_QUERY,
          variables: { countryCode: 'UK' },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const { data } = response.body;
      expect(data.compareAirHaloPackages).toHaveLength(1);
      expect(data.compareAirHaloPackages[0]).toMatchObject({
        id: 'compare-pkg-1',
        title: 'UK Local Plans',
        slug: 'uk-local',
      });

      expect(mockAirHaloClient.getPackages).toHaveBeenCalledWith({
        type: 'local',
        countries: ['UK'],
        limit: 50,
      });
    });

    it('should return empty array for unsupported country', async () => {
      mockAirHaloClient.getPackages.mockResolvedValue({ data: [] });

      const response = await request(app)
        .post('/graphql')
        .send({
          query: COMPARE_PACKAGES_QUERY,
          variables: { countryCode: 'XX' },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.compareAirHaloPackages).toEqual([]);
    });
  });

  describe('airHaloPricingData Query', () => {
    const PRICING_DATA_QUERY = `
      query GetAirHaloPricingData($packageIds: [String!]!) {
        airHaloPricingData(packageIds: $packageIds) {
          id
          type
          title
          shortInfo
          data
          amount
          day
          isUnlimited
          price {
            value
            currency
          }
          netPrice {
            value
            currency
          }
          prices {
            netPrice {
              value
              currency
            }
            recommendedRetailPrice {
              value
              currency
            }
          }
        }
      }
    `;

    it('should fetch pricing data for specific package IDs', async () => {
      const mockResponse = {
        data: [
          {
            operators: [
              {
                packages: [
                  {
                    id: 'pricing-pkg-1',
                    type: 'LOCAL',
                    title: 'Test Pricing Package',
                    short_info: 'For pricing tests',
                    data: 2048,
                    amount: 2048,
                    day: 14,
                    is_unlimited: false,
                    voice: 'N/A',
                    text: 'N/A',
                    price: { value: 20.0, currency: 'USD' },
                    net_price: { value: 16.0, currency: 'USD' },
                    prices: {
                      net_price: { value: 16.0, currency: 'USD' },
                      recommended_retail_price: { value: 24.0, currency: 'USD' },
                    },
                    qr_installation: true,
                    manual_installation: true,
                    is_fair_usage_policy: false,
                    fair_usage_policy: null,
                  },
                  {
                    id: 'other-pkg',
                    title: 'Other Package',
                  },
                ],
              },
            ],
          },
        ],
      };

      mockAirHaloClient.getPackages.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/graphql')
        .send({
          query: PRICING_DATA_QUERY,
          variables: { packageIds: ['pricing-pkg-1'] },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const { data } = response.body;
      expect(data.airHaloPricingData).toHaveLength(1);
      expect(data.airHaloPricingData[0]).toMatchObject({
        id: 'pricing-pkg-1',
        type: 'LOCAL',
        title: 'Test Pricing Package',
        shortInfo: 'For pricing tests',
        data: 2048,
        amount: 2048,
        day: 14,
        isUnlimited: false,
        price: { value: 20.0, currency: 'USD' },
        netPrice: { value: 16.0, currency: 'USD' },
      });

      expect(mockAirHaloClient.getPackages).toHaveBeenCalledWith({
        limit: 1000,
      });
    });

    it('should return empty array when no matching packages found', async () => {
      const mockResponse = {
        data: [
          {
            operators: [
              {
                packages: [
                  { id: 'different-pkg', title: 'Different Package' },
                ],
              },
            ],
          },
        ],
      };

      mockAirHaloClient.getPackages.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/graphql')
        .send({
          query: PRICING_DATA_QUERY,
          variables: { packageIds: ['non-existent-pkg'] },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.airHaloPricingData).toEqual([]);
    });

    it('should handle multiple package IDs', async () => {
      const mockResponse = {
        data: [
          {
            operators: [
              {
                packages: [
                  { id: 'pkg-1', title: 'Package 1' },
                  { id: 'pkg-2', title: 'Package 2' },
                  { id: 'pkg-3', title: 'Package 3' },
                  { id: 'pkg-4', title: 'Package 4' },
                ],
              },
            ],
          },
        ],
      };

      mockAirHaloClient.getPackages.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/graphql')
        .send({
          query: PRICING_DATA_QUERY,
          variables: { packageIds: ['pkg-1', 'pkg-3'] },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const { data } = response.body;
      expect(data.airHaloPricingData).toHaveLength(2);
      expect(data.airHaloPricingData[0].id).toBe('pkg-1');
      expect(data.airHaloPricingData[1].id).toBe('pkg-3');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing AirHalo client', async () => {
      // Create server without AirHalo client
      const serverWithoutClient = await buildTestServer({
        airHaloClient: null,
      });

      const appWithoutClient = express();
      appWithoutClient.use('/graphql', express.json(), expressMiddleware(serverWithoutClient));

      const response = await request(appWithoutClient)
        .post('/graphql')
        .send({
          query: `
            query {
              airHaloPackages {
                data {
                  id
                }
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toMatchObject({
        message: 'AirHalo client not configured',
        extensions: { code: 'SERVICE_UNAVAILABLE' },
      });

      await serverWithoutClient.stop();
    });

    it('should handle network timeouts', async () => {
      mockAirHaloClient.getPackages.mockRejectedValue(new Error('ECONNRESET'));

      const response = await request(app)
        .post('/graphql')
        .send({
          query: `
            query {
              airHaloPackages {
                data {
                  id
                }
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toMatchObject({
        message: 'Failed to fetch AirHalo packages',
        extensions: { code: 'EXTERNAL_API_ERROR' },
      });
    });
  });
});