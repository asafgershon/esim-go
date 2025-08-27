import type { Context } from "../../context/types";
import { logger } from "../../lib/logger";
import type {
  Country,
  MutationResolvers,
  SubscriptionResolvers,
} from "../../types";
import { publish } from "./subscriptions";

export const checkoutMutationsV2: MutationResolvers = {
  createCheckout: {
    resolve: async (
      _,
      { numOfDays, countryId },
      { auth, repositories, services }
    ) => {
      const loggedInUser = await repositories.users.getUserById(
        auth.user?.id || ""
      );

      const { isAuthComplete } = await import("../../services/checkout/workflow");
      
      const cleanEmail = loggedInUser?.email && loggedInUser.email !== "" ? loggedInUser.email : undefined;
      const cleanPhone = loggedInUser?.user_metadata?.phone_number && loggedInUser.user_metadata?.phone_number !== "" ? loggedInUser.user_metadata?.phone_number : undefined;
      const cleanFirstName = loggedInUser?.user_metadata?.first_name && loggedInUser.user_metadata?.first_name !== "" ? loggedInUser.user_metadata?.first_name : undefined;
      const cleanLastName = loggedInUser?.user_metadata?.last_name && loggedInUser.user_metadata?.last_name !== "" ? loggedInUser.user_metadata?.last_name : undefined;

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

      setImmediate(async () => {
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
            country: {
              iso: session.bundle.countryId || "",
              __typename: "Country",
              // We rely on field resolver
            } as Country,
            price: session.bundle.price || Infinity,
            pricePerDay: session.bundle.pricePerDay || Infinity,
            currency: "USD",
            validated: false,
          },
        });

        const validatedSession = await services.checkoutWorkflow.validateBundle(
          {
            sessionId: checkout.id,
          }
        );

        publish(services.pubsub)(checkout.id, {
          ...validatedSession,
          bundle: {
            ...validatedSession.bundle,
            completed: true,
            country: {
              iso: validatedSession.bundle.countryId || "",
              __typename: "Country",
              // We rely on field resolver
            } as Country,
            id: validatedSession.bundle.externalId || "",
            // TODO: format with currency
            price: validatedSession.bundle.price || Infinity,
            pricePerDay: validatedSession.bundle.pricePerDay || Infinity,
            currency: "USD",
            validated: validatedSession.bundle.validated,
          },
        });
      });

      return checkout.id;
    },
  },

  updateCheckoutAuth: {
    resolve: async (
      _,
      { sessionId, firstName, lastName, email, phone },
      { auth, services }
    ) => {
      // We allow running this mutation only
      const session = await services.checkoutWorkflow.authenticate({
        sessionId,
        userId: auth.user?.id || "",
        firstName,
        lastName,
        email: email && email !== "" ? email : undefined,
        phone: phone && phone !== "" ? phone : undefined,
      });

      publish(services.pubsub)(sessionId, {
        ...session,
        bundle: {
          id: session.bundle.externalId || "",
          country: {
            iso: session.bundle.countryId || "",
            __typename: "Country",
            // We rely on field resolver
          } as Country,
          price: session.bundle.price || Infinity,
          pricePerDay: session.bundle.pricePerDay || Infinity,
          currency: "USD",
          ...session.bundle,
        },
        auth: session.auth,
      });

      return session.auth;
    },
  },
  verifyOTP: {
    resolve: async (_, { sessionId, otp }, { services }) => {
      const session = await services.checkoutWorkflow.verifyOTP({
        sessionId,
        otp,
      });

      publish(services.pubsub)(sessionId, {
        ...session,
        bundle: {
          id: session.bundle.externalId || "",
          country: {
            iso: session.bundle.countryId || "",
            __typename: "Country",
            // We rely on field resolver
          } as Country,
          price: session.bundle.price || Infinity,
          pricePerDay: session.bundle.pricePerDay || Infinity,
          currency: "USD",
          ...session.bundle,
        },
        auth: session.auth,
      });

      return session.auth;
    },
  },
  updateCheckoutAuthName: {
    resolve: async (_, { sessionId, firstName, lastName }, { services }) => {
      const session = await services.checkoutWorkflow.updateAuthName({
        sessionId,
        firstName: firstName || "",
        lastName: lastName || "",
      });

      publish(services.pubsub)(sessionId, {
        ...session,
        bundle: {
          id: session.bundle.externalId || "",
          country: {
            iso: session.bundle.countryId || "",
            __typename: "Country",
            // We rely on field resolver
          } as Country,
          price: session.bundle.price || Infinity,
          pricePerDay: session.bundle.pricePerDay || Infinity,
          currency: "USD",
          ...session.bundle,
        },
        auth: session.auth,
      });

      return session.auth;
    },
  },
  updateCheckoutDelivery: {
    resolve: async (_, { sessionId, email, phone }, { services }) => {
      const session = await services.checkoutWorkflow.setDelivery({
        sessionId,
        email: email !== "" ? email : undefined,
        phone: phone !== "" ? phone : undefined,
      });

      publish(services.pubsub)(sessionId, {
        ...session,
        bundle: {
          id: session.bundle.externalId || "",
          country: {
            iso: session.bundle.countryId || "",
            __typename: "Country",
            // We rely on field resolver
          } as Country,
          price: session.bundle.price || Infinity,
          pricePerDay: session.bundle.pricePerDay || Infinity,
          currency: "USD",
          ...session.bundle,
        },
        delivery: session.delivery,
      });

      return session.delivery;
    },
  },
  triggerCheckoutPayment: {
    resolve: async (_, { sessionId,redirectUrl }, { services }) => {
      const session = await services.checkoutWorkflow.triggerPayment({
        sessionId,
        completed: false,
        intent:{
          id: '',
          url: '',
          applePayJavaScriptUrl: '',
        },
        redirectUrl,
      });

      publish(services.pubsub)(sessionId, {
        ...session,
        bundle: {
          id: session.bundle.externalId || "",
          country: {
            iso: session.bundle.countryId || "",
            __typename: "Country",
            // We rely on field resolver
          } as Country,
          price: session.bundle.price || Infinity,
          pricePerDay: session.bundle.pricePerDay || Infinity,
          currency: "USD",
          ...session.bundle,
        },
        auth: session.auth,
        delivery: session.delivery,
        payment: session.payment,
      });

      return session.payment;
    },
  },
  processPaymentCallback: async (_, args, context: Context) => {
    try {
      const { transactionId } = args;
      const session = await context.services.checkoutWorkflow.captruePayment({ transactionId });
      if (!session) {
        throw new Error("Session not found");
      }
      publish(context.services.pubsub)(session.id, {
        ...session,
        bundle: {
          id: session.bundle.externalId || "",
          country: {
            iso: session.bundle.countryId || "",
            __typename: "Country",
            // We rely on field resolver
          } as Country,
          price: session.bundle.price || Infinity,
          pricePerDay: session.bundle.pricePerDay || Infinity,
          currency: "USD",
          ...session.bundle,
        },
        auth: session.auth,
        delivery: session.delivery,
        payment: session.payment,
      });
      return session.payment.completed;
    } catch (error: any) {
      logger.error("Error in processPaymentCallback", error);
      return false;
    }
  },
};
