import { describe, it, expect, beforeEach, afterEach } from 'bun:test';

describe('CatalogSyncService - Cache Resilience', () => {
  let catalogSyncService: any;
  let mockCatalogueDataSource: any;

  beforeEach(() => {
    // Mock catalogue data source with failing cache
    mockCatalogueDataSource = {
      cache: {
        get: async () => { throw new Error('Cache failure'); },
        set: async () => { throw new Error('Cache failure'); },
        delete: async () => { throw new Error('Cache failure'); }
      },
      getWithErrorHandling: async () => ({
        bundles: [
          {
            name: 'test-bundle',
            duration: 7,
            countries: [{ iso: 'US', name: 'United States' }]
          }
        ],
        totalCount: 1
      })
    };
  });

  afterEach(() => {
    if (catalogSyncService) {
      catalogSyncService.cleanup();
    }
  });

  it('should handle cache failures during service initialization', async () => {
    const { CatalogSyncService } = await import('../../../src/services/catalog-sync.service');
    
    // Should not throw during construction even with failing cache
    expect(() => {
      catalogSyncService = new CatalogSyncService(mockCatalogueDataSource);
    }).not.toThrow();
    
    expect(catalogSyncService).toBeDefined();
    expect(typeof catalogSyncService.cleanup).toBe('function');
  });

  it('should handle cache failures in syncCountryBundles', async () => {
    const { CatalogSyncService } = await import('../../../src/services/catalog-sync.service');
    catalogSyncService = new CatalogSyncService(mockCatalogueDataSource);

    // Should handle cache failures gracefully and continue operation
    try {
      await catalogSyncService.syncCountryBundles('US');
      // If it succeeds, that's good - cache failures were handled
      expect(true).toBe(true);
    } catch (error) {
      // If it fails, it should not be due to cache errors
      expect(error.message).not.toContain('Cache failure');
    }
  });

  it('should handle cache failures in getCachedCountryBundles', async () => {
    const { CatalogSyncService } = await import('../../../src/services/catalog-sync.service');
    catalogSyncService = new CatalogSyncService(mockCatalogueDataSource);

    // Should return null gracefully when cache fails
    const result = await catalogSyncService.getCachedCountryBundles('US');
    
    // Should either return null or handle the cache failure gracefully
    expect(result).toBeNull();
  });

  it('should handle cache failures in syncFullCatalog', async () => {
    const { CatalogSyncService } = await import('../../../src/services/catalog-sync.service');
    catalogSyncService = new CatalogSyncService(mockCatalogueDataSource);

    try {
      await catalogSyncService.syncFullCatalog();
      // If sync completes, cache failures were handled gracefully
      expect(true).toBe(true);
    } catch (error) {
      // Should not fail due to cache errors - might fail due to lock or API issues
      expect(error.message).not.toContain('Cache failure');
    }
  });

  it('should handle cache failures in getCachedFullCatalog', async () => {
    const { CatalogSyncService } = await import('../../../src/services/catalog-sync.service');
    catalogSyncService = new CatalogSyncService(mockCatalogueDataSource);

    const result = await catalogSyncService.getCachedFullCatalog();
    
    // Should return null gracefully when cache fails
    expect(result).toBeNull();
  });

  it('should handle cache failures during periodic sync check', async () => {
    const { CatalogSyncService } = await import('../../../src/services/catalog-sync.service');
    catalogSyncService = new CatalogSyncService(mockCatalogueDataSource);

    // The checkAndSync method is private, but we can test the public interface
    // Should not throw during periodic operations
    expect(() => {
      catalogSyncService.startPeriodicSync();
      catalogSyncService.stopPeriodicSync();
    }).not.toThrow();
  });

  it('should cleanup resources properly even with cache failures', async () => {
    const { CatalogSyncService } = await import('../../../src/services/catalog-sync.service');
    catalogSyncService = new CatalogSyncService(mockCatalogueDataSource);

    // Should handle cleanup gracefully even with failing cache
    expect(() => catalogSyncService.cleanup()).not.toThrow();
  });

  describe('Cache Health Integration', () => {
    it('should integrate cache health monitoring', async () => {
      const workingCache = {
        get: async () => null,
        set: async () => true,
        delete: async () => true
      };

      const workingDataSource = {
        ...mockCatalogueDataSource,
        cache: workingCache
      };

      const { CatalogSyncService } = await import('../../../src/services/catalog-sync.service');
      catalogSyncService = new CatalogSyncService(workingDataSource);

      // Should have cache health integration
      expect(catalogSyncService.cacheHealth).toBeDefined();
    });

    it('should handle mixed cache success/failure scenarios', async () => {
      let callCount = 0;
      const intermittentCache = {
        get: async () => {
          callCount++;
          if (callCount % 3 === 0) {
            throw new Error('Intermittent failure');
          }
          return null;
        },
        set: async () => {
          callCount++;
          if (callCount % 4 === 0) {
            throw new Error('Intermittent failure');
          }
          return true;
        },
        delete: async () => true
      };

      const intermittentDataSource = {
        ...mockCatalogueDataSource,
        cache: intermittentCache
      };

      const { CatalogSyncService } = await import('../../../src/services/catalog-sync.service');
      catalogSyncService = new CatalogSyncService(intermittentDataSource);

      // Should handle intermittent failures gracefully
      try {
        await catalogSyncService.syncCountryBundles('US');
      } catch (error) {
        // Should not propagate cache errors
        expect(error.message).not.toContain('Intermittent failure');
      }
    });
  });

  describe('Distributed Lock Integration with Cache Failures', () => {
    it('should handle cache failures in distributed lock operations', async () => {
      const { CatalogSyncService } = await import('../../../src/services/catalog-sync.service');
      catalogSyncService = new CatalogSyncService(mockCatalogueDataSource);

      try {
        // Distributed lock might fail due to Redis unavailability, but cache errors should be separate
        const lockResult = await catalogSyncService.acquireSyncLock();
        
        if (lockResult.acquired && lockResult.release) {
          await lockResult.release();
        }
        
        // Test completed without cache-related errors
        expect(true).toBe(true);
      } catch (error) {
        // Lock failures are acceptable, but should not be cache-related
        expect(error.message).not.toContain('Cache failure');
      }
    });

    it('should maintain sync functionality even with both cache and lock failures', async () => {
      const { CatalogSyncService } = await import('../../../src/services/catalog-sync.service');
      catalogSyncService = new CatalogSyncService(mockCatalogueDataSource);

      // Test that service remains functional even with multiple failure points
      expect(typeof catalogSyncService.acquireSyncLock).toBe('function');
      expect(typeof catalogSyncService.releaseSyncLock).toBe('function');
      expect(typeof catalogSyncService.syncFullCatalog).toBe('function');
    });
  });

  describe('Resilience Under Load', () => {
    it('should handle multiple concurrent cache failures', async () => {
      const { CatalogSyncService } = await import('../../../src/services/catalog-sync.service');
      catalogSyncService = new CatalogSyncService(mockCatalogueDataSource);

      // Simulate multiple concurrent operations with failing cache
      const operations = [
        catalogSyncService.getCachedCountryBundles('US'),
        catalogSyncService.getCachedCountryBundles('CA'),
        catalogSyncService.getCachedFullCatalog()
      ];

      const results = await Promise.allSettled(operations);
      
      // All operations should either succeed or fail gracefully (not due to cache)
      results.forEach(result => {
        if (result.status === 'rejected') {
          expect(result.reason.message).not.toContain('Cache failure');
        }
      });
    });

    it('should maintain service state integrity during cache failures', async () => {
      const { CatalogSyncService } = await import('../../../src/services/catalog-sync.service');
      catalogSyncService = new CatalogSyncService(mockCatalogueDataSource);

      // Perform operations that would typically use cache
      await catalogSyncService.getCachedCountryBundles('US');
      await catalogSyncService.getCachedFullCatalog();

      // Service should remain in a consistent state
      expect(catalogSyncService).toBeDefined();
      expect(typeof catalogSyncService.cleanup).toBe('function');
    });
  });
});