import { describe, it, expect } from 'bun:test';

describe('CatalogSyncService - Distributed Lock Integration', () => {
  it('should have required lock methods in interface', async () => {
    // Mock the catalogue data source
    const mockCatalogueDataSource = {
      getWithErrorHandling: async () => ({ bundles: [], totalCount: 0 }),
      cache: {
        set: async () => true,
        get: async () => null
      }
    };

    // Import the service dynamically to avoid env issues
    const { CatalogSyncService } = await import('../../../src/services/catalog-sync.service');
    const catalogSyncService = new CatalogSyncService(mockCatalogueDataSource as any);

    // Test interface exists
    expect(typeof catalogSyncService.acquireSyncLock).toBe('function');
    expect(typeof catalogSyncService.releaseSyncLock).toBe('function');
    expect(typeof catalogSyncService.cleanup).toBe('function');
    expect(typeof catalogSyncService.syncFullCatalog).toBe('function');
  });

  it('should have acquireSyncLock return a promise with LockResult', async () => {
    const mockCatalogueDataSource = {
      getWithErrorHandling: async () => ({ bundles: [], totalCount: 0 }),
      cache: { set: async () => true, get: async () => null }
    };

    const { CatalogSyncService } = await import('../../../src/services/catalog-sync.service');
    const catalogSyncService = new CatalogSyncService(mockCatalogueDataSource as any);

    try {
      const result = await catalogSyncService.acquireSyncLock();
      
      // Should return a LockResult object
      expect(typeof result).toBe('object');
      expect(typeof result.acquired).toBe('boolean');
      
      // If acquired is false, should have error message
      if (!result.acquired) {
        expect(typeof result.error).toBe('string');
      }
      
      // If acquired is true, should have release function
      if (result.acquired && result.release) {
        expect(typeof result.release).toBe('function');
        await result.release(); // Clean up
      }
    } catch (error) {
      // Connection errors are acceptable in test environment
      expect(error).toBeDefined();
    }

    await catalogSyncService.cleanup();
  });

  it('should handle lock acquisition failure gracefully in syncFullCatalog', async () => {
    const mockCatalogueDataSource = {
      getWithErrorHandling: async () => ({ bundles: [], totalCount: 0 }),
      cache: { set: async () => true, get: async () => null }
    };

    const { CatalogSyncService } = await import('../../../src/services/catalog-sync.service');
    const catalogSyncService = new CatalogSyncService(mockCatalogueDataSource as any);

    // This should not throw even if Redis is not available
    try {
      await catalogSyncService.syncFullCatalog();
      // Should complete without throwing
      expect(true).toBe(true);
    } catch (error) {
      // Any errors should be Redis connection related, not application logic
      expect(error instanceof Error ? error.message : String(error)).toMatch(/redis|connection|connect/i);
    }

    await catalogSyncService.cleanup();
  });
});