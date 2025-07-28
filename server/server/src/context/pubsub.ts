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
    logger.info('Initializing Redis PubSub with separate clients', {
      operationType: 'pubsub-init',
      redisUrl: env.REDIS_URL
    });

    // Create native Redis clients specifically for PubSub using Redis URL
    // These are separate from Apollo Server's KeyvAdapter Redis client
    const redisConfig = {
      maxRetriesPerRequest: null, // Required for PubSub compatibility
    };

    const publisher = new Redis(env.REDIS_URL, redisConfig);
    const subscriber = new Redis(env.REDIS_URL, redisConfig);

    // Add error handlers to prevent unhandled error events
    publisher.on('error', (error) => {
      logger.error('Redis publisher error', error as Error, {
        operationType: 'redis-publisher-error'
      });
    });

    subscriber.on('error', (error) => {
      logger.error('Redis subscriber error', error as Error, {
        operationType: 'redis-subscriber-error'
      });
    });

    // Test connections
    try {
      await publisher.ping();
      await subscriber.ping();
      logger.info('Redis PubSub clients connected successfully', {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        operationType: 'pubsub-init'
      });
    } catch (error) {
      logger.error('Failed to connect Redis PubSub clients', error as Error, {
        operationType: 'pubsub-init'
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