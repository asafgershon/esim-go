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
      const { isAuthComplete } = await import("../../services/checkout/workflow");

      const cleanEmail = loggedInUser?.email || undefined;
      const cleanPhone = loggedInUser?.user_metadata?.phone_number || undefined;
      const cleanFirstName = loggedInUser?.user_metadata?.first_name || undefined;
      const cleanLastName = loggedInUser?.user_metadata?.last_name || undefined;

      const isAuthCompleted = isAuthComplete(
        auth.user?.id,
        cleanEmail,
        cleanPhone,
        cleanFirstName,
        cleanLastName
      );

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

          publish(services.pubsub)(checkout.id, {
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
          });

          const validatedSession = await services.checkoutWorkflow.validateBundle({
            sessionId: checkout.id,
          });

          publish(services.pubsub)(checkout.id, {
            ...validatedSession,
            bundle: {
              ...validatedSession.bundle,
              completed: true,
              id: validatedSession.bundle.externalId || "",
              currency: "USD",
              price: validatedSession.bundle.price ?? 0,
              pricePerDay: validatedSession.bundle.pricePerDay ?? 0,
              country: {
                iso: validatedSession.bundle.countryId || "",
                __typename: "Country",
              } as Country,
            },
          });
        } catch (err) {
          logger.warn("Async createCheckout background task failed", err as ErrorConstructor);
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
      const session = await services.checkoutWorkflow.authenticate({
        sessionId,
        userId: auth.user?.id || "",
        firstName,
        lastName,
        email,
        phone,
      });

      publish(services.pubsub)(sessionId, {
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
        auth: session.auth,
      });

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

      publish(services.pubsub)(sessionId, {
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
        delivery: session.delivery,
      });

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

        publish(services.pubsub)(sessionId, {
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
        });

        return {
          success: true,
          checkout: {
            ...session,
            bundle: {
              ...session.bundle,
              id: session.bundle.externalId || "",
              currency: "USD",
              price: session.bundle.price ?? 0,
              pricePerDay: session.bundle.pricePerDay ?? 0,
            },
          },
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
