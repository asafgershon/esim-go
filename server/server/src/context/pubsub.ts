import { RedisPubSub } from "graphql-redis-subscriptions";
import { type RedisOptions, Redis } from "ioredis";
import { cleanEnv, str } from "envalid";
import { createLogger } from "../lib/logger";

const logger = createLogger({ component: "PubSub" });

const env = cleanEnv(process.env, {
  REDIS_URL: str({ default: "redis://default:mypassword@localhost:6379" }),
});

let pubsub: RedisPubSub | null = null;

export async function getPubSub(apolloRedis?: any): Promise<RedisPubSub> {
  if (!pubsub) {
    logger.info("=== STARTING REDIS PUBSUB INITIALIZATION ===", {
      operationType: "pubsub-init-start",
      redisUrl: env.REDIS_URL,
      allEnvRedisVars: {
        REDIS_URL: env.REDIS_URL,
      },
    });

    // Create native Redis clients specifically for PubSub
    // These are separate from Apollo Server's KeyvAdapter Redis client

    // Use the REDIS_URL directly if available (for Railway internal DNS)
    let publisher: Redis;
    let subscriber: Redis;
    console.log(env.REDIS_URL);
    const url = env.REDIS_URL + "?family=0";
    logger.debug(`Redis URL: ${url}`);
    publisher = new Redis(url);
    subscriber = new Redis(url);

    publisher.on("error", (error) => {
      logger.error("Redis publisher error", error as Error, {
        operationType: "redis-publisher-error",
        errorName: error.name,
        errorMessage: error.message,
      });
    });

    subscriber.on("error", (error) => {
      logger.error("Redis subscriber error", error as Error, {
        operationType: "redis-subscriber-error",
        errorName: error.name,
        errorMessage: error.message,
      });
    });

    // Test DNS resolution first
    logger.info("Testing Redis connection", {
      operationType: "redis-connection-test",
    });

    // Test connections with detailed logging
    try {
      logger.info("Attempting to ping Redis publisher...", {
        operationType: "redis-ping-test",
      });
      await publisher.ping();

      logger.info("Attempting to ping Redis subscriber...", {
        operationType: "redis-ping-test",
      });
      await subscriber.ping();

      logger.info("✅ Redis PubSub clients connected successfully", {
        operationType: "pubsub-init-success",
      });
    } catch (error) {
      logger.error(
        "❌ Failed to connect Redis PubSub clients",
        error as Error,
        {
          operationType: "pubsub-init-failure",
          errorName: (error as Error).name,
          errorMessage: (error as Error).message,
        }
      );
      throw error;
    }

    pubsub = new RedisPubSub({
      publisher,
      subscriber,
      // Use a prefix to namespace our pubsub events
      connection: {
        keyPrefix: "esim-go:pubsub:",
      },
    });

    logger.info("Redis PubSub initialized successfully", {
      operationType: "pubsub-init",
    });
  }

  return pubsub;
}

// Event types for type safety
export enum PubSubEvents {
  // Order events
  ORDER_CREATED = "ORDER_CREATED",
  ORDER_UPDATED = "ORDER_UPDATED",
  ORDER_CANCELLED = "ORDER_CANCELLED",
  ORDER_COMPLETED = "ORDER_COMPLETED",

  // eSIM events
  ESIM_ACTIVATED = "ESIM_ACTIVATED",
  ESIM_DEACTIVATED = "ESIM_DEACTIVATED",
  ESIM_DATA_USAGE_UPDATE = "ESIM_DATA_USAGE_UPDATE",

  // Trip events
  TRIP_CREATED = "TRIP_CREATED",
  TRIP_UPDATED = "TRIP_UPDATED",
  TRIP_CANCELLED = "TRIP_CANCELLED",

  // Catalog sync events
  CATALOG_SYNC_STARTED = "CATALOG_SYNC_STARTED",
  CATALOG_SYNC_PROGRESS = "CATALOG_SYNC_PROGRESS",
  CATALOG_SYNC_COMPLETED = "CATALOG_SYNC_COMPLETED",
  CATALOG_SYNC_FAILED = "CATALOG_SYNC_FAILED",

  // Pricing events
  PRICING_RULES_UPDATED = "PRICING_RULES_UPDATED",
  PRICING_PIPELINE_STEP = "PRICING_PIPELINE_STEP",
}

// Helper function to publish events with logging
export async function publishEvent<T = any>(
  pubsub: RedisPubSub,
  event: PubSubEvents,
  payload: T
): Promise<void> {
  try {
    await pubsub.publish(event, payload);
    logger.debug("Published PubSub event", {
      event,
      operationType: "pubsub-publish",
    });
  } catch (error) {
    logger.error("Failed to publish PubSub event", error as Error, {
      event,
      operationType: "pubsub-publish",
    });
    throw error;
  }
}
