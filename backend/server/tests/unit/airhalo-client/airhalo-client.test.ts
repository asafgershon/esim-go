import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { AirHaloClient, type AirHaloClientConfig } from '@airhalo/client';

// Mock the generated API classes
const mockPackagesApi = {
  v2PackagesGet: mock(() => Promise.resolve({ data: {} })),
  v2CompatibleDevicesGet: mock(() => Promise.resolve({ data: {} })),
};

const mockAuthApi = {
  v2TokenPost: mock(() => Promise.resolve({ data: {} })),
};

const mockOrdersApi = {
  v2OrdersPost: mock(() => Promise.resolve({ data: {} })),
};

const mockManageOrdersApi = {
  v2OrdersGet: mock(() => Promise.resolve({ data: {} })),
  v2OrdersOrderIdGet: mock(() => Promise.resolve({ data: {} })),
};

// Mock the configuration class
const mockConfiguration = mock(() => ({}));

// Mock all the generated API classes
mock.module('@airhalo/client/generated/api', () => ({
  RESTAPIEndpointsBrowsePackagesApi: mock(() => mockPackagesApi),
  RESTAPIEndpointsAuthenticateApi: mock(() => mockAuthApi),
  RESTAPIEndpointsPlaceOrderApi: mock(() => mockOrdersApi),
  RESTAPIEndpointsManageOrdersESIMsApi: mock(() => mockManageOrdersApi),
}));

mock.module('@airhalo/client/generated/configuration', () => ({
  Configuration: mockConfiguration,
}));

describe('AirHaloClient', () => {
  let client: AirHaloClient;
  const mockConfig: AirHaloClientConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    baseUrl: 'https://api.test-airalo.com',
    timeout: 10000,
  };

  beforeEach(() => {
    // Reset all mocks
    mockPackagesApi.v2PackagesGet.mockReset();
    mockPackagesApi.v2CompatibleDevicesGet.mockReset();
    mockAuthApi.v2TokenPost.mockReset();
    mockOrdersApi.v2OrdersPost.mockReset();
    mockManageOrdersApi.v2OrdersGet.mockReset();
    mockManageOrdersApi.v2OrdersOrderIdGet.mockReset();
    mockConfiguration.mockReset();

    client = new AirHaloClient(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(mockConfiguration).toHaveBeenCalledWith({
        basePath: 'https://api.test-airalo.com',
        baseOptions: {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        },
      });
    });

    it('should use default baseUrl when not provided', () => {
      const configWithoutUrl = {
        clientId: 'test-id',
        clientSecret: 'test-secret',
      };
      
      new AirHaloClient(configWithoutUrl);
      
      expect(mockConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          basePath: 'https://api.airalo.com',
        })
      );
    });

    it('should use default timeout when not provided', () => {
      const configWithoutTimeout = {
        clientId: 'test-id',
        clientSecret: 'test-secret',
      };
      
      new AirHaloClient(configWithoutTimeout);
      
      expect(mockConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          baseOptions: expect.objectContaining({
            timeout: 30000,
          }),
        })
      );
    });
  });

  describe('authentication', () => {
    it('should authenticate and cache token', async () => {
      const mockTokenResponse = {
        data: {
          data: {
            access_token: 'test-token-123',
            expires_in: 3600, // 1 hour
          },
        },
      };

      mockAuthApi.v2TokenPost.mockResolvedValue(mockTokenResponse);
      mockPackagesApi.v2PackagesGet.mockResolvedValue({
        data: { data: [] },
      });

      // First call should authenticate
      await client.getPackages();

      expect(mockAuthApi.v2TokenPost).toHaveBeenCalledWith({
        accept: 'application/json',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        grantType: 'client_credentials',
      });

      expect(mockPackagesApi.v2PackagesGet).toHaveBeenCalledWith(
        expect.objectContaining({
          authorization: 'Bearer test-token-123',
        })
      );

      // Reset the mock to ensure second call doesn't authenticate again
      mockAuthApi.v2TokenPost.mockReset();

      // Second call should use cached token
      await client.getPackages();

      expect(mockAuthApi.v2TokenPost).not.toHaveBeenCalled();
    });

    it('should re-authenticate when token expires', async () => {
      const mockTokenResponse = {
        data: {
          data: {
            access_token: 'test-token-123',
            expires_in: 1, // 1 second (will expire quickly)
          },
        },
      };

      mockAuthApi.v2TokenPost.mockResolvedValue(mockTokenResponse);
      mockPackagesApi.v2PackagesGet.mockResolvedValue({
        data: { data: [] },
      });

      // First call
      await client.getPackages();
      expect(mockAuthApi.v2TokenPost).toHaveBeenCalledTimes(1);

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Second call should re-authenticate
      await client.getPackages();
      expect(mockAuthApi.v2TokenPost).toHaveBeenCalledTimes(2);
    });

    it('should handle authentication errors', async () => {
      mockAuthApi.v2TokenPost.mockRejectedValue(new Error('Invalid credentials'));

      await expect(client.getPackages()).rejects.toThrow(
        'AirHalo authentication failed: Error: Invalid credentials'
      );
    });
  });

  describe('getPackages', () => {
    beforeEach(() => {
      // Mock successful authentication
      mockAuthApi.v2TokenPost.mockResolvedValue({
        data: {
          data: {
            access_token: 'test-token',
            expires_in: 3600,
          },
        },
      });
    });

    it('should fetch packages without filter', async () => {
      const mockPackagesResponse = {
        data: {
          data: [
            {
              id: 'pkg1',
              title: 'Test Package',
              slug: 'test-package',
            },
          ],
        },
      };

      mockPackagesApi.v2PackagesGet.mockResolvedValue(mockPackagesResponse);

      const result = await client.getPackages();

      expect(mockPackagesApi.v2PackagesGet).toHaveBeenCalledWith({
        accept: 'application/json',
        authorization: 'Bearer test-token',
        filterType: undefined,
        filterCountry: undefined,
        limit: undefined,
        page: undefined,
        include: undefined,
      });

      expect(result).toEqual(mockPackagesResponse.data);
    });

    it('should fetch packages with filter', async () => {
      const mockPackagesResponse = {
        data: { data: [] },
      };

      mockPackagesApi.v2PackagesGet.mockResolvedValue(mockPackagesResponse);

      const filter = {
        type: 'local' as const,
        countries: ['US', 'CA'],
        limit: 20,
        page: 2,
      };

      await client.getPackages(filter);

      expect(mockPackagesApi.v2PackagesGet).toHaveBeenCalledWith({
        accept: 'application/json',
        authorization: 'Bearer test-token',
        filterType: 'local',
        filterCountry: 'US,CA',
        limit: '20',
        page: '2',
        include: undefined,
      });
    });

    it('should handle API errors', async () => {
      mockPackagesApi.v2PackagesGet.mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      await expect(client.getPackages()).rejects.toThrow(
        'Failed to fetch AirHalo packages: Error: Rate limit exceeded'
      );
    });
  });

  describe('getCompatibleDevices', () => {
    beforeEach(() => {
      mockAuthApi.v2TokenPost.mockResolvedValue({
        data: {
          data: {
            access_token: 'test-token',
            expires_in: 3600,
          },
        },
      });
    });

    it('should fetch compatible devices successfully', async () => {
      const mockDevicesResponse = {
        data: {
          data: [
            {
              manufacturer: 'Apple',
              model: 'iPhone 14',
              esim_support: true,
            },
          ],
        },
      };

      mockPackagesApi.v2CompatibleDevicesGet.mockResolvedValue(mockDevicesResponse);

      const result = await client.getCompatibleDevices();

      expect(mockPackagesApi.v2CompatibleDevicesGet).toHaveBeenCalledWith({
        accept: 'application/json',
        authorization: 'Bearer test-token',
      });

      expect(result).toEqual(mockDevicesResponse.data);
    });

    it('should handle API errors', async () => {
      mockPackagesApi.v2CompatibleDevicesGet.mockRejectedValue(
        new Error('Service unavailable')
      );

      await expect(client.getCompatibleDevices()).rejects.toThrow(
        'Failed to fetch compatible devices: Error: Service unavailable'
      );
    });
  });

  describe('placeOrder', () => {
    beforeEach(() => {
      mockAuthApi.v2TokenPost.mockResolvedValue({
        data: {
          data: {
            access_token: 'test-token',
            expires_in: 3600,
          },
        },
      });
    });

    it('should place order with minimal parameters', async () => {
      const mockOrderResponse = {
        data: {
          data: {
            id: 'order-123',
            status: 'pending',
          },
        },
      };

      mockOrdersApi.v2OrdersPost.mockResolvedValue(mockOrderResponse);

      const result = await client.placeOrder('pkg-123');

      expect(mockOrdersApi.v2OrdersPost).toHaveBeenCalledWith({
        accept: 'application/json',
        authorization: 'Bearer test-token',
        quantity: '1',
        packageId: 'pkg-123',
        type: 'sim',
        description: '',
        brandSettingsName: '',
        toEmail: '',
        sharingOption: '',
        copyAddress: '',
      });

      expect(result).toEqual(mockOrderResponse.data);
    });

    it('should place order with custom parameters', async () => {
      const mockOrderResponse = {
        data: { data: { id: 'order-456' } },
      };

      mockOrdersApi.v2OrdersPost.mockResolvedValue(mockOrderResponse);

      const customData = {
        description: 'Test order',
        toEmail: 'test@example.com',
        brandSettingsName: 'TestBrand',
      };

      await client.placeOrder('pkg-456', 2, customData);

      expect(mockOrdersApi.v2OrdersPost).toHaveBeenCalledWith({
        accept: 'application/json',
        authorization: 'Bearer test-token',
        quantity: '2',
        packageId: 'pkg-456',
        type: 'sim',
        description: 'Test order',
        brandSettingsName: 'TestBrand',
        toEmail: 'test@example.com',
        sharingOption: '',
        copyAddress: '',
      });
    });

    it('should handle order errors', async () => {
      mockOrdersApi.v2OrdersPost.mockRejectedValue(
        new Error('Insufficient balance')
      );

      await expect(client.placeOrder('pkg-123')).rejects.toThrow(
        'Failed to place AirHalo order: Error: Insufficient balance'
      );
    });
  });

  describe('getOrders', () => {
    beforeEach(() => {
      mockAuthApi.v2TokenPost.mockResolvedValue({
        data: {
          data: {
            access_token: 'test-token',
            expires_in: 3600,
          },
        },
      });
    });

    it('should fetch orders without parameters', async () => {
      const mockOrdersResponse = {
        data: { data: [] },
      };

      mockManageOrdersApi.v2OrdersGet.mockResolvedValue(mockOrdersResponse);

      const result = await client.getOrders();

      expect(mockManageOrdersApi.v2OrdersGet).toHaveBeenCalledWith({
        accept: 'application/json',
        authorization: 'Bearer test-token',
        limit: undefined,
        page: undefined,
      });

      expect(result).toEqual(mockOrdersResponse.data);
    });

    it('should fetch orders with pagination', async () => {
      const mockOrdersResponse = {
        data: { data: [] },
      };

      mockManageOrdersApi.v2OrdersGet.mockResolvedValue(mockOrdersResponse);

      await client.getOrders(50, 2);

      expect(mockManageOrdersApi.v2OrdersGet).toHaveBeenCalledWith({
        accept: 'application/json',
        authorization: 'Bearer test-token',
        limit: '50',
        page: '2',
      });
    });
  });

  describe('getOrderById', () => {
    beforeEach(() => {
      mockAuthApi.v2TokenPost.mockResolvedValue({
        data: {
          data: {
            access_token: 'test-token',
            expires_in: 3600,
          },
        },
      });
    });

    it('should fetch order by ID', async () => {
      const mockOrderResponse = {
        data: {
          id: 'order-123',
          status: 'completed',
        },
      };

      mockManageOrdersApi.v2OrdersOrderIdGet.mockResolvedValue(mockOrderResponse);

      const result = await client.getOrderById('order-123');

      expect(mockManageOrdersApi.v2OrdersOrderIdGet).toHaveBeenCalledWith({
        accept: 'application/json',
        authorization: 'Bearer test-token',
        orderId: 'order-123',
      });

      expect(result).toEqual(mockOrderResponse.data);
    });

    it('should handle order not found', async () => {
      mockManageOrdersApi.v2OrdersOrderIdGet.mockRejectedValue(
        new Error('Order not found')
      );

      await expect(client.getOrderById('invalid-order')).rejects.toThrow(
        'Failed to fetch AirHalo order invalid-order: Error: Order not found'
      );
    });
  });

  describe('searchPackages', () => {
    beforeEach(() => {
      mockAuthApi.v2TokenPost.mockResolvedValue({
        data: {
          data: {
            access_token: 'test-token',
            expires_in: 3600,
          },
        },
      });
    });

    it('should search packages with comprehensive criteria', async () => {
      const mockSearchResponse = {
        data: {
          data: [
            {
              id: 'pkg1',
              title: 'US Package',
              slug: 'us-package',
              type: 'local',
              operators: [
                {
                  id: 'op1',
                  title: 'Verizon',
                  countries: [
                    { iso: 'US', region: 'North America' },
                  ],
                  packages: [
                    {
                      id: 'p1',
                      amount: 1024, // 1GB
                      day: 7,
                      price: 15.00,
                      currency: 'USD',
                      is_unlimited: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      mockPackagesApi.v2PackagesGet.mockResolvedValue(mockSearchResponse);

      const criteria = {
        countries: ['US'],
        minDataAmount: 500,
        maxDataAmount: 2000,
        minDuration: 5,
        maxDuration: 10,
        sortBy: 'price' as const,
        sortDirection: 'asc' as const,
      };

      const result = await client.searchPackages(criteria);

      expect(mockPackagesApi.v2PackagesGet).toHaveBeenCalledWith({
        accept: 'application/json',
        authorization: 'Bearer test-token',
        limit: '50',
        page: '1',
        filterType: undefined,
        filterCountry: 'US',
        include: undefined,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pkg1');
      expect(result[0].countries).toContain('US');
      expect(result[0].regions).toContain('North America');
    });

    it('should filter unlimited packages', async () => {
      const mockSearchResponse = {
        data: {
          data: [
            {
              id: 'pkg1',
              operators: [
                {
                  packages: [
                    {
                      id: 'p1',
                      amount: 0,
                      is_unlimited: true,
                      day: 30,
                      price: 50,
                    },
                    {
                      id: 'p2',
                      amount: 1024,
                      is_unlimited: false,
                      day: 30,
                      price: 20,
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      mockPackagesApi.v2PackagesGet.mockResolvedValue(mockSearchResponse);

      // Search for unlimited packages only
      const result = await client.searchPackages({
        isUnlimited: true,
      });

      expect(result[0].operators[0].packages).toHaveLength(1);
      expect(result[0].operators[0].packages[0].id).toBe('p1');
      expect(result[0].operators[0].packages[0].is_unlimited).toBe(true);
    });

    it('should sort packages by price', async () => {
      const mockSearchResponse = {
        data: {
          data: [
            {
              id: 'pkg1',
              operators: [
                {
                  packages: [{ price: 30 }],
                },
              ],
            },
            {
              id: 'pkg2',
              operators: [
                {
                  packages: [{ price: 10 }],
                },
              ],
            },
            {
              id: 'pkg3',
              operators: [
                {
                  packages: [{ price: 20 }],
                },
              ],
            },
          ],
        },
      };

      mockPackagesApi.v2PackagesGet.mockResolvedValue(mockSearchResponse);

      const result = await client.searchPackages({
        sortBy: 'price',
        sortDirection: 'asc',
      });

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('pkg2'); // Cheapest first
      expect(result[1].id).toBe('pkg3');
      expect(result[2].id).toBe('pkg1'); // Most expensive last
    });
  });

  describe('findSimilarPackages', () => {
    beforeEach(() => {
      mockAuthApi.v2TokenPost.mockResolvedValue({
        data: {
          data: {
            access_token: 'test-token',
            expires_in: 3600,
          },
        },
      });
    });

    it('should find similar packages by specification', async () => {
      const mockSimilarResponse = {
        data: {
          data: [
            {
              id: 'similar1',
              operators: [
                {
                  countries: [{ iso: 'US' }],
                  packages: [
                    {
                      amount: 1024,
                      day: 7,
                      is_unlimited: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      mockPackagesApi.v2PackagesGet.mockResolvedValue(mockSimilarResponse);

      const targetSpec = {
        countries: ['US'],
        duration: 7,
        dataAmount: 1024,
        isUnlimited: false,
      };

      const result = await client.findSimilarPackages(targetSpec);

      // Should call with broader criteria for similarity matching
      expect(mockPackagesApi.v2PackagesGet).toHaveBeenCalledWith(
        expect.objectContaining({
          filterCountry: 'US',
          limit: '100', // Higher limit for similarity matching
        })
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('similar1');
    });

    it('should handle unlimited packages in similarity search', async () => {
      const mockSimilarResponse = {
        data: {
          data: [
            {
              id: 'unlimited1',
              operators: [
                {
                  packages: [
                    {
                      amount: 0,
                      day: 30,
                      is_unlimited: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      mockPackagesApi.v2PackagesGet.mockResolvedValue(mockSimilarResponse);

      const targetSpec = {
        duration: 30,
        isUnlimited: true,
      };

      const result = await client.findSimilarPackages(targetSpec);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('unlimited1');
    });
  });
});