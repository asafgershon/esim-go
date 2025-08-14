import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { GraphQLError } from 'graphql';
import { airHaloResolvers } from '../../../src/resolvers/airhalo.resolvers';
import type { Context } from '../../../src/context/types';
import type { AirHaloPackageFilter } from '../../../src/types';

// Mock AirHalo client
const mockAirHaloClient = {
  getPackages: mock(() => Promise.resolve({})),
  getCompatibleDevices: mock(() => Promise.resolve({})),
};

// Mock logger
const mockLogger = {
  info: mock(() => {}),
  error: mock(() => {}),
};

// Create mock context
const createMockContext = (includeAirHaloClient = true): Context => ({
  user: null,
  services: {
    airHaloClient: includeAirHaloClient ? mockAirHaloClient : null,
  },
  // Add other required context properties as needed
} as Context);

describe('AirHalo Resolvers', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockAirHaloClient.getPackages.mockReset();
    mockAirHaloClient.getCompatibleDevices.mockReset();
    mockLogger.info.mockReset();
    mockLogger.error.mockReset();
  });

  describe('airHaloPackages', () => {
    it('should fetch packages successfully with basic filter', async () => {
      const mockPackagesResponse = {
        data: [
          {
            id: 'pkg1',
            title: 'UK Data Plan',
            slug: 'uk-data-plan',
            image: {
              url: 'https://example.com/uk.jpg',
              width: 300,
              height: 200,
            },
            operators: [
              {
                id: 'op1',
                title: 'UK Operator',
                type: 'MNO',
                countries: [
                  {
                    id: 'uk',
                    title: 'United Kingdom',
                    slug: 'united-kingdom',
                  },
                ],
                packages: [
                  {
                    id: 'pkg-1gb',
                    type: 'LOCAL',
                    title: '1GB UK Plan',
                    short_info: '1GB data for 7 days',
                    data: 1024,
                    amount: 1024,
                    day: 7,
                    is_unlimited: false,
                    voice: 'N/A',
                    text: 'N/A',
                    price: {
                      value: 10.00,
                      currency: 'USD',
                    },
                    net_price: {
                      value: 8.00,
                      currency: 'USD',
                    },
                    prices: {
                      net_price: {
                        value: 8.00,
                        currency: 'USD',
                      },
                      recommended_retail_price: {
                        value: 12.00,
                        currency: 'USD',
                      },
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
                      {
                        name: 'EE',
                        type: '4G/5G',
                      },
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
          first: 'https://api.airalo.com/v2/packages?page=1',
          last: 'https://api.airalo.com/v2/packages?page=10',
          prev: null,
          next: 'https://api.airalo.com/v2/packages?page=2',
        },
        meta: {
          current_page: 1,
          from: 1,
          last_page: 10,
          path: 'https://api.airalo.com/v2/packages',
          per_page: 20,
          to: 20,
          total: 200,
        },
      };

      mockAirHaloClient.getPackages.mockResolvedValue(mockPackagesResponse);

      const filter: AirHaloPackageFilter = {
        type: 'LOCAL',
        countries: ['UK'],
        limit: 20,
      };

      const context = createMockContext();
      const result = await airHaloResolvers.Query.airHaloPackages(
        {},
        { filter },
        context
      );

      expect(mockAirHaloClient.getPackages).toHaveBeenCalledWith({
        limit: 20,
        page: undefined,
        type: 'local', // Should be lowercase
        countries: ['UK'],
      });

      expect(result).toEqual({
        data: [
          {
            id: 'pkg1',
            title: 'UK Data Plan',
            slug: 'uk-data-plan',
            image: {
              url: 'https://example.com/uk.jpg',
              width: 300,
              height: 200,
            },
            operators: [
              {
                id: 'op1',
                title: 'UK Operator',
                type: 'MNO',
                countries: [
                  {
                    id: 'uk',
                    title: 'United Kingdom',
                    slug: 'united-kingdom',
                  },
                ],
                packages: [
                  {
                    id: 'pkg-1gb',
                    type: 'LOCAL',
                    title: '1GB UK Plan',
                    shortInfo: '1GB data for 7 days',
                    data: 1024,
                    amount: 1024,
                    day: 7,
                    isUnlimited: false,
                    voice: 'N/A',
                    text: 'N/A',
                    price: {
                      value: 10.00,
                      currency: 'USD',
                    },
                    netPrice: {
                      value: 8.00,
                      currency: 'USD',
                    },
                    prices: {
                      netPrice: {
                        value: 8.00,
                        currency: 'USD',
                      },
                      recommendedRetailPrice: {
                        value: 12.00,
                        currency: 'USD',
                      },
                    },
                    qrInstallation: true,
                    manualInstallation: true,
                    isFairUsagePolicy: false,
                    fairUsagePolicy: null,
                  },
                ],
                coverages: [
                  {
                    networks: [
                      {
                        name: 'EE',
                        type: '4G/5G',
                      },
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
          first: 'https://api.airalo.com/v2/packages?page=1',
          last: 'https://api.airalo.com/v2/packages?page=10',
          prev: null,
          next: 'https://api.airalo.com/v2/packages?page=2',
        },
        meta: {
          currentPage: 1,
          from: 1,
          lastPage: 10,
          path: 'https://api.airalo.com/v2/packages',
          perPage: 20,
          to: 20,
          total: 200,
        },
      });
    });

    it('should handle empty packages response', async () => {
      const mockEmptyResponse = {
        data: [],
        links: null,
        meta: null,
      };

      mockAirHaloClient.getPackages.mockResolvedValue(mockEmptyResponse);

      const context = createMockContext();
      const result = await airHaloResolvers.Query.airHaloPackages({}, {}, context);

      expect(result).toEqual({
        data: [],
        links: null,
        meta: null,
      });
    });

    it('should throw error when airHaloClient is not configured', async () => {
      const context = createMockContext(false); // No airHaloClient

      await expect(
        airHaloResolvers.Query.airHaloPackages({}, {}, context)
      ).rejects.toThrow(
        new GraphQLError('AirHalo client not configured', {
          extensions: { code: 'SERVICE_UNAVAILABLE' },
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockAirHaloClient.getPackages.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const context = createMockContext();

      await expect(
        airHaloResolvers.Query.airHaloPackages({}, {}, context)
      ).rejects.toThrow(
        new GraphQLError('Failed to fetch AirHalo packages', {
          extensions: { code: 'EXTERNAL_API_ERROR' },
        })
      );
    });

    it('should transform filter types correctly', async () => {
      mockAirHaloClient.getPackages.mockResolvedValue({ data: [] });

      const filter: AirHaloPackageFilter = {
        type: 'REGIONAL',
        page: 2,
        limit: 50,
      };

      const context = createMockContext();
      await airHaloResolvers.Query.airHaloPackages({}, { filter }, context);

      expect(mockAirHaloClient.getPackages).toHaveBeenCalledWith({
        limit: 50,
        page: 2,
        type: 'regional', // Should be lowercase
        countries: undefined,
      });
    });
  });

  describe('airHaloCompatibleDevices', () => {
    it('should fetch compatible devices successfully', async () => {
      const mockDevicesResponse = {
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
        ],
      };

      mockAirHaloClient.getCompatibleDevices.mockResolvedValue(mockDevicesResponse);

      const context = createMockContext();
      const result = await airHaloResolvers.Query.airHaloCompatibleDevices(
        {},
        {},
        context
      );

      expect(mockAirHaloClient.getCompatibleDevices).toHaveBeenCalled();
      expect(result).toEqual({
        data: [
          {
            manufacturer: 'Apple',
            model: 'iPhone 14',
            esimSupport: true,
          },
          {
            manufacturer: 'Samsung',
            model: 'Galaxy S23',
            esimSupport: true,
          },
        ],
      });
    });

    it('should handle missing esim_support field', async () => {
      const mockDevicesResponse = {
        data: [
          {
            manufacturer: 'Google',
            model: 'Pixel 7',
            // esim_support field is missing
          },
        ],
      };

      mockAirHaloClient.getCompatibleDevices.mockResolvedValue(mockDevicesResponse);

      const context = createMockContext();
      const result = await airHaloResolvers.Query.airHaloCompatibleDevices(
        {},
        {},
        context
      );

      expect(result).toEqual({
        data: [
          {
            manufacturer: 'Google',
            model: 'Pixel 7',
            esimSupport: true, // Should default to true
          },
        ],
      });
    });

    it('should throw error when airHaloClient is not configured', async () => {
      const context = createMockContext(false);

      await expect(
        airHaloResolvers.Query.airHaloCompatibleDevices({}, {}, context)
      ).rejects.toThrow(
        new GraphQLError('AirHalo client not configured', {
          extensions: { code: 'SERVICE_UNAVAILABLE' },
        })
      );
    });

    it('should handle API errors', async () => {
      mockAirHaloClient.getCompatibleDevices.mockRejectedValue(
        new Error('Network timeout')
      );

      const context = createMockContext();

      await expect(
        airHaloResolvers.Query.airHaloCompatibleDevices({}, {}, context)
      ).rejects.toThrow(
        new GraphQLError('Failed to fetch AirHalo compatible devices', {
          extensions: { code: 'EXTERNAL_API_ERROR' },
        })
      );
    });
  });

  describe('compareAirHaloPackages', () => {
    it('should compare packages for a specific country', async () => {
      const mockCompareResponse = {
        data: [
          {
            id: 'compare-pkg1',
            title: 'France Local Plan',
            slug: 'france-local',
            operators: [
              {
                id: 'fr-op1',
                title: 'Orange France',
                packages: [
                  {
                    id: 'fr-1gb',
                    type: 'LOCAL',
                    title: '1GB France',
                    amount: 1024,
                    day: 7,
                    price: { value: 8.0, currency: 'USD' },
                    net_price: { value: 6.0, currency: 'USD' },
                    prices: {
                      net_price: { value: 6.0, currency: 'USD' },
                      recommended_retail_price: { value: 10.0, currency: 'USD' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      mockAirHaloClient.getPackages.mockResolvedValue(mockCompareResponse);

      const context = createMockContext();
      const result = await airHaloResolvers.Query.compareAirHaloPackages(
        {},
        { countryCode: 'FR' },
        context
      );

      expect(mockAirHaloClient.getPackages).toHaveBeenCalledWith({
        type: 'local',
        countries: ['FR'],
        limit: 50,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('compare-pkg1');
      expect(result[0].title).toBe('France Local Plan');
    });

    it('should return empty array when no packages found', async () => {
      mockAirHaloClient.getPackages.mockResolvedValue({ data: [] });

      const context = createMockContext();
      const result = await airHaloResolvers.Query.compareAirHaloPackages(
        {},
        { countryCode: 'XX' },
        context
      );

      expect(result).toEqual([]);
    });
  });

  describe('airHaloPricingData', () => {
    it('should fetch pricing data for specific package IDs', async () => {
      const mockPricingResponse = {
        data: [
          {
            operators: [
              {
                packages: [
                  {
                    id: 'pkg-123',
                    type: 'LOCAL',
                    title: 'Test Package',
                    short_info: 'Test description',
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
                  {
                    id: 'pkg-456', // This shouldn't be included
                    type: 'LOCAL',
                    title: 'Other Package',
                  },
                ],
              },
            ],
          },
        ],
      };

      mockAirHaloClient.getPackages.mockResolvedValue(mockPricingResponse);

      const context = createMockContext();
      const result = await airHaloResolvers.Query.airHaloPricingData(
        {},
        { packageIds: ['pkg-123'] },
        context
      );

      expect(mockAirHaloClient.getPackages).toHaveBeenCalledWith({
        limit: 1000,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pkg-123');
      expect(result[0].title).toBe('Test Package');
    });

    it('should handle multiple matching packages', async () => {
      const mockPricingResponse = {
        data: [
          {
            operators: [
              {
                packages: [
                  { id: 'pkg-1', title: 'Package 1' },
                  { id: 'pkg-2', title: 'Package 2' },
                  { id: 'pkg-3', title: 'Package 3' },
                ],
              },
            ],
          },
        ],
      };

      mockAirHaloClient.getPackages.mockResolvedValue(mockPricingResponse);

      const context = createMockContext();
      const result = await airHaloResolvers.Query.airHaloPricingData(
        {},
        { packageIds: ['pkg-1', 'pkg-3'] },
        context
      );

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('pkg-1');
      expect(result[1].id).toBe('pkg-3');
    });

    it('should return empty array when no matching packages found', async () => {
      mockPricingResponse = {
        data: [
          {
            operators: [
              {
                packages: [
                  { id: 'pkg-999', title: 'Different Package' },
                ],
              },
            ],
          },
        ],
      };

      mockAirHaloClient.getPackages.mockResolvedValue(mockPricingResponse);

      const context = createMockContext();
      const result = await airHaloResolvers.Query.airHaloPricingData(
        {},
        { packageIds: ['pkg-123'] },
        context
      );

      expect(result).toEqual([]);
    });
  });
});