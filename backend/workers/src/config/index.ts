import { cleanEnv, str, num, url } from 'envalid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate and clean environment variables
const env = cleanEnv(process.env, {
  // Redis configuration
  REDIS_HOST: str({ default: 'localhost' }),
  REDIS_PORT: num({ default: 6379 }),
  REDIS_PASSWORD: str({ default: '' }),
  REDIS_MAX_RETRIES: num({ default: 3 }),

  // Supabase configuration
  SUPABASE_URL: url(),
  SUPABASE_ANON_KEY: str(),
  SUPABASE_SERVICE_ROLE_KEY: str(),

  // eSIM Go API configuration
  ESIM_GO_API_KEY: str(),
  ESIM_GO_BASE_URL: url({ default: 'https://api.esim-go.com' }),
  ESIM_GO_RETRY_ATTEMPTS: num({ default: 3 }),

  // Worker configuration
  WORKER_PORT: num({ default: 5002 }),
  WORKER_CONCURRENCY: num({ default: 5 }),
  SYNC_INTERVAL: str({ default: '0 0 * * *' }), // Daily at midnight
  STUCK_JOB_THRESHOLD: num({ default: 60 }), // Minutes
  CLEANUP_OLD_JOBS_DAYS: num({ default: 30 }),

  // Queue configuration
  JOB_ATTEMPTS: num({ default: 3 }),
  JOB_BACKOFF_DELAY: num({ default: 2000 }),
  JOB_REMOVE_ON_COMPLETE_AGE: num({ default: 3600 }), // 1 hour
  JOB_REMOVE_ON_COMPLETE_COUNT: num({ default: 1000 }),
  JOB_REMOVE_ON_FAIL_AGE: num({ default: 24 * 3600 }), // 24 hours

  // Environment
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
  LOG_LEVEL: str({ choices: ['debug', 'info', 'warn', 'error'], default: 'info' }),
});

// Build configuration object from validated env vars
export const config = {
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required by BullMQ for blocking operations
  },
  
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  esimGo: {
    apiKey: env.ESIM_GO_API_KEY,
    baseUrl: env.ESIM_GO_BASE_URL,
    retryAttempts: env.ESIM_GO_RETRY_ATTEMPTS,
  },
  
  worker: {
    port: env.WORKER_PORT,
    concurrency: env.WORKER_CONCURRENCY,
    syncInterval: env.SYNC_INTERVAL,
    stuckJobThreshold: env.STUCK_JOB_THRESHOLD,
    cleanupOldJobsDays: env.CLEANUP_OLD_JOBS_DAYS,
  },
  
  queue: {
    defaultJobOptions: {
      attempts: env.JOB_ATTEMPTS,
      backoff: {
        type: 'exponential' as const,
        delay: env.JOB_BACKOFF_DELAY,
      },
      removeOnComplete: {
        age: env.JOB_REMOVE_ON_COMPLETE_AGE,
        count: env.JOB_REMOVE_ON_COMPLETE_COUNT,
      },
      removeOnFail: {
        age: env.JOB_REMOVE_ON_FAIL_AGE,
      },
    },
  },
  
  nodeEnv: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
} as const;

// Export typed configuration
export type Config = typeof config;