import { createLogger } from "@hiilo/utils";
import { nanoid } from "nanoid";
import { type RedisInstance } from "../redis";
import { CheckoutSessionSchema, type CheckoutSession } from "./schema";
import { env } from "../../config/env";
import type { BundleRepository } from "../../repositories"; // Make sure this path is correct

const logger = createLogger({ component: "checkout-session-service-v2" });
let redis: RedisInstance | null = null;
let bundleRepository: BundleRepository | null = null;

// 1 day on dev, 30 min on prod
const ttl = env.isDev ? 24 * 60 * 60 : 30 * 60;

// 👇 MODIFIED: init now accepts bundleRepository
const init = async (context: { redis: RedisInstance; bundleRepository: BundleRepository }) => {
  redis = context.redis;
  bundleRepository = context.bundleRepository;
  return checkoutSessionService;
};

// 👇 MODIFIED: createSession now fetches country data
const createSession = async ({
  countryId,
  numOfDays,
  initialState,
}: {
  numOfDays: number;
  countryId: string;
  initialState?: Pick<CheckoutSession, "auth">;
}) => {
  const id = nanoid();

  // --- Start of new logic ---
  let countryData: { iso2: string; name: string } | null = null;
  if (!bundleRepository) {
      logger.error("BundleRepository not initialized in session service!");
  } else {
      try {
        const found = await bundleRepository.getCountryByIso(countryId);
        console.log("[DEBUG] Data returned from getCountryByIso:", found);
        if (found && found.name) countryData = { iso2 :found.iso2, name: found.name };
        else if(found) {
          logger.warn(`Country found but missing name for ISO: ${countryId}`);
        }
      } catch (err: any) {
        logger.warn(`[WARN] Could not fetch country ${countryId} on session creation:`, err.message);
      }
  }
  // --- End of new logic ---

  const session = CheckoutSessionSchema.parse({
    id,
    status: "select-bundle",
    bundle: {
      completed: false,
      countryId,
      numOfDays,
      country: countryData, // ✅ ADDED: Country object is now included on creation
    },
    auth: {
      completed: initialState?.auth?.completed ?? false,
      userId: initialState?.auth?.userId,
      email: initialState?.auth?.email && initialState.auth.email !== "" ? initialState.auth.email : undefined,
      phone: initialState?.auth?.phone && initialState.auth.phone !== "" ? initialState.auth.phone : undefined,
      firstName: initialState?.auth?.firstName && initialState.auth.firstName !== "" ? initialState.auth.firstName : undefined,
      lastName: initialState?.auth?.lastName && initialState.auth.lastName !== "" ? initialState.auth.lastName : undefined,
      method: initialState?.auth?.method,
      otpSent: initialState?.auth?.otpSent,
      otpVerified: initialState?.auth?.otpVerified,
    },
    delivery: {
      completed: false,
      email: undefined,
      phone: undefined,
    },
    payment: {
      completed: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  await saveSession(session);

  logger.info("Created checkout session with initial country data", { sessionId: session.id });

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

  // Create index for payment intent ID if it exists
  if (session.payment?.intent?.id) {
    const indexKey = `checkout:intent:${session.payment.intent.id}`;
    await redis.set(indexKey, session.id, { ttl });
    logger.debug("Created payment intent index", {
      sessionId: session.id,
      paymentIntentId: session.payment.intent.id
    });
  }
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

const getSessionByPaymentIntentId = async (
  paymentIntentId: string
): Promise<CheckoutSession | null> => {
  if (!redis) {
    throw new NotInitializedError();
  }

  const indexKey = `checkout:intent:${paymentIntentId}`;
  const sessionId = await redis.get(indexKey);

  if (!sessionId) {
    logger.warn("No session found for payment intent ID", { paymentIntentId, indexKey });
    return null;
  }

  logger.debug("Found session ID for payment intent", { paymentIntentId, sessionId });

  return getSession(sessionId);
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

  const oldPaymentIntentId = session.payment?.intent?.id;

  session[step] = {
    ...(session[step] as object),
    ...updates,
  } as CheckoutSession[K];

  session.updatedAt = new Date();
  session.version += 1;

  const validatedSession = CheckoutSessionSchema.parse(session);

  if (step === 'payment' && redis) {
    const newPaymentIntentId = validatedSession.payment?.intent?.id;
    
    if (oldPaymentIntentId && oldPaymentIntentId !== newPaymentIntentId) {
      const oldIndexKey = `checkout:intent:${oldPaymentIntentId}`;
      await redis.delete(oldIndexKey);
      logger.debug("Removed old payment intent index", {
        sessionId,
        oldPaymentIntentId
      });
    }

    if (newPaymentIntentId) {
      const ttl = Math.floor((validatedSession.expiresAt.getTime() - Date.now()) / 1000);
      const newIndexKey = `checkout:intent:${newPaymentIntentId}`;
      await redis.set(newIndexKey, sessionId, { ttl });
      logger.debug("Created payment intent index", {
        sessionId,
        paymentIntentId: newPaymentIntentId
      });
    }
  }

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

const deleteSession = async (sessionId: string): Promise<void> => {
  if (!redis) {
    throw new NotInitializedError();
  }

  const session = await getSession(sessionId);
  
  if (session) {
    const sessionKey = `checkout:session:${sessionId}`;
    await redis.delete(sessionKey);

    if (session.payment?.intent?.id) {
      const indexKey = `checkout:intent:${session.payment.intent.id}`;
      await redis.delete(indexKey);
    }

    logger.info("Deleted session and indexes", { sessionId });
  }
};

export const checkoutSessionService = {
  init,
  createSession,
  saveSession,
  getSession,
  getSessionByPaymentIntentId,
  getSessionNextStep,
  updateSessionStep,
  deleteSession,
};

export type CheckoutSessionServiceV2 = typeof checkoutSessionService;

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