import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { CacheHealthService } from '../../../src/services/cache-health.service';

// Mock cache adapter
const createMockCache = (shouldFail: boolean = false) => ({
  get: async (key: string) => {
    if (shouldFail) {
      throw new Error('Mock cache get failure');
    }
    if (key === 'test-key') {
      return 'test-value';
    }
    return null;
  },
  set: async (key: string, value: string, options?: any) => {
    if (shouldFail) {
      throw new Error('Mock cache set failure');
    }
    return true;
  },
  delete: async (key: string) => {
    if (shouldFail) {
      throw new Error('Mock cache delete failure');
    }
    return true;
  }
});

describe('CacheHealthService', () => {
  let cacheHealth: CacheHealthService;
  let mockCache: any;

  beforeEach(() => {
    mockCache = createMockCache();
    cacheHealth = new CacheHealthService(mockCache);
  });

  afterEach(() => {
    cacheHealth.cleanup();
  });

  describe('safeGet', () => {
    it('should successfully get data from cache', async () => {
      const result = await cacheHealth.safeGet('test-key');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('test-value');
      expect(result.error).toBeUndefined();
      expect(typeof result.responseTime).toBe('number');
    });

    it('should handle cache get failures gracefully', async () => {
      const failingCache = createMockCache(true);
      const failingCacheHealth = new CacheHealthService(failingCache);
      
      const result = await failingCacheHealth.safeGet('test-key');
      
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Mock cache get failure');
      
      failingCacheHealth.cleanup();
    });

    it('should handle null cache gracefully', async () => {
      const nullCacheHealth = new CacheHealthService(null);
      
      const result = await nullCacheHealth.safeGet('test-key');
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Cache is not available');
      
      nullCacheHealth.cleanup();
    });
  });

  describe('safeSet', () => {
    it('should successfully set data in cache', async () => {
      const result = await cacheHealth.safeSet('test-key', 'test-value', { ttl: 3600 });
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.error).toBeUndefined();
      expect(typeof result.responseTime).toBe('number');
    });

    it('should handle cache set failures gracefully', async () => {
      const failingCache = createMockCache(true);
      const failingCacheHealth = new CacheHealthService(failingCache);
      
      const result = await failingCacheHealth.safeSet('test-key', 'test-value');
      
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Mock cache set failure');
      
      failingCacheHealth.cleanup();
    });
  });

  describe('safeDelete', () => {
    it('should successfully delete data from cache', async () => {
      const result = await cacheHealth.safeDelete('test-key');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle cache delete failures gracefully', async () => {
      const failingCache = createMockCache(true);
      const failingCacheHealth = new CacheHealthService(failingCache);
      
      const result = await failingCacheHealth.safeDelete('test-key');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      failingCacheHealth.cleanup();
    });
  });

  describe('retryOperation', () => {
    it('should retry failed operations with exponential backoff', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          return { success: false, error: new Error('Temporary failure'), responseTime: 10 };
        }
        return { success: true, data: 'success', responseTime: 10 };
      };

      const result = await cacheHealth.retryOperation(operation, 3, 10);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should fail after max retries', async () => {
      const operation = async () => ({
        success: false,
        error: new Error('Persistent failure'),
        responseTime: 10
      });

      const result = await cacheHealth.retryOperation(operation, 2, 10);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Persistent failure');
    });
  });

  describe('health metrics', () => {
    it('should track successful operations', async () => {
      await cacheHealth.safeGet('test-key');
      await cacheHealth.safeSet('test-key', 'value');
      
      const metrics = cacheHealth.getHealthMetrics();
      
      expect(metrics.isHealthy).toBe(true);
      expect(metrics.totalOperations).toBe(2);
      expect(metrics.successfulOperations).toBe(2);
      expect(metrics.failedOperations).toBe(0);
      expect(metrics.consecutiveFailures).toBe(0);
    });

    it('should track failed operations and mark unhealthy after consecutive failures', async () => {
      const failingCache = createMockCache(true);
      const failingCacheHealth = new CacheHealthService(failingCache);
      
      // Simulate 6 failures (more than MAX_CONSECUTIVE_FAILURES)
      for (let i = 0; i < 6; i++) {
        await failingCacheHealth.safeGet('test-key');
      }
      
      const metrics = failingCacheHealth.getHealthMetrics();
      
      expect(metrics.isHealthy).toBe(false);
      expect(metrics.consecutiveFailures).toBe(6);
      expect(metrics.failedOperations).toBe(6);
      
      failingCacheHealth.cleanup();
    });

    it('should calculate availability percentage correctly', async () => {
      // 2 successful operations
      await cacheHealth.safeGet('test-key');
      await cacheHealth.safeSet('test-key', 'value');
      
      const availability = cacheHealth.getAvailabilityPercentage();
      expect(availability).toBe(100);
    });

    it('should reset metrics', async () => {
      await cacheHealth.safeGet('test-key');
      
      cacheHealth.resetMetrics();
      const metrics = cacheHealth.getHealthMetrics();
      
      expect(metrics.totalOperations).toBe(0);
      expect(metrics.successfulOperations).toBe(0);
      expect(metrics.consecutiveFailures).toBe(0);
    });
  });

  describe('health reporting', () => {
    it('should generate health report', async () => {
      await cacheHealth.safeGet('test-key');
      
      const report = cacheHealth.getHealthReport();
      
      expect(report).toContain('Cache Health Report');
      expect(report).toContain('✅ Healthy');
      expect(report).toContain('Operations: 1/1 successful');
    });

    it('should show unhealthy status in report', async () => {
      const failingCache = createMockCache(true);
      const failingCacheHealth = new CacheHealthService(failingCache);
      
      // Force unhealthy state
      for (let i = 0; i < 6; i++) {
        await failingCacheHealth.safeGet('test-key');
      }
      
      const report = failingCacheHealth.getHealthReport();
      
      expect(report).toContain('❌ Unhealthy');
      expect(report).toContain('Consecutive Failures: 6');
      
      failingCacheHealth.cleanup();
    });
  });

  describe('health check status', () => {
    it('should return correct health status', () => {
      expect(cacheHealth.isHealthy()).toBe(true);
    });

    it('should handle cleanup gracefully', () => {
      // Should not throw
      cacheHealth.cleanup();
      cacheHealth.cleanup(); // Second cleanup should also be safe
    });
  });
});