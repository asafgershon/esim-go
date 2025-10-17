import { GraphQLError } from "graphql";
import type { Context } from "../../context/types";
import { logger } from "../../lib/logger";
import type {
  Country,
  MutationApplyCouponToCheckoutArgs,
  MutationResolvers,
} from "../../types";
import { publish } from "./subscriptions";
import { validateApplyCouponInput } from "./validators";

// ==================================================================
// Helper function to prevent code duplication when publishing events
// ==================================================================
const formatSessionForPublishing = (session: any) => {
  // Ensure session and session.bundle exist to prevent errors
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
  // ✅ Create Checkout Flow
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

      // The auth check is temporarily disabled.
      // To re-enable, uncomment the following lines and remove the line below them.
      /*
      const isAuthCompleted = services.checkoutWorkflow.isAuthComplete(
        auth.user?.id,
        cleanEmail,
        cleanPhone,
        cleanFirstName,
        cleanLastName
      );
      */
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

      // 🔄 Run async bundle selection + validation
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
  // ✅ Update Checkout Auth Info
  // ===========================
  updateCheckoutAuth: {
    resolve: async (
      _,
      { sessionId, firstName, lastName, email, phone },
      { auth, services }
    ) => {
      // 💡 FIX: Calling 'updateSessionStep' with three separate arguments:
      // 1. sessionId
      // 2. The step name ("auth")
      // 3. An object with the new details
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
  // ✅ Update Checkout Delivery
  // ============================
  updateCheckoutDelivery: {
    resolve: async (_, { sessionId, email, phone }, { services }) => {
      const session = await services.checkoutWorkflow.setDelivery({
        sessionId,
        email,
        phone,
      });

      publish(services.pubsub)(sessionId, formatSessionForPublishing(session));

      return session.delivery;
    },
  },

  // ==========================
  // ✅ Apply Coupon to Checkout
  // ==========================
  applyCouponToCheckout: {
    resolve: async (
      _,
      { input }: MutationApplyCouponToCheckoutArgs,
      { services }: Context
    ) => {
      try {
        const { sessionId, couponCode } = validateApplyCouponInput(input);
        logger.info("Applying coupon", { sessionId, couponCode });

        const session = await services.checkoutWorkflow.applyCoupon({
          sessionId,
          couponCode,
        });

        publish(services.pubsub)(sessionId, formatSessionForPublishing(session));

        return {
          success: true,
          checkout: formatSessionForPublishing(session),
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
};