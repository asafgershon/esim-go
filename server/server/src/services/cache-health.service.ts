import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import { createLogger } from "../lib/logger";

export interface CacheHealthMetrics {
  isHealthy: boolean;
  lastSuccessfulOperation: Date | null;
  consecutiveFailures: number;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageResponseTime: number;
  lastError: string | null;
}

export interface CacheOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  responseTime: number;
}

export class CacheHealthService {
  private cache: KeyvAdapter<any> | null;
  private logger = createLogger();
  
  private metrics: CacheHealthMetrics = {
    isHealthy: true,
    lastSuccessfulOperation: null,
    consecutiveFailures: 0,
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageResponseTime: 0,
    lastError: null
  };

  private readonly MAX_CONSECUTIVE_FAILURES = 5;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly OPERATION_TIMEOUT = 5000; // 5 seconds
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor(cache: KeyvAdapter<any> | null) {
    this.cache = cache;
    this.startHealthMonitoring();
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
    
    this.logger.info('🏥 Cache health monitoring started');
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      this.logger.info('🏥 Cache health monitoring stopped');
    }
  }

  /**
   * Perform a health check by trying a simple cache operation
   */
  private async performHealthCheck(): Promise<void> {
    const healthKey = 'cache-health-check';
    const healthValue = Date.now().toString();
    
    try {
      // Test both set and get operations
      const setResult = await this.safeSet(healthKey, healthValue, { ttl: 60 });
      if (!setResult.success) {
        throw new Error(`Health check set failed: ${setResult.error?.message}`);
      }

      const getResult = await this.safeGet(healthKey);
      if (!getResult.success || getResult.data !== healthValue) {
        throw new Error(`Health check get failed: ${getResult.error?.message}`);
      }

      // Clean up health check key
      await this.safeDelete(healthKey);
      
      this.logger.debug('✅ Cache health check passed');
    } catch (error) {
      this.logger.warn('⚠️ Cache health check failed:', error);
    }
  }

  /**
   * Safe cache get operation with error handling and metrics
   */
  async safeGet<T>(key: string): Promise<CacheOperationResult<T>> {
    const startTime = Date.now();
    
    try {
      if (!this.cache) {
        throw new Error('Cache is not available');
      }

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Cache operation timeout')), this.OPERATION_TIMEOUT);
      });

      const data = await Promise.race([
        this.cache.get(key),
        timeoutPromise
      ]) as T;

      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);
      
      this.logger.debug(`📥 Cache GET success: ${key} (${responseTime}ms)`);
      
      return {
        success: true,
        data,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));
      this.recordFailure(err, 'GET', key);
      
      this.logger.warn(`❌ Cache GET failed: ${key} (${responseTime}ms)`, {
        error: err.message,
        key,
        responseTime
      });
      
      return {
        success: false,
        error: err,
        responseTime
      };
    }
  }

  /**
   * Safe cache set operation with error handling and metrics
   */
  async safeSet(key: string, value: string, options?: { ttl?: number }): Promise<CacheOperationResult<boolean>> {
    const startTime = Date.now();
    
    try {
      if (!this.cache) {
        throw new Error('Cache is not available');
      }

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Cache operation timeout')), this.OPERATION_TIMEOUT);
      });

      const result = await Promise.race([
        this.cache.set(key, value, options),
        timeoutPromise
      ]) as boolean;

      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);
      
      this.logger.debug(`📤 Cache SET success: ${key} (${responseTime}ms)`);
      
      return {
        success: true,
        data: result,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));
      this.recordFailure(err, 'SET', key);
      
      this.logger.warn(`❌ Cache SET failed: ${key} (${responseTime}ms)`, {
        error: err.message,
        key,
        responseTime,
        valueLength: value?.length || 0
      });
      
      return {
        success: false,
        error: err,
        responseTime
      };
    }
  }

  /**
   * Safe cache delete operation with error handling and metrics
   */
  async safeDelete(key: string): Promise<CacheOperationResult<boolean>> {
    const startTime = Date.now();
    
    try {
      if (!this.cache) {
        throw new Error('Cache is not available');
      }

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Cache operation timeout')), this.OPERATION_TIMEOUT);
      });

      const result = await Promise.race([
        this.cache.delete(key),
        timeoutPromise
      ]) as boolean;

      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);
      
      this.logger.debug(`🗑️ Cache DELETE success: ${key} (${responseTime}ms)`);
      
      return {
        success: true,
        data: result,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));
      this.recordFailure(err, 'DELETE', key);
      
      this.logger.warn(`❌ Cache DELETE failed: ${key} (${responseTime}ms)`, {
        error: err.message,
        key,
        responseTime
      });
      
      return {
        success: false,
        error: err,
        responseTime
      };
    }
  }

  /**
   * Retry cache operation with exponential backoff
   */
  async retryOperation<T>(
    operation: () => Promise<CacheOperationResult<T>>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<CacheOperationResult<T>> {
    let lastResult: CacheOperationResult<T> | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      lastResult = await operation();
      
      if (lastResult.success) {
        if (attempt > 1) {
          this.logger.info(`✅ Cache operation succeeded on attempt ${attempt}`);
        }
        return lastResult;
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        this.logger.warn(`⏳ Cache operation failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await this.sleep(delay);
      }
    }
    
    this.logger.error(`❌ Cache operation failed after ${maxRetries} attempts`);
    return lastResult!;
  }

  /**
   * Record successful cache operation
   */
  private recordSuccess(responseTime: number): void {
    this.metrics.totalOperations++;
    this.metrics.successfulOperations++;
    this.metrics.lastSuccessfulOperation = new Date();
    this.metrics.consecutiveFailures = 0;
    this.metrics.isHealthy = true;
    
    // Update average response time
    const totalResponseTime = this.metrics.averageResponseTime * (this.metrics.totalOperations - 1);
    this.metrics.averageResponseTime = (totalResponseTime + responseTime) / this.metrics.totalOperations;
  }

  /**
   * Record failed cache operation
   */
  private recordFailure(error: Error, operation: string, key: string): void {
    this.metrics.totalOperations++;
    this.metrics.failedOperations++;
    this.metrics.consecutiveFailures++;
    this.metrics.lastError = `${operation} ${key}: ${error.message}`;
    
    // Mark as unhealthy if too many consecutive failures
    if (this.metrics.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
      this.metrics.isHealthy = false;
      this.logger.error(`💔 Cache marked as unhealthy after ${this.metrics.consecutiveFailures} consecutive failures`);
    }
  }

  /**
   * Get current cache health metrics
   */
  getHealthMetrics(): CacheHealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if cache is currently healthy
   */
  isHealthy(): boolean {
    return this.metrics.isHealthy;
  }

  /**
   * Get cache availability percentage
   */
  getAvailabilityPercentage(): number {
    if (this.metrics.totalOperations === 0) return 100;
    return (this.metrics.successfulOperations / this.metrics.totalOperations) * 100;
  }

  /**
   * Reset health metrics
   */
  resetMetrics(): void {
    this.metrics = {
      isHealthy: true,
      lastSuccessfulOperation: null,
      consecutiveFailures: 0,
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageResponseTime: 0,
      lastError: null
    };
    
    this.logger.info('🔄 Cache health metrics reset');
  }

  /**
   * Get comprehensive health report
   */
  getHealthReport(): string {
    const metrics = this.getHealthMetrics();
    const availability = this.getAvailabilityPercentage();
    
    return `
🏥 Cache Health Report
===================
Status: ${metrics.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}
Availability: ${availability.toFixed(2)}%
Operations: ${metrics.successfulOperations}/${metrics.totalOperations} successful
Consecutive Failures: ${metrics.consecutiveFailures}
Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms
Last Successful Operation: ${metrics.lastSuccessfulOperation?.toISOString() || 'Never'}
Last Error: ${metrics.lastError || 'None'}
`;
  }

  /**
   * Utility sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopHealthMonitoring();
  }
}