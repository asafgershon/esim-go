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
        // Validate input
        const { token } = validateGetSessionInput(args);
        
        // Get services
        const tokenService = getCheckoutTokenService();
        const sessionService = context.services.checkoutSessionService || 
          createCheckoutSessionService(context);
        
        // Validate token and extract session info
        const decoded = tokenService.validateToken(token);
        
        // Get session with auto-renewal enabled
        const session = await sessionService.getSession(decoded.sessionId, { 
          autoRenewPaymentIntent: true 
        });
        
        if (!session) {
          logger.warn("Session not found", { sessionId: decoded.sessionId });
          return {
            success: false,
            error: ERROR_MESSAGES.SESSION_NOT_FOUND,
            session: null,
          };
        }
        
        // Check if session is expired
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
        
        // Handle specific GraphQL errors
        if (error instanceof GraphQLError) {
          throw error;
        }
        
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
        // Validate input
        const input = validateCreateSessionInput(args.input);
        
        // Get services
        const tokenService = getCheckoutTokenService();
        const sessionService = context.services.checkoutSessionService || 
          createCheckoutSessionService(context);
        
        logger.info("Creating checkout session", { input });
        
        // Create session
        const session = await sessionService.createSession({
          ...input,
          userId: context.auth?.user?.id,
        });
        
        // Generate JWT token
        const token = tokenService.generateToken(
          context.auth?.user?.id || "anonymous",
          session.id
        );
        
        // Store token hash for lookup
        await context.repositories.checkoutSessions.updateTokenHash(
          session.id,
          tokenService.hashToken(token)
        );
        
        logger.info("Checkout session created", { 
          sessionId: session.id,
          userId: context.auth?.user?.id 
        });
        
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
        // Validate input
        const { token, stepType, data } = validateUpdateStepInput(args.input);
        
        // Get services
        const tokenService = getCheckoutTokenService();
        const sessionService = context.services.checkoutSessionService || 
          createCheckoutSessionService(context);
        
        logger.info("Updating checkout step", { stepType, data });
        
        // Validate token
        const decoded = tokenService.validateToken(token);
        
        let updatedSession;
        
        switch (stepType) {
          case CHECKOUT_STEP_TYPE.AUTHENTICATION: {
            // User has logged in or signed up
            const userId = context.auth?.user?.id || data?.userId;
            
            if (!userId) {
              throw new GraphQLError(ERROR_MESSAGES.USER_ID_REQUIRED, {
                extensions: { code: CheckoutErrorCode.VALIDATION_ERROR }
              });
            }
            
            updatedSession = await sessionService.authenticateSession(
              decoded.sessionId,
              userId
            );
            break;
          }
          
          case CHECKOUT_STEP_TYPE.DELIVERY: {
            // Validate delivery data
            const deliveryData = DeliveryStepDataSchema.parse(data);
            
            updatedSession = await sessionService.setDeliveryMethod(
              decoded.sessionId,
              deliveryData
            );
            break;
          }
          
          case CHECKOUT_STEP_TYPE.PAYMENT: {
            // Prepare for payment
            updatedSession = await sessionService.preparePayment(decoded.sessionId);
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
        
        logger.info("Checkout step updated", { 
          sessionId: decoded.sessionId,
          stepType,
          nextStep 
        });
        
        return {
          success: true,
          session: formatSessionForGraphQL(updatedSession, token),
          nextStep: nextStep as any,
          error: null,
        };
      } catch (error: any) {
        logger.error("Error in updateCheckoutStep", error);
        
        // Handle specific GraphQL errors
        if (error instanceof GraphQLError) {
          throw error;
        }
        
        return {
          success: false,
          session: null,
          nextStep: null,
          error: error.message || "Failed to update checkout step",
        };
      }
    },

    /**
     * Process checkout payment
     */
    processCheckoutPayment: async (_, args, context: Context) => {
      try {
        // Validate input
        const { token } = validateProcessPaymentInput(args.input);
        
        // Get services
        const tokenService = getCheckoutTokenService();
        const sessionService = context.services.checkoutSessionService || 
          createCheckoutSessionService(context);
        
        logger.info("Processing checkout payment");
        
        // Validate token
        const decoded = tokenService.validateToken(token);

        // Process payment
        const result = await sessionService.processPayment(decoded.sessionId);
        
        // Get updated session for response
        const session = result.success 
          ? await sessionService.getSession(decoded.sessionId)
          : null;
        
        logger.info("Payment processing result", { 
          sessionId: decoded.sessionId,
          success: result.success,
          orderId: result.orderId 
        });
        
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
        
        // Handle specific GraphQL errors
        if (error instanceof GraphQLError) {
          throw error;
        }
        
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
     * @deprecated Use automatic validation on session creation instead
     */
    validateOrder: async (_, args, context: Context) => {
      try {
        // Validate input
        const { bundleName, quantity, customerReference } = validateOrderInput(args.input);
        
        logger.info("validateOrder resolver called", {
          bundleName,
          quantity,
          customerReference,
          operationType: "order-validation",
        });
        
        // Use the eSIM Go client to validate the order
        const { BundleOrderTypeEnum, OrderRequestTypeEnum } = await import("@hiilo/esim-go");
        
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
        
        logger.info("Calling eSIM Go API", {
          orderRequest,
          operationType: "order-validation",
        });
        
        const response = await context.services.esimGoClient.ordersApi.ordersPost({
          orderRequest,
        });
        
        logger.info("eSIM Go API response", {
          responseData: response.data,
          operationType: "order-validation",
        });
        
        const isValid = Number(response.data.total) > 0;
        
        if (!isValid) {
          logger.warn("Order validation failed", {
            bundleName,
            operationType: "order-validation",
          });
          
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
        
        logger.info("Order validation succeeded", {
          bundleName,
          totalPrice: response.data.total,
          currency: response.data.currency,
          operationType: "order-validation",
        });
        
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
        logger.error("Error in validateOrder", error, {
          bundleName: args.input.bundleName,
          operationType: "order-validation",
        });
        
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