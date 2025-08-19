import crypto from "crypto";
import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";
import { z } from "zod";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import { createCheckoutSessionService, CheckoutState } from "../services/checkout-session.service";
import { CheckoutUpdateType, type Resolvers } from "../types";

// ===============================================
// TYPE DEFINITIONS & SCHEMAS
// ===============================================

const logger = createLogger({ component: "checkout-resolvers" });

const CheckoutSessionTokenSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  exp: z.number(),
  iss: z.string(),
});

type CheckoutSessionToken = z.infer<typeof CheckoutSessionTokenSchema>;

// Generate secure JWT token for checkout session
function generateCheckoutToken(userId: string, sessionId: string): string {
  const payload: CheckoutSessionToken = {
    userId,
    sessionId,
    exp: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    iss: "esim-go-checkout",
  };

  return jwt.sign(payload, process.env.CHECKOUT_JWT_SECRET!);
}

// Validate and decode checkout token
function validateCheckoutToken(token: string): CheckoutSessionToken {
  try {
    const decoded = jwt.verify(
      token,
      process.env.CHECKOUT_JWT_SECRET!
    ) as unknown;

    // Validate the decoded token with Zod schema
    const validatedToken = CheckoutSessionTokenSchema.parse(decoded);

    if (validatedToken.iss !== "esim-go-checkout") {
      throw new Error("Invalid token issuer");
    }

    return validatedToken;
  } catch (error) {
    console.error("Error in validateCheckoutToken:", error);
    throw new GraphQLError("Invalid or expired checkout token", {
      extensions: { code: "INVALID_TOKEN" },
    });
  }
}

// Generate token hash for database storage
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Helper to format session for GraphQL response
function formatSessionForGraphQL(session: any, token?: string) {
  const planSnapshot = session.metadata?.planSnapshot || 
    (typeof session.plan_snapshot === 'string' 
      ? JSON.parse(session.plan_snapshot) 
      : session.plan_snapshot);
  
  // Import the mapStateToSteps function from the service
  const { mapStateToSteps } = require('../services/checkout-session.service');
  
  // Generate steps from the current state
  const steps = mapStateToSteps({
    state: session.state || session.metadata?.state || CheckoutState.INITIALIZED,
    userId: session.user_id || session.userId,
    paymentIntentId: session.payment_intent_id || session.paymentIntentId,
    metadata: session.metadata || {}
  });
  
  // Extract payment URL from metadata
  const paymentUrl = (session.metadata as any)?.paymentIntent?.url || null;
  const paymentIntentId = session.payment_intent_id || session.paymentIntentId || null;
  
  return {
    id: session.id,
    token: token || "",
    expiresAt: session.expiresAt || session.expires_at,
    isComplete: session.state === CheckoutState.PAYMENT_COMPLETED,
    isValidated: session.metadata?.isValidated || false,
    timeRemaining: Math.max(
      0,
      Math.floor(
        (new Date(session.expiresAt || session.expires_at).getTime() - Date.now()) / 1000
      )
    ),
    createdAt: session.createdAt || session.created_at,
    planSnapshot,
    pricing: session.pricing,
    steps: steps || session.metadata?.steps || session.steps, // Fallback to stored steps if mapStateToSteps fails
    paymentStatus: mapStateToPaymentStatus(session.state || session.metadata?.state || CheckoutState.INITIALIZED),
    paymentUrl,
    paymentIntentId,
    orderId: session.orderId || session.order_id,
    metadata: session.metadata,
  };
}

// Map internal state to payment status
function mapStateToPaymentStatus(state: CheckoutState): string {
  switch (state) {
    case CheckoutState.PAYMENT_PROCESSING:
      return "PROCESSING";
    case CheckoutState.PAYMENT_COMPLETED:
      return "SUCCEEDED";
    case CheckoutState.PAYMENT_FAILED:
      return "FAILED";
    default:
      return "PENDING";
  }
}

// Determine next step based on current state
function determineNextStep(state: CheckoutState): string | null {
  switch (state) {
    case CheckoutState.INITIALIZED:
      return "AUTHENTICATION";
    case CheckoutState.AUTHENTICATED:
      return "DELIVERY";
    case CheckoutState.DELIVERY_SET:
      return "PAYMENT";
    case CheckoutState.PAYMENT_READY:
      return null; // Ready for payment processing
    default:
      return null;
  }
}

// ===============================================
// RESOLVERS
// ===============================================

export const checkoutResolvers: Partial<Resolvers> = {
  Query: {
    // Get checkout session by token
    getCheckoutSession: async (_, { token }, context: Context) => {
      try {
        // Initialize service if not already done
        if (!context.services.checkoutSessionService) {
          context.services.checkoutSessionService = createCheckoutSessionService(context);
        }
        
        const service = context.services.checkoutSessionService;
        
        // Validate token and extract session info
        const decoded = validateCheckoutToken(token);
        
        // Get session using service with auto-renewal enabled
        const session = await service.getSession(decoded.sessionId, { 
          autoRenewPaymentIntent: true 
        });
        
        if (!session) {
          return {
            success: false,
            error: "Session not found or expired",
            session: null,
          };
        }
        
        // Check if session is expired
        if (new Date(session.expiresAt) <= new Date()) {
          return {
            success: false,
            error: "Session has expired",
            session: null,
          };
        }
        
        return {
          success: true,
          session: formatSessionForGraphQL(session, token),
          error: null,
        };
      } catch (error: any) {
        console.error("Error in getCheckoutSession:", error);
        return {
          success: false,
          session: null,
          error: error.message || "Failed to get checkout session",
        };
      }
    },
  },

  Mutation: {
    // Create a new checkout session
    createCheckoutSession: async (_, { input }, context: Context) => {
      try {
        // Initialize service if not already done
        if (!context.services.checkoutSessionService) {
          context.services.checkoutSessionService = createCheckoutSessionService(context);
        }
        
        const service = context.services.checkoutSessionService;
        
        logger.info("Creating checkout session", { input });
        
        // Create session using service
        const session = await service.createSession({
          ...input,
          userId: context.auth?.user?.id,
        });
        
        // Generate JWT token
        const token = generateCheckoutToken(
          context.auth?.user?.id || "anonymous",
          session.id
        );
        
        // Store token hash in database for lookup
        await context.repositories.checkoutSessions.updateTokenHash(
          session.id,
          hashToken(token)
        );
        
        return {
          success: true,
          session: formatSessionForGraphQL(session, token),
          error: null,
        };
      } catch (error: any) {
        console.error("Error in createCheckoutSession:", error);
        return {
          success: false,
          session: null,
          error: error.message || "An unexpected error occurred",
        };
      }
    },

    // Update a checkout step
    updateCheckoutStep: async (_, { input }, context: Context) => {
      try {
        const { token, stepType, data } = input;
        
        // Initialize service if not already done
        if (!context.services.checkoutSessionService) {
          context.services.checkoutSessionService = createCheckoutSessionService(context);
        }
        
        const service = context.services.checkoutSessionService;
        
        console.log("Updating checkout step:", stepType, "with data:", data);
        
        // Validate token
        const decoded = validateCheckoutToken(token);
        
        let updatedSession;
        
        switch (stepType) {
          case "AUTHENTICATION":
            // User has logged in or signed up
            const userId = context.auth?.user?.id || data.userId;
            
            if (!userId) {
              throw new GraphQLError("User ID is required for authentication", {
                extensions: { code: "VALIDATION_ERROR" }
              });
            }
            
            updatedSession = await service.authenticateSession(
              decoded.sessionId,
              userId
            );
            break;
            
          case "DELIVERY":
            // User has selected delivery method
            updatedSession = await service.setDeliveryMethod(decoded.sessionId, {
              method: data.method,
              email: data.email,
              phoneNumber: data.phoneNumber,
            });
            break;
            
          case "PAYMENT":
            // Prepare for payment
            updatedSession = await service.preparePayment(decoded.sessionId);
            break;
            
          default:
            return {
              success: false,
              error: "Invalid step type",
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
        console.error("Error in updateCheckoutStep:", error);
        return {
          success: false,
          session: null,
          nextStep: null,
          error: error.message || "Failed to update checkout step",
        };
      }
    },

    // Process checkout payment
    processCheckoutPayment: async (_, { input }, context: Context) => {
      try {
        const { token } = input;
        
        // Initialize service if not already done
        if (!context.services.checkoutSessionService) {
          context.services.checkoutSessionService = createCheckoutSessionService(context);
        }
        
        const service = context.services.checkoutSessionService;
        
        console.log("Processing checkout payment");
        
        // Validate token
        const decoded = validateCheckoutToken(token);
        
        // Process payment using service
        const result = await service.processPayment(decoded.sessionId);
        
        // Get updated session for response
        const session = result.success 
          ? await service.getSession(decoded.sessionId)
          : null;
        
        return {
          success: result.success,
          orderId: result.orderId || null,
          session: session ? formatSessionForGraphQL(session, token) : null,
          paymentIntentId: session?.paymentIntentId || null,
          webhookProcessing: result.success && !result.orderId, // True if payment initiated but not completed
          error: result.error || null,
        };
      } catch (error: any) {
        console.error("Error in processCheckoutPayment:", error);
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

    // Validate order (existing functionality kept for compatibility)
    validateOrder: async (_, { input }, context: Context) => {
      const { bundleName, customerReference } = input;
      
      try {
        logger.info("validateOrder resolver called", {
          input,
          operationType: "order-validation",
        });
        
        if (!bundleName) {
          throw new Error("bundleName is required but was not provided");
        }
        
        // Use the eSIM Go client to validate the order
        const { BundleOrderTypeEnum, OrderRequestTypeEnum } = await import("@hiilo/esim-go");
        
        const orderRequest = {
          type: OrderRequestTypeEnum.VALIDATE,
          order: [
            {
              type: BundleOrderTypeEnum.BUNDLE,
              item: bundleName,
              quantity: 1,
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
        
        const validationResult = {
          isValid: Number(response.data.total) > 0,
          bundleDetails: response.data.order?.[0] || null,
          totalPrice: response.data.total || null,
          currency: response.data.currency || "USD",
          error: null,
          errorCode: null,
        };
        
        if (!validationResult.isValid) {
          logger.warn("Order validation failed", {
            bundleName,
            error: validationResult.error,
            errorCode: validationResult.errorCode,
            operationType: "order-validation",
          });
          return {
            success: true, // API call succeeded
            isValid: false,
            bundleDetails: null,
            totalPrice: null,
            currency: null,
            error: validationResult.error,
            errorCode: validationResult.errorCode,
          };
        }
        
        logger.info("Order validation succeeded", {
          bundleName,
          totalPrice: validationResult.totalPrice,
          currency: validationResult.currency,
          operationType: "order-validation",
        });
        
        return {
          success: true,
          isValid: true,
          bundleDetails: validationResult.bundleDetails,
          totalPrice: validationResult.totalPrice,
          currency: validationResult.currency,
          error: null,
          errorCode: null,
        };
      } catch (error: any) {
        logger.error("Error in validateOrder", error, {
          bundleName,
          customerReference,
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

// Export the refactored resolvers
export default checkoutResolvers;