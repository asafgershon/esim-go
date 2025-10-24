import { createLogger } from "@hiilo/utils";
import { nanoid } from "nanoid";
import { type RedisInstance } from "../redis";
import { CheckoutSessionSchema, type CheckoutSession } from "./schema";
import { env } from "../../config/env";
import type { BundleRepository, CheckoutSessionRepository } from "../../repositories";

const logger = createLogger({ component: "checkout-session-service-v2" });
let redis: RedisInstance | null = null;
let bundleRepository: BundleRepository | null = null;
let checkoutSessionRepository: CheckoutSessionRepository | null = null;

// 1 day on dev, 30 min on prod
const ttl = env.isDev ? 24 * 60 * 60 : 30 * 60;

const init = async (context: {
    redis: RedisInstance;
    bundleRepository: BundleRepository;
    checkoutSessionRepository: CheckoutSessionRepository;
}) => {
  redis = context.redis;
  bundleRepository = context.bundleRepository;
  checkoutSessionRepository = context.checkoutSessionRepository;
  return checkoutSessionService;
};

// פונקציית עזר למיפוי state ל-status
const mapStateToStatus = (state: string | null): CheckoutSession['status'] => {
    switch (state) {
        case 'INITIALIZED': return 'select-bundle';
        case 'AUTHENTICATED': return 'auth';
        case 'DELIVERY_SET': return 'delivery';
        case 'PAYMENT_READY':
        case 'PAYMENT_PROCESSING': return 'payment';
        case 'PAYMENT_COMPLETED': return 'confirmation';
        default: return 'select-bundle'; // ברירת מחדל
    }
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

  const session = CheckoutSessionSchema.parse({
    id,
    status: "select-bundle",
    bundle: {
      completed: false,
      countryId,
      numOfDays,
      country: countryData,
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
      firstName: undefined,
      lastName: undefined,
    },
    payment: {
      completed: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + ttl * 1000),
  });

  try {
      await saveSession(session);
      logger.info("Created checkout session (and saved to Redis if available)", { sessionId: session.id });
  } catch (redisError) {
      logger.warn("Could not save session to Redis during creation, continuing...", { sessionId: session.id, error: (redisError as Error).message });
  }

  // ✍️ **חשוב:** עדיין חסרה כאן השמירה הראשונית ל-Database!
  // הפונקציה createSession המקורית (זו שקשורה ל-GraphQL) היא זו ששומרת ל-DB.
  // הפונקציה הזו כאן היא כנראה לא בשימוש ישיר ביצירה הראשונית.

  return session;
};

const saveSession = async (session: CheckoutSession) => {
  if (!redis) {
    if (checkoutSessionRepository) {
        logger.warn("Redis not initialized in saveSession, skipping Redis save.", {sessionId: session.id});
        return;
    }
    throw new NotInitializedError("Redis not initialized");
  }

  try {
      const verifiedSession = CheckoutSessionSchema.parse(session);
      const remainingTtl = Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
      const key = `checkout:session:${session.id}`;

      await redis.set(key, JSON.stringify(verifiedSession), { ttl: remainingTtl });

      if (session.payment?.intent?.id) {
        const indexKey = `checkout:intent:${session.payment.intent.id}`;
        await redis.set(indexKey, session.id, { ttl: remainingTtl });
        logger.debug("Created payment intent index", { sessionId: session.id, paymentIntentId: session.payment.intent.id });
      }
  } catch (error) {
      logger.error("Failed to save session to Redis", error as Error, { sessionId: session.id });
  }
};

const getSession = async (
  sessionId: string
): Promise<CheckoutSession | null> => {
  if (!checkoutSessionRepository) {
    throw new NotInitializedError("CheckoutSessionRepository not initialized");
  }

  try {
    const sessionDataFromDb = await checkoutSessionRepository.getById(sessionId);

    if (!sessionDataFromDb) {
      logger.warn(`[DEBUG] getSession: Session ${sessionId} not found in DB.`);
      return null;
    }

    console.log("[DEBUG] Raw data from DB:", JSON.stringify(sessionDataFromDb, null, 2));

    // 👇 הוספת type assertion כדי שנוכל לגשת לשדות הפנימיים
    const metadata = sessionDataFromDb.metadata as any || {};
    const pricing = sessionDataFromDb.pricing as any || {};
    const steps = sessionDataFromDb.steps as any || {};

    const mappedSessionData = {
        id: sessionDataFromDb.id,
        version: 1, // ברירת מחדל
        bundle: {
            completed: steps.bundle?.completed || false, // גישה בטוחה יותר
            numOfDays: metadata.requestedDays || 0,
            countryId: metadata.countries?.[0] || '',
            country: metadata.country || null,
            price: pricing.finalPrice,
            discounts: pricing.discount ? [pricing.discount] : [],
            // שדות נוספים מ-bundle
            currency: pricing.currency || "USD", // דוגמה
            dataAmount: metadata.dataAmount || "Unlimited", // דוגמה
            speed: metadata.speed || [], // דוגמה
            validated: metadata.isValidated || false, // דוגמה
            pricePerDay: pricing.finalPrice && metadata.requestedDays ? pricing.finalPrice / metadata.requestedDays : 0, // דוגמה
        },
        auth: {
            completed: !!sessionDataFromDb.user_id || steps.authentication?.completed || false,
            userId: sessionDataFromDb.user_id || undefined,
            email: metadata.authEmail || steps.authentication?.email || undefined,
            phone: metadata.authPhone || steps.authentication?.phone || undefined,
            firstName: metadata.firstName || steps.authentication?.firstName || undefined,
            lastName: metadata.lastName || steps.authentication?.lastName || undefined,
        },
        delivery: {
            completed: steps.delivery?.completed || false,
            email: steps.delivery?.email || metadata.deliveryEmail || undefined,
            phone: steps.delivery?.phone || metadata.deliveryPhone || undefined,
            firstName: steps.delivery?.firstName || metadata.firstName || undefined, // נשתמש גם בשם מה-auth אם יש
            lastName: steps.delivery?.lastName || metadata.lastName || undefined,
        },
        payment: {
            completed: sessionDataFromDb.payment_status === 'SUCCEEDED' || steps.payment?.completed || false,
            intent: sessionDataFromDb.payment_intent_id ? { id: sessionDataFromDb.payment_intent_id, url: '' } : undefined,
            // למפות שדות נוספים מ-steps.payment אם קיימים
        },
        pricing: sessionDataFromDb.pricing as any,
        status: mapStateToStatus(sessionDataFromDb.state),
        createdAt: new Date(sessionDataFromDb.created_at || Date.now()),
        updatedAt: new Date(sessionDataFromDb.updated_at || Date.now()),
        expiresAt: new Date(sessionDataFromDb.expires_at || Date.now()),
        completedAt: sessionDataFromDb.payment_status === 'SUCCEEDED' ? new Date(sessionDataFromDb.updated_at || Date.now()) : undefined,
    };

    console.log("[DEBUG] Data mapped for Zod parse:", JSON.stringify(mappedSessionData, null, 2));

    const validationResult = CheckoutSessionSchema.safeParse(mappedSessionData);
    if (!validationResult.success) {
        logger.error("Failed to parse MAPPED session data from DB against Zod schema", validationResult.error, { sessionId });
        // 👇 תיקון: שימוש ב-issues במקום errors
        console.log("Validation Issues:", validationResult.error.issues);
        return null;
    }

    return validationResult.data;

  } catch (error) {
      logger.error("Error fetching or mapping/parsing session from DB in getSession", error as Error, { sessionId });
      return null;
  }
};


