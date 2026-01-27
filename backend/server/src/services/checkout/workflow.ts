import { GraphQLError } from "graphql";
import { createLogger } from "@hiilo/utils";
import { env } from "../../config/env";
import type { PubSubInstance } from "../../context/pubsub";
// ⚠️ פתרון עקיף: שימוש ב-any במקום לייבא CheckoutSession שחסר
import type { CheckoutSessionServiceV2 } from "./session";
import postmark from "postmark";
import QRCode from "qrcode";
import fs, { stat } from "fs";
import path from "path";
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
import { getTransactionStatus, getIntentIdFromTransaction, type ITransactionStatusResponse } from "../../../../apis/easycard/src/custom-payment.service";
import type { constants } from "zlib";
import type { any } from "zod";
import { num } from "envalid";

const logger = createLogger({ component: "checkout-workflow" });

// ===========================
// Internal Global Context (נשאר כפי שהיה)
// ===========================
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

const readEmailAsset = (fileName: string) => {
  return fs.readFileSync(
    path.join(process.cwd(), "assets/email", fileName),
    "base64"
  );
};

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

  logger.info(
    `[COMPLETE_ORDER] 📝 Loaded session object:\n${JSON.stringify(session, null, 2)}`
  );

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
      const numOfEsims = session.bundle?.numOfEsims || 1;
      const createdEsims: any[] = [];

      for (let i = 0; i < numOfEsims; i++) {
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
          qr_code_url: esimDetails.qr_code_url || esimDetails.activation_code, // ✅ זה ה־LPA (לסריקה או שליחה למשתמש)
          smdp_address: esimDetails.smdp_address,   // ✅ כתובת ה־SM-DP+
          activation_code: esimDetails.activation_code || esimDetails.manual_code || null, // ✅ קוד הפעלה (לפי מאיה)
          status: esimDetails.status || esimDetails.service_status || 'ASSIGNED', // ✅ תומך גם ב-"active"
          matching_id: esimDetails.matching_id || esimDetails.uid, // ✅ מזהה ה-eSIM במערכת Maya
        });

        logger.info(`[COMPLETE_ORDER] ✅ eSIM ${esimRecord.iccid} created and saved for order ${order.id}`);
        createdEsims.push(esimDetails);
      }

      // 3.6 שלח מייל ללקוח (עם פרטי eSIM)
      try {
        const email = session.delivery?.email || session.auth?.email || "office@hiiloworld.com";
        const name =
          [session.delivery?.firstName, session.delivery?.lastName]
            .filter(Boolean)
            .join(" ") || "לקוח יקר";
        const amount = transactionInfo.totalAmount || session.pricing?.finalPrice || 0;

        // בדיקת אם המייל נגמר ב-@il.ey.com עבור לקוחות EY
        const isEYCustomer = email.toLowerCase().endsWith("@il.ey.com");
        const headerImageName = isEYCustomer ? "header_hiilo_esim_ey.png" : "header_hiilo_esim.png";
        const beachImageName = isEYCustomer ? "beach_ey.svg" : "beach.svg";

        // צבעים דינמיים: EY מקבל שחור וצהוב, רגיל מקבל כחול וירוק
        const primaryColor = isEYCustomer ? "#1a1a1a" : "#4a5be3"; // כחול → שחור
        const secondaryColor = isEYCustomer ? "#2a2a2a" : "#5565ef"; // כחול בהיר → אפור כהה
        const footerMainBg = "#1a1a1a"; // רקע footer עליון - שחור לכולם
        const footerSubBg = isEYCustomer ? "#FFD700" : "#00EBA7"; // רקע footer תחתון: צהוב לEY, ירוק לרגיל
        const activationString: any[] = [];
        const lpaString: any[] = [];
        const manualCode: any[] = [];
        const appleActivationUrl: any[] = [];
        const qrImageBase64: any[] = [];
        for (let i = 0; i < createdEsims.length; i++) {
          activationString.push(createdEsims[i].activation_code || createdEsims[i].qr_code_url);
          lpaString.push(createdEsims[i].smdp_address);
          manualCode.push(createdEsims[i].manual_code);
          qrImageBase64.push((await QRCode.toDataURL(activationString[i], { width: 250 })).replace(/^data:image\/png;base64,/, ""));
          appleActivationUrl.push(`https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${activationString[i]}`);
        }
        if (numOfEsims === 1) {
          const activationStringSingle = activationString[0];
          const lpaStringSingle = lpaString[0];
          const manualCodeSingle = manualCode[0];
          const appleActivationUrlSingle = appleActivationUrl[0];
          const qrImageBase64Single = qrImageBase64[0];
          await postmarkClient.sendEmail({
            From: "HiiloWorld office@hiiloworld.com",
            To: email,
            Subject: "ה-eSIM שלך מוכן",

            HtmlBody: `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ה-eSIM שלך מוכן</title>
</head>

<body style="margin:0; padding:0; background-color:#f5f5f7;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;
             direction:rtl; text-align:right;">

  <table role="presentation" style="width:100%; border-collapse:collapse;
         background-color:#f5f5f7; padding:40px 20px;">
    <tr>
      <td align="center">

        <table role="presentation" style="max-width:600px; width:100%;
               background:#ffffff; border-radius:16px;
               box-shadow:0 4px 20px rgba(0,0,0,0.08); overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:0; margin:0;">
              <img src="cid:header.png"
                   alt="Hiilo Header"
                   style="display:block; width:100%; height:auto;" />
            </td>
          </tr>

          <!-- Greeting Section -->
          <tr>
            <td style="background:#ffffff; padding:25px 30px 10px; margin:0;">
              <table role="presentation" style="width:100%; border-collapse:collapse;">
                <tr>

                  <!-- RIGHT — Text -->
                  <td style="width:65%; vertical-align:middle; text-align:right;">

                    <p style="margin:0; font-size:16px; color:#000; font-weight:600;">
                      שלום ${name},
                    </p>

                    <p style="margin:12px 0 0; font-size:13px; color:#000; line-height:1.6;">
                      שתהיה לך חופשה מושלמת,
                    </p>

                    <p style="margin:2px 0 0; font-size:13px; color:#000; line-height:1.6;">
                      וכמובן אם צריך אותי אני כאן!
                    </p>

                    <p style="margin:12px 0 0; font-size:12px; color:${primaryColor}; font-weight:600;">
                      - אסף, מנהל קשרי לקוחות
                    </p>

                  </td>

                  <!-- LEFT — Beach Image -->
                  <td style="width:35%; vertical-align:bottom; text-align:left;">
                    <img src="cid:beach.svg"
                         alt="Beach Illustration"
                         style="width:90%; height:auto; display:block; margin-top:35px;" />
                  </td>

                </tr>
              </table>
            </td>
          </tr>

          <!-- Order ID Box -->
          <tr>
            <td style="background:#ffffff; padding:5px 30px 20px;">
              <table role="presentation"
                     style="width:100%; background:${secondaryColor}; border-radius:10px; padding:12px 18px;">
                <tr>
                  <td style="text-align:center;">
                    <span style="color:#ffffff; font-size:14px; font-weight:600;
                                 white-space:nowrap; display:inline-block;">
                      מספר ההזמנה שלך: ${order.id}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- QR BOX -->
          <tr>
            <td style="padding:0 30px 30px; text-align:center;">
              <table role="presentation"
                     style="width:100%; max-width:300px; margin:0 auto;
                            background:#e3e8fb; border:2px solid #b8c1e8;
                            border-radius:16px; padding:30px;">
                <tr>
                  <td style="text-align:center;">
                    <img src="cid:qrcode.png"
                         alt="QR Code"
                         style="width:200px; height:200px; display:block; margin:0 auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- iPhone Installation -->
          <tr>
            <td style="padding:0 30px 20px;">

              <table role="presentation" style="
                width:100%;
                background:#f1f4f9;
                border-radius:16px;
                padding:24px 18px;
                text-align:center;
                margin-bottom:20px;
              ">
                <tr>
                  <td style="font-size:16px; font-weight:700; color:#4a5be3; padding-bottom:16px;">
                    להתקנה בקליק ב-iPhone
                  </td>
                </tr>

                <tr>
                  <td>
                    <table role="presentation" style="
                      width:100%;
                      max-width:480px;
                      background:white;
                      border-radius:14px;
                      padding:20px;
                      margin:0 auto;
                    ">
                      <tr>
                        <td style="text-align:center;">

                          <a href="${appleActivationUrlSingle}"
                             style="
                               display:inline-flex;
                               align-items:center;
                               gap:6px;
                               padding:12px 28px;
                               border-radius:10px;
                               border:2px solid #4a5be3;
                               text-decoration:none;
                               font-size:16px;
                               font-weight:700;
                               color:#0a0a0a;
                               white-space:nowrap;
                             ">
                             הפעילו את ה-eSIM בלחיצה כאן
                          </a>

                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Android Installation -->
          <tr>
            <td style="padding:0 30px 20px;">

              <table role="presentation" style="
                width:100%;
                background:#f1f4f9;
                border-radius:16px;
                padding:24px 18px;
                text-align:center;
              ">

                <!-- Blue title -->
                <tr>
                  <td style="
                    font-size:16px;
                    font-weight:700;
                    color:#4a5be3;
                    padding-bottom:20px;
                    text-align:center;
                  ">
                    להתקנה ידנית ב-Android עקבו אחר ההוראות:
                  </td>
                </tr>

                <!-- Inner white card -->
                <tr>
                  <td>
                    <table role="presentation" style="
                      width:100%;
                      max-width:520px;
                      background:white;
                      border-radius:14px;
                      padding:26px 22px;
                      margin:0 auto;
                      text-align:right;
                    ">

                      <tr>
                        <td style="
                          font-size:16px;
                          font-weight:700;
                          color:#000;
                          padding-bottom:6px;
                        ">
                          אם יש לכם Android
                        </td>
                      </tr>

                      <tr>
                        <td style="
                          font-size:14px;
                          color:#000;
                          line-height:1.6;
                        ">
                          כנסו להגדרות &gt; רשת ניידת &gt; הוסף eSIM ידנית
                        </td>
                      </tr>

                      <tr>
                        <td style="
                          font-size:14px;
                          color:#4a5be3;
                          font-weight:700;
                          padding-top:8px;
                        ">
                          נכנסתם? מעולה!
                        </td>
                      </tr>

                      <tr>
                        <td style="
                          font-size:14px;
                          color:#000;
                          padding:6px 0 16px;
                        ">
                          העתיקו את הפרטים הבאים במדויק:
                        </td>
                      </tr>

                      <!-- SM-DP+ + Activation Code Table -->
                      <table role="presentation" style="width:100%; border-collapse:collapse; margin-top:4px;">

                        <tr>
                          <td style="
                            font-size:14px;
                            font-weight:700;
                            color:#000;
                            padding:8px 0;
                            text-align:right;
                            white-space:nowrap;
                            width:1%;
                          ">
                            כתובת SM-DP+:
                          </td>

                          <td style="padding:8px 0; text-align:right; width:220px;">
                            <div style="
                              background:#f5f7fb;
                              border:1px solid #e0e4ef;
                              border-radius:10px;
                              padding:8px 10px;
                              font-size:12px;
                              color:#000;
                              white-space:nowrap;
                              text-align:center;
                              width:100%;
                              display:block;
                            ">
                              ${lpaStringSingle}
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td style="
                            font-size:14px;
                            font-weight:700;
                            color:#000;
                            padding:8px 0;
                            text-align:right;
                            white-space:nowrap;
                            width:1%;
                          ">
                            קוד הפעלה:
                          </td>

                          <td style="padding:8px 0; text-align:right; width:220px;">
                            <div style="
                              background:#f5f7fb;
                              border:1px solid #e0e4ef;
                              border-radius:10px;
                              padding:8px 10px;
                              font-size:12px;
                              color:#000;
                              white-space:nowrap;
                              text-align:center;
                              width:100%;
                              display:block;
                            ">
                              ${manualCodeSingle}
                            </div>
                          </td>
                        </tr>

                      </table>

                    </table>
                  </td>
                </tr>

              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0; margin:0;">

              <table role="presentation" style="
                width:100%;
                background:${footerMainBg};
                border-radius:20px 20px 0 0;
                padding:32px 20px 40px;
                text-align:center;
              ">
                <tr>
                  <td style="font-size:20px; font-weight:700; color:#ffffff; padding-bottom:6px;">
                    עדיין צריכים עזרה?
                  </td>
                </tr>

                <tr>
                  <td style="font-size:14px; color:#ffffff; padding-bottom:20px;">
                    לשליחת הודעת וואטסאפ לשירות הלקוחות
                  </td>
                </tr>

                <tr>
                  <td>
                    <a href="https://wa.me/972559965794"
                       style="
                         display:inline-flex;
                         align-items:center;
                         justify-content:center;
                         gap:8px;
                         background:#ffffff;
                         color:#000000;
                         padding:10px 22px;
                         border-radius:10px;
                         text-decoration:none;
                         font-size:15px;
                         font-weight:600;
                       ">
                      לשליחת הודעה
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" style="
                width:100%;
                background:${footerSubBg};
                border-top:1px solid ${footerMainBg};
                padding:20px 10px;
                text-align:center;
              ">
                <tr>
                  <td style="font-size:15px; color:#000; font-weight:600;">
                    נשמח שתשלחו לנו משוב: 
                    <a href="mailto:office@hiiloworld.com"
                       style="color:#1a73e8; text-decoration:underline;">
                      office@hiiloworld.com
                    </a>
                  </td>
                </tr>
              </table>

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

סרוק את הקוד המצורף או, אם אתה משתמש ב-iPhone,
הפעל ישירות מהקישור הבא: ${activationStringSingle}

אם אתה משתמש ב-Android:
1. כנס להגדרות › רשת ניידת › הוסף eSIM ידנית
2. הזן כתובת SM-DP+: ${lpaStringSingle}
3. הזן קוד הפעלה: ${manualCodeSingle}

צוות Hiilo מאחל לך חופשה מושלמת.`,

            MessageStream: "transactional",

            Attachments: [
              {
                Name: headerImageName,
                Content: readEmailAsset(headerImageName),
                ContentID: "header.png",
                ContentType: "image/png",
              },
              {
                Name: beachImageName,
                Content: readEmailAsset(beachImageName),
                ContentID: "beach.svg",
                ContentType: "image/svg+xml",
              },
              {
                Name: "qrcode.png",
                Content: qrImageBase64Single,
                ContentID: "qrcode.png",
                ContentType: "image/png",
              },
              {
                Name: "how-to-install.pdf",
                Content: readEmailAsset("guide.pdf"),
                ContentID: "how-to-install.pdf",
                ContentType: "application/pdf",
              },
            ],
          });
        }
        else {
          let whatsappMessageText = "";

          for (let i = 0; i < createdEsims.length; i++) {
            whatsappMessageText += `
# eSIM ${i + 1}:

קישור התקנה לאייפון:
${appleActivationUrl[i]}

התקנה ידנית לאנדרואיד:
כתובת SM-DP+: ${lpaString[i]}
קוד הפעלה: ${manualCode[i]}

`;
          }

          const whatsappEncoded = encodeURIComponent(whatsappMessageText.trim());
          const whatsappUrl = `https://wa.me/?text=${whatsappEncoded}`;

          await postmarkClient.sendEmail({
            From: "HiiloWorld office@hiiloworld.com",
            To: email,
            Subject: "ה-eSIMים שלך מוכנים",

            HtmlBody: `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ה-eSIMים שלך מוכנים</title>
</head>

<body style="margin:0; padding:0; background-color:#f5f5f7;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;
             direction:rtl; text-align:right;">

  <table role="presentation" style="width:100%; border-collapse:collapse;
         background-color:#f5f5f7; padding:40px 20px;">
    <tr>
      <td align="center">

        <table role="presentation" style="max-width:600px; width:100%;
               background:#ffffff; border-radius:16px;
               box-shadow:0 4px 20px rgba(0,0,0,0.08); overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:0; margin:0;">
              <img src="cid:header.png"
                   alt="Hiilo Header"
                   style="display:block; width:100%; height:auto;" />
            </td>
          </tr>

          <!-- Greeting Section -->
          <tr>
            <td style="background:#ffffff; padding:25px 30px 10px; margin:0;">
              <table role="presentation" style="width:100%; border-collapse:collapse;">
                <tr>

                  <!-- RIGHT — Text -->
                  <td style="width:65%; vertical-align:middle; text-align:right;">

                    <p style="margin:0; font-size:16px; color:#000; font-weight:600;">
                      שלום ${name},
                    </p>

                    <p style="margin:12px 0 0; font-size:13px; color:#000; line-height:1.6;">
                      שתהיה לך חופשה מושלמת,
                    </p>

                    <p style="margin:2px 0 0; font-size:13px; color:#000; line-height:1.6;">
                      וכמובן אם צריך אותי אני כאן!
                    </p>

                    <p style="margin:12px 0 0; font-size:12px; color:${primaryColor}; font-weight:600;">
                      - אסף, מנהל קשרי לקוחות
                    </p>

                  </td>

                  <!-- LEFT — Beach Image -->
                  <td style="width:35%; vertical-align:bottom; text-align:left;">
                    <img src="cid:beach.svg"
                         alt="Beach Illustration"
                         style="width:90%; height:auto; display:block; margin-top:35px;" />
                  </td>

                </tr>
              </table>
            </td>
          </tr>

          <!-- Order ID Box -->
          <tr>
            <td style="background:#ffffff; padding:5px 30px 20px;">
              <table role="presentation"
                     style="width:100%; background:${secondaryColor}; border-radius:10px; padding:12px 18px;">
                <tr>
                  <td style="text-align:center;">
                    <span style="color:#ffffff; font-size:14px; font-weight:600;
                                 white-space:nowrap; display:inline-block;">
                      מספר ההזמנה שלך: ${order.id}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- WhatsApp Button -->
          <tr>
            <td style="padding:0 30px 40px; text-align:center;">

              <a href="${whatsappUrl}"
                style="
                  display:block;
                  margin:25px auto 0;
                  width:100%;
                  max-width:400px;
                  padding:14px 26px;
                  background:#ffffff;
                  border:2px solid #000000;
                  border-radius:12px;
                  text-align:center;
                  font-size:17px;
                  font-weight:700;
                  color:#000000;
                  text-decoration:none;
                ">
                שליחת פרטי התקנה בוואטסאפ
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0; margin:0;">

              <table role="presentation" style="
                width:100%;
                background:${footerMainBg};
                border-radius:20px 20px 0 0;
                padding:32px 20px 40px;
                text-align:center;
              ">
                <tr>
                  <td style="font-size:20px; font-weight:700; color:#FFFFFF; padding-bottom:6px;">
                    עדיין צריכים עזרה?
                  </td>
                </tr>

                <tr>
                  <td style="font-size:14px; color:#FFFFFF; padding-bottom:20px;">
                    לשליחת הודעת וואטסאפ לשירות הלקוחות
                  </td>
                </tr>

                <tr>
                  <td>
                    <a href="https://wa.me/972559965794"
                       style="
                         display:inline-flex;
                         align-items:center;
                         gap:8px;
                         background:#ffffff;
                         color:#000000;
                         padding:10px 22px;
                         border-radius:10px;
                         text-decoration:none;
                         font-size:15px;
                         font-weight:600;
                       ">
                      לשליחת הודעה
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" style="
                width:100%;
                background:${footerSubBg};
                border-top:1px solid ${footerMainBg};
                padding:20px 10px;
                text-align:center;
              ">
                <tr>
                  <td style="font-size:15px; color:#000; font-weight:600;">
                    נשמח שתשלחו לנו משוב: 
                    <a href="mailto:office@hiiloworld.com"
                       style="color:#1a73e8; text-decoration:underline;">
                      office@hiiloworld.com
                    </a>
                  </td>
                </tr>
              </table>

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

אפשר לקבל את כל פרטי ההתקנה בוואטסאפ בקישור הבא:
${whatsappUrl}

צוות Hiilo מאחל לך חופשה מושלמת.`,

            MessageStream: "transactional",

            Attachments: [
              {
                Name: headerImageName,
                Content: readEmailAsset(headerImageName),
                ContentID: "header.png",
                ContentType: "image/png",
              },
              {
                Name: beachImageName,
                Content: readEmailAsset(beachImageName),
                ContentID: "beach.svg",
                ContentType: "image/svg+xml",
              },
              {
                Name: "how-to-install.pdf",
                Content: readEmailAsset("guide.pdf"),
                ContentID: "how-to-install.pdf",
                ContentType: "application/pdf",
              },
            ],
          });
        }


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