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
      externalId: result.externalId.toString(),
      pricePerDay: price / numOfDays,
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
}): Promise<{ status: 'COMPLETED' | 'FAILED'; orderId?: string }> => {
  // 1. אימות שירותים חיוניים
  if (!sessionService || !orderRepository || !pubsub || !mayaAPI || !esimRepository) throw new NotInitializedError();

  const session = await sessionService.getSession(sessionId);
  if (!session) {
    logger.error(`[COMPLETE_ORDER] ❌ Session not found: ${sessionId}`);
    return { status: 'FAILED' };
  }

  logger.info(`[COMPLETE_ORDER] 🟢 Processing transaction ${easycardTransactionId}`);

  // 2. אימות העסקה מול EasyCard
  let transactionInfo;
  try {
    transactionInfo = await getTransactionStatus(easycardTransactionId);
  } catch (err: any) {
    logger.error(`[COMPLETE_ORDER] Failed to fetch transaction info: ${err.message}`);
    return { status: 'FAILED' };
  }

  const rawStatus = transactionInfo?.status || "";
  const normalizedStatus = rawStatus.toLowerCase();
  logger.info(`[COMPLETE_ORDER] 💳 EasyCard status: ${normalizedStatus}`);
 
  // 3. אם התשלום אושר או נמצא במצב המתנה לאספקה (Approved, Succeeded, AwaitingForTransmission)
  if (["approved", "succeeded", "awaitingfortransmission"].includes(normalizedStatus)) {
    try {
      logger.info(`[COMPLETE_ORDER] ✅ Payment appears successful (${rawStatus}). Creating order and fulfilling...`);

      // 3.1 בדיקת ה-UID של המוצר
      const mayaProductUid = session.bundle?.externalId; 
  
      if (!mayaProductUid) {
          logger.error(`[COMPLETE_ORDER] ❌ Missing Maya Product UID in session: ${sessionId}`);
          throw new Error("Missing Maya Product UID for fulfillment"); 
      }
      
      // 3.2 יצירת הזמנה חדשה ב-DB
      const order = await orderRepository.createFromSession(session, easycardTransactionId);

      // 3.3 עדכון ה־Session
      await sessionService.updateSessionFields(sessionId, {
        orderId: order.id,
        state: "PAYMENT_COMPLETED" as any,
      });
      await sessionService.updateSessionStep(sessionId, "payment", {
        completed: true,
      });

      // 🌟 3.4 יצירת eSIM באמצעות Maya API (FULFILLMENT)
      logger.info(`[COMPLETE_ORDER] 📞 Calling Maya to create eSIM for order ${order.id}`);

      const mayaResponse = await mayaAPI.createEsim({
        product_uid: mayaProductUid,
        quantity: 1, 
        metadata: {
          order_id: order.id, 
          session_id: sessionId,
        },
      });

      const esimDetails = mayaResponse.esims[0];

      if (!esimDetails) {
        logger.error(`[COMPLETE_ORDER] ❌ Maya did not return eSIM details for ${order.id}`);
        throw new Error("Maya API did not return eSIM details (Fulfillment failed)");
      }
      
      // 3.5 שמירת פרטי ה-eSIM ב-DB (מיפוי מדויק!)
      const userId = session.auth?.userId || null; // יקבל null אם אורח (דורש user_id nullable ב-esims!)
      const expirationDate = esimDetails.expires_at ? new Date(esimDetails.expires_at).toISOString() : null;

      const esimRecord = await esimRepository.create({
          order_id: order.id,
          user_id: userId, // 🚨 חייב להיות NULLABLE ב-DB עבור אורחים
          iccid: esimDetails.iccid,
          qr_code_url: esimDetails.activation.qr_code, // מיפוי מדויק
          smdp_address: esimDetails.activation.lpa_string, // שימוש בשדה זה עבור LPA
          activation_code: esimDetails.activation.manual_activation_code || null, // מיפוי מדויק
          status: esimDetails.status, // סטטוס ראשוני
          matching_id: esimDetails.esim_id, // מזהה ייחודי של Maya
          // created_at, assigned_date, last_action יוגדרו אוטומטית או ע"י הריפוזיטורי
      });
      
      logger.info(`[COMPLETE_ORDER] ✅ eSIM ${esimRecord.iccid} created and saved for order ${order.id}`);

      // 3.6 שלח מייל ללקוח (עם פרטי eSIM)
      try {
        const email = session.delivery?.email || session.auth?.email || "office@hiiloworld.com";
        const name =
          [session.delivery?.firstName, session.delivery?.lastName]
            .filter(Boolean)
            .join(" ") || "לקוח יקר";
        const amount = transactionInfo.totalAmount || session.pricing?.finalPrice || 0;
        
        // פרטי ההפעלה
        const qrCodeDataUrl = esimDetails.activation.qr_code;
        const lpaString = esimDetails.activation.lpa_string;
        const manualCode = esimDetails.activation.manual_activation_code;

        await postmarkClient.sendEmail({
          From: "office@hiiloworld.com",
          To: email,
          Subject: "ה-eSIM שלך מוכן! 🎉", 
          HtmlBody: `
            <h2>שלום ${name},</h2>
            <p>תודה על הרכישה!</p>
            <p>מספר הזמנה: <strong>${order.id}</strong></p>
            <hr/>
            
            <h3>✅ פרטי הפעלת eSIM:</h3>
            <p>השתמשו במידע הבא כדי להתקין את ה-eSIM שלכם:</p>
            
            <div style="text-align: center; margin: 20px 0; border: 1px solid #eee; padding: 15px;">
              <h4>קוד QR לסריקה:</h4>
              <p style="font-size: 10px; word-break: break-all;">${qrCodeDataUrl}</p> 
              <p style="font-size: 10px; margin-top: 15px;">(אם המערכת אינה מצליחה להציג את הקוד, ניתן להעתיק את המחרוזת)</p>
            </div>
            
            <p><strong>אפשרות הפעלה ידנית:</strong></p>
            <ul>
              <li><strong>כתובת SM-DP (קוד LPA):</strong> <code>${lpaString}</code></li>
              ${manualCode ? `<li><strong>קוד הפעלה ידני (Activation Code):</strong> <code>${manualCode}</code></li>` : ''}
            </ul>

            <p>צוות Hiilo 💜</p>
          `,
          TextBody: `שלום ${name}, ה-eSIM שלך מוכן. מספר הזמנה: ${order.id}. קוד QR: ${qrCodeDataUrl}`,
          MessageStream: "transactional",
        });

        logger.info(`[COMPLETE_ORDER] 📧 Confirmation email with eSIM sent to ${email}`);
      } catch (emailErr: any) {
        logger.error(`[COMPLETE_ORDER] ⚠️ Failed to send confirmation email (Fulfillment was successful): ${emailErr.message}`);
        // נמשיך הלאה כי ההזמנה וה-eSIM נוצרו
      }

      logger.info(`[COMPLETE_ORDER] ✅ Order ${order.id} created successfully and fulfilled for session ${sessionId}`);
      return { status: "COMPLETED", orderId: order.id };
    } catch (err: any) {
      logger.error(`[COMPLETE_ORDER] 💥 Fulfillment or DB Error for ${sessionId}: ${err.message}`);
      // במקרה של כשלון בשלבים 3.2-3.5:
      await sessionService.updateSessionFields(sessionId, { state: "PAYMENT_FAILED" as any });
      return { status: "FAILED" };
    }
  }

  // 4. אם לא הצליח בכלל – נרשום ככישלון
  logger.warn(`[COMPLETE_ORDER] ❌ Payment not approved (${rawStatus})`);
  await sessionService.updateSessionFields(sessionId, { state: "PAYMENT_FAILED" as any });
  return { status: "FAILED" };
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