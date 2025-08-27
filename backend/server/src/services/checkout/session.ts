import { createLogger } from "@hiilo/utils";
import { nanoid } from "nanoid";
import { type RedisInstance } from "../redis";
import { CheckoutSessionSchema, type CheckoutSession } from "./schema";

const logger = createLogger({ component: "checkout-session-service-v2" });
let redis: RedisInstance | null = null;

const init = async (context: { redis: RedisInstance }) => {
  redis = context.redis;
  return checkoutSessionService;
};

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

  const session = CheckoutSessionSchema.parse({
    id,

    status: "select-bundle",

    bundle: {
      completed: false,
      countryId,
      numOfDays,
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

/**
 * Get a checkout session by its payment intent ID
 * @param paymentIntentId - The EasyCard payment intent ID (entityUID)
 * @returns The checkout session or null if not found
 */
const getSessionByPaymentIntentId = async (
  paymentIntentId: string
): Promise<CheckoutSession | null> => {
  if (!redis) {
    throw new NotInitializedError();
  }

  // First, get the session ID from the payment intent index
  const indexKey = `checkout:intent:${paymentIntentId}`;
  const sessionId = await redis.get(indexKey);

  if (!sessionId) {
    logger.debug("No session found for payment intent ID", { paymentIntentId });
    return null;
  }

  // Then get the actual session
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

  // Store old payment intent ID to clean up old index if it changes
  const oldPaymentIntentId = session.payment?.intent?.id;

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

  // Handle payment intent ID index updates
  if (step === 'payment' && redis) {
    const newPaymentIntentId = validatedSession.payment?.intent?.id;
    
    // Clean up old index if payment intent ID changed
    if (oldPaymentIntentId && oldPaymentIntentId !== newPaymentIntentId) {
      const oldIndexKey = `checkout:intent:${oldPaymentIntentId}`;
      await redis.delete(oldIndexKey);
      logger.debug("Removed old payment intent index", { 
        sessionId, 
        oldPaymentIntentId 
      });
    }

    // Create new index if payment intent ID is set
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

/**
 * Clean up a session and its associated indexes
 * @param sessionId - The session ID to clean up
 */
const deleteSession = async (sessionId: string): Promise<void> => {
  if (!redis) {
    throw new NotInitializedError();
  }

  const session = await getSession(sessionId);
  
  if (session) {
    // Delete the main session
    const sessionKey = `checkout:session:${sessionId}`;
    await redis.delete(sessionKey);

    // Delete payment intent index if exists
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