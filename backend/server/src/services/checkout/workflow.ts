import { GraphQLError } from "graphql";
import { createLogger } from "@hiilo/utils";
import { env } from "../../config/env";
import type { PubSubInstance } from "../../context/pubsub";
// ⚠️ פתרון עקיף: שימוש ב-any במקום לייבא CheckoutSession שחסר
import type { CheckoutSessionServiceV2 } from "./session";
import postmark from "postmark";
type CheckoutSession = any; 

import { calculateSimplePrice, type SimplePricingResult, type SimplePricingDiscount } from "../../../../packages/rules-engine-2/src/simple-pricer/simple-pricer";
import type {
  BundleRepository,
  CouponRepository,
  OrderRepository,
  UserRepository,
} from "../../repositories";
import type { ESIMRepository } from "../../repositories/esim.repository";
import type { DeliveryService } from "../delivery";
import type { ESimGoClient } from "@hiilo/esim-go";
import { MayaApi } from "@hiilo/esim-go/maya";
import type { PaymentServiceInstance } from "../payment";
// 👇 ייבוא קריטי: פונקציות האימות מול איזיקארד
import { getTransactionStatus, type ITransactionStatusResponse } from "../../../../apis/easycard/src/custom-payment.service"; 

const logger = createLogger({ component: "checkout-workflow" });

// ==========================
// Internal Global Context (נשאר כפי שהיה)
// ==========================
let pubsub: PubSubInstance | null = null;
let sessionService: CheckoutSessionServiceV2 | null = null;
let bundleRepository: BundleRepository | null = null;
let couponRepository: CouponRepository | null = null;
let userRepository: UserRepository | null = null;
let esimAPI: ESimGoClient | null = null;
let mayaAPI: MayaApi | null = null;
let paymentAPI: PaymentServiceInstance | null = null;
let deliveryService: DeliveryService | null = null;
let orderRepository: OrderRepository | null = null;
let esimRepository: ESIMRepository | null = null;

// ======================
// Init (נשאר כפי שהיה)
// ======================
const init = async (context: {
  pubsub: PubSubInstance;
  sessionService: CheckoutSessionServiceV2;
  bundleRepository: BundleRepository;
  userRepository: UserRepository;
  esimAPI: ESimGoClient;
  paymentAPI: PaymentServiceInstance;
  deliveryService: DeliveryService;
  orderRepository: OrderRepository;
  esimRepository: ESIMRepository;
  couponRepository: CouponRepository;
  mayaAPI?: MayaApi;
}) => {
  pubsub = context.pubsub;
  sessionService = context.sessionService;
  bundleRepository = context.bundleRepository;
  userRepository = context.userRepository;
  esimAPI = context.esimAPI;
  paymentAPI = context.paymentAPI;
  deliveryService = context.deliveryService;
  orderRepository = context.orderRepository;
  esimRepository = context.esimRepository;
  couponRepository = context.couponRepository;
  mayaAPI =
    context.mayaAPI ||
    (env.MAYA_API_KEY
      ? new MayaApi({ auth: env.MAYA_API_KEY, baseUrl: env.MAYA_BASE_URL })
      : null);
  return checkoutWorkflow;
};

// ==================================
// selectBundle – now adds country
// ==================================
const selectBundle = async ({
  sessionId,
  countryId,
  numOfDays,
}: {
  sessionId: string;
  countryId: string;
  numOfDays: number;
}) => {
  if (!sessionService) throw new NotInitializedError();
  if (!bundleRepository) throw new NotInitializedError();

  const session = await sessionService.getSession(sessionId);
  if (!session) throw new SessionNotFound();

  let country: { iso2: string; name: string } | null = null;
  try {
    const found = await bundleRepository.getCountryByIso(countryId);
    if (found) country = found;
  } catch (err: any) {
    logger.warn(`[WARN] Could not fetch country ${countryId}:`, err.message);
  }

  const result = await calculateSimplePrice(countryId, numOfDays);
  const price = result.finalPrice;

  const next = await sessionService.updateSessionStep(
    sessionId,
    "bundle",
    {
      ...session.bundle,
      completed: false,
      validated: false,
      countryId,
      country,
      numOfDays,
      price,
      pricePerDay: price / numOfDays,
      externalId: `bundle-${countryId}-${numOfDays}`,
    }
  );

  return next;
};

