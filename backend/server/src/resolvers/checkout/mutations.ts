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
import {
  createPaymentIntent,
  type ICreatePaymentParams,
} from "../../../../apis/easycard/src/custom-payment.service";

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

      let session;
      try {
        // שלב 1️⃣ - שלוף את הסשן הקיים (הלוגיקה הזו נשארת, היא טובה)
        session = await context.services.checkoutSessionServiceV2.getSession(sessionId);
        if (!session) {
          throw new GraphQLError("Session not found", { extensions: { code: "SESSION_NOT_FOUND" } });
        }

        if (!session.delivery.completed) {
          throw new GraphQLError("Delivery details must be completed before payment", {
            extensions: { code: "STEP_NOT_COMPLETED" },
          });
        }

        // שלב 2️⃣ - בדוק מחיר (הלוגיקה הזו נשארת, היא טובה)
        const pricing = session.pricing as SimplePricingResult | undefined;
        if (!pricing || typeof pricing.finalPrice !== "number") {
          throw new GraphQLError("Invalid pricing data in session", {
            extensions: { code: "INTERNAL_ERROR" },
          });
        }
        
        //
        // 👇 ================== החלפה ================== 👇
        // מחקנו את הקוד של getEasyCardClient
        // והכנסנו את הקוד שלנו שמשתמש ב-custom-payment.service
        //

        // שלב 3️⃣ - ודא שיש לנו את שם הפריט
        const bundle = session.bundle; // מגיע מ-checkoutSessionServiceV2
        if (!bundle || !bundle.dataAmount) {
            logger.error(
            `Session is missing bundle.dataAmount: ${sessionId}`
          );
          throw new GraphQLError("Session is incomplete for payment (no bundle data).");
        }

        // שלב 4️⃣ - הרכב את הבקשה עבור השירות *שלנו*
        const paymentItem = {
          itemName: bundle.dataAmount || "eSIM Bundle", 
          price: pricing.finalPrice, // שימוש במחיר הנכון
          quantity: 1, 
        };

        const paymentParams: ICreatePaymentParams = {
          amount: pricing.finalPrice, // שימוש במחיר הנכון
          items: [paymentItem],   
          redirectUrl: redirectUrl, // שימוש ב-redirectUrl שהגיע מה-Frontend
          terminalID:
            process.env.EASY_CARD_TERMINAL_ID ||
            "bcbb963a-7eb1-497d-9611-b2ce00b2bdc5",
        };

        // שלב 5️⃣ - קריאה לשירות *שלנו* (זה שקורא ל-/connect/token)
        logger.info("Calling [OUR] createPaymentIntent for Easycard", { paymentParams });
        const paymentResponse = await createPaymentIntent(paymentParams);
        
        //
        // 👆 ================== /החלפה ================== 👆
        //

        logger.info("Easycard response received", { paymentResponse });

        // שלב 6️⃣ - חילוץ מזהים וכתובת תשלום (מהתגובה *שלנו*)
        const paymentRequestId = paymentResponse.entityUID;
        const paymentUrl = paymentResponse.additionalData.url;

        if (!paymentRequestId || !paymentUrl) {
          logger.error(
            "Failed to create EasyCard payment request: Missing redirectUrl or ID in response",
             new Error(JSON.stringify(paymentResponse))
          );
          throw new GraphQLError(
            "Payment gateway did not return a valid Payment Request response.",
            { extensions: { code: "PAYMENT_GATEWAY_ERROR" } }
          );
        }

        logger.info(`Payment Request created: ${paymentRequestId}, URL: ${paymentUrl}`);

        // שלב 7️⃣ - עדכן את ה-Session (הלוגיקה הזו נשארת, היא טובה)
        await context.services.checkoutSessionServiceV2.updateSessionStep(sessionId, "payment", {
          intent: { id: paymentRequestId, url: paymentUrl },
          readyForPayment: true,
        });

        // שלב 8️⃣ - הרכב תשובה ל-GraphQL (הלוגיקה הזו נשארת, היא טובה)
        const intentResult: PaymentIntent = {
          __typename: "PaymentIntent",
          id: paymentRequestId,
          url: paymentUrl,
          applePayJavaScriptUrl: paymentResponse.additionalData.applePayJavaScriptUrl, // הוספנו את זה
        };

        const result: CheckoutPayment = {
          __typename: "CheckoutPayment",
          completed: false,
          intent: intentResult,
          email: session.delivery.email,
          phone: session.delivery.phone,
          nameForBilling:
            nameForBilling ||
            `${session.delivery.firstName || ""} ${session.delivery.lastName || ""}`.trim(),
        };

        return result;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;

        logger.error("Unexpected error in triggerCheckoutPayment", error);
        throw new GraphQLError(error.message || "Failed to trigger payment", {
          extensions: { code: error.extensions?.code || "INTERNAL_ERROR" },
        });
      }
    },
  },
};