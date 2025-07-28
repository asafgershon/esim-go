import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';
import { cleanEnv, str } from 'envalid';
import { createLogger } from '../lib/logger';

const logger = createLogger({ component: 'PubSub' });

const env = cleanEnv(process.env, {
  REDIS_URL: str({ default: "redis://default:mypassword@localhost:6379" }),
  REDIS_HOST: str({ default: "localhost" }),
  REDIS_PORT: str({ default: "6379" }),
  REDIS_PASSWORD: str({ default: "mypassword" }),
  REDIS_USER: str({ default: "default" }),
});

let pubsub: RedisPubSub | null = null;

export async function getPubSub(apolloRedis?: any): Promise<RedisPubSub> {
  if (!pubsub) {
    logger.info('=== STARTING REDIS PUBSUB INITIALIZATION ===', {
      operationType: 'pubsub-init-start',
      redisUrl: env.REDIS_URL,
      allEnvRedisVars: {
        REDIS_URL: process.env.REDIS_URL,
        REDIS_HOST: process.env.REDIS_HOST,
        REDIS_PORT: process.env.REDIS_PORT,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
        REDIS_USER: process.env.REDIS_USER,
      }
    });

    // Create native Redis clients specifically for PubSub using object config
    // These are separate from Apollo Server's KeyvAdapter Redis client
    const redisConfig = {
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT),
      password: env.REDIS_PASSWORD,
      username: env.REDIS_USER,
      maxRetriesPerRequest: null, // Required for PubSub compatibility
    };

    logger.info('Creating Redis clients with object configuration', {
      operationType: 'redis-client-creation',
      config: {
        host: redisConfig.host,
        port: redisConfig.port,
        username: redisConfig.username,
        hasPassword: !!redisConfig.password
      }
    });

    const publisher = new Redis(redisConfig);
    const subscriber = new Redis(redisConfig);

    // Add error handlers to prevent unhandled error events
    publisher.on('error', (error) => {
      logger.error('Redis publisher error', error as Error, {
        operationType: 'redis-publisher-error',
        host: redisConfig.host,
        port: redisConfig.port,
        errorName: error.name,
        errorMessage: error.message
      });
    });

    subscriber.on('error', (error) => {
      logger.error('Redis subscriber error', error as Error, {
        operationType: 'redis-subscriber-error',
        host: redisConfig.host,
        port: redisConfig.port,
        errorName: error.name,
        errorMessage: error.message
      });
    });

    // Test DNS resolution first
    logger.info('Testing Redis connection', {
      operationType: 'redis-connection-test',
      host: redisConfig.host,
      port: redisConfig.port
    });

    // Test connections with detailed logging
    try {
      logger.info('Attempting to ping Redis publisher...', {
        operationType: 'redis-ping-test'
      });
      await publisher.ping();
      
      logger.info('Attempting to ping Redis subscriber...', {
        operationType: 'redis-ping-test'
      });
      await subscriber.ping();
      
      logger.info('✅ Redis PubSub clients connected successfully', {
        operationType: 'pubsub-init-success',
        host: redisConfig.host,
        port: redisConfig.port
      });
    } catch (error) {
      logger.error('❌ Failed to connect Redis PubSub clients', error as Error, {
        operationType: 'pubsub-init-failure',
        host: redisConfig.host,
        port: redisConfig.port,
        errorName: (error as Error).name,
        errorMessage: (error as Error).message
      });
      throw error;
    }

    pubsub = new RedisPubSub({
      publisher,
      subscriber,
      // Use a prefix to namespace our pubsub events
      connection: {
        keyPrefix: 'esim-go:pubsub:'
      }
    });

    logger.info('Redis PubSub initialized successfully', {
      operationType: 'pubsub-init'
    });
  }

  return pubsub;
}

// Event types for type safety
export enum PubSubEvents {
  // Order events
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_COMPLETED = 'ORDER_COMPLETED',
  
  // eSIM events
  ESIM_ACTIVATED = 'ESIM_ACTIVATED',
  ESIM_DEACTIVATED = 'ESIM_DEACTIVATED',
  ESIM_DATA_USAGE_UPDATE = 'ESIM_DATA_USAGE_UPDATE',
  
  // Trip events
  TRIP_CREATED = 'TRIP_CREATED',
  TRIP_UPDATED = 'TRIP_UPDATED',
  TRIP_CANCELLED = 'TRIP_CANCELLED',
  
  // Catalog sync events
  CATALOG_SYNC_STARTED = 'CATALOG_SYNC_STARTED',
  CATALOG_SYNC_PROGRESS = 'CATALOG_SYNC_PROGRESS',
  CATALOG_SYNC_COMPLETED = 'CATALOG_SYNC_COMPLETED',
  CATALOG_SYNC_FAILED = 'CATALOG_SYNC_FAILED',
  
  // Pricing events
  PRICING_RULES_UPDATED = 'PRICING_RULES_UPDATED',
  PRICING_PIPELINE_STEP = 'PRICING_PIPELINE_STEP',
}

// Helper function to publish events with logging
export async function publishEvent<T = any>(
  pubsub: RedisPubSub,
  event: PubSubEvents,
  payload: T
): Promise<void> {
  try {
    await pubsub.publish(event, payload);
    logger.debug('Published PubSub event', {
      event,
      operationType: 'pubsub-publish'
    });
  } catch (error) {
    logger.error('Failed to publish PubSub event', error as Error, {
      event,
      operationType: 'pubsub-publish'
    });
    throw error;
  }
}