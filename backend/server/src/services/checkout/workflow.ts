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
import { getTransactionStatus,getIntentIdFromTransaction, type ITransactionStatusResponse } from "../../../../apis/easycard/src/custom-payment.service"; 

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
        
    if (!['Approved', 'Succeeded', 'awaitingfortransmission'].includes(easycardStatus.status)) {
      logger.warn(`[COMPLETE_ORDER] Payment not approved: ${easycardStatus.status}`);
      await sessionService.updateSessionFields(sessionId, { state: 'PAYMENT_FAILED' as any });
      await sessionService.updateSessionStep(sessionId, "payment", { completed: true });
      return { status: 'FAILED' };
    }
    } catch (err: any) {
        logger.error(`[COMPLETE_ORDER] Easycard verification failed for ${easycardTransactionId}: ${err.message}`);
        return { status: 'PENDING' }; 
    }

    try {
        logger.info(`[COMPLETE_ORDER] 🟢 calling createFromSession for session ${sessionId}`);
        if(orderRepository === null){
          logger.error(`[COMPLETE_ORDER] orderRepository is null!`);
        }
        const order = await orderRepository?.createFromSession(session, easycardTransactionId);
        logger.info(`[COMPLETE_ORDER] 🟢 order response: ${JSON.stringify(order, null, 2)}`);
       
        await sessionService.updateSessionFields(sessionId, {
            orderId: order?.id,
            state: 'PAYMENT_COMPLETED' as any 
        });
        
        // 5. עדכון שלב התשלום (רק completed)
        const completedSession = await sessionService.updateSessionStep(sessionId, "payment", {
            completed: true, 
            // אין צורך ב-status, הוא עודכן למעלה
        });


        // 6. נשגר עדכון ל-Frontend (דרך PubSub)
        // publish(pubsub)(sessionId, { ...completedSession, isComplete: true }); 

        logger.info(`[COMPLETE_ORDER] Order ${order?.id} created successfully for session ${sessionId}`);
        return { status: 'COMPLETED', orderId: order?.id };

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

  console.log(`[REDIRECT_CB] Processing transaction ${easycardTransactionId}`);

  // ----------------------------------------------------
  // 1️⃣ שולפים את פרטי העסקה מ-EasyCard
  // ----------------------------------------------------
  const transactionInfo = await getTransactionStatus(easycardTransactionId);
  console.log(`[REDIRECT_CB] Transaction info received.`);

  // ----------------------------------------------------
  // 2️⃣ מוציאים את ה-paymentIntentID מתוך הנתונים
  // ----------------------------------------------------
  const intentId =
    transactionInfo?.paymentIntentID ||
    (transactionInfo as any)?.PaymentIntentID ||
    (transactionInfo as any)?.payment_intent_id ||
    null;

  console.log(`[REDIRECT_CB] Extracted paymentIntentID: ${intentId}`);

  if (!intentId) {
    throw new GraphQLError("Missing paymentIntentID in Easycard transaction response", {
      extensions: { code: "MISSING_INTENT_ID" },
    });
  }

  // ----------------------------------------------------
  // 3️⃣ מחפשים במסד לפי ה-paymentIntentID
  // ----------------------------------------------------
  const session = await sessionService.getSessionByPaymentIntentId(intentId);
  if (!session) {
    logger.error(`[REDIRECT_CB] No session found for paymentIntentID: ${intentId}`);
    throw new GraphQLError("Session not found for this payment.", {
      extensions: { code: "SESSION_NOT_FOUND" },
    });
  }

  console.log(`[REDIRECT_CB] Matched Transaction ${easycardTransactionId} → Intent ${intentId}`);

  // ----------------------------------------------------
  // 4️⃣ בודקים אם העסקה אושרה
  // ----------------------------------------------------
  const resultCode = transactionInfo.processorResultCode;
  const status = transactionInfo.status?.toLowerCase() || "";
  const isApproved =
    resultCode === 0 ||
    status.includes("approve") ||
    status.includes("success") ||
    status.includes("succeeded");

  console.log(`[REDIRECT_CB] Transaction status: ${status} (resultCode=${resultCode})`);

  if (!isApproved) {
    throw new GraphQLError("Payment is pending or failed.", {
      extensions: { code: "PAYMENT_PENDING" },
    });
  }

  // ----------------------------------------------------
  // 5️⃣ סוגרים את ההזמנה
  // ----------------------------------------------------
  const sessionId = session.id;
  const result = await completeOrder({ sessionId, easycardTransactionId });

  // ----------------------------------------------------
  // 6️⃣ שולחים מייל ללקוח
  // ----------------------------------------------------
  if (result.status === "COMPLETED") {
    try {
      const customerEmail =
        session.delivery?.email || session.auth?.email || "office@hiiloworld.com";
      const customerName =
        [session.auth?.firstName, session.auth?.lastName].filter(Boolean).join(" ") || "לקוח יקר";
      const amount = transactionInfo.totalAmount || session.bundle?.price || 0;

      await postmarkClient.sendEmail({
        From: "office@hiiloworld.com",
        To: customerEmail,
        Subject: "התשלום שלך אושר 🎉",
        HtmlBody: `
          <h2>שלום ${customerName},</h2>
          <p>תודה על הרכישה שלך!</p>
          <p>התשלום על סך <strong>${amount} ₪</strong> אושר בהצלחה.</p>
          <p>מספר הזמנה: <strong>${result.orderId}</strong></p>
          <br/>
          <p>צוות Hiilo 💜</p>
        `,
        TextBody: `שלום ${customerName}, התשלום שלך על סך ${amount} ש"ח אושר בהצלחה. מספר הזמנה: ${result.orderId}`,
        MessageStream: "transactional",
      });

      console.log(`📧 Email sent successfully to ${customerEmail}`);
    } catch (emailErr: any) {
      logger.error("[REDIRECT_CB] Failed to send email:", emailErr.message);
    }
  }

  // ----------------------------------------------------
  // 7️⃣ מחזירים תשובה סופית
  // ----------------------------------------------------
  return { success: true, sessionId, orderId: result.orderId };
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