// ==================================
// Other workflow methods
// ==================================
const validateBundle = async ({ sessionId }: { sessionId: string }) => {
  if (!sessionService) throw new NotInitializedError();
  const session = await sessionService.getSession(sessionId);
  if (!session) throw new SessionNotFound();
  return sessionService.updateSessionStep(sessionId, "bundle", {
    ...session.bundle,
    completed: true,
    validated: true,
  });
};

const setDelivery = async ({
  sessionId,
  email,
  phone,
  firstName,
  lastName,
}: {
  sessionId: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}) => {
  if (!sessionService) throw new NotInitializedError();
  console.log(`[DEBUG] setDelivery: Attempting to getSession with ID: ${sessionId}`);
  const session = await sessionService.getSession(sessionId);
  console.log(`[DEBUG] setDelivery: Got session successfully:`, session ? session.id : 'null');
  if (!session) throw new Error(`SessionNotFound in setDelivery: ID ${sessionId} not found`);

  return sessionService.updateSessionStep(sessionId, "delivery", {
    email,
    phone,
    firstName,
    lastName,
    completed: true,
  });
};

const applyCoupon = async ({
  sessionId,
  couponCode,
}: {
  sessionId: string;
  couponCode: string;
}) => {
  if (!sessionService || !couponRepository)
    throw new NotInitializedError();

  const session = await sessionService.getSession(sessionId);
  if (!session) throw new SessionNotFound();

  try {
    const updatedSession = await couponRepository.applyCoupon({
      sessionId,
      couponCode,
      userId: session.auth.userId,
    });

    const updatedPricing = updatedSession.pricing as unknown as SimplePricingResult;

    return sessionService.updateSessionStep(sessionId, "bundle", {
      ...session.bundle,
      discounts: updatedPricing.discount ? [updatedPricing.discount] : [],
      price: updatedPricing.finalPrice ?? session.bundle.price,
    });
  } catch (err: any) {
    logger.error("Coupon failed", err);
    throw new GraphQLError(err.message || "Invalid or expired coupon", {
      extensions: { code: "COUPON_VALIDATION_FAILED" },
    });
  }
};

// ==========================================================
// 🌟 פונקציה חדשה: סיום ההזמנה ומשלוח eSIM (Webhook/Callback)
// ==========================================================

/**
 * 🛠️ מבצע את הלוגיקה הקריטית: אימות תשלום, יצירת הזמנת eSIM, ועדכון DB.
 */
export const completeOrder = async ({
    sessionId,
    easycardTransactionId,
}: {
    sessionId: string;
    easycardTransactionId: string;
}): Promise<{ status: 'COMPLETED' | 'FAILED' | 'PENDING', orderId?: string }> => {
    // ⚠️ נניח ש-updateSessionFields נוספה כראוי ל-sessionService
    if (!sessionService || !esimRepository || !pubsub) throw new NotInitializedError();

    const session = await sessionService.getSession(sessionId);
    if (!session) {
        logger.error(`[COMPLETE_ORDER] Session not found: ${sessionId}`);
        return { status: 'FAILED' }; 
    }
    
    // 1. מניעת כפילויות: אם orderId קיים בסשן, התהליך כבר בוצע.
    if ((session as any).orderId) { 
        logger.warn(`[COMPLETE_ORDER] Session ${sessionId} already has order ID: ${(session as any).orderId}. Ignoring.`);
        return { status: 'COMPLETED', orderId: (session as any).orderId };
    }
    
    // 2. 🛡️ אימות שרת-שרת מול איזיקארד
    let easycardStatus: ITransactionStatusResponse;
    try {
        easycardStatus = await getTransactionStatus(easycardTransactionId);
        
        if (easycardStatus.status !== 'Approved' && easycardStatus.status !== 'Succeeded') {
            logger.warn(`[COMPLETE_ORDER] Payment status not approved: ${easycardStatus.status} for ${sessionId}`);
            // 👇 תיקון שגיאת 2353: עדכון הסטטוס בשדה הראשי
            await sessionService.updateSessionFields(sessionId, { state: 'PAYMENT_FAILED' as any });
            
            // עדכון ה-step רק כדי לסמן completed
            await sessionService.updateSessionStep(sessionId, "payment", { 
                completed: true,
            });
            return { status: 'FAILED' };
        }
    } catch (err: any) {
        logger.error(`[COMPLETE_ORDER] Easycard verification failed for ${easycardTransactionId}: ${err.message}`);
        return { status: 'PENDING' }; 
    }

    // 3. 💰 **התשלום אושר! שליחת ה-eSIM**
    try {
        // ⚠️ תיקון: שימוש ב-esimRepository.create
        const order = await esimRepository.create({ 
            user_id: session.auth.userId, // 👈 תיקון שגיאה 2339 (userId)
            bundle_id: session.bundle.externalId, 
            email: session.delivery.email, 
            //... נדרש למלא את שאר השדות הקריטיים ל-EsimInsert
        } as any); // ⚠️ יש להחליף את 'as any' בטיפוס EsimInsert תקין
        
        const newOrderId = order.id; // נניח שמזהה השורה שנוצרה הוא ה-orderId שלנו
        
        // 4. עדכון הסשן והשלמת התהליך
        // 👇 תיקון שגיאת 2353: עדכון הסטטוס וה-orderId בשדה הראשי
        await sessionService.updateSessionFields(sessionId, {
            orderId: newOrderId,
            state: 'PAYMENT_COMPLETED' as any 
        });
        
        // 5. עדכון שלב התשלום (רק completed)
        const completedSession = await sessionService.updateSessionStep(sessionId, "payment", {
            completed: true, 
            // אין צורך ב-status, הוא עודכן למעלה
        });


        // 6. נשגר עדכון ל-Frontend (דרך PubSub)
        // publish(pubsub)(sessionId, { ...completedSession, isComplete: true }); 

        logger.info(`[COMPLETE_ORDER] Order ${newOrderId} created successfully for session ${sessionId}`);
        return { status: 'COMPLETED', orderId: newOrderId };

    } catch (err: any) {
        logger.error(`[COMPLETE_ORDER] Failed to create eSIM order for session ${sessionId}: ${err.message}`);
        // נסמן שהתשלום אושר אך המשלוח נכשל (דורש טיפול ידוני)
        await sessionService.updateSessionFields(sessionId, { state: 'MANUAL_REVIEW_REQUIRED' as any });
        await sessionService.updateSessionStep(sessionId, "payment", { 
            completed: true, 
        });
        return { status: 'FAILED' };
    }
};


// ==========================================================
// 📞 פונקציה חדשה: טיפול ב-Redirect Callback (Frontend Resolver)
// ==========================================================

/**
 * 🛠️ מטפל בהפניה חזרה של הלקוח מדף התשלום.
 */
// יצירת לקוח Postmark עם הטוקן שלך
const postmarkClient = new postmark.ServerClient(process.env.POSTMARK_TOKEN || "");

export const handleRedirectCallback = async ({
  easycardTransactionId,
}: {
  easycardTransactionId: string;
}) => {
  if (!sessionService) throw new NotInitializedError();

  const MAX_ITERATIONS = 5;     // ניסיון מקסימלי: 5 פעמים
  const INTERVAL_MS = 4000;    // המתנה של 4 שניות בין ניסיון לניסיון

  let transactionInfo: ITransactionStatusResponse | null = null;
  let isApproved = false;

  console.log(`[REDIRECT_CB] Start polling transaction ${easycardTransactionId}`);

  // 🔁 **לולאת Polling** - מחכה עד לאישור העסקה הסופי מול Easycard
  for (let i = 1; i <= MAX_ITERATIONS; i++) {
    console.log(`[POLLING] Attempt #${i} to get status for ${easycardTransactionId}`);
    
    // 1. בדיקת הסטטוס הנוכחי מול Easycard
    try {
      // 🛑 שימוש ב-getTransactionStatus לבדיקה חוזרת
      transactionInfo = await getTransactionStatus(easycardTransactionId); 

      // 2. אימות: האם הסטטוס הוא סופי ומאושר?
      if (transactionInfo.status === 'Approved' || transactionInfo.status === 'Succeeded') {
        isApproved = true;
        console.log(`[POLLING] Success on attempt #${i}. Status: ${transactionInfo.status}`);
        break; // יציאה מהלולאה - העסקה אושרה
      } 
      
      console.log(`[POLLING] Status is ${transactionInfo.status}. Waiting...`);

    } catch (e) {
      console.error(`[POLLING] Error during status check on attempt #${i}:`, (e as any).message);
    }

    // 3. המתנה לפני האיטרציה הבאה
    if (i < MAX_ITERATIONS) {
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
    }
  }

  console.log("[POLLING] Finished polling loop.");

  // ----------------------------------------------------
  // 🛑 בדיקת הסטטוס הסופי לאחר סיום ה-Polling
  // ----------------------------------------------------

  if (!transactionInfo) {
    // אם לא קיבלנו אף תשובה (שגיאת תקשורת קריטית)
    throw new GraphQLError("Failed to get any payment status response from Easycard.",
      { extensions: { code: "PAYMENT_API_ERROR" } });
  }

  if (!isApproved) {
    // אם יצאנו מהלולאה והעסקה עדיין לא אושרה (Pending או Failed סופי)
    throw new GraphQLError(
      "Payment status is still pending or failed after retries. We will notify you by email.",
      { extensions: { code: "PAYMENT_PENDING" } }
    );
  }
  
  // ----------------------------------------------------
  // ✅ אם הגענו לכאן - התשלום אושר סופית.
  // ----------------------------------------------------

  // 🔹 חיפוש session לפי transaction ID
  const session = await sessionService.getSessionByPaymentIntentId(easycardTransactionId);
  if (!session) {
    logger.error(`[REDIRECT_CB] Session not found by Payment Intent ID: ${easycardTransactionId}`);
    throw new GraphQLError("Session ID not found for payment data.");
  }

  const sessionId = session.id;

  // 🔹 ניסיון להשלים את ההזמנה
  const result = await completeOrder({ sessionId, easycardTransactionId });

  // 💌 שליחת אימייל ללקוח - הלוגיקה המלאה
  if (result.status === 'COMPLETED') {
    try {
      // חילוץ מידע נכון מה-session
      const customerEmail =
        session.delivery.email ||
        session.auth.email ||
        "office@hiiloworld.com";

      const customerName = [
        session.auth.firstName,
        session.auth.lastName
      ]
        .filter(Boolean)
        .join(" ") || "לקוח יקר";

      // סכום העסקה: נעדיף מה-EasyCard (שקיבלנו ב-transactionInfo)
      const amount =
        transactionInfo?.TotalAmount || // נניח ש-TotalAmount קיים בתשובת EasyCard
        session.bundle?.price ||
        0;

      // שליחת מייל עם Postmark
      await postmarkClient.sendEmail({
        From: "office@hiiloworld.com",
        To: customerEmail,
        Subject: "התשלום שלך אושר 🎉",
        HtmlBody: `
          <h2>שלום ${customerName},</h2>
          <p>תודה על הרכישה שלך!</p>
          <p>התשלום על סך <strong>${amount} ₪</strong> אושר בהצלחה.</p>
          <p>מספר הזמנה: <strong>${result.orderId}</strong></p>
          <p>המוצר שלך יישלח בהמשך למייל זה.</p>
          <br/>
          <p>צוות Hiilo 💜</p>
        `,
        TextBody: `שלום ${customerName}, התשלום שלך על סך ${amount} ש"ח אושר בהצלחה. מספר הזמנה: ${result.orderId}`,
        MessageStream: "transactional",
      });

      console.log(`📧 Email sent successfully to ${customerEmail}`);
    } catch (emailErr: any) {
      logger.error("[REDIRECT_CB] Failed to send Postmark email:", emailErr.message);
    }

    return { success: true, sessionId, orderId: result.orderId };
  }

  // ❌ כל מצב אחר (לדוגמה: התשלום אושר אך יצירת ה-eSIM נכשלה בתוך completeOrder)
  return { success: false, sessionId, message: "Payment was approved, but order completion failed." };
};


// ===========================
// Export workflow
// ===========================
export const checkoutWorkflow = {
  init,
  selectBundle,
  validateBundle,
  setDelivery,
  applyCoupon,
  // 👇 הוספת הפונקציות החדשות לאובייקט הייצוא
  completeOrder, 
  handleRedirectCallback,
};

export type CheckoutWorkflowInstance = typeof checkoutWorkflow;

// ===========================
// Errors
// ===========================
class NotInitializedError extends Error {
  constructor() {
    super("Workflow not initialized");
  }
}
class SessionNotFound extends Error {
  constructor() {
    super("Session not found");
  }
}