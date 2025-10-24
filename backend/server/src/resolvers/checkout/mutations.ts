import { GraphQLError } from "graphql";
import type { Context } from "../../context/types";
import { logger } from "../../lib/logger";
import type {
  Country,
  MutationApplyCouponToCheckoutArgs,
  MutationResolvers,
  PaymentIntent,
  CheckoutPayment,
  MutationTriggerCheckoutPaymentArgs,
} from "../../types";
import { publish } from "./subscriptions";
import { validateApplyCouponInput, /* הוסף ייבוא לפונקציית ולידציה אם יש */ } from "./validators";
import { formatSessionForGraphQL } from "./helpers";
import { CurrencyEnum, type PaymentRequestCreate } from '../../../../apis/easycard/src';
import { getEasyCardClient } from '../../../../apis/easycard/src/client';
import { type SimplePricingResult } from '../../../../packages/rules-engine-2/src/simple-pricer/simple-pricer'; // ודא שהייבוא נכון
import { fa } from "zod/v4/locales";

// ==================================================================
// Helper function to prevent code duplication when publishing events
// ==================================================================
const formatSessionForPublishing = (session: any) => {
  if (!session?.bundle) {
    return session;
  }
  return {
    ...session,
    bundle: {
      ...session.bundle,
      id: session.bundle.externalId || "",
      currency: "USD",
      price: session.bundle.price ?? 0,
      pricePerDay: session.bundle.pricePerDay ?? 0,
      country: {
        iso: session.bundle.countryId || "",
        __typename: "Country",
      } as Country,
    },
  };
};

