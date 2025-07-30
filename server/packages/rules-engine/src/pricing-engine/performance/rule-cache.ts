import type { PricingEngineState, PricingRule } from "../../rules-engine-types";

/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  value: T;
  timestamp: Date;
  ttl: number;
  hits: number;
}

/**
 * Cache key generator function type
 */
type CacheKeyGenerator<T> = (input: T) => string;

/**
 * Rule evaluation cache for performance optimization
 */
export class RuleCache {
  private evaluationCache = new Map<string, CacheEntry<boolean>>();
  private stateCache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL: number;
  private readonly maxSize: number;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(defaultTTL: number = 300000, maxSize: number = 1000) { // 5 minutes default TTL
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
    this.startCleanupInterval();
  }
  
  /**
   * Cache rule evaluation result
   */
  cacheEvaluation(
    ruleId: string,
    state: PricingEngineState,
    result: boolean,
    ttl?: number
  ): void {
    const key = this.generateEvaluationKey(ruleId, state);
    const entry: CacheEntry<boolean> = {
      value: result,
      timestamp: new Date(),
      ttl: ttl || this.defaultTTL,
      hits: 0,
    };
    
    this.evaluationCache.set(key, entry);
    this.enforceMaxSize(this.evaluationCache);
  }
  
  /**
   * Get cached rule evaluation result
   */
  getCachedEvaluation(ruleId: string, state: PricingEngineState): boolean | null {
    const key = this.generateEvaluationKey(ruleId, state);
    const entry = this.evaluationCache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.evaluationCache.delete(key);
      return null;
    }
    
    // Update hit count
    entry.hits++;
    
    return entry.value;
  }
  
  /**
   * Cache state computation result
   */
  cacheState<T>(
    key: string,
    value: T,
    ttl?: number
  ): void {
    const entry: CacheEntry<T> = {
      value,
      timestamp: new Date(),
      ttl: ttl || this.defaultTTL,
      hits: 0,
    };
    
    this.stateCache.set(key, entry);
    this.enforceMaxSize(this.stateCache);
  }
  
  /**
   * Get cached state computation result
   */
  getCachedState<T>(key: string): T | null {
    const entry = this.stateCache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.stateCache.delete(key);
      return null;
    }
    
    // Update hit count
    entry.hits++;
    
    return entry.value;
  }
  
  /**
   * Invalidate cache entries for a specific rule
   */
  invalidateRule(ruleId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.evaluationCache.keys()) {
      if (key.startsWith(`${ruleId}:`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.evaluationCache.delete(key));
  }
  
  /**
   * Invalidate all cache entries
   */
  invalidateAll(): void {
    this.evaluationCache.clear();
    this.stateCache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getStatistics(): {
    evaluationCache: {
      size: number;
      hits: number;
      maxSize: number;
    };
    stateCache: {
      size: number;
      hits: number;
      maxSize: number;
    };
    totalMemoryUsage: number;
  } {
    const evaluationHits = Array.from(this.evaluationCache.values())
      .reduce((sum, entry) => sum + entry.hits, 0);
    
    const stateHits = Array.from(this.stateCache.values())
      .reduce((sum, entry) => sum + entry.hits, 0);
    
    return {
      evaluationCache: {
        size: this.evaluationCache.size,
        hits: evaluationHits,
        maxSize: this.maxSize,
      },
      stateCache: {
        size: this.stateCache.size,
        hits: stateHits,
        maxSize: this.maxSize,
      },
      totalMemoryUsage: this.estimateMemoryUsage(),
    };
  }
  
  /**
   * Manually trigger cache cleanup
   */
  cleanup(): void {
    this.cleanupExpiredEntries();
  }
  
  /**
   * Destroy the cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.invalidateAll();
  }
  
  /**
   * Generate cache key for rule evaluation
   */
  private generateEvaluationKey(ruleId: string, state: PricingEngineState): string {
    // Create a deterministic key based on rule ID and relevant state properties
    const stateKey = this.generateStateKey(state);
    return `${ruleId}:${stateKey}`;
  }
  
  /**
   * Generate state key for caching
   */
  private generateStateKey(state: PricingEngineState): string {
    // Only include state properties that affect rule evaluation
    const relevantState = {
      countryISO: state.request.countryISO,
      duration: state.request.duration,
      dataType: state.request.dataType,
      paymentMethod: state.request.paymentMethod,
      customerSegment: state.context.customer?.segment,
      region: state.processing.region,
      group: state.processing.group,
      totalCost: state.response.pricing?.totalCost,
    };
    
    return JSON.stringify(relevantState);
  }
  
  /**
   * Check if cache entry has expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    const entryTime = entry.timestamp.getTime();
    return (now - entryTime) > entry.ttl;
  }
  
  /**
   * Enforce maximum cache size by removing least recently used entries
   */
  private enforceMaxSize(cache: Map<string, CacheEntry<any>>): void {
    if (cache.size <= this.maxSize) {
      return;
    }
    
    // Convert to array and sort by hits (ascending) and timestamp (ascending)
    const entries = Array.from(cache.entries())
      .sort(([, a], [, b]) => {
        if (a.hits !== b.hits) {
          return a.hits - b.hits; // Fewer hits first
        }
        return a.timestamp.getTime() - b.timestamp.getTime(); // Older first
      });
    
    // Remove oldest/least used entries
    const toRemove = entries.slice(0, cache.size - this.maxSize + 1);
    toRemove.forEach(([key]) => cache.delete(key));
  }
  
  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Cleanup every minute
  }
  
  /**
   * Remove expired entries from all caches
   */
  private cleanupExpiredEntries(): void {
    // Cleanup evaluation cache
    for (const [key, entry] of this.evaluationCache.entries()) {
      if (this.isExpired(entry)) {
        this.evaluationCache.delete(key);
      }
    }
    
    // Cleanup state cache
    for (const [key, entry] of this.stateCache.entries()) {
      if (this.isExpired(entry)) {
        this.stateCache.delete(key);
      }
    }
  }
  
  /**
   * Estimate memory usage (rough approximation)
   */
  private estimateMemoryUsage(): number {
    let usage = 0;
    
    // Rough estimate: each cache entry uses ~100-200 bytes on average
    usage += this.evaluationCache.size * 150;
    usage += this.stateCache.size * 200;
    
    return usage;
  }
}

/**
 * Memoization decorator for expensive operations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: CacheKeyGenerator<Parameters<T>>,
  ttl?: number
): T {
  const cache = new Map<string, CacheEntry<ReturnType<T>>>();
  const defaultKeyGen: CacheKeyGenerator<Parameters<T>> = (args) => JSON.stringify(args);
  const getKey = keyGenerator || defaultKeyGen;
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey(args);
    const cached = cache.get(key);
    
    if (cached && !isEntryExpired(cached)) {
      cached.hits++;
      return cached.value;
    }
    
    const result = fn(...args);
    cache.set(key, {
      value: result,
      timestamp: new Date(),
      ttl: ttl || 300000, // 5 minutes default
      hits: 0,
    });
    
    return result;
  }) as T;
}

/**
 * Helper function to check if memoized entry is expired
 */
function isEntryExpired(entry: CacheEntry<any>): boolean {
  const now = Date.now();
  const entryTime = entry.timestamp.getTime();
  return (now - entryTime) > entry.ttl;
}