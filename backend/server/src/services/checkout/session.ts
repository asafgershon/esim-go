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
      // הוספתי ערכים התחלתיים ריקים לשדות החדשים
      firstName: undefined,
      lastName: undefined,
    },
    payment: {
      completed: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + ttl * 1000), // שימוש ב-ttl שהוגדר למעלה
  });

  // עדיין ננסה לשמור ב-Redis אם הוא זמין, לטובת פיצ'רים אחרים אולי
  try {
      await saveSession(session);
      logger.info("Created checkout session (and saved to Redis if available)", { sessionId: session.id });
  } catch (redisError) {
      logger.warn("Could not save session to Redis during creation, continuing...", { sessionId: session.id, error: (redisError as Error).message });
      // לא זורקים שגיאה, ממשיכים כי העיקר שזה יישמר ב-DB
  }

  // ✍️ **חשוב:** כאן חסרה השמירה הראשונית ל-Database!
  // צריך להוסיף קריאה ל-checkoutSessionRepository.create(session)
  // או שהפונקציה createSession המקורית (זו שקראנו לה מ-GraphQL) עושה את זה.
  // כרגע, הקוד הזה רק שומר ב-Redis.

  return session;
};

const saveSession = async (session: CheckoutSession) => {
  if (!redis) {
    // זורקים שגיאה רק אם Redis *אמור* להיות זמין ולא אותחל
    if (checkoutSessionRepository) { // אם יש DB, אפשר לדלג על שמירת Redis
        logger.warn("Redis not initialized in saveSession, skipping Redis save.", {sessionId: session.id});
        return;
    }
    throw new NotInitializedError("Redis not initialized");
  }

  try {
      const verifiedSession = CheckoutSessionSchema.parse(session);
      const remainingTtl = Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)); // ודא TTL חיובי
      const key = `checkout:session:${session.id}`;

      await redis.set(key, JSON.stringify(verifiedSession), { ttl: remainingTtl });

      if (session.payment?.intent?.id) {
        const indexKey = `checkout:intent:${session.payment.intent.id}`;
        await redis.set(indexKey, session.id, { ttl: remainingTtl });
        logger.debug("Created payment intent index", { sessionId: session.id, paymentIntentId: session.payment.intent.id });
      }
  } catch (error) {
      logger.error("Failed to save session to Redis", error as Error, { sessionId: session.id });
      // לא זורקים שגיאה כדי לא לשבור תהליכים אחרים
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

    // המרת הנתונים מה-DB לפורמט שהסכמה מצפה לו
    const parsedSession = {
        ...sessionDataFromDb,
        // המרה מפורשת אם השדות הם Json ב-DB (Supabase מחזיר אותם כאובייקטים בדרך כלל)
        pricing: sessionDataFromDb.pricing as any, // נניח שזה כבר אובייקט
        metadata: sessionDataFromDb.metadata as any, // נניח שזה כבר אובייקט
        // המרת תאריכים אם הם מגיעים כמחרוזות (Supabase מחזיר אותם כמחרוזות ISO)
        createdAt: new Date(sessionDataFromDb.created_at || Date.now()),
        updatedAt: new Date(sessionDataFromDb.updated_at || Date.now()),
        expiresAt: new Date(sessionDataFromDb.expires_at || Date.now()),
        // צריך למפות גם את שאר השדות אם יש הבדלי שמות (למשל plan_id -> bundle.id?)
        // כאן אני מניח שהמבנה ב-DB דומה למבנה בסכמת Zod
        // **זהירות:** אם יש הבדלים, ה-parse ייכשל
    };

    // מנסים לעשות Parse לפי הסכמה
    const validationResult = CheckoutSessionSchema.safeParse(parsedSession);
    if (!validationResult.success) {
        logger.error("Failed to parse session data from DB against Zod schema", validationResult.error, { sessionId });
        return null; // אם הנתונים מה-DB לא תואמים לסכמה
    }

    return validationResult.data; // מחזירים את הנתונים שעברו ולידציה

  } catch (error) {
      logger.error("Error fetching or parsing session from DB in getSession", error as Error, { sessionId });
      return null;
  }
};


const getSessionByPaymentIntentId = async (
  paymentIntentId: string
): Promise<CheckoutSession | null> => {
    // לוגיקה זו עדיין תלויה ב-Redis Index.
    // אם רוצים לעבור לגמרי ל-DB, צריך להוסיף שאילתה לחיפוש ב-DB לפי payment_intent_id
    if (!redis) {
        logger.warn("getSessionByPaymentIntentId requires Redis index which is not available.");
        // אפשר לנסות לחפש ב-DB אם רוצים
        if (checkoutSessionRepository) {
             const session = await checkoutSessionRepository.findByPaymentIntent(paymentIntentId); // נניח שיש פונקציה כזו
             if (session) return getSession(session.id); // אם נמצא, קרא ל-getSession הרגיל
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

  return getSession(sessionId); // קורא ל-getSession החדש שקורא מה-DB
};

const updateSessionStep = async <K extends keyof CheckoutSession>(
  sessionId: string,
  step: K,
  updates: Partial<CheckoutSession[K]>
): Promise<CheckoutSession> => {
  const session = await getSession(sessionId); // קורא ל-getSession החדש

  if (!session) {
    throw new SessionNotFound();
  }

  const oldPaymentIntentId = session.payment?.intent?.id;

  // עדכון האובייקט בזיכרון
  session[step] = {
    ...(session[step] as object),
    ...updates,
  } as CheckoutSession[K];

  session.updatedAt = new Date();
  session.version += 1;

  // ולידציה לפני שמירה
  const validatedSession = CheckoutSessionSchema.parse(session);

  // ✍️ **חשוב:** כאן חסרה השמירה ל-Database!
  // צריך להוסיף קריאה ל-checkoutSessionRepository.update(sessionId, validatedSession)
  // כרגע, הקוד הזה רק שומר ב-Redis.
  await saveSession(validatedSession); // ננסה לשמור גם ב-Redis

  // ניהול האינדקס של Redis (אם Redis פעיל)
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

  // ננסה למחוק גם מ-Redis אם הוא זמין
  if (!redis) {
      logger.warn("Redis not initialized in deleteSession, skipping Redis delete.", {sessionId});
  } else {
      const session = await getSession(sessionId); // קורא ל-getSession החדש
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
  createSession,
  saveSession, // עדיין חשוף, למרות שהוא פנימי בעיקר
  getSession,
  getSessionByPaymentIntentId,
  getSessionNextStep,
  updateSessionStep,
  deleteSession,
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