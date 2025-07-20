import { createClient } from 'redis';
import redisLock from 'redis-lock';
import { cleanEnv, str } from "envalid";

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
  
  private redisClient: any;
  private lock: any;
  private lockName: string;

  constructor(lockName: string) {
    this.lockName = lockName;
  }

  /**
   * Initialize Redis client and lock
   */
  private async initializeRedis(): Promise<void> {
    if (!this.redisClient) {
      const redisUrl = `redis://${env.REDIS_USER}:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}`;
      
      this.redisClient = createClient({
        url: redisUrl,
      });

      await this.redisClient.connect();
      this.lock = redisLock(this.redisClient);
      
      console.log(`🔗 Redis client connected for distributed lock: ${this.lockName}`);
    }
  }

  /**
   * Acquire a distributed lock
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

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        console.log(`🔒 Attempting to acquire lock: ${this.lockName} (attempt ${attempt}/${retryAttempts})`);
        
        // Try to acquire the lock with timeout
        const releaseLock = await new Promise<any>((resolve, reject) => {
          this.lock(this.lockName, timeout, (done: any) => {
            if (done) {
              resolve(done);
            } else {
              reject(new Error('Lock acquisition timeout'));
            }
          });
        });

        console.log(`✅ Distributed lock acquired: ${this.lockName}`);
        
        return {
          acquired: true,
          release: async () => {
            try {
              await releaseLock();
              console.log(`🔓 Distributed lock released: ${this.lockName}`);
            } catch (error) {
              console.error(`❌ Error releasing lock ${this.lockName}:`, error);
            }
          }
        };
        
      } catch (error) {
        console.log(`🔒 Failed to acquire lock ${this.lockName} (attempt ${attempt}/${retryAttempts}):`, error instanceof Error ? error.message : 'Unknown error');
        
        if (attempt < retryAttempts) {
          console.log(`⏳ Retrying in ${retryDelay}ms...`);
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
        console.log(`🔗 Redis client disconnected for lock: ${this.lockName}`);
      } catch (error) {
        console.error(`❌ Error closing Redis connection for lock ${this.lockName}:`, error);
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