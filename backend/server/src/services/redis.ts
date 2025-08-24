import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import KeyvRedis from "@keyv/redis";
import { cleanEnv, port, str } from "envalid";
import Keyv from "keyv";
import { createLogger } from "../lib/logger";

const env = cleanEnv(process.env, {
  REDIS_PASSWORD: str({ default: "mypassword" }),
  REDIS_HOST: str({ default: "localhost" }),
  REDIS_PORT: port({ default: 6379 }),
  REDIS_USER: str({ default: "default" }),
});


const logger = createLogger({ component: 'redis' });

let redisInstance: KeyvAdapter<any>;

export async function getRedis() {
  if (!redisInstance) {
    const redisUrl = `redis://${env.REDIS_USER}:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}?family=0`;
    
    logger.info('Redis configuration', { 
      redisUrl,
      operationType: 'redis-config'
    });
    const store = new KeyvRedis(
      {
        url: redisUrl,
      },
      {
        throwOnConnectError: true,
        connectionTimeout: 5 * 1000,
        throwErrors: true,
      }
    );

    const keyv = new Keyv({
      store,
    });

    keyv.set("connection-test", "test");
    // Wait for Redis connection to be established
    try {
      const test = await keyv.get("connection-test");
      console.log(test);
      if (test !== "test") {
        throw new Error("Redis connection test failed");
      }
      logger.info('Redis connected', { redisUrl, operationType: 'redis-connection' });
    } catch (error) {
      logger.error('Redis connection error', error as Error, { redisUrl, operationType: 'redis-connection' });
      throw error;
    }

    redisInstance = new KeyvAdapter(keyv);
  }

  return redisInstance;
}

export type RedisInstance = typeof redisInstance;