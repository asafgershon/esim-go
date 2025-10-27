import { GraphQLError } from "graphql";
import type { Context } from "../../context/types";
import { createLogger } from "../../lib/logger";
import { createCheckoutSessionService } from "../../services/checkout-session.service";
import { getCheckoutTokenService } from "../../services/checkout-token.service";
import type { Resolvers } from "../../types";
import { ERROR_MESSAGES, CHECKOUT_STEP_TYPE } from "../../constants/checkout";
import { CheckoutErrorCode } from "./types";
import { formatSessionForGraphQL, determineNextStep } from "./helpers";
import {
  validateCreateSessionInput,
  validateUpdateStepInput,
  validateProcessPaymentInput,
  validateGetSessionInput,
  validateOrderInput,
  DeliveryStepDataSchema,
} from "./validators";
import {
  createPaymentIntent,
  type ICreatePaymentParams,
} from "../../../../apis/easycard/src/custom-payment.service";
// 👆 ================== /הוספה ================== 👆

const logger = createLogger({ component: "checkout-resolvers" });

/**
 * Checkout resolvers implementation
 */
export const checkoutResolvers: Partial<Resolvers> = {
  Query: {
    /**
     * Get checkout session by token
     */
    getCheckoutSession: async (_, args, context: Context) => {
      try {
        const { token } = validateGetSessionInput(args);
        const tokenService = getCheckoutTokenService();
        const sessionService =
          context.services.checkoutSessionService ||
          createCheckoutSessionService(context);

        const decoded = tokenService.validateToken(token);
        const session = await sessionService.getSession(decoded.sessionId, {
          autoRenewPaymentIntent: true,
        });

        if (!session) {
          logger.warn("Session not found", { sessionId: decoded.sessionId });
          return {
            success: false,
            error: ERROR_MESSAGES.SESSION_NOT_FOUND,
            session: null,
          };
        }

        if (new Date(session.expiresAt) <= new Date()) {
          logger.warn("Session expired", { sessionId: decoded.sessionId });
          return {
            success: false,
            error: ERROR_MESSAGES.SESSION_EXPIRED,
            session: null,
          };
        }

        return {
          success: true,
          session: formatSessionForGraphQL(session, token),
          error: null,
        };
      } catch (error: any) {
        logger.error("Error in getCheckoutSession", error);
        if (error instanceof GraphQLError) throw error;
        return {
          success: false,
          session: null,
          error: error.message || "Failed to get checkout session",
        };
      }
    },
  },

  Mutation: {
    /**
     * Create a new checkout session
     */
    createCheckoutSession: async (_, args, context: Context) => {
      try {
        const input = validateCreateSessionInput(args.input);
        const tokenService = getCheckoutTokenService();
        const sessionService =
          context.services.checkoutSessionService ||
          createCheckoutSessionService(context);

        logger.info("Creating checkout session", { input });

        // 💡 FIX: Added 'context' as the first argument as required by the updated service.
        const session = await sessionService.createSession(context, {
          ...input,
          userId: context.auth?.user?.id,
        });

        const token = tokenService.generateToken(
          context.auth?.user?.id || "anonymous",
          session.id
        );

        await context.repositories.checkoutSessions.updateTokenHash(
          session.id,
          tokenService.hashToken(token)
        );

        logger.info("Checkout session created", { sessionId: session.id });
        return {
          success: true,
          session: formatSessionForGraphQL(session, token),
          error: null,
        };
      } catch (error: any) {
        logger.error("Error in createCheckoutSession", error);
        return {
          success: false,
          session: null,
          error: error.message || "An unexpected error occurred",
        };
      }
    },

    /**
     * Update a checkout step
     */
    updateCheckoutStep: async (_, args, context: Context) => {
      try {
        const { token, stepType, data } = validateUpdateStepInput(args.input);
        const tokenService = getCheckoutTokenService();
        const sessionService =
          context.services.checkoutSessionService ||
          createCheckoutSessionService(context);

        const decoded = tokenService.validateToken(token);

        // This function now expects an options object, passing an empty one.
        const checkoutSession = await sessionService.getSession(
          decoded.sessionId,
          {}
        );

        if (!checkoutSession) {
          throw new GraphQLError(ERROR_MESSAGES.SESSION_NOT_FOUND, {
            extensions: { code: CheckoutErrorCode.SESSION_NOT_FOUND },
          });
        }

        let updatedSession;

        switch (stepType) {
          case CHECKOUT_STEP_TYPE.AUTHENTICATION: {
            const userId =
              context.auth?.user?.id || data?.userId || decoded.userId;
            if (!userId) {
              throw new GraphQLError(ERROR_MESSAGES.USER_ID_REQUIRED, {
                extensions: { code: CheckoutErrorCode.VALIDATION_ERROR },
              });
            }

            // 💡 FIX: Added 'context' as the first argument.
            updatedSession = await sessionService.authenticateSession(
              context,
              decoded.sessionId,
              userId
            );
            break;
          }

          case CHECKOUT_STEP_TYPE.DELIVERY: {
            const deliveryData = DeliveryStepDataSchema.parse(data);

            // 💡 FIX: Added 'context' as the first argument.
            updatedSession = await sessionService.setDeliveryMethod(
              context,
              decoded.sessionId,
              deliveryData
            );
            break;
          }

          case CHECKOUT_STEP_TYPE.PAYMENT: {
            updatedSession = await sessionService.getSession(
              decoded.sessionId,
              {}
            );
            if (!updatedSession) {
              throw new GraphQLError(ERROR_MESSAGES.SESSION_NOT_FOUND, {
                extensions: { code: CheckoutErrorCode.SESSION_NOT_FOUND },
              });
            }
            break;
          }

          default:
            return {
              success: false,
              error: ERROR_MESSAGES.INVALID_STEP_TYPE,
              session: null,
              nextStep: null,
            };
        }

        const nextStep = determineNextStep(updatedSession.state);
        return {
          success: true,
          session: formatSessionForGraphQL(updatedSession, token),
          nextStep: nextStep as any,
          error: null,
        };
      } catch (error: any) {
        logger.error("Error in updateCheckoutStep", error);
        if (error instanceof GraphQLError) throw error;
        return {
          success: false,
          session: null,
          nextStep: null,
          error: error.message || "Failed to update checkout step",
        };
      }
    },

    processCheckoutPayment: async (_, args, context: Context) => {
      try {
        const { token } = validateProcessPaymentInput(args.input);
        const tokenService = getCheckoutTokenService();
        const sessionService =
          context.services.checkoutSessionService ||
          createCheckoutSessionService(context);

        const decoded = tokenService.validateToken(token);

        // 💡 FIX: Added 'context' as the first argument.
        const result = await sessionService.processPayment(
          context,
          decoded.sessionId
        );

        const session = result.success
          ? await sessionService.getSession(decoded.sessionId, {})
          : null;

        return {
          success: result.success,
          orderId: result.orderId || null,
          session: session ? formatSessionForGraphQL(session, token) : null,
          paymentIntentId: session?.paymentIntentId || null,
          webhookProcessing: result.success && !result.orderId,
          error: result.error || null,
        };
      } catch (error: any) {
        logger.error("Error in processCheckoutPayment", error);
        if (error instanceof GraphQLError) throw error;
        return {
          success: false,
          orderId: null,
          session: null,
          paymentIntentId: null,
          webhookProcessing: false,
          error: error.message || "Failed to process payment",
        };
      }
    },

    /**
     * Validate order (kept for backward compatibility)
     */
    // 💡 FIX: Restored the full, original implementation of this function.
    validateOrder: async (_, args, context: Context) => {
      try {
        const { bundleName, quantity } = validateOrderInput(args.input);
        const { BundleOrderTypeEnum, OrderRequestTypeEnum } = await import(
          "@hiilo/esim-go"
        );

        const orderRequest = {
          type: OrderRequestTypeEnum.VALIDATE,
          order: [
            {
              type: BundleOrderTypeEnum.BUNDLE,
              item: bundleName,
              quantity: quantity || 1,
            },
          ],
        };

        const response =
          await context.services.esimGoClient.ordersApi.ordersPost({
            orderRequest,
          });

        const isValid = Number(response.data.total) > 0;

        if (!isValid) {
          return {
            success: true,
            isValid: false,
            bundleDetails: null,
            totalPrice: null,
            currency: null,
            error: "Order validation failed",
            errorCode: "VALIDATION_ERROR",
          };
        }

        return {
          success: true,
          isValid: true,
          bundleDetails: response.data.order?.[0] || null,
          totalPrice: response.data.total || null,
          currency: response.data.currency || "USD",
          error: null,
          errorCode: null,
        };
      } catch (error: any) {
        logger.error("Error in validateOrder", error);
        return {
          success: false,
          isValid: false,
          bundleDetails: null,
          totalPrice: null,
          currency: null,
          error: error.message || "Failed to validate order",
          errorCode: "VALIDATION_ERROR",
        };
      }
    },
  },
};

export default checkoutResolvers;

export * from "./subscriptions";
export * from "./mutations";