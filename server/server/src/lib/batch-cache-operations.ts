import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import { createClient } from 'redis';
import { cleanEnv, str } from "envalid";
import { createLogger } from "./logger";

const env = cleanEnv(process.env, {
  REDIS_HOST: str({ default: "localhost" }),
  REDIS_PORT: str({ default: "6379" }),
  REDIS_PASSWORD: str({ default: "mypassword" }),
  REDIS_USER: str({ default: "default" }),
});

export interface BatchGetResult<T = any> {
  success: boolean;
  results: Map<string, T>;
  errors: Map<string, Error>;
  totalRequested: number;
  totalRetrieved: number;
  responseTime: number;
}

export interface BatchSetResult {
  success: boolean;
  successfulSets: string[];
  failedSets: Map<string, Error>;
  totalRequested: number;
  totalSuccessful: number;
  responseTime: number;
}

export interface BatchOperationOptions {
  /** Maximum number of operations per batch (default: 100) */
  batchSize?: number;
  /** Maximum memory usage per batch in MB (default: 50MB) */
  maxMemoryPerBatch?: number;
  /** Operation timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Enable memory monitoring during operations */
  enableMemoryMonitoring?: boolean;
  /** Maximum concurrent batches (default: 3) */
  maxConcurrentBatches?: number;
}

export interface StreamingOptions extends BatchOperationOptions {
  /** Callback for each processed chunk */
  onChunk?: (chunk: any[], chunkIndex: number, totalChunks: number) => void;
  /** Callback for progress updates */
  onProgress?: (processed: number, total: number) => void;
}

export class BatchCacheOperations {
  private logger = createLogger({ component: 'BatchCacheOperations' });
  private redisClient: any = null;
  private cache: KeyvAdapter<any> | null;
  
  private readonly DEFAULT_BATCH_SIZE = 100;
  private readonly DEFAULT_MAX_MEMORY_MB = 50;
  private readonly DEFAULT_TIMEOUT = 10000;
  private readonly DEFAULT_MAX_CONCURRENT = 3;

  constructor(cache: KeyvAdapter<any> | null) {
    this.cache = cache;
  }

  /**
   * Initialize Redis client for pipelining operations
   */
  private async initializeRedisClient(): Promise<void> {
    if (!this.redisClient) {
      const redisUrl = `redis://${env.REDIS_USER}:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}`;
      
      this.redisClient = createClient({ url: redisUrl });
      await this.redisClient.connect();
      
      this.logger.info('📡 Redis client initialized for batch operations');
    }
  }

  /**
   * Batch get operations with Redis pipelining
   */
  async batchGet<T>(
    keys: string[], 
    options: BatchOperationOptions = {}
  ): Promise<BatchGetResult<T>> {
    const startTime = Date.now();
    const {
      batchSize = this.DEFAULT_BATCH_SIZE,
      maxMemoryPerBatch = this.DEFAULT_MAX_MEMORY_MB,
      timeout = this.DEFAULT_TIMEOUT,
      enableMemoryMonitoring = true,
      maxConcurrentBatches = this.DEFAULT_MAX_CONCURRENT
    } = options;

    const results = new Map<string, T>();
    const errors = new Map<string, Error>();
    
    this.logger.info(`🚀 Starting batch get operation for ${keys.length} keys`, {
      batchSize,
      maxMemoryPerBatch,
      maxConcurrentBatches
    });

    try {
      if (this.redisClient) {
        // Use Redis pipelining for better performance
        await this.batchGetWithPipeline(keys, results, errors, {
          batchSize,
          maxMemoryPerBatch,
          timeout,
          enableMemoryMonitoring,
          maxConcurrentBatches
        });
      } else {
        // Fallback to cache adapter with batching
        await this.batchGetWithCache(keys, results, errors, {
          batchSize,
          maxMemoryPerBatch,
          timeout,
          enableMemoryMonitoring,
          maxConcurrentBatches
        });
      }
    } catch (error) {
      this.logger.error('❌ Batch get operation failed', { error, keysCount: keys.length });
      throw error;
    }

    const responseTime = Date.now() - startTime;
    const totalRetrieved = results.size;
    const success = errors.size === 0;

    this.logger.info(`✅ Batch get completed`, {
      totalRequested: keys.length,
      totalRetrieved,
      errorCount: errors.size,
      responseTime,
      successRate: `${((totalRetrieved / keys.length) * 100).toFixed(2)}%`
    });

    return {
      success,
      results,
      errors,
      totalRequested: keys.length,
      totalRetrieved,
      responseTime
    };
  }

