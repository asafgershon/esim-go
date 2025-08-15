import { describe, it, expect, beforeEach, afterEach } from 'bun:test';

describe('CatalogueDataSource - Cache Resilience', () => {
  let catalogueDataSource: any;
  let mockConfig: any;

  beforeEach(() => {
    // Mock config with failing cache
    mockConfig = {
      cache: {
        get: async () => { throw new Error('Cache unavailable'); },
        set: async () => { throw new Error('Cache unavailable'); },
        delete: async () => { throw new Error('Cache unavailable'); }
      }
    };
  });

  afterEach(() => {
    if (catalogueDataSource) {
      catalogueDataSource.cleanup();
    }
  });

  it('should handle cache failures gracefully in constructor', async () => {
    // Should not throw during construction even with failing cache
    const { CatalogueDataSource } = await import('../../../src/datasources/esim-go/catalogue-datasource');
    
    expect(() => {
      catalogueDataSource = new CatalogueDataSource(mockConfig);
    }).not.toThrow();
    
    expect(catalogueDataSource).toBeDefined();
    expect(typeof catalogueDataSource.cleanup).toBe('function');
    expect(typeof catalogueDataSource.getCacheHealthStatus).toBe('function');
    expect(typeof catalogueDataSource.resetCacheHealth).toBe('function');
  });

  it('should provide cache health status methods', async () => {
    const { CatalogueDataSource } = await import('../../../src/datasources/esim-go/catalogue-datasource');
    catalogueDataSource = new CatalogueDataSource(mockConfig);

    const healthStatus = catalogueDataSource.getCacheHealthStatus();
    expect(typeof healthStatus).toBe('string');
    expect(healthStatus).toContain('Cache Health Report');

    // Should not throw
    expect(() => catalogueDataSource.resetCacheHealth()).not.toThrow();
  });

  it('should handle cache failures in getAllBundels without crashing', async () => {
    const { CatalogueDataSource } = await import('../../../src/datasources/esim-go/catalogue-datasource');
    catalogueDataSource = new CatalogueDataSource(mockConfig);

    try {
      // This will likely fail due to API call, but should handle cache errors gracefully
      await catalogueDataSource.getAllBundels();
    } catch (error) {
      // API failure is expected in test environment, but should not be cache-related
      expect(error.message).not.toContain('Cache unavailable');
    }
  });

  it('should handle cache failures in getPlansByRegion without crashing', async () => {
    const { CatalogueDataSource } = await import('../../../src/datasources/esim-go/catalogue-datasource');
    catalogueDataSource = new CatalogueDataSource(mockConfig);

    try {
      await catalogueDataSource.getPlansByRegion('Europe');
    } catch (error) {
      // API failure is expected, cache errors should be handled gracefully
      expect(error.message).not.toContain('Cache unavailable');
    }
  });

  it('should handle cache failures in getPlansByCountry without crashing', async () => {
    const { CatalogueDataSource } = await import('../../../src/datasources/esim-go/catalogue-datasource');
    catalogueDataSource = new CatalogueDataSource(mockConfig);

    try {
      await catalogueDataSource.getPlansByCountry('US', 'Standard Fixed');
    } catch (error) {
      // API failure is expected, cache errors should be handled gracefully
      expect(error.message).not.toContain('Cache unavailable');
    }
  });

  it('should handle cache failures in searchPlans without crashing', async () => {
    const { CatalogueDataSource } = await import('../../../src/datasources/esim-go/catalogue-datasource');
    catalogueDataSource = new CatalogueDataSource(mockConfig);

    try {
      await catalogueDataSource.searchPlans({
        country: 'US',
        duration: 7,
        limit: 10
      });
    } catch (error) {
      // Should handle cache errors gracefully and fall back to API
      expect(error.message).not.toContain('Cache unavailable');
    }
  });

  it('should cleanup resources properly', async () => {
    const { CatalogueDataSource } = await import('../../../src/datasources/esim-go/catalogue-datasource');
    catalogueDataSource = new CatalogueDataSource(mockConfig);

    // Should not throw
    expect(() => catalogueDataSource.cleanup()).not.toThrow();
  });

  describe('Cache Health Integration', () => {
    it('should integrate with cache health monitoring', async () => {
      const workingCache = {
        get: async (key: string) => null,
        set: async (key: string, value: string) => true,
        delete: async (key: string) => true
      };

      const workingConfig = { cache: workingCache };
      
      const { CatalogueDataSource } = await import('../../../src/datasources/esim-go/catalogue-datasource');
      catalogueDataSource = new CatalogueDataSource(workingConfig);

      const healthStatus = catalogueDataSource.getCacheHealthStatus();
      expect(healthStatus).toContain('Cache Health Report');
      expect(healthStatus).toContain('Status:');
    });

    it('should handle partial cache failures', async () => {
      let getCallCount = 0;
      const partiallyFailingCache = {
        get: async (key: string) => {
          getCallCount++;
          if (getCallCount % 2 === 0) {
            throw new Error('Intermittent cache failure');
          }
          return null;
        },
        set: async (key: string, value: string) => true,
        delete: async (key: string) => true
      };

      const partialConfig = { cache: partiallyFailingCache };
      
      const { CatalogueDataSource } = await import('../../../src/datasources/esim-go/catalogue-datasource');
      catalogueDataSource = new CatalogueDataSource(partialConfig);

      // Should handle intermittent failures gracefully
      try {
        await catalogueDataSource.searchPlans({ limit: 5 });
      } catch (error) {
        // API errors are expected, but cache errors should be handled
        expect(error.message).not.toContain('Intermittent cache failure');
      }
    });
  });

  describe('Fallback Strategies', () => {
    it('should have fallback methods available', async () => {
      const { CatalogueDataSource } = await import('../../../src/datasources/esim-go/catalogue-datasource');
      catalogueDataSource = new CatalogueDataSource(mockConfig);

      // Check that fallback-related methods exist (private methods won't be directly testable)
      expect(catalogueDataSource).toBeDefined();
      
      // Verify backup service integration exists
      expect(catalogueDataSource.backupService).toBeDefined();
    });

    it('should handle total system failure gracefully', async () => {
      const totallyFailingCache = {
        get: async () => { throw new Error('Total cache failure'); },
        set: async () => { throw new Error('Total cache failure'); },
        delete: async () => { throw new Error('Total cache failure'); }
      };

      const failingConfig = { cache: totallyFailingCache };
      
      const { CatalogueDataSource } = await import('../../../src/datasources/esim-go/catalogue-datasource');
      
      // Should not throw during construction
      expect(() => {
        catalogueDataSource = new CatalogueDataSource(failingConfig);
      }).not.toThrow();

      // Health status should still be available
      const healthStatus = catalogueDataSource.getCacheHealthStatus();
      expect(typeof healthStatus).toBe('string');
    });
  });
});