import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import KeyvRedis from "@keyv/redis";
import { cleanEnv, port, str } from "envalid";
import Keyv from "keyv";
import { createLogger } from "../lib/logger";

const env = cleanEnv(process.env, {
  REDIS_URL: str({ default: "redis://localhost:6379" }),
  REDIS_PASSWORD: str({ default: "mypassword" }),
  REDIS_HOST: str({ default: "localhost" }),
  REDIS_PORT: port({ default: 6379 }),
  REDIS_USER: str({ default: "default" }),
  RAILWAY_SERVICE_REDIS_URL: str({ default: "" }),
});

const logger = createLogger({ component: 'redis' });

let redisInstance: KeyvAdapter<any>;

export async function getRedis() {
  if (!redisInstance) {
    // Use external Railway Redis URL if available (internal DNS not working)
    let redisUrl: string;
    
    if (env.RAILWAY_SERVICE_REDIS_URL && env.REDIS_URL) {
      // Replace internal hostname with external one in the URL
      redisUrl = env.REDIS_URL.replace('redis.railway.internal', env.RAILWAY_SERVICE_REDIS_URL);
      logger.info('Using external Redis URL', { 
        originalUrl: env.REDIS_URL,
        externalUrl: redisUrl,
        operationType: 'redis-url-config'
      });
    } else {
      // Fallback to constructing URL
      const redisHost = env.REDIS_HOST;
      redisUrl = `redis://${env.REDIS_USER}:${env.REDIS_PASSWORD}@${redisHost}:${env.REDIS_PORT}`;
    }
    const store = new KeyvRedis(
      {
        url: redisUrl,
      },
      {
        throwOnConnectError: false,
        connectionTimeout: 5000,
        throwErrors: true,
      }
    );

    const keyv = new Keyv({
      store,
    });

    // Wait for Redis connection to be established
    try {
      await keyv.get("connection-test");
      logger.info('Redis connected', { redisUrl, operationType: 'redis-connection' });
    } catch (error) {
      logger.error('Redis connection error', error as Error, { redisUrl, operationType: 'redis-connection' });
      throw error;
    }

    redisInstance = new KeyvAdapter(keyv);
  }

  return redisInstance;
}
