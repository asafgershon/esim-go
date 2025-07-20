import { createClient, type RedisClientType } from 'redis';
import { cleanEnv, str } from "envalid";
import { createLogger } from './logger';

const env = cleanEnv(process.env, {
  REDIS_HOST: str({ default: "localhost" }),
  REDIS_PORT: str({ default: "6379" }),
  REDIS_PASSWORD: str({ default: "mypassword" }),
  REDIS_USER: str({ default: "default" }),
});

export interface LockOptions {
  /** Lock timeout in milliseconds (default: 1 hour) */
  timeout?: number;
  /** Lock retry attempts (default: 3) */
  retryAttempts?: number;
  /** Retry delay in milliseconds (default: 1000) */
  retryDelay?: number;
}

export interface LockResult {
  /** Whether the lock was acquired successfully */
  acquired: boolean;
  /** Release function to call when done */
  release?: () => Promise<void>;
  /** Error message if acquisition failed */
  error?: string;
}

export class DistributedLock {
  private static readonly DEFAULT_TIMEOUT = 60 * 60 * 1000; // 1 hour
  private static readonly DEFAULT_RETRY_ATTEMPTS = 3;
  private static readonly DEFAULT_RETRY_DELAY = 1000; // 1 second
  
  private redisClient: RedisClientType | null = null;
  private lockName: string;
  private lockValue: string | null = null;
  private logger = createLogger({ component: 'DistributedLock' });

  constructor(lockName: string) {
    this.lockName = `lock:${lockName}`;
  }

  /**
   * Initialize Redis client
   */
  private async initializeRedis(): Promise<void> {
    if (!this.redisClient) {
      const redisUrl = `redis://${env.REDIS_USER}:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}`;
      
      this.redisClient = createClient({
        url: redisUrl,
      });

      await this.redisClient.connect();
    }
  }

  /**
   * Acquire a distributed lock using Redis SET NX with expiration
   */
  async acquire(options: LockOptions = {}): Promise<LockResult> {
    const timeout = options.timeout ?? DistributedLock.DEFAULT_TIMEOUT;
    const retryAttempts = options.retryAttempts ?? DistributedLock.DEFAULT_RETRY_ATTEMPTS;
    const retryDelay = options.retryDelay ?? DistributedLock.DEFAULT_RETRY_DELAY;

    try {
      await this.initializeRedis();
    } catch (error) {
      return {
        acquired: false,
        error: `Failed to connect to Redis: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    if (!this.redisClient) {
      return {
        acquired: false,
        error: 'Redis client not initialized'
      };
    }

    // Generate unique lock value to prevent releasing other instances' locks
    this.lockValue = `${Date.now()}-${Math.random()}`;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        // Try to acquire the lock using SET NX with expiration
        const result = await this.redisClient.set(this.lockName, this.lockValue, {
          NX: true, // Only set if key doesn't exist
          PX: timeout // Set expiration in milliseconds
        });

        if (result === 'OK') {
          this.logger.info('Distributed lock acquired', { 
            lockName: this.lockName,
            lockValue: this.lockValue,
            timeout,
            operationType: 'lock-acquisition'
          });
          
          return {
            acquired: true,
            release: async () => {
              await this.release();
            }
          };
        }
        
        // Lock is already held by another process
        if (attempt < retryAttempts) {
          this.logger.warn('Lock already held, retrying', {
            lockName: this.lockName,
            attempt,
            retryAttempts,
            operationType: 'lock-acquisition'
          });
          await this.sleep(retryDelay);
        }
        
      } catch (error) {
        this.logger.warn('Failed to acquire lock', {
          lockName: this.lockName,
          attempt,
          retryAttempts,
          error: error instanceof Error ? error.message : 'Unknown error',
          operationType: 'lock-acquisition'
        });
        
        if (attempt < retryAttempts) {
          await this.sleep(retryDelay);
        }
      }
    }

    return {
      acquired: false,
      error: `Failed to acquire lock after ${retryAttempts} attempts`
    };
  }

  /**
   * Release the distributed lock
   */
  private async release(): Promise<void> {
    if (!this.redisClient || !this.lockValue) {
      return;
    }

    try {
      // Use Lua script to atomically check and delete the lock
      // Only delete if the lock value matches (prevents releasing other instances' locks)
      const luaScript = `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
          return redis.call("DEL", KEYS[1])
        else
          return 0
        end
      `;

      const result = await this.redisClient.eval(luaScript, {
        keys: [this.lockName],
        arguments: [this.lockValue]
      });

      if (result === 1) {
        this.logger.info('Distributed lock released', { 
          lockName: this.lockName,
          lockValue: this.lockValue,
          operationType: 'lock-release'
        });
      } else {
        this.logger.warn('Lock not found or value mismatch during release', { 
          lockName: this.lockName,
          lockValue: this.lockValue,
          operationType: 'lock-release'
        });
      }
    } catch (error) {
      this.logger.error('Error releasing lock', error as Error, { 
        lockName: this.lockName,
        lockValue: this.lockValue,
        operationType: 'lock-release'
      });
    }

    this.lockValue = null;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup Redis connection
   */
  async cleanup(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        this.redisClient = null;
      } catch (error) {
        this.logger.error('Error closing Redis connection', error as Error, {
          lockName: this.lockName,
          operationType: 'cleanup'
        });
      }
    }
  }
}

/**
 * Utility function to create a new distributed lock
 */
export function createDistributedLock(lockName: string): DistributedLock {
  return new DistributedLock(lockName);
}