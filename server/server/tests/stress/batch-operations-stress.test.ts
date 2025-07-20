import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { BatchCacheOperations } from '../../src/lib/batch-cache-operations';

// Mock cache adapter for stress testing
const createStressTestCache = (dataSize: number = 1000, shouldFail: boolean = false) => {
  const cache = new Map<string, string>();
  
  // Pre-populate cache with test data
  for (let i = 0; i < dataSize; i++) {
    const bundleData = {
      id: `bundle-${i}`,
      name: `Test Bundle ${i}`,
      description: `Description for bundle ${i}`,
      price: 10 + (i % 50),
      currency: 'USD',
      duration: [1, 7, 15, 30][i % 4],
      countries: [
        { iso: 'US', name: 'United States' },
        { iso: 'CA', name: 'Canada' }
      ],
      dataAllowance: `${1 + (i % 10)}GB`,
      region: 'North America',
      unlimited: false,
      billingType: 'one-time',
      baseCountry: 'US',
      roamingCountries: ['US', 'CA']
    };
    
    cache.set(`esim-go:catalog:bundle:bundle-${i}`, JSON.stringify(bundleData));
  }

  return {
    get: async (key: string) => {
      if (shouldFail && Math.random() < 0.1) { // 10% failure rate
        throw new Error('Mock cache failure');
      }
      
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
      return cache.get(key) || null;
    },
    set: async (key: string, value: string) => {
      if (shouldFail && Math.random() < 0.05) { // 5% failure rate
        throw new Error('Mock cache set failure');
      }
      
      await new Promise(resolve => setTimeout(resolve, Math.random() * 3));
      cache.set(key, value);
      return true;
    },
    delete: async (key: string) => {
      if (shouldFail) {
        throw new Error('Mock cache delete failure');
      }
      return cache.delete(key);
    },
    size: () => cache.size
  };
};

describe('Batch Operations Stress Tests', () => {
  let batchOperations: BatchCacheOperations;
  let mockCache: any;

  afterEach(async () => {
    if (batchOperations) {
      await batchOperations.cleanup();
    }
  });

  describe('Small Scale Tests (< 1000 items)', () => {
    beforeEach(() => {
      mockCache = createStressTestCache(500);
      batchOperations = new BatchCacheOperations(mockCache);
    });

    it('should handle 500 bundle retrievals efficiently', async () => {
      const keys = Array.from({ length: 500 }, (_, i) => `esim-go:catalog:bundle:bundle-${i}`);
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;

      const result = await batchOperations.batchGet(keys, {
        batchSize: 50,
        maxMemoryPerBatch: 10,
        timeout: 15000,
        enableMemoryMonitoring: true
      });

      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      const memoryUsedMB = (endMemory - startMemory) / 1024 / 1024;

      expect(result.success).toBe(true);
      expect(result.totalRetrieved).toBeGreaterThan(400); // Allow for some cache misses
      expect(result.responseTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(memoryUsedMB).toBeLessThan(50); // Should use less than 50MB

      console.log(`📊 500 items test: ${result.totalRetrieved}/${result.totalRequested} retrieved in ${endTime - startTime}ms, memory: ${memoryUsedMB.toFixed(2)}MB`);
    });
  });

  describe('Medium Scale Tests (1000-5000 items)', () => {
    beforeEach(() => {
      mockCache = createStressTestCache(3000);
      batchOperations = new BatchCacheOperations(mockCache);
    });

    it('should handle 3000 bundle retrievals with streaming', async () => {
      const keys = Array.from({ length: 3000 }, (_, i) => `esim-go:catalog:bundle:bundle-${i}`);
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;

      let totalRetrieved = 0;
      let chunkCount = 0;

      for await (const chunk of batchOperations.streamingBatchGet(keys, {
        batchSize: 100,
        maxMemoryPerBatch: 15,
        timeout: 10000,
        enableMemoryMonitoring: true,
        onProgress: (processed, total) => {
          if (processed % 500 === 0) {
            console.log(`📊 Progress: ${processed}/${total} (${((processed/total)*100).toFixed(1)}%)`);
          }
        },
        onChunk: (chunkData, chunkIndex, totalChunks) => {
          chunkCount++;
        }
      })) {
        totalRetrieved += chunk.length;
        
        // Verify memory usage stays reasonable
        const currentMemory = process.memoryUsage().heapUsed;
        const memoryIncreaseMB = (currentMemory - startMemory) / 1024 / 1024;
        expect(memoryIncreaseMB).toBeLessThan(100); // Should not exceed 100MB increase
      }

      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      const memoryUsedMB = (endMemory - startMemory) / 1024 / 1024;

      expect(totalRetrieved).toBeGreaterThan(2500); // Allow for some cache misses
      expect(endTime - startTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(memoryUsedMB).toBeLessThan(80); // Should use less than 80MB
      expect(chunkCount).toBeGreaterThan(25); // Should have processed multiple chunks

      console.log(`📊 3000 items streaming test: ${totalRetrieved}/3000 retrieved in ${endTime - startTime}ms, memory: ${memoryUsedMB.toFixed(2)}MB, chunks: ${chunkCount}`);
    });
  });

  describe('Large Scale Tests (10k+ items)', () => {
    beforeEach(() => {
      mockCache = createStressTestCache(12000);
      batchOperations = new BatchCacheOperations(mockCache);
    });

    it('should handle 10k+ bundle retrievals without memory leaks', async () => {
      const keys = Array.from({ length: 10000 }, (_, i) => `esim-go:catalog:bundle:bundle-${i}`);
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;
      
      let totalRetrieved = 0;
      let maxMemoryUsed = 0;
      let chunkCount = 0;

      try {
        for await (const chunk of batchOperations.streamingBatchGet(keys, {
          batchSize: 50, // Smaller batches for large datasets
          maxMemoryPerBatch: 10, // Strict memory limits
          timeout: 8000,
          enableMemoryMonitoring: true,
          maxConcurrentBatches: 2,
          onProgress: (processed, total) => {
            if (processed % 1000 === 0) {
              const currentMemory = process.memoryUsage().heapUsed;
              const memoryUsedMB = (currentMemory - startMemory) / 1024 / 1024;
              maxMemoryUsed = Math.max(maxMemoryUsed, memoryUsedMB);
              console.log(`📊 10k test progress: ${processed}/${total} (${((processed/total)*100).toFixed(1)}%), memory: ${memoryUsedMB.toFixed(2)}MB`);
            }
          },
          onChunk: (chunkData, chunkIndex, totalChunks) => {
            chunkCount++;
          }
        })) {
          totalRetrieved += chunk.length;
          
          // Critical: Verify memory doesn't grow unbounded
          const currentMemory = process.memoryUsage().heapUsed;
          const memoryIncreaseMB = (currentMemory - startMemory) / 1024 / 1024;
          maxMemoryUsed = Math.max(maxMemoryUsed, memoryIncreaseMB);
          
          // Fail test if memory usage exceeds reasonable limits
          if (memoryIncreaseMB > 150) {
            throw new Error(`Memory usage exceeded limit: ${memoryIncreaseMB.toFixed(2)}MB`);
          }
        }

        const endTime = Date.now();
        const endMemory = process.memoryUsage().heapUsed;
        const finalMemoryUsedMB = (endMemory - startMemory) / 1024 / 1024;

        // Assertions for 10k+ test
        expect(totalRetrieved).toBeGreaterThan(8000); // Allow for some cache misses
        expect(endTime - startTime).toBeLessThan(120000); // Should complete within 2 minutes
        expect(maxMemoryUsed).toBeLessThan(150); // Peak memory should be reasonable
        expect(finalMemoryUsedMB).toBeLessThan(100); // Final memory should be cleaned up
        expect(chunkCount).toBeGreaterThan(150); // Should have processed many chunks

        console.log(`✅ 10k+ test completed: ${totalRetrieved}/10000 retrieved in ${(endTime - startTime)/1000}s`);
        console.log(`📊 Memory stats: peak ${maxMemoryUsed.toFixed(2)}MB, final ${finalMemoryUsedMB.toFixed(2)}MB`);
        console.log(`📦 Processed ${chunkCount} chunks`);

      } catch (error) {
        console.error('❌ 10k+ test failed:', error);
        throw error;
      }
    }, 150000); // 2.5 minute timeout for this test

    it('should handle memory pressure gracefully', async () => {
      const keys = Array.from({ length: 15000 }, (_, i) => `esim-go:catalog:bundle:bundle-${i}`);
      
      // Artificially increase memory usage before test
      const memoryBallast = new Array(1000000).fill('memory pressure test');
      
      try {
        let totalRetrieved = 0;
        const startTime = Date.now();

        for await (const chunk of batchOperations.streamingBatchGet(keys, {
          batchSize: 25, // Very small batches under memory pressure
          maxMemoryPerBatch: 5, // Very strict memory limits
          timeout: 5000,
          enableMemoryMonitoring: true,
          maxConcurrentBatches: 1, // Single batch processing
          onProgress: (processed, total) => {
            if (processed % 2000 === 0) {
              console.log(`📊 Memory pressure test: ${processed}/${total} (${((processed/total)*100).toFixed(1)}%)`);
            }
          }
        })) {
          totalRetrieved += chunk.length;
          
          // Test should continue to work under memory pressure
          const memoryUsage = process.memoryUsage();
          const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
          
          // Should still process data despite memory pressure
          expect(chunk.length).toBeGreaterThan(0);
        }

        const endTime = Date.now();
        
        // Should complete a reasonable number despite memory pressure
        expect(totalRetrieved).toBeGreaterThan(10000);
        expect(endTime - startTime).toBeLessThan(180000); // 3 minutes max under pressure

        console.log(`✅ Memory pressure test: ${totalRetrieved}/15000 retrieved in ${(endTime - startTime)/1000}s`);

      } finally {
        // Clean up memory ballast
        memoryBallast.length = 0;
      }
    }, 200000); // 3+ minute timeout
  });

  describe('Error Resilience Tests', () => {
    beforeEach(() => {
      mockCache = createStressTestCache(5000, true); // Cache with failures
      batchOperations = new BatchCacheOperations(mockCache);
    });

    it('should handle cache failures gracefully during large operations', async () => {
      const keys = Array.from({ length: 5000 }, (_, i) => `esim-go:catalog:bundle:bundle-${i}`);
      
      let totalRetrieved = 0;
      let errorCount = 0;

      try {
        for await (const chunk of batchOperations.streamingBatchGet(keys, {
          batchSize: 100,
          maxMemoryPerBatch: 20,
          timeout: 10000,
          enableMemoryMonitoring: true,
          onProgress: (processed, total) => {
            if (processed % 1000 === 0) {
              console.log(`📊 Error resilience test: ${processed}/${total}, retrieved: ${totalRetrieved}`);
            }
          }
        })) {
          totalRetrieved += chunk.length;
        }
      } catch (error) {
        errorCount++;
        console.log('❌ Expected error during resilience test:', error.message);
      }

      // Should retrieve a reasonable number despite errors
      expect(totalRetrieved).toBeGreaterThan(3000); // At least 60% success rate
      console.log(`✅ Error resilience test: ${totalRetrieved}/5000 retrieved with intermittent failures`);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should demonstrate performance improvement over sequential operations', async () => {
      const testSize = 1000;
      mockCache = createStressTestCache(testSize);
      batchOperations = new BatchCacheOperations(mockCache);
      
      const keys = Array.from({ length: testSize }, (_, i) => `esim-go:catalog:bundle:bundle-${i}`);

      // Test batch operations
      const batchStartTime = Date.now();
      const batchResult = await batchOperations.batchGet(keys, {
        batchSize: 100,
        maxMemoryPerBatch: 25,
        timeout: 15000,
        enableMemoryMonitoring: true
      });
      const batchEndTime = Date.now();
      const batchDuration = batchEndTime - batchStartTime;

      // Simulate sequential operations for comparison
      const sequentialStartTime = Date.now();
      let sequentialRetrieved = 0;
      
      for (const key of keys.slice(0, 100)) { // Only test 100 for speed
        try {
          const value = await mockCache.get(key);
          if (value) sequentialRetrieved++;
        } catch (error) {
          // Ignore errors for benchmark
        }
      }
      const sequentialEndTime = Date.now();
      const sequentialDuration = sequentialEndTime - sequentialStartTime;
      
      // Extrapolate sequential time for full dataset
      const estimatedSequentialTime = (sequentialDuration / 100) * testSize;

      console.log(`📊 Performance comparison:`);
      console.log(`   Batch operations: ${batchDuration}ms for ${batchResult.totalRetrieved}/${testSize} items`);
      console.log(`   Sequential (estimated): ${estimatedSequentialTime}ms for ${testSize} items`);
      console.log(`   Performance improvement: ${(estimatedSequentialTime / batchDuration).toFixed(2)}x faster`);

      // Batch should be significantly faster
      expect(batchDuration).toBeLessThan(estimatedSequentialTime / 2);
      expect(batchResult.totalRetrieved).toBeGreaterThan(800);
    });
  });
});