import { createLogger } from "@hiilo/utils";
import { getRedis, type RedisInstance } from "../redis";
import type KeyvRedis from "@keyv/redis";
import type { PubSubInstance } from "../../context/pubsub";
import * as pricingEngine from "@hiilo/rules-engine-2";
import { nanoid } from "nanoid";
import { CheckoutSessionSchema, type CheckoutSession } from "./schema";

const logger = createLogger({ component: "checkout-session-service-v2" });
let redis: RedisInstance | null = null;

const init = async (context: { redis: RedisInstance }) => {
  redis = context.redis;
  return checkoutSessionService
};

const createSession = async ({countryId,numOfDays}: { numOfDays: number; countryId: string }) => {
  const id = nanoid();

  const session = CheckoutSessionSchema.parse({
    id,

    status: "select-bundle",

    bundle: {
      completed: false,
      countryId,
      numOfDays,
    },
    auth: {
      completed: false,
    },
    delivery: {
      completed: false,
    },
    payment: {
      completed: false,
    },

    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  await saveSession(session);

  logger.info("Created checkout session", { sessionId: session.id });

  return session;
};

const saveSession = async (session: CheckoutSession) => {
  if (!redis) {
    throw new NotInitializedError();
  }

  const verifiedSession = CheckoutSessionSchema.parse(session);
  const ttl = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
  const key = `checkout:session:${session.id}`;

  await redis.set(key, JSON.stringify(verifiedSession), { ttl });
};

const getSession = async (
  sessionId: string
): Promise<CheckoutSession | null> => {
  if (!redis) {
    throw new NotInitializedError();
  }

  const key = `checkout:session:${sessionId}`;
  const data = await redis.get(key);

  if (!data) {
    return null;
  }

  return CheckoutSessionSchema.parse(JSON.parse(data));
};

const updateSessionStep = async <K extends keyof CheckoutSession>(
  sessionId: string,
  step: K,
  updates: Partial<CheckoutSession[K]>
): Promise<CheckoutSession> => {
  const session = await getSession(sessionId);

  if (!session) {
    throw new SessionNotFound();
  }

  // Update the specific domain
  session[step] = {
    ...(session[step] as object),
    ...updates,
  } as CheckoutSession[K];

  // Update metadata
  session.updatedAt = new Date();
  session.version += 1;

  // Validate the entire session after update
  const validatedSession = CheckoutSessionSchema.parse(session);

  // Save back to Redis
  await saveSession(validatedSession);

  return validatedSession;
};

const getSessionNextStep = (session: CheckoutSession): string => {
  if (!session.bundle.completed) return "bundle";
  if (!session.auth.completed) return "auth";
  if (!session.delivery.completed) return "delivery";
  if (!session.payment.completed) return "payment";
  return "confirmation";
};

export const checkoutSessionService = {
  init,
  createSession,
  saveSession,
  getSession,
  getSessionNextStep,
  updateSessionStep,
};

export type CheckoutSessionServiceV2 = typeof checkoutSessionService;

/* ===============================
 * Errors
 * =============================== */
class NotInitializedError extends Error {
  constructor() {
    super("Service not initialized");
    this.name = "NotInitializedError";
  }
}
class SessionNotFound extends Error {
  constructor() {
    super("Session not found");
    this.name = "SessionNotFound";
  }
}