const getSessionByPaymentIntentId = async (
  paymentIntentId: string
): Promise<CheckoutSession | null> => {
    if (!redis) {
        logger.warn("getSessionByPaymentIntentId requires Redis index which is not available.");
        if (checkoutSessionRepository) {
             const session = await checkoutSessionRepository.findByPaymentIntent(paymentIntentId);
             if (session) return getSession(session.id);
        }
        return null;
    }

  const indexKey = `checkout:intent:${paymentIntentId}`;
  const sessionId = await redis.get(indexKey);

  if (!sessionId) {
    logger.warn("No session found for payment intent ID via Redis index", { paymentIntentId, indexKey });
    return null;
  }

  logger.debug("Found session ID for payment intent via Redis", { paymentIntentId, sessionId });

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

  // ✍️ **חשוב:** כאן חסרה השמירה ל-Database!
  // צריך להוסיף קריאה ל-checkoutSessionRepository.update(sessionId, ...)
  // צריך למפות את validatedSession חזרה לפורמט שה-DB מצפה לו.
  await saveSession(validatedSession);

  if (step === 'payment' && redis) {
    const newPaymentIntentId = validatedSession.payment?.intent?.id;
    const ttl = Math.max(1, Math.floor((validatedSession.expiresAt.getTime() - Date.now()) / 1000));

    if (oldPaymentIntentId && oldPaymentIntentId !== newPaymentIntentId) {
      const oldIndexKey = `checkout:intent:${oldPaymentIntentId}`;
      await redis.delete(oldIndexKey);
      logger.debug("Removed old payment intent index from Redis", { sessionId, oldPaymentIntentId });
    }
    if (newPaymentIntentId) {
      const newIndexKey = `checkout:intent:${newPaymentIntentId}`;
      await redis.set(newIndexKey, sessionId, { ttl });
      logger.debug("Created/Updated payment intent index in Redis", { sessionId, paymentIntentId: newPaymentIntentId });
    }
  }

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
  // ✍️ **חשוב:** כאן חסרה המחיקה מה-Database!
  // צריך להוסיף קריאה ל-checkoutSessionRepository.delete(sessionId)

  if (!redis) {
      logger.warn("Redis not initialized in deleteSession, skipping Redis delete.", {sessionId});
  } else {
      const session = await getSession(sessionId);
      if (session) {
        const sessionKey = `checkout:session:${sessionId}`;
        await redis.delete(sessionKey);

        if (session.payment?.intent?.id) {
          const indexKey = `checkout:intent:${session.payment.intent.id}`;
          await redis.delete(indexKey);
        }
        logger.info("Deleted session and indexes from Redis", { sessionId });
      }
  }
};

export const checkoutSessionService = {
  init,
  createSession, // הפונקציה הזו כנראה לא בשימוש ליצירה ראשונית
  saveSession, // זו שמירה רק ל-Redis
  getSession, // קורא מה-DB וממפה
  getSessionByPaymentIntentId, // קורא מאינדקס Redis
  getSessionNextStep,
  updateSessionStep, // קורא מה-DB, מעדכן בזיכרון, שומר ב-Redis (חסר שמירה ל-DB)
  deleteSession, // מוחק מ-Redis (חסר מחיקה מה-DB)
};

export type CheckoutSessionServiceV2 = typeof checkoutSessionService;

class NotInitializedError extends Error {
  constructor(message: string = "Service not initialized") {
    super(message);
    this.name = "NotInitializedError";
  }
}
class SessionNotFound extends Error {
  constructor() {
    super("Session not found");
    this.name = "SessionNotFound";
  }
}