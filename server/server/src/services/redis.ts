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
});

const logger = createLogger({ component: 'redis' });

let redisInstance: KeyvAdapter<any>;

export async function getRedis() {
  if (!redisInstance) {
    // Parse the REDIS_URL and add password if provided
    const redisUrl = `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`;
    const store = new KeyvRedis(
      {
        url: redisUrl,
      },
      {
        throwOnConnectError: true,
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