export const checkoutMutationsV2: MutationResolvers = {
  // ======================
  // Create Checkout Flow
  // ======================
  createCheckout: {
    resolve: async (
      _,
      { numOfDays, countryId },
      { auth, repositories, services }
    ) => {
      const loggedInUser = await repositories.users.getUserById(auth.user?.id || "");
      const cleanEmail = loggedInUser?.email || undefined;
      const cleanPhone = loggedInUser?.user_metadata?.phone_number || undefined;
      const cleanFirstName = loggedInUser?.user_metadata?.first_name || undefined;
      const cleanLastName = loggedInUser?.user_metadata?.last_name || undefined;
      const isAuthCompleted = true; // Assuming auth is complete for now.
      const initialState = loggedInUser
        ? {
            auth: {
              completed: isAuthCompleted,
              userId: auth.user?.id,
              email: cleanEmail || null,
              phone: cleanPhone,
              firstName: cleanFirstName,
              lastName: cleanLastName,
              otpVerified: false,
              otpSent: false,
            },
          }
        : undefined;
      const checkout = await services.checkoutSessionServiceV2.createSession({
        numOfDays,
        countryId,
        initialState,
      });
      setImmediate(async () => {
        try {
          const session = await services.checkoutWorkflow.selectBundle({
            numOfDays,
            countryId,
            sessionId: checkout.id,
          });
          publish(services.pubsub)(checkout.id, formatSessionForPublishing(session));
          const validatedSession = await services.checkoutWorkflow.validateBundle({
            sessionId: checkout.id,
          });
          publish(services.pubsub)(checkout.id, formatSessionForPublishing(validatedSession));
        } catch (err) {
          logger.warn("Async createCheckout background task failed", err as Error);
        }
      });
      return checkout.id;
    },
  },

  // ===========================
  // Update Checkout Auth Info
  // ===========================
  updateCheckoutAuth: {
    resolve: async (
      _,
      { sessionId, firstName, lastName, email, phone },
      { auth, services }
    ) => {
      const session = await services.checkoutSessionServiceV2.updateSessionStep(
        sessionId,
        "auth",
        {
          completed: true,
          userId: auth.user?.id,
          firstName: firstName ?? undefined,
          lastName: lastName ?? undefined,
          email,
          phone,
        }
      );
      publish(services.pubsub)(sessionId, formatSessionForPublishing(session));
      return session.auth;
    },
  },

  // ============================
  // Update Checkout Delivery
  // ============================
  updateCheckoutDelivery: {
    resolve: async (_, { sessionId, email, phone, firstName, lastName }, { services }) => {
      const session = await services.checkoutWorkflow.setDelivery({
        sessionId,
        email,
        phone,
        firstName,
        lastName,
      });
      publish(services.pubsub)(sessionId, formatSessionForPublishing(session));
      return session.delivery;
    },
  },

  // ==========================
  // Apply Coupon to Checkout
  // ==========================
  applyCouponToCheckout: {
    resolve: async (
      _,
      { input }: MutationApplyCouponToCheckoutArgs,
       context : Context
    ) => {
      try {
        const { sessionId, couponCode } = validateApplyCouponInput(input);
        logger.info("Applying coupon", { sessionId, couponCode });
        const session = await context.repositories.coupons.applyCoupon({
          sessionId,
          couponCode,
          userId: context.auth?.user?.id,
        });
        publish(context.services.pubsub)(sessionId, session);
        return {
          success: true,
          checkout: formatSessionForGraphQL(session),
          error: null,
        };
      } catch (error: any) {
        logger.error("Failed to apply coupon", error);
        return {
          success: false,
          checkout: null,
          error: {
            __typename: "CouponError",
            message: error.message || "Failed to apply coupon",
            code: error.extensions?.code || "COUPON_ERROR",
          },
        };
      }
    },
  },

  // ============================
  // Trigger Checkout Payment
  // ============================
triggerCheckoutPayment: {
    resolve: async (
      _,
      { sessionId, nameForBilling, redirectUrl }: MutationTriggerCheckoutPaymentArgs,
      context: Context
    ): Promise<CheckoutPayment> => {
      logger.info("Triggering checkout payment", { sessionId, nameForBilling, redirectUrl });

      let session; // הגדרת המשתנה מחוץ ל-try כדי שיהיה זמין ב-catch
      try {
        session = await context.services.checkoutSessionServiceV2.getSession(sessionId);
        if (!session) {
          throw new GraphQLError("Session not found", { extensions: { code: "SESSION_NOT_FOUND" } });
        }

        if (!session.delivery.completed) {
             throw new GraphQLError("Delivery details must be completed before payment", { extensions: { code: "STEP_NOT_COMPLETED" } });
        }

        const pricing = session.pricing as SimplePricingResult | undefined;
        if (!pricing || typeof pricing.finalPrice !== 'number') {
             throw new GraphQLError("Invalid pricing data in session", { extensions: { code: "INTERNAL_ERROR" } });
        }
        const amountToCharge = pricing.finalPrice;
        const currency = CurrencyEnum.USD;

        const easyCardClient = await getEasyCardClient();

        const easyCardRequest = {
          amount: amountToCharge,
          currency: currency,
          description: `Hiilo eSIM Order - Session ${sessionId}`,
          customerReference: sessionId,
          metadata: {
            firstName: session.delivery.firstName || '',
            lastName: session.delivery.lastName || '',
            email: session.delivery.email || '',
          },
          // 💡 הוספתי redirectUrl לבקשה, אולי EasyCard צריכים אותו? (בדוק בתיעוד שלהם)
          // redirectUrl: redirectUrl, // הסר אם לא נדרש
        } as any; // עדיין משתמשים ב-any זמנית

        logger.info("Calling EasyCard createPaymentIntent API", { easyCardRequest });

        let easyCardResponse: any;
        try {
            easyCardResponse = await easyCardClient.executeWithTokenRefresh(() =>
              easyCardClient.paymentIntent.apiPaymentIntentPost({
                paymentRequestCreate: easyCardRequest
              })
            );
        } catch (easyCardError: any) {
            // הדפסה מפורטת יותר של השגיאה מה-API
            let errorBody = 'Could not read error body';
            try {
                if (easyCardError.response && typeof easyCardError.response.text === 'function') {
                    errorBody = await easyCardError.response.text();
                } else if (easyCardError.body) {
                     errorBody = JSON.stringify(easyCardError.body);
                }
            } catch (e) { /* ignore read error */ }

            logger.error("EasyCard API call failed!", {
                message: easyCardError?.message,
                status: easyCardError?.response?.status || easyCardError?.status,
                responseBody: errorBody,
                requestData: easyCardRequest
            } as any);
            // זרוק שגיאה עם הודעה ברורה יותר שכוללת את הסטטוס אם אפשר
            const status = easyCardError.response?.status || easyCardError.status;
            throw new GraphQLError(`Payment gateway request failed${status ? ` with status ${status}` : ''}. Check logs for details.`, { extensions: { code: "PAYMENT_GATEWAY_ERROR" } });
        }

        logger.info("EasyCard createPaymentIntent response received", { easyCardResponse });

        // נסה לחלץ את הנתונים מהתשובה (התאם את הנתיבים לפי התשובה האמיתית)
        const paymentIntentId = easyCardResponse?.paymentIntentID || easyCardResponse?.data?.paymentIntentID;
        // נסה כמה אפשרויות נפוצות ל-URL
        const paymentUrl = easyCardResponse?.url || easyCardResponse?.redirectUrl || easyCardResponse?.checkoutUrl || easyCardResponse?.data?.url || easyCardResponse?.data?.redirectUrl || easyCardResponse?.data?.checkoutUrl || null;

        if (!paymentIntentId) {
            const easyCardResponseString = (() => {
                try {
                    return JSON.stringify(easyCardResponse);
                } catch {
                    return String(easyCardResponse);
                }
            })();
            logger.error("Failed to create EasyCard payment intent: Missing paymentIntentID in response", new Error(easyCardResponseString));
            throw new GraphQLError("Payment gateway did not return a valid Payment Intent ID.", { extensions: { code: "PAYMENT_GATEWAY_ERROR" } });
        }

        logger.info(`Payment Intent created: ${paymentIntentId}, URL: ${paymentUrl}`);

        await context.services.checkoutSessionServiceV2.updateSessionStep(sessionId, 'payment', {
            intent: { id: paymentIntentId, url: paymentUrl || '' },
            readyForPayment: !!paymentUrl,
            // אולי לעדכן כאן גם payment_status ל-PENDING?
        });

        const intentResult: PaymentIntent | null = paymentUrl ? {
            __typename: "PaymentIntent",
            id: paymentIntentId,
            url: paymentUrl,
            applePayJavaScriptUrl: null, // או לקחת מהתשובה אם קיים
          } : null;

        const result: CheckoutPayment = {
          __typename: "CheckoutPayment",
          completed: false, // התשלום מתחיל עכשיו, הוא לא הושלם
          intent: intentResult,
          email: session.delivery.email,
          phone: session.delivery.phone,
          nameForBilling: nameForBilling || `${session.delivery.firstName || ''} ${session.delivery.lastName || ''}`.trim(),
        };
        return result;

      } catch (error: any) {
        // אם השגיאה כבר GraphQLError, זרוק אותה הלאה
        if (error instanceof GraphQLError) {
            throw error;
        }
        // אחרת, עטוף אותה כשגיאת GraphQL כללית
        logger.error("Unexpected error in triggerCheckoutPayment", error);
        throw new GraphQLError(error.message || "Failed to trigger payment", {
          extensions: { code: error.extensions?.code || "INTERNAL_ERROR" },
        });
      }
    },
  },
};