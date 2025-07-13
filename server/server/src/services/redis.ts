import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import KeyvRedis from "@keyv/redis";
import { cleanEnv, str } from "envalid";
import Keyv from "keyv";

const env = cleanEnv(process.env, {
  REDIS_HOST: str({ default: "localhost" }),
  REDIS_PORT: str({ default: "6379" }),
  REDIS_PASSWORD: str({ default: "mypassword" }),
  REDIS_USER: str({ default: "default" }),
});

let redisInstance: KeyvAdapter<any>;

export async function getRedis() {
  if (!redisInstance) {
    const redisUrl = `redis://${env.REDIS_USER}:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}`;
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
      console.log("🔥 Redis connected", redisUrl);
    } catch (error) {
      console.log("🔥 Redis connection error", error);
      throw error;
    }

    redisInstance = new KeyvAdapter(keyv);
  }

  return redisInstance;
}
