import { BundleOrderTypeEnum, OrderRequestTypeEnum } from "@hiilo/client";
import { calculatePricing, type RequestFacts, type PricingEngineV2Result } from "@hiilo/rules-engine-2";
import crypto from "crypto";
import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";
import { z } from "zod";
import type { Context } from "../context/types";
import type { Database } from "../database.types";
import { createLogger } from "../lib/logger";
import { CheckoutSessionStepsSchema } from "../repositories/checkout-session.repository";
import { createPaymentService } from "../services/payment";
import { PaymentMethod, type EsimStatus, type OrderStatus, type Resolvers } from "../types";
import type { OrderResponse } from "../datasources/esim-go";
import { purchaseAndDeliverESIM } from "../services/esim-purchase";
import { WEB_APP_BUNDLE_GROUP } from "../lib/constants/bundle-groups";

// ===============================================
// TYPE DEFINITIONS & SCHEMAS
// ===============================================

const logger = createLogger({ component: "checkout-resolvers" });

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
        const { countryId, numOfDays, regionId, group } = input;
        console.log(
          "Creating checkout session for countryId:",
          countryId,
          "numOfDays:",
          numOfDays,
          "regionId:",
          regionId,
          "group:",
          group
        );
        // Validate input parameters strictly - this is payment flow
        if (!numOfDays || numOfDays <= 0) {
          throw new Error(`Invalid requested duration: ${numOfDays}`);
        }
        
        // Ensure we have at least one location criteria
        if (!countryId && !regionId) {
          throw new Error("Either countryId or regionId is required for checkout");
        }

        // Build search parameters based on what's provided
        const searchParams: any = {
          minValidityInDays: 1,
          // Use provided group or default to web app bundle group
          groups: [group || WEB_APP_BUNDLE_GROUP],
        };

        // Only add countries if countryId is provided
        if (countryId) {
          searchParams.countries = [countryId];
        }

        // Only add regions if regionId is provided  
        if (regionId) {
          searchParams.regions = [regionId];
        }

        // Debug: Log the search parameters being used
        console.log("Bundle search parameters:", JSON.stringify(searchParams, null, 2));

        // Debug: Check what countries are available in the database
        try {
          const availableCountries = await context.repositories.bundles.getCountries();
          console.log("Available countries in database:", availableCountries.slice(0, 20));
          console.log("Total countries available:", availableCountries.length);
          
          // Check if UZ specifically exists
          const hasUZ = availableCountries.includes('UZ');
          console.log("Database contains UZ bundles:", hasUZ);
        } catch (error) {
          console.error("Error checking available countries:", error);
        }

        // Fetch ALL available bundles for the country/region to allow optimal selection
        // Don't filter by duration - let the pricing engine select the best bundle
        const bundleResults = await context.repositories.bundles.search(searchParams);

        // Debug: Log the search results
        console.log("Bundle search results:", {
          dataLength: bundleResults?.data?.length || 0,
          count: bundleResults?.count || 0,
          hasNextPage: bundleResults?.hasNextPage,
          firstFewBundles: bundleResults?.data?.slice(0, 3).map(b => ({
            name: b.esim_go_name,
            countries: b.countries,
            validity: b.validity_in_days,
            price: b.price
          }))
        });

        // STRICT VALIDATION - fail if no bundles available
        if (!bundleResults?.data || bundleResults.data.length === 0) {
          throw new Error(
            `No bundles available for country: ${countryId}${
              regionId ? `, region: ${regionId}` : ""
            }`
          );
        }

        // Debug: Log bundle durations to understand what's available
        const bundleDurations = bundleResults.data
          .map((b) => b.validity_in_days)
          .sort((a, b) => (a || 0) - (b || 0));
        console.log(
          `Found ${bundleResults.data.length} bundles for ${countryId} with durations:`,
          bundleDurations
        );
        console.log(`Requested duration: ${numOfDays} days`);

        // Use the new simplified pricing engine
        // Build request facts based on location criteria
        const requestFacts: RequestFacts = {
          group: group || WEB_APP_BUNDLE_GROUP,
          days: numOfDays,
          paymentMethod: PaymentMethod.IsraeliCard,
          ...(countryId ? { country: countryId } : { region: regionId || '' })
        };

        // Debug: Log what we're passing to the pricing engine
        console.log("Calling calculatePricing with facts:", requestFacts);

        // Calculate pricing with the new engine
        let pricingResult: PricingEngineV2Result;
        try {
          pricingResult = await calculatePricing(requestFacts);
        } catch (error) {
          // If no bundles are available for the requested duration, provide helpful info
          if (
            error instanceof Error &&
            error.message.includes("No bundles available")
          ) {
            const availableDurations = bundleResults.data
              .map((b) => b.validity_in_days)
              .filter((d) => d && d > 0)
              .sort((a, b) => a - b);

            throw new Error(
              `No bundles available for ${numOfDays} days or longer for ${countryId || regionId}. ` +
                `Available durations: ${availableDurations.join(", ")} days. ` +
                `Please select a different duration or choose the longest available option.`
            );
          }
          throw error;
        }

        // STRICT VALIDATION of pricing result - this affects payment
        if (!pricingResult) {
          throw new Error("Pricing calculation failed - no result returned");
        }
        if (!pricingResult.pricing?.finalPrice || pricingResult.pricing.finalPrice <= 0) {
          throw new Error(
            `Invalid final price calculated: ${pricingResult.pricing?.finalPrice}`
          );
        }
        if (!pricingResult.selectedBundle) {
          throw new Error("No bundle selected by pricing engine");
        }

        // Use the bundle selected by the pricing engine
        const selectedBundle = pricingResult.selectedBundle;

        // Construct plan data from selected bundle and pricing result
        const plan = {
          id: selectedBundle.esim_go_name,
          name: selectedBundle.esim_go_name,
          duration: selectedBundle.validity_in_days,
          price: pricingResult.pricing.finalPrice,
          currency: "USD",
          countries: selectedBundle.countries || [countryId],
          bundleGroup: (selectedBundle as any).groups?.[0] || WEB_APP_BUNDLE_GROUP,
          dataAmount: selectedBundle.data_amount_mb ? `${selectedBundle.data_amount_mb}MB` : "0MB",
          isUnlimited: selectedBundle.is_unlimited || false,
        };

        // Final validation of plan data before creating checkout session
        if (!plan.id || !plan.name || !plan.duration || !plan.price) {
          throw new Error(
            "Invalid plan data constructed - missing required fields"
          );
        }

        const pricing = pricingResult;

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
          pricing: pricing as any,
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

        logger.info("Created session", {
          sessionId: session.id,
          operationType: "session-creation",
        });

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
        const { token, paymentMethodId } = input;
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
          .substring(2, 11)}`;

        // Create payment service and process payment
        const paymentService = createPaymentService("mock");
        await paymentService.initialize({});

        const paymentResult = await paymentService.createPaymentIntent({
          amount: planSnapshot.price, // Use the price from plan snapshot
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
      // Extract parameters outside try block so they're available in catch block
      const { bundleName, quantity, customerReference } = input;
      
      try {
        logger.info("validateOrder resolver called", {
          input,
          operationType: "order-validation"
        });
        
        
        logger.info("Extracted parameters", {
          bundleName,
          bundleNameType: typeof bundleName,
          quantity,
          customerReference,
          operationType: "order-validation"
        });
        
        if (!bundleName) {
          throw new Error("bundleName is required but was not provided");
        }

        // Use the eSIM Go client to validate the order
        const orderRequest = {
          type: OrderRequestTypeEnum.VALIDATE,
          order: [{
            type: BundleOrderTypeEnum.BUNDLE,
            item: bundleName,
            quantity: quantity,
          }]
        };
        
        logger.info("Calling eSIM Go API", {
          orderRequest,
          operationType: "order-validation"
        });
        
        const response = await context.services.esimGoClient.ordersApi.ordersPost({
          orderRequest
        });
        
        logger.info("eSIM Go API response", {
          responseData: response.data,
          operationType: "order-validation"
        });

        const validationResult = {
          isValid: (response.data).valid || false,
          bundleDetails: response.data.order?.[0] || null,
          totalPrice: response.data.total || null,
          currency: response.data.currency || 'USD',
          error: response.data.valid ? null : response.data.message,
          errorCode: response.data.valid ? null : 'VALIDATION_FAILED'
        };

        if (!validationResult.isValid) {
          logger.warn("Order validation failed", {
            bundleName,
            error: validationResult.error,
            errorCode: validationResult.errorCode,
            operationType: "order-validation"
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
          operationType: "order-validation"
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
          quantity,
          customerReference,
          operationType: "order-validation"
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
      const planSnapshot = PlanSnapshotSchema.parse(
        originalSession.plan_snapshot
      );

      if (!steps.authentication?.userId) {
        throw new Error("Cannot create order without a user ID");
      }

      // Calculate detailed pricing breakdown for the order using the new pricing engine
      const firstCountry = planSnapshot.countries[0] || "";
      const requestFacts: RequestFacts = {
        group: WEB_APP_BUNDLE_GROUP,
        days: planSnapshot.duration,
        paymentMethod: PaymentMethod.IsraeliCard,
        country: firstCountry
      };

      const detailedPricing = await calculatePricing(requestFacts);

      // Step 1: Create Order record using repository with detailed pricing
      // Adapt new pricing format to old format expected by repository
      const pricingBreakdownForOrder = {
        baseCost: detailedPricing.pricing.cost,
        priceAfterDiscount: detailedPricing.pricing.finalPrice,
        finalPrice: detailedPricing.pricing.finalPrice,
        finalRevenue: detailedPricing.pricing.netProfit,
        markup: detailedPricing.pricing.markup,
        maxDiscountPercentage: detailedPricing.pricing.discountRate,
        maxRecommendedPrice: detailedPricing.pricing.finalPrice, // Using finalPrice as there's no costumerPrice field
        processingFee: detailedPricing.pricing.processingCost,
        appliedRules: detailedPricing.appliedRules || [],
        discounts: []
      };
      
      const orderRecord =
        await context.repositories.orders.createOrderWithPricing(
          {
            user_id: steps.authentication.userId,
            total_price: detailedPricing.pricing.finalPrice,
            reference: orderId, // This becomes the order reference
            status: "PROCESSING" as OrderStatus, // Start as PROCESSING, will be updated to COMPLETED after eSIM delivery
            plan_data: planSnapshot, // Store plan info in JSONB field
            quantity: 1,
          },
          pricingBreakdownForOrder as any
        );

      console.log("Order record created:", orderRecord.id);

      // Step 2: Purchase and deliver eSIM using our simplified approach
      await purchaseAndDeliverESIM(
        orderRecord.id,
        planSnapshot.name,
        steps.authentication.userId,
        steps.delivery?.email || "", // Get email from delivery step
        context
      );

      console.log("eSIM purchase and delivery completed");

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
  logger.info("Starting eSIM provisioning", {
    bundleName: planSnapshot.name,
    customerReference,
    operationType: "esim-provisioning"
  });


  try {
    const order = await context.services.esimGoClient.ordersApi.ordersPost({
      contentType: 'application/json',
      orderRequest: {
        type: OrderRequestTypeEnum.TRANSACTION,
        assign: false,
        order: [{
          item: planSnapshot.name,
          quantity: 1,
        }]
      }
    })

    // Extract eSIM details from response
    const iccid = order.data?.order?.[0]?.iccids?.[0];
    const bundle = order.data?.order?.[0]?.item;
    if (!iccid) {
      throw new Error("No eSIM returned from provisioning API");
    }

    logger.info("eSIM created with bundle applied", {
      iccid,
      bundle,
      operationType: "esim-provisioning"
    });

    // Step 2: Get eSIM details including QR code from eSIM Go
    // The apply bundle response doesn't include QR code details, so we need to fetch them
    const esimDetails = await context.dataSources.esims.getESIMInstallDetails(iccid);
    
    if (!esimDetails) {
      throw new Error("Failed to get eSIM installation details");
    }

    logger.info("eSIM details retrieved", {
      iccid,
      hasQR: !!esimDetails.qrCode,
      operationType: "esim-details-fetch"
    });

    return {
      iccid,
      qrCode: esimDetails.qrCode || "",
      matchingId: esimDetails.matchingId || "",
      smdpAddress: esimDetails.smdpAddress || "",
      activationCode: esimDetails.activationCode || esimDetails.matchingId || "",
      activationUrl: esimDetails.activationUrl || null,
      instructions: esimDetails.instructions || generateDefaultInstructions(),
      status: "ASSIGNED",
      esimGoOrderRef: customerReference // Using customer reference as order ref for now
    };
  } catch (error) {
    logger.error("Failed to provision eSIM", error as Error, {
      bundleName: planSnapshot.name,
      customerReference,
      operationType: "esim-provisioning"
    });

    // Re-throw with more context
    if ((error as any).response?.data?.message) {
      throw new Error(`eSIM provisioning failed: ${(error as any).response.data.message}`);
    }
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
