import { GraphQLError } from "graphql";
import { createLogger } from "@hiilo/utils";
import { env } from "../../config/env";
import type { PubSubInstance } from "../../context/pubsub";
// ⚠️ פתרון עקיף: שימוש ב-any במקום לייבא CheckoutSession שחסר
import type { CheckoutSessionServiceV2 } from "./session";
import postmark from "postmark";
import fs, { stat } from "fs";
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

  logger.info("[BUNDLE] after updateSessionStep()", {
    sessionId,
    savedExternalId: next.bundle?.externalId,
  });

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
      const mayaProductUid =
        session.bundle?.externalId ||
        session.pricing?.externalId ||
        (session.pricing as any)?.calculation?.externalId ||
        null;
          
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

    const esimDetails =
  (mayaResponse as any).esim ?? mayaResponse.esims?.[0];
      if (!esimDetails) {
        logger.error(`[COMPLETE_ORDER] ❌ Maya did not return eSIM details for ${order.id}`);
        throw new Error("Maya API did not return eSIM details (Fulfillment failed)");
      }
      
      // 3.5 שמירת פרטי ה-eSIM ב-DB (מיפוי מדויק!)
      const userId = session.auth?.userId || null; // יקבל null אם אורח (דורש user_id nullable ב-esims!)
      const expirationDate = esimDetails.expires_at ? new Date(esimDetails.expires_at).toISOString() : null;

    const esimRecord = await esimRepository.create({
      order_id: order.id,
      user_id: userId, // עדיין יכול להיות NULL לאורחים
      iccid: esimDetails.iccid,
      qr_code_url: esimDetails.activation_code, // ✅ זה ה-LPA (לסריקה או שליחה למשתמש)
      smdp_address: esimDetails.smdp_address,   // ✅ כתובת ה-SM-DP+
      activation_code: esimDetails.manual_code || null, // ✅ קוד ידני אם נדרש
      status: esimDetails.service_status,       // ✅ לפי Maya זה הסטטוס המשמעותי
      matching_id: esimDetails.uid,             // ✅ מזהה ה-eSIM במערכת Maya
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
  Subject: "ה-eSIM שלך מוכן",
  HtmlBody: `
  <!DOCTYPE html>
  <html dir="rtl" lang="he">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ה-eSIM שלך מוכן</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;direction:rtl;text-align:right;">
    <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f5f5f7;padding:40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);overflow:hidden;">
            
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#008060 0%,#00B37A 100%);padding:35px 30px;text-align:center;">
                <img src="cid:logo-header.svg" alt="Hiilo logo" style="width:120px;height:auto;margin-bottom:10px;" />
                <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">ה-eSIM שלך מוכן</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:40px 30px;">
                <p style="margin:0 0 20px;font-size:18px;color:#1a1a1a;font-weight:600;">שלום ${name},</p>
                <p style="margin:0 0 12px;font-size:16px;color:#4a4a4a;">
                  צוות <strong style="color:#007A5E;">Hiilo</strong> מאחל לך חופשה לא פחות ממושלמת 🌴
                </p>
                <p style="margin:0 0 25px;font-size:14px;color:#777;">
                  מספר הזמנה:
                  <strong style="color:#007A5E;font-family:monospace;">${order.id}</strong>
                </p>

                <div style="height:2px;background:linear-gradient(to left,transparent,#00A97A,transparent);margin:30px 0;"></div>

                <!-- QR Section -->
                <div style="background:linear-gradient(135deg,#f5fff9 0%,#ffffff 100%);border-radius:12px;padding:30px;border:2px solid #c6f3e0;">
                  <h3 style="color:#007A5E;text-align:center;margin-bottom:20px;">סרוק את הקוד כדי להפעיל את ה-eSIM</h3>

                  <div style="text-align:center;">
                    <div style="border:3px solid #00A97A;border-radius:12px;padding:20px;display:inline-block;">
                      <img src="${esimDetails.activation.qr_code}" alt="QR Code" style="width:200px;height:200px;" />
                    </div>
                  </div>

                  <!-- iPhone -->
                  <div style="margin-top:25px;padding:20px;background:#f8fff9;border-radius:8px;border-right:4px solid #00A97A;text-align:center;">
                    <p style="font-size:13px;color:#333;font-weight:600;margin-bottom:8px;">משתמש ב-iPhone?</p>
                    <p style="font-size:13px;color:#555;margin:0;">תוכל ללחוץ על הכפתור הבא להפעלה ישירה:</p>
                    <div style="margin-top:16px;">
                      <a href="${esimDetails.activation.qr_code}" 
                         style="display:inline-block;background:#00A97A;color:#fff;padding:10px 22px;
                                border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">
                        הפעל את ה-eSIM
                      </a>
                    </div>
                  </div>

                  <!-- Android -->
                  <div style="margin-top:25px;padding:20px;background:#f8f8f8;border-radius:8px;border-right:4px solid #007A5E;text-align:right;">
                    <p style="font-size:13px;color:#333;font-weight:600;margin-bottom:8px;">משתמש ב-Android?</p>
                    <p style="font-size:13px;color:#555;margin-bottom:12px;">
                      כנס להגדרות > רשת ניידת > הוסף eSIM ידנית<br/>
                      והעתק את הפרטים הבאים לשדות המתאימים:
                    </p>
                    <ul style="list-style:none;padding:0;margin:0;font-size:13px;color:#444;">
                      <li><strong>כתובת SM-DP+:</strong> ${esimDetails.activation.lpa_string}</li>
                      <li><strong>קוד הפעלה (Activation Code):</strong> ${esimDetails.activation.manual_activation_code}</li>
                    </ul>
                  </div>
                </div>

                <!-- Support -->
                <div style="background:#f9f9f9;border-radius:8px;padding:20px;text-align:center;margin-top:30px;">
                  <p style="font-size:14px;color:#666;margin:0;">צריך עזרה?<br/>
                    <a href="mailto:office@hiiloworld.com" style="color:#00A97A;">office@hiiloworld.com</a>
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#fafafa;padding:30px;text-align:center;border-top:1px solid #eee;">
                <p style="margin:0;font-size:16px;color:#1a1a1a;">צוות <span style="color:#007A5E;font-weight:700;">Hiilo</span></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `,
  TextBody: `שלום ${name},

ה-eSIM שלך מוכן.

סרוק את הקוד או, אם אתה משתמש ב-iPhone, לחץ על הקישור להפעלה ישירה:
${esimDetails.activation.qr_code}

אם אתה משתמש ב-Android:
1. כנס להגדרות > רשת ניידת > הוסף eSIM ידנית
2. הזן את כתובת SM-DP+: ${esimDetails.activation.lpa_string}
3. הזן קוד הפעלה: ${esimDetails.activation.manual_activation_code}

צוות Hiilo מאחל לך חופשה לא פחות ממושלמת.`,
  MessageStream: "transactional",
  Attachments: [
    {
      Name: "logo-header.svg",
      Content: fs
        .readFileSync("../../../../../frontend/apps/web-app/public/images/logos/logo-header.svg")
        .toString("base64"),
      ContentID: "logo-header.svg",
      ContentType: "image/svg+xml",
    },
  ],
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
    status.includes("awaiting_for_transmission") ||
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