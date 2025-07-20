import crypto from "crypto";
import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";
import { z } from "zod";
import type { Context } from "../context/types";
import type { Database } from "../database.types";
import { CheckoutSessionStepsSchema } from "../repositories/checkout/checkout-session.repository";
import {
  createDeliveryService,
  type DeliveryMethod,
} from "../services/delivery";
import { createPaymentService } from "../services/payment";
import type { EsimStatus, OrderStatus, Resolvers } from "../types";
import QRCode from 'qrcode';
import { createLogger } from "../lib/logger";

// ===============================================
// TYPE DEFINITIONS & SCHEMAS
// ===============================================

const logger = createLogger({ component: 'checkout-resolvers' });

type CheckoutSessionRow =
  Database["public"]["Tables"]["checkout_sessions"]["Row"];

const PlanSnapshotSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.number(),
  price: z.number(),
  currency: z.string(),
  countries: z.array(z.string()),
});

interface CheckoutSessionToken {
  userId: string;
  sessionId: string;
  exp: number;
  iss: string;
}

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
    ) as CheckoutSessionToken;

    if (decoded.iss !== "esim-go-checkout") {
      throw new Error("Invalid token issuer");
    }

    return decoded;
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

// ===============================================
// RESOLVERS
// ===============================================

export const checkoutResolvers: Partial<Resolvers> = {
  Query: {
    // Get checkout session by token
    getCheckoutSession: async (_, { token }, context: Context) => {
      try {

        // Validate token and extract session info
        const decoded = validateCheckoutToken(token);

        // Get session from database using repository
        const session = await context.repositories.checkoutSessions.getById(
          decoded.sessionId
        );

        if (!session) {
          console.error("Session not found");
          return {
            success: false,
            error: "Session not found or expired",
            session: null,
          };
        }

        // Parse JSON fields into typed objects
        const steps = CheckoutSessionStepsSchema.parse(session.steps || {});
        const pricing = session.pricing;
        const planSnapshot = PlanSnapshotSchema.parse(session.plan_snapshot);

        // Check if session is expired
        if (await context.repositories.checkoutSessions.isExpired(session)) {
          return {
            success: false,
            error: "Session has expired",
            session: null,
          };
        }

        // Check if all steps are completed
        const isComplete = Boolean(
          steps.authentication?.completed &&
            steps.delivery?.completed &&
            steps.payment?.completed
        );

        // Calculate time remaining
        const timeRemaining = Math.max(
          0,
          Math.floor(
            (new Date(session.expires_at).getTime() - Date.now()) / 1000
          )
        );

        return {
          success: true,
          session: {
            orderId: session.order_id,
            id: session.id,
            token,
            expiresAt: session.expires_at,
            isComplete,
            timeRemaining,
            createdAt: session.created_at,
            // Add these fields for frontend use
            planSnapshot: planSnapshot,
            pricing: pricing,
            steps: steps,
            paymentStatus: session.payment_status || "PENDING",
            metadata: session.metadata, // Added missing metadata field
          },
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
        const { countryId, numOfDays, regionId } = input;
        console.log(
          "Creating checkout session for countryId:",
          countryId,
          "numOfDays:",
          numOfDays,
          "regionId:",
          regionId
        );
        const pricing = await context.services.pricing.calculatePrice(
          numOfDays,
          regionId,
          countryId,
          context.dataSources.catalogue
        );

        const { plan } = pricing;


        // Create session in database using repository
        const session = await context.repositories.checkoutSessions.create({
          user_id: context.auth?.user?.id,
          plan_id: plan.id,
          plan_snapshot: {
            id: plan.id,
            name: plan.name,
            duration: plan.duration,
            price: plan.price,
            currency: "USD",
            countries: plan.countries,
          },
          pricing,
          steps: {
            authentication: {
              completed: context.auth?.isAuthenticated || false,
              completedAt: context.auth?.isAuthenticated
                ? new Date().toISOString()
                : undefined,
              userId: context.auth?.user?.id,
            },
            delivery: { completed: false },
            payment: { completed: false },
          },
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        });

        logger.info('Created session', { sessionId: session.id, operationType: 'session-creation' });

        // Generate JWT token (include session ID even if user not authenticated)
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
          session: {
            id: session.id,
            token,
            expiresAt: session.expires_at,
            isComplete: false,
            createdAt: session.created_at,
          },
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
        console.log("Updating checkout step:", stepType, "with data:", data);

        // Validate token
        const decoded = validateCheckoutToken(token);

        // Get current session using repository
        const session = await context.repositories.checkoutSessions.getById(
          decoded.sessionId
        );

        if (!session) {
          return {
            success: false,
            error: "Session not found",
            session: null,
            nextStep: null,
          };
        }

        // Parse steps for safe manipulation
        const steps = CheckoutSessionStepsSchema.parse(session.steps || {});
        const now = new Date().toISOString();

        switch (stepType) {
          case "AUTHENTICATION":
            // User has logged in or signed up
            steps.authentication = {
              completed: true,
              completedAt: now,
              userId: context.auth?.user?.id || data.userId,
            };

            // IMPORTANT: Update user_id in session when user authenticates
            if (context.auth?.user?.id && !session.user_id) {
              await context.repositories.checkoutSessions.update(session.id, {
                user_id: context.auth.user.id,
              });
              console.log("Updated session user_id to:", context.auth.user.id);
              // Update our local session object too
              session.user_id = context.auth.user.id;
            }
            break;

          case "DELIVERY":
            // User has selected delivery method for QR code
            steps.delivery = {
              completed: true,
              completedAt: now,
              method: data.method, // 'EMAIL', 'SMS', or 'BOTH'
              email: data.email,
              phoneNumber: data.phoneNumber,
            };
            break;

          case "PAYMENT":
            // User has selected payment method (not yet processed)
            steps.payment = {
              completed: false, // Will be completed after actual payment
              paymentMethodId: data.paymentMethodId,
              paymentMethodType: data.paymentMethodType, // 'card', 'paypal', etc
              readyForPayment: true,
            };
            break;

          default:
            return {
              success: false,
              error: "Invalid step type",
              session: null,
              nextStep: null,
            };
        }

        console.log("Updated steps:", steps);

        // Update session in database using repository
        const updatedSession =
          await context.repositories.checkoutSessions.update(session.id, {
            steps: steps,
          });

        // Re-parse for consistency
        const updatedSteps = CheckoutSessionStepsSchema.parse(
          updatedSession.steps || {}
        );

        // Determine next step
        let nextStep: string | null = null;
        if (!updatedSteps.authentication?.completed) {
          nextStep = "AUTHENTICATION";
        } else if (!updatedSteps.delivery?.completed) {
          nextStep = "DELIVERY";
        } else if (!updatedSteps.payment?.readyForPayment) {
          nextStep = "PAYMENT";
        }
        // If nextStep is null, all steps are ready for final payment processing

        const isComplete = Boolean(
          !nextStep && updatedSteps.payment?.readyForPayment
        );

        console.log("Next step:", nextStep, "Is complete:", isComplete);

        return {
          success: true,
          session: {
            id: updatedSession.id,
            token,
            expiresAt: updatedSession.expires_at,
            isComplete,
            timeRemaining: Math.max(
              0,
              Math.floor(
                (new Date(updatedSession.expires_at).getTime() - Date.now()) /
                  1000
              )
            ),
            createdAt: updatedSession.created_at,
            planSnapshot: updatedSession.plan_snapshot,
            pricing: updatedSession.pricing,
            steps: updatedSteps,
            paymentStatus: updatedSession.payment_status || "PENDING",
          },
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
        const { token, paymentMethodId, savePaymentMethod } = input;
        console.log(
          "Processing checkout payment for token:",
          token.substring(0, 20) + "..."
        );

        // Validate token
        const decoded = validateCheckoutToken(token);

        // Get session using repository
        const session = await context.repositories.checkoutSessions.getById(
          decoded.sessionId
        );

        if (!session) {
          return {
            success: false,
            error: "Session not found",
            orderId: null,
            session: null,
            paymentIntentId: null,
            webhookProcessing: false,
          };
        }

        // Parse JSON fields
        const steps = CheckoutSessionStepsSchema.parse(session.steps || {});
        const pricing = session.pricing;
        const planSnapshot = PlanSnapshotSchema.parse(session.plan_snapshot);

        // Check if session is expired
        if (await context.repositories.checkoutSessions.isExpired(session)) {
          return {
            success: false,
            error: "Session has expired",
            orderId: null,
            session: null,
            paymentIntentId: null,
            webhookProcessing: false,
          };
        }

        // Validate that all required steps are completed
        if (!steps.authentication?.completed) {
          return {
            success: false,
            error: "Authentication required before payment",
            orderId: null,
            session: null,
            paymentIntentId: null,
            webhookProcessing: false,
          };
        }

        if (!steps.delivery?.completed) {
          return {
            success: false,
            error: "Delivery method required before payment",
            orderId: null,
            session: null,
            paymentIntentId: null,
            webhookProcessing: false,
          };
        }

        console.log("All steps validated, processing payment...");

        // Create order record first (before payment processing)
        const orderId = `order_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Create payment service and process payment
        const paymentService = createPaymentService("mock");
        await paymentService.initialize({});

        const paymentResult = await paymentService.createPaymentIntent({
          amount: (pricing as any)?.finalPrice,
          currency: "USD",
          payment_method_id: paymentMethodId,
          description: `eSIM purchase: ${planSnapshot.name}`,
          metadata: {
            sessionId: session.id,
            orderId,
            planId: session.plan_id,
          },
        });

        if (!paymentResult.success || !paymentResult.payment_intent) {
          return {
            success: false,
            error: paymentResult.error?.message || "Payment processing failed",
            orderId: null,
            session: null,
            paymentIntentId: null,
            webhookProcessing: false,
          };
        }

        const paymentIntent = paymentResult.payment_intent;
        console.log("Payment intent created:", paymentIntent.id);

        // Update session with payment processing status
        const updatedSteps = {
          ...steps,
          payment: {
            ...steps.payment,
            completed: false, // Will be set to true by webhook
            paymentMethodId,
            paymentIntentId: paymentIntent.id,
            processing: true,
            processedAt: new Date().toISOString(),
          },
        };

        const updatedSession =
          await context.repositories.checkoutSessions.updatePaymentProcessing(
            session.id,
            paymentIntent.id,
            updatedSteps
          );

        console.log("Session updated, starting webhook simulation...");

        // Start webhook simulation (Step 2: Timer to simulate webhook)
        // In production, this would be a real webhook from Stripe
        setTimeout(async () => {
          console.log(
            "Simulating webhook processing for payment:",
            paymentIntent.id
          );
          await simulateWebhookProcessing(
            session.id,
            paymentIntent.id,
            orderId,
            session,
            context,
            paymentService
          );
        }, 3000); // Simulate 3-second payment processing

        return {
          success: true,
          orderId, // This will be replaced with real DB order ID by the webhook
          session: {
            id: updatedSession.id,
            token,
            expiresAt: updatedSession.expires_at,
            isComplete: false, // Will be true after webhook completes
            timeRemaining: Math.max(
              0,
              Math.floor(
                (new Date(updatedSession.expires_at).getTime() - Date.now()) /
                  1000
              )
            ),
            createdAt: updatedSession.created_at,
            planSnapshot: updatedSession.plan_snapshot,
            pricing: updatedSession.pricing,
            steps: updatedSteps,
            paymentStatus: "PROCESSING",
            orderId: updatedSession.order_id,
            metadata: updatedSession.metadata, // Added missing metadata field
          },
          paymentIntentId: paymentIntent.id,
          webhookProcessing: true,
          error: null,
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

    // Validate order before purchase (eSIM Go recommended flow)
    validateOrder: async (_, { input }, context: Context) => {
      try {
        const { bundleName, quantity, customerReference } = input;
        console.log("Validating order:", { bundleName, quantity, customerReference });

        // Use the eSIM Go API to validate the order
        const validationResult = await context.dataSources.orders.validateOrder(
          bundleName,
          quantity,
          customerReference
        );

        if (!validationResult.isValid) {
          console.log("Order validation failed:", validationResult.error);
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

        console.log("Order validation succeeded");
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
        console.error("Error in validateOrder:", error);
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

// ===============================================
// WEBHOOK SIMULATION (Step 2) - Updated to create real Order + ESIM records
// ===============================================

async function simulateWebhookProcessing(
  sessionId: string,
  paymentIntentId: string,
  orderId: string,
  originalSession: CheckoutSessionRow,
  context: Context,
  paymentService: any
) {
  try {
    console.log(
      "Webhook simulation: Processing payment completion for",
      paymentIntentId
    );

    // Simulate payment completion using payment service
    const completedPayment = await paymentService.simulatePaymentCompletion(
      paymentIntentId,
      true // Simulate success - in real webhook this would be determined by the actual payment result
    );

    const paymentSucceeded = completedPayment.status === "succeeded";

    if (paymentSucceeded) {
      console.log("Payment succeeded, creating order and provisioning eSIM...");

      const steps = CheckoutSessionStepsSchema.parse(
        originalSession.steps || {}
      );
      const pricing = originalSession.pricing;
      const planSnapshot = PlanSnapshotSchema.parse(
        originalSession.plan_snapshot
      );

      // Step 2: Real eSIM provisioning using eSIM Go API
      const esimData = await provisionESIM(planSnapshot, orderId, context);

      if (!steps.authentication?.userId) {
        throw new Error("Cannot create order without a user ID");
      }

      // Calculate detailed pricing breakdown for the order
      const { PricingService } = await import('../services/pricing.service');
      const pricingConfig = await PricingService.getPricingConfig(
        planSnapshot.countries[0] || '', // Use first country for pricing
        planSnapshot.duration,
        context.dataSources.catalogue
      );
      
      const bundleName = PricingService.getBundleName(planSnapshot.duration);
      const countryName = PricingService.getCountryName(planSnapshot.countries[0] || '');
      
      const detailedPricing = PricingService.calculatePricing(
        bundleName,
        countryName,
        planSnapshot.duration,
        pricingConfig
      );

      // Step 1: Create Order record using repository with detailed pricing
      const orderRecord = await context.repositories.orders.createOrderWithPricing({
        user_id: steps.authentication.userId,
        reference: orderId, // This becomes the order reference
        status: "COMPLETED" as OrderStatus,
        plan_data: planSnapshot, // Store plan info in JSONB field
        quantity: 1,
        esim_go_order_ref: esimData.esimGoOrderRef, // Real eSIM Go order reference
      }, detailedPricing);

      console.log("Order record created:", orderRecord.id);

      // Step 3: Create ESIM record using repository
      const esimRecord = await context.repositories.esims.create({
        user_id: steps.authentication.userId,
        order_id: orderRecord.id,
        iccid: esimData.iccid,
        customer_ref: orderId,
        qr_code_url: esimData.qrCode,
        status: "ASSIGNED" as EsimStatus,
        assigned_date: new Date().toISOString(),
        last_action: "ASSIGNED",
        action_date: new Date().toISOString(),
      });

      console.log("eSIM record created:", esimRecord.id);

      // Step 4: Deliver eSIM QR code to customer
      const deliveryService = createDeliveryService();
      const deliveryMethod = steps.delivery;

      // if (deliveryMethod?.completed) {
      //   try {
      //     const deliveryResult = await deliveryService.deliverESIM(
      //       {
      //         esimId: esimRecord.id,
      //         iccid: esimData.iccid,
      //         qrCode: esimData.qrCode,
      //         activationCode: esimData.activationCode,
      //         activationUrl: esimData.activationUrl,
      //         instructions: esimData.instructions,
      //         planName: planSnapshot.name,
      //         customerName: "Customer", // TODO: Get actual customer name from user profile
      //         orderReference: orderId,
      //       },
      //       {
      //         type: (deliveryMethod.method || "EMAIL") as  unknown as DeliveryMethod,
      //         email: deliveryMethod.email,
      //         phoneNumber: deliveryMethod.phoneNumber,
      //       }
      //     );

      //     console.log("eSIM delivery result:", deliveryResult);

      //     if (!deliveryResult.success) {
      //       console.error("Failed to deliver eSIM:", deliveryResult.error);
      //     }
      //   } catch (error) {
      //     console.error("Error delivering eSIM:", error);
      //   }
      // }

      // Step 5: Update checkout session to completed
      const completedSteps = {
        ...steps,
        payment: {
          ...steps.payment,
          completed: true,
          completedAt: new Date().toISOString(),
          paymentIntentId,
        },
      };

      // Update payment step and global isCompleted flag
      await context.repositories.checkoutSessions.updatePaymentProcessing(
        sessionId,
        paymentIntentId,
        completedSteps
      );

      await context.repositories.checkoutSessions.markCompleted(sessionId, {
        orderId: orderRecord.id, // This is the database order ID, not the reference
        orderReference: orderId, // This is the reference string
        esimId: esimRecord.id,
      });

      console.log(
        "Webhook simulation: Payment, order, and eSIM creation completed!"
      );
      console.log("Order ID for frontend:", orderRecord.id);
    } else {
      // Payment failed
      console.log("Payment failed, updating session...");

      await context.repositories.checkoutSessions.updatePaymentFailed(
        sessionId
      );
    }
  } catch (error: any) {
    console.error("Webhook simulation error:", error);

    // Update session to failed state
    await context.repositories.checkoutSessions.updatePaymentFailed(
      sessionId,
      error.message
    );
  }
}

// ===============================================
// REAL eSIM PROVISIONING (Step 3) - Using eSIM Go API
// ===============================================

async function provisionESIM(
  planSnapshot: z.infer<typeof PlanSnapshotSchema>,
  customerReference: string,
  context: Context
) {
  console.log("Real eSIM provisioning for plan:", planSnapshot.name);

  const esimGoOrder = {
    iccid: `89000000000000000${Math.random().toString().substr(2, 6)}`, // Mock ICCID
    matchingId: 'mock-matching-id',
    smdpAddress: 'rsp-3104.idemia.io',
    activationCode: `ACT-${customerReference}`, // Mock activation code
    activationUrl: `https://esim-activate.com/activate/${customerReference}`, // Mock activation URL
    instructions: `To activate your eSIM for ${planSnapshot.name}:\n1. Scan the QR code\n2. Follow setup instructions\n3. Enjoy your data!`,
    status: "ASSIGNED",
    esimGoOrderRef: `ESG-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 6)}`, // Mock eSIM Go order reference
  }
  // Return mock for now
  return {
    ...esimGoOrder,
    qrCode: await QRCode.toDataURL(`LPA:1$${esimGoOrder.smdpAddress}$${esimGoOrder.activationCode}`),
  };
  try {
    // Step 1: Create order in eSIM Go API
    const esimGoOrder = await context.dataSources.orders.createOrder({
      bundleName: planSnapshot.name,
      quantity: 1,
      customerReference,
      autoActivate: false, // We'll handle activation separately
    });

    console.log("eSIM Go order created:", esimGoOrder.reference);

    // Step 2: Get eSIM assignments (QR codes and ICCIDs)
    const assignments = await context.dataSources.orders.getOrderAssignments(
      esimGoOrder.reference
    );

    if (!assignments || assignments.length === 0) {
      throw new Error("No eSIM assignments found for order");
    }

    // Take the first assignment (since quantity is 1)
    const assignment = assignments[0];
    if (!assignment) {
      throw new Error("No assignment found in eSIM Go response");
    }

    console.log("eSIM assignment received:", assignment.iccid);

    return {
      iccid: assignment.iccid,
      qrCode: assignment.qrCode, // This is the real QR code from eSIM Go
      activationCode: (assignment as any).activationCode || null,
      activationUrl: (assignment as any).activationUrl || null,
      instructions:
        (assignment as any).instructions || generateDefaultInstructions(),
      status: "ASSIGNED",
      esimGoOrderRef: esimGoOrder.reference,
    };
  } catch (error) {
    console.error("Error provisioning eSIM:", error);

    // If real provisioning fails, we could fall back to mock for development
    // But in production, we should throw the error
    throw new Error(`Failed to provision eSIM: ${(error as Error).message}`);
  }
}

// Helper function to generate default installation instructions
function generateDefaultInstructions(): string {
  return `1. Scan the QR code with your device
2. Follow the installation prompts on your device
3. Enable the eSIM in your cellular settings
4. Your plan will activate automatically when you arrive at your destination
5. Contact support if you need assistance`;
}