  /**
   * Batch get using Redis pipelining
   */
  private async batchGetWithPipeline<T>(
    keys: string[],
    results: Map<string, T>,
    errors: Map<string, Error>,
    options: Required<BatchOperationOptions>
  ): Promise<void> {
    await this.initializeRedisClient();
    
    const chunks = this.chunkArray(keys, options.batchSize);
    const semaphore = new Semaphore(options.maxConcurrentBatches);
    
    await Promise.all(chunks.map(async (chunk, chunkIndex) => {
      await semaphore.acquire();
      
      try {
        const startMemory = options.enableMemoryMonitoring ? process.memoryUsage().heapUsed : 0;
        
        this.logger.debug(`📦 Processing batch ${chunkIndex + 1}/${chunks.length} (${chunk.length} keys)`);
        
        // Create Redis pipeline for this chunk
        const pipeline = this.redisClient.multi();
        
        // Add all GET commands to pipeline
        chunk.forEach(key => {
          pipeline.get(key);
        });
        
        // Execute pipeline
        const pipelineResults = await Promise.race([
          pipeline.exec(),
          this.createTimeoutPromise(options.timeout)
        ]);
        
        // Process results
        for (let i = 0; i < chunk.length; i++) {
          const key = chunk[i];
          const result = pipelineResults[i];
          
          if (result[0] === null && result[1] !== null) {
            // Success: result[0] is error (null), result[1] is value
            try {
              const parsed = JSON.parse(result[1]) as T;
              results.set(key, parsed);
            } catch (parseError) {
              errors.set(key, new Error(`JSON parse error: ${parseError.message}`));
            }
          } else if (result[0] !== null) {
            // Error occurred
            errors.set(key, new Error(result[0].message));
          }
          // If result[1] is null, key doesn't exist (not an error)
        }
        
        // Memory monitoring
        if (options.enableMemoryMonitoring) {
          const endMemory = process.memoryUsage().heapUsed;
          const memoryUsedMB = (endMemory - startMemory) / 1024 / 1024;
          
          if (memoryUsedMB > options.maxMemoryPerBatch) {
            this.logger.warn(`⚠️ Batch ${chunkIndex + 1} exceeded memory limit`, {
              memoryUsedMB: memoryUsedMB.toFixed(2),
              maxMemoryPerBatch: options.maxMemoryPerBatch,
              chunkSize: chunk.length
            });
          }
          
          this.logger.debug(`💾 Batch ${chunkIndex + 1} memory usage: ${memoryUsedMB.toFixed(2)}MB`);
        }
        
      } catch (error) {
        this.logger.error(`❌ Batch ${chunkIndex + 1} failed`, { error, chunkSize: chunk.length });
        
        // Mark all keys in this chunk as failed
        chunk.forEach(key => {
          errors.set(key, error instanceof Error ? error : new Error(String(error)));
        });
      } finally {
        semaphore.release();
      }
    }));
  }

  /**
   * Batch get using cache adapter (fallback)
   */
  private async batchGetWithCache<T>(
    keys: string[],
    results: Map<string, T>,
    errors: Map<string, Error>,
    options: Required<BatchOperationOptions>
  ): Promise<void> {
    if (!this.cache) {
      throw new Error('Cache not available for batch operations');
    }
    
    const chunks = this.chunkArray(keys, options.batchSize);
    const semaphore = new Semaphore(options.maxConcurrentBatches);
    
    await Promise.all(chunks.map(async (chunk, chunkIndex) => {
      await semaphore.acquire();
      
      try {
        this.logger.debug(`📦 Processing cache batch ${chunkIndex + 1}/${chunks.length} (${chunk.length} keys)`);
        
        // Process chunk concurrently but in smaller sub-batches to avoid overwhelming cache
        const subBatchSize = Math.min(10, chunk.length);
        const subChunks = this.chunkArray(chunk, subBatchSize);
        
        for (const subChunk of subChunks) {
          await Promise.all(subChunk.map(async (key) => {
            try {
              const value = await Promise.race([
                this.cache!.get(key),
                this.createTimeoutPromise(options.timeout)
              ]);
              
              if (value !== null && value !== undefined) {
                const parsed = JSON.parse(value) as T;
                results.set(key, parsed);
              }
            } catch (error) {
              errors.set(key, error instanceof Error ? error : new Error(String(error)));
            }
          }));
        }
        
      } catch (error) {
        this.logger.error(`❌ Cache batch ${chunkIndex + 1} failed`, { error, chunkSize: chunk.length });
        
        chunk.forEach(key => {
          errors.set(key, error instanceof Error ? error : new Error(String(error)));
        });
      } finally {
        semaphore.release();
      }
    }));
  }

  /**
   * Streaming batch operations for very large datasets
   */
  async *streamingBatchGet<T>(
    keys: string[],
    options: StreamingOptions = {}
  ): AsyncGenerator<T[], void, unknown> {
    const {
      batchSize = this.DEFAULT_BATCH_SIZE,
      onChunk,
      onProgress
    } = options;
    
    const chunks = this.chunkArray(keys, batchSize);
    let processedCount = 0;
    
    this.logger.info(`🌊 Starting streaming batch operation for ${keys.length} keys in ${chunks.length} chunks`);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const batchResult = await this.batchGet<T>(chunk, options);
        const chunkResults = Array.from(batchResult.results.values());
        
        processedCount += chunk.length;
        
        // Call callbacks
        if (onChunk) {
          onChunk(chunkResults, i, chunks.length);
        }
        
        if (onProgress) {
          onProgress(processedCount, keys.length);
        }
        
        yield chunkResults;
        
        // Add small delay to prevent overwhelming the system
        if (i < chunks.length - 1) {
          await this.sleep(10);
        }
        
      } catch (error) {
        this.logger.error(`❌ Streaming chunk ${i + 1} failed`, { error, chunkSize: chunk.length });
        throw error;
      }
    }
    
    this.logger.info(`✅ Streaming batch operation completed: ${processedCount}/${keys.length} keys processed`);
  }

  /**
   * Batch set operations with memory management
   */
  async batchSet(
    data: Map<string, string>,
    options: BatchOperationOptions = {}
  ): Promise<BatchSetResult> {
    const startTime = Date.now();
    const {
      batchSize = this.DEFAULT_BATCH_SIZE,
      maxMemoryPerBatch = this.DEFAULT_MAX_MEMORY_MB,
      timeout = this.DEFAULT_TIMEOUT,
      maxConcurrentBatches = this.DEFAULT_MAX_CONCURRENT
    } = options;

    const successfulSets: string[] = [];
    const failedSets = new Map<string, Error>();
    const keys = Array.from(data.keys());
    
    this.logger.info(`🚀 Starting batch set operation for ${keys.length} keys`);

    try {
      const chunks = this.chunkArray(keys, batchSize);
      const semaphore = new Semaphore(maxConcurrentBatches);
      
      await Promise.all(chunks.map(async (chunk, chunkIndex) => {
        await semaphore.acquire();
        
        try {
          this.logger.debug(`📦 Setting batch ${chunkIndex + 1}/${chunks.length} (${chunk.length} keys)`);
          
          if (this.cache) {
            // Use cache adapter for setting
            await Promise.all(chunk.map(async (key) => {
              try {
                const value = data.get(key)!;
                await Promise.race([
                  this.cache!.set(key, value),
                  this.createTimeoutPromise(timeout)
                ]);
                successfulSets.push(key);
              } catch (error) {
                failedSets.set(key, error instanceof Error ? error : new Error(String(error)));
              }
            }));
          }
          
        } catch (error) {
          this.logger.error(`❌ Set batch ${chunkIndex + 1} failed`, { error, chunkSize: chunk.length });
          
          chunk.forEach(key => {
            failedSets.set(key, error instanceof Error ? error : new Error(String(error)));
          });
        } finally {
          semaphore.release();
        }
      }));
      
    } catch (error) {
      this.logger.error('❌ Batch set operation failed', { error, keysCount: keys.length });
      throw error;
    }

    const responseTime = Date.now() - startTime;
    const success = failedSets.size === 0;

    this.logger.info(`✅ Batch set completed`, {
      totalRequested: keys.length,
      totalSuccessful: successfulSets.length,
      errorCount: failedSets.size,
      responseTime
    });

    return {
      success,
      successfulSets,
      failedSets,
      totalRequested: keys.length,
      totalSuccessful: successfulSets.length,
      responseTime
    };
  }

  /**
   * Check memory usage and apply backpressure if needed
   */
  private checkMemoryPressure(): boolean {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    const memoryPressure = (heapUsedMB / heapTotalMB) > 0.8; // 80% threshold
    
    if (memoryPressure) {
      this.logger.warn('⚠️ High memory pressure detected', {
        heapUsedMB: heapUsedMB.toFixed(2),
        heapTotalMB: heapTotalMB.toFixed(2),
        pressureRatio: ((heapUsedMB / heapTotalMB) * 100).toFixed(2) + '%'
      });
      
      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
        this.logger.info('🗑️ Garbage collection triggered');
      }
    }
    
    return memoryPressure;
  }

  /**
   * Utility: Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Utility: Create timeout promise
   */
  private createTimeoutPromise<T>(timeoutMs: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs);
    });
  }

  /**
   * Utility: Sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        this.logger.info('📡 Redis client disconnected');
      } catch (error) {
        this.logger.error('❌ Error disconnecting Redis client', { error });
      }
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const memoryUsage = process.memoryUsage();
    return {
      memoryUsage: {
        heapUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
        externalMB: (memoryUsage.external / 1024 / 1024).toFixed(2),
        rss: (memoryUsage.rss / 1024 / 1024).toFixed(2)
      },
      redisConnected: !!this.redisClient,
      cacheAvailable: !!this.cache
    };
  }
}

/**
 * Simple semaphore for concurrency control
 */
class Semaphore {
  private permits: number;
  private waiting: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!;
      resolve();
    } else {
      this.permits++;
    }
  }
}