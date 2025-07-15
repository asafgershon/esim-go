// checkout.resolvers.ts
// Step 1: Basic checkout session creation and management

import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { Context } from "../context/types";
import type { CheckoutSession, Resolvers, OrderStatus, EsimStatus } from "../types";
import { createPaymentService } from "../services/payment";
import { createDeliveryService } from "../services/delivery";

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

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
        console.log("Getting checkout session for token");

        // Validate token and extract session info
        const decoded = validateCheckoutToken(token);
        console.log("Token decoded, sessionId:", decoded.sessionId);

        // Get session from database using repository
        const session = await context.repositories.checkoutSessions.getById(decoded.sessionId);

        if (!session) {
          console.error("Session not found");
          return {
            success: false,
            error: "Session not found or expired",
            session: null,
          };
        }

        // Check if session is expired
        if (await context.repositories.checkoutSessions.isExpired(session)) {
          return {
            success: false,
            error: "Session has expired",
            session: null,
          };
        }

        // Check if all steps are completed
        const steps = session.steps || {};
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

        console.log(
          "Session found, isComplete:",
          isComplete,
          "timeRemaining:",
          timeRemaining
        );

        return {
          success: true,
          session: {
            id: session.id,
            token,
            expiresAt: session.expires_at,
            isComplete,
            timeRemaining,
            createdAt: session.created_at,
            // Add these fields for frontend use
            planSnapshot: session.plan_snapshot,
            pricing: session.pricing,
            steps: steps,
            paymentStatus: session.payment_status || "PENDING",
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
        const { planId } = input;
        console.log("Creating checkout session for planId:", planId);

        // Get plan details from catalogue API (same as your dataPlans query)
        const plans = await context.dataSources.catalogue.searchPlans({});
        const plan = plans.find((p) => p.name === planId);

        if (!plan) {
          console.error("Plan not found in catalogue:", planId);
          return {
            success: false,
            error: `Plan not found: ${planId}`,
            session: null,
          };
        }

        console.log("Found plan:", plan.name, "Price:", plan.price);

        // Calculate pricing (same as your calculatePrice logic)
        const pricing = {
          subtotal: Math.round(plan.price * 100), // Convert to cents
          taxes: 0, // Add tax calculation if needed
          fees: 0, // Add fee calculation if needed
          total: Math.round(plan.price * 100),
          currency: "USD",
        };

        console.log("Calculated pricing:", pricing);

        // Create session in database using repository
        const session = await context.repositories.checkoutSessions.create({
          user_id: context.auth?.user?.id,
          plan_id: planId,
          plan_snapshot: {
            id: planId,
            name: plan.name,
            duration: plan.duration,
            price: plan.price,
            currency: "USD",
            countries: plan.countries?.map(c => c.iso) || [],
          },
          pricing,
          steps: {
            authentication: {
              completed: context.auth?.isAuthenticated || false,
              completedAt: context.auth?.isAuthenticated
                ? new Date().toISOString()
                : undefined,
            },
            delivery: { completed: false },
            payment: { completed: false },
          },
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        });

        console.log("Created session:", session.id);

        // Generate JWT token (include session ID even if user not authenticated)
        const token = generateCheckoutToken(
          context.auth?.user?.id || "anonymous",
          session.id
        );

        // Store token hash in database for lookup
        await context.repositories.checkoutSessions.updateTokenHash(session.id, hashToken(token));

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
        const session = await context.repositories.checkoutSessions.getById(decoded.sessionId);

        if (!session) {
          return {
            success: false,
            error: "Session not found",
            session: null,
            nextStep: null,
          };
        }

        // Check if session is expired
        if (await context.repositories.checkoutSessions.isExpired(session)) {
          return {
            success: false,
            error: "Session has expired",
            session: null,
            nextStep: null,
          };
        }

        // Update the specific step
        const updatedSteps = { ...session.steps };
        const now = new Date().toISOString();

        switch (stepType) {
          case "AUTHENTICATION":
            // User has logged in or signed up
            updatedSteps.authentication = {
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
            updatedSteps.delivery = {
              completed: true,
              completedAt: now,
              method: data.method, // 'EMAIL', 'SMS', or 'BOTH'
              email: data.email,
              phoneNumber: data.phoneNumber,
            };
            break;

          case "PAYMENT":
            // User has selected payment method (not yet processed)
            updatedSteps.payment = {
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

        console.log("Updated steps:", updatedSteps);

        // Update session in database using repository
        const updatedSession = await context.repositories.checkoutSessions.update(session.id, {
          steps: updatedSteps,
        });

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

        const isComplete = Boolean(!nextStep && updatedSteps.payment?.readyForPayment);

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
        const session = await context.repositories.checkoutSessions.getById(decoded.sessionId);

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
        const steps = session.steps;
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
        const paymentService = createPaymentService('mock');
        await paymentService.initialize({});

        const paymentResult = await paymentService.createPaymentIntent({
          amount: session.pricing.total,
          currency: session.pricing.currency.toLowerCase(),
          payment_method_id: paymentMethodId,
          description: `eSIM purchase: ${session.plan_snapshot.name}`,
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

        const updatedSession = await context.repositories.checkoutSessions.updatePaymentProcessing(
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
  },
};

// ===============================================
// WEBHOOK SIMULATION (Step 2) - Updated to create real Order + ESIM records
// ===============================================

async function simulateWebhookProcessing(
  sessionId: string,
  paymentIntentId: string,
  orderId: string,
  originalSession: any,
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

    const paymentSucceeded = completedPayment.status === 'succeeded';

    if (paymentSucceeded) {
      console.log("Payment succeeded, creating order and provisioning eSIM...");

      // Step 2: Real eSIM provisioning using eSIM Go API
      const esimData = await provisionESIM(
        originalSession.plan_snapshot,
        orderId,
        context
      );

      // Step 1: Create Order record using repository with real eSIM Go reference
      const orderRecord = await context.repositories.orders.create({
        user_id: originalSession.steps.authentication.userId,
        reference: orderId, // This becomes the order reference
        status: "COMPLETED" as OrderStatus,
        plan_data: originalSession.plan_snapshot, // Store plan info in JSONB field
        quantity: 1,
        total_price: originalSession.pricing.total / 100, // Convert cents back to dollars
        esim_go_order_ref: esimData.esimGoOrderRef, // Real eSIM Go order reference
      });

      console.log("Order record created:", orderRecord.id);

      // Step 3: Create ESIM record using repository
      const esimRecord = await context.repositories.esims.create({
        user_id: originalSession.steps.authentication.userId,
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
      const deliveryMethod = originalSession.steps.delivery;
      
      if (deliveryMethod?.completed) {
        try {
          const deliveryResult = await deliveryService.deliverESIM(
            {
              esimId: esimRecord.id,
              iccid: esimData.iccid,
              qrCodeUrl: esimData.qrCode,
              activationCode: esimData.activationCode,
              activationUrl: esimData.activationUrl,
              instructions: esimData.instructions,
              planName: originalSession.plan_snapshot.name,
              customerName: 'Customer', // TODO: Get actual customer name from user profile
              orderReference: orderId,
            },
            {
              type: deliveryMethod.method,
              email: deliveryMethod.email,
              phoneNumber: deliveryMethod.phoneNumber,
            }
          );

          console.log('eSIM delivery result:', deliveryResult);
          
          if (!deliveryResult.success) {
            console.error('Failed to deliver eSIM:', deliveryResult.error);
          }
        } catch (error) {
          console.error('Error delivering eSIM:', error);
        }
      }

      // Step 5: Update checkout session to completed
      const completedSteps = {
        ...originalSession.steps,
        payment: {
          ...originalSession.steps.payment,
          completed: true,
          completedAt: new Date().toISOString(),
          paymentIntentId,
        },
      };

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

      await context.repositories.checkoutSessions.updatePaymentFailed(sessionId);
    }
  } catch (error: any) {
    console.error("Webhook simulation error:", error);

    // Update session to failed state
    await context.repositories.checkoutSessions.updatePaymentFailed(sessionId, error.message);
  }
}

// ===============================================
// REAL eSIM PROVISIONING (Step 3) - Using eSIM Go API
// ===============================================

async function provisionESIM(planSnapshot: any, customerReference: string, context: Context) {
  console.log("Real eSIM provisioning for plan:", planSnapshot.name);

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
      instructions: (assignment as any).instructions || generateDefaultInstructions(),
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
