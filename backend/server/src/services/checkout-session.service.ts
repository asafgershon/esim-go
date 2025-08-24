import { env } from "@hiilo/easycard";
import {
  calculatePricing,
  type PricingEngineV2Result,
  type RequestFacts,
} from "@hiilo/rules-engine-2";
import { GraphQLError } from "graphql";
import { getPubSub, PubSubEvents } from "../context/pubsub";
import type { Context } from "../context/types";
import { WEB_APP_BUNDLE_GROUP } from "../lib/constants/bundle-groups";
import { createLogger } from "../lib/logger";
import { CheckoutUpdateType, OrderStatus, PaymentMethod } from "../types";
import { purchaseAndDeliverESIM } from "./esim-purchase";

const logger = createLogger({ component: "checkout-session-service" });

// ===============================================
// TYPES & STATE DEFINITIONS
// ===============================================

export enum CheckoutState {
  INITIALIZED = "INITIALIZED",
  VALIDATED = "VALIDATED",
  AUTHENTICATED = "AUTHENTICATED",
  DELIVERY_SET = "DELIVERY_SET",
  PAYMENT_READY = "PAYMENT_READY",
  PAYMENT_PROCESSING = "PAYMENT_PROCESSING",
  PAYMENT_COMPLETED = "PAYMENT_COMPLETED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  EXPIRED = "EXPIRED",
}

export interface CheckoutSession {
  id: string;
  state: CheckoutState;
  userId?: string;
  bundleId: string;
  pricing: PricingEngineV2Result;
  paymentIntentId?: string;
  orderId?: string;
  expiresAt: string;
  isValidated: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutSessionService {
  createSession: typeof createSession;
  authenticateSession: typeof authenticateSession;
  setDeliveryMethod: typeof setDeliveryMethod;
  preparePayment: typeof preparePayment;
  processPayment: typeof processPayment;
  handlePaymentWebhook: typeof handlePaymentWebhook;
  getSession: (
    sessionId: string,
    options?: { autoRenewPaymentIntent?: boolean }
  ) => Promise<CheckoutSession | null>;
  validateSessionState: typeof validateSessionState;
  cleanupExpiredSessions: typeof cleanupExpiredSessions;
}

// ===============================================
// PURE VALIDATION FUNCTIONS
// ===============================================

const validateSessionCreationInput = (input: {
  countryId?: string;
  regionId?: string;
  numOfDays: number;
  group?: string;
}) => {
  const errors: string[] = [];

  if (!input.numOfDays || input.numOfDays <= 0) {
    errors.push(`Invalid requested duration: ${input.numOfDays}`);
  }

  if (input.numOfDays > 365) {
    errors.push("Cannot request more than 365 days");
  }

  if (!input.countryId && !input.regionId) {
    errors.push("Either countryId or regionId is required");
  }

  if (errors.length > 0) {
    throw new GraphQLError(errors.join(", "), {
      extensions: { code: "VALIDATION_ERROR" },
    });
  }

  return input;
};

const validateStateTransition = (
  currentState: CheckoutState,
  targetState: CheckoutState
): boolean => {
  const validTransitions: Record<CheckoutState, CheckoutState[]> = {
    [CheckoutState.INITIALIZED]: [
      CheckoutState.AUTHENTICATED,
      CheckoutState.EXPIRED,
    ],
    [CheckoutState.AUTHENTICATED]: [
      CheckoutState.DELIVERY_SET,
      CheckoutState.EXPIRED,
    ],
    [CheckoutState.DELIVERY_SET]: [
      CheckoutState.PAYMENT_READY,
      CheckoutState.EXPIRED,
    ],
    [CheckoutState.PAYMENT_READY]: [
      CheckoutState.PAYMENT_PROCESSING,
      CheckoutState.EXPIRED,
    ],
    [CheckoutState.PAYMENT_PROCESSING]: [
      CheckoutState.PAYMENT_COMPLETED,
      CheckoutState.PAYMENT_FAILED,
    ],
    [CheckoutState.PAYMENT_COMPLETED]: [],
    [CheckoutState.PAYMENT_FAILED]: [
      CheckoutState.PAYMENT_READY,
      CheckoutState.EXPIRED,
    ],
    [CheckoutState.EXPIRED]: [],
  };

  return validTransitions[currentState]?.includes(targetState) || false;
};

/**
 * Publishes session updates to subscribed clients
 */
const publishSessionUpdate = async (
  session: CheckoutSession,
  updateType: CheckoutUpdateType,
  context: Context
): Promise<void> => {
  try {
    const pubsub = await getPubSub();
    const channel = `${PubSubEvents.CHECKOUT_SESSION_UPDATED}:${session.id}`;

    // Format session for GraphQL subscription
    const sessionData = {
      __typename: "CheckoutSession",
      id: session.id,
      token: "", // Token not needed in updates
      expiresAt: session.expiresAt,
      isComplete: session.state === CheckoutState.PAYMENT_COMPLETED,
      isValidated: session.isValidated || false,
      timeRemaining: Math.max(
        0,
        Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)
      ),
      createdAt: session.createdAt,
      planSnapshot: session.metadata.planSnapshot,
      pricing: session.pricing,
      steps: mapStateToSteps({
        state: session.state,
        userId: session.userId,
        paymentIntentId: session.paymentIntentId,
        metadata: session.metadata,
      }),
      paymentStatus: mapStateToPaymentStatus(session.state),
      paymentUrl: session.metadata?.paymentIntent?.url || null,
      paymentIntentId: session.paymentIntentId || null,
      orderId: session.orderId || null,
      metadata: session.metadata,
    };

    const update = {
      __typename: "CheckoutSessionUpdate",
      session: sessionData,
      updateType,
      timestamp: new Date().toISOString(),
    };

    await pubsub.publish(channel, {
      checkoutSessionUpdated: update,
    });

    logger.debug("Published checkout session update", {
      sessionId: session.id,
      state: session.state,
      updateType,
      operationType: "pubsub-publish",
    });
  } catch (error) {
    logger.error("Failed to publish checkout session update", error as Error, {
      sessionId: session.id,
      updateType,
      operationType: "pubsub-publish-error",
    });
    // Don't throw - subscription updates are non-critical
  }
};

/**
 * Helper function to map internal state to GraphQL steps format
 */
export const mapStateToSteps = (params: {
  state: CheckoutState;
  userId?: string;
  user?: {
    email?: string;
    firstName: string;
    phoneNumber?: string;
    lastName: string;
    id: string;
  };
  paymentIntent?: {
    id: string;
    url: string;
    applePayJavaScriptUrl: string;
    createdAt: string;
    orderId: string;
  };
  metadata?: any;
}) => {
  const { state, userId, user, paymentIntent, metadata = {} } = params;

  const steps = {
    authentication: {
      completed: false,
      completedAt: undefined as string | undefined,
      userId: undefined as string | undefined,
      email: undefined as string | undefined,
      firstName: undefined as string | undefined,
      lastName: undefined as string | undefined,
      phoneNumber: undefined as string | undefined,
    },
    delivery: {
      completed: false,
      completedAt: undefined as string | undefined,
      method: undefined as string | undefined,
      email: undefined as string | undefined,
      phoneNumber: undefined as string | undefined,
    },
    payment: {
      completed: false,
      completedAt: undefined as string | undefined,
      paymentIntentId: undefined as string | undefined,
      processing: false,
      paymentIntentUrl: undefined as string | undefined,
      paymentIntentApplePayUrl: undefined as string | undefined,
      readyForPayment: false,
    },
  };

  // Map states to steps
  if (state !== CheckoutState.INITIALIZED) {
    steps.authentication.completed = true;
    steps.authentication.completedAt = metadata.authCompletedAt;
    steps.authentication.userId = userId;
    steps.authentication.email = user?.email;
    steps.authentication.firstName = user?.first_name;
    steps.authentication.lastName = user?.last_name;
  }

  if (
    [
      CheckoutState.DELIVERY_SET,
      CheckoutState.PAYMENT_READY,
      CheckoutState.PAYMENT_PROCESSING,
      CheckoutState.PAYMENT_COMPLETED,
    ].includes(state)
  ) {
    steps.delivery.completed = true;
    steps.delivery.completedAt = metadata.deliveryCompletedAt;
    steps.delivery.method = metadata.delivery?.method;
    steps.delivery.email = metadata.delivery?.email;
    steps.delivery.phoneNumber = metadata.delivery?.phoneNumber;
  }

  if (state === CheckoutState.PAYMENT_READY) {
    steps.payment.readyForPayment = true;
    steps.payment.paymentIntentId = paymentIntent?.id;
    steps.payment.paymentIntentUrl = paymentIntent?.url;
    steps.payment.paymentIntentApplePayUrl =
      paymentIntent?.applePayJavaScriptUrl;
  }

  if (state === CheckoutState.PAYMENT_PROCESSING) {
    steps.payment.processing = true;
  }

  if (state === CheckoutState.PAYMENT_COMPLETED) {
    steps.payment.completed = true;
    steps.payment.completedAt = metadata.paymentCompletedAt;
    steps.payment.paymentIntentId = paymentIntent?.id;
  }

  return steps;
};

/**
 * Maps internal state to GraphQL payment status
 */
const mapStateToPaymentStatus = (state: CheckoutState): string => {
  switch (state) {
    case CheckoutState.PAYMENT_PROCESSING:
      return "PROCESSING";
    case CheckoutState.PAYMENT_COMPLETED:
      return "COMPLETED";
    case CheckoutState.PAYMENT_FAILED:
      return "FAILED";
    default:
      return "PENDING";
  }
};

// ===============================================
// CORE SERVICE FUNCTIONS
// ===============================================

/**
 * Creates a new checkout session with validated input and calculated pricing
 */
export const createSession = async (
  context: Context,
  input: {
    countryId?: string;
    regionId?: string;
    numOfDays: number;
    group?: string;
    userId?: string;
  }
): Promise<CheckoutSession> => {
  logger.info("Creating checkout session", { input });

  // Validate input using pure function
  const validInput = validateSessionCreationInput(input);

  // Build search parameters
  const searchParams = {
    minValidityInDays: 1,
    groups: [input.group || WEB_APP_BUNDLE_GROUP],
    ...(validInput.countryId && { countries: [validInput.countryId] }),
    ...(validInput.regionId && { regions: [validInput.regionId] }),
  };

  // Fetch available bundles
  const bundleResults = await context.repositories.bundles.search(searchParams);

  if (!bundleResults?.data || bundleResults.data.length === 0) {
    throw new GraphQLError(`No bundles available for the specified location`, {
      extensions: { code: "NO_BUNDLES_AVAILABLE" },
    });
  }

  // Calculate pricing
  const requestFacts: RequestFacts = {
    group: input.group || WEB_APP_BUNDLE_GROUP,
    days: validInput.numOfDays,
    paymentMethod: PaymentMethod.IsraeliCard,
    ...(validInput.countryId
      ? { country: validInput.countryId }
      : { region: validInput.regionId || "" }),
  };

  const pricingResult = await calculatePricing(requestFacts);

  if (!pricingResult?.selectedBundle) {
    throw new GraphQLError("No suitable bundle found for pricing", {
      extensions: { code: "PRICING_ERROR" },
    });
  }

  // Create plan snapshot for backward compatibility
  const planSnapshot = {
    id: pricingResult.selectedBundle.esim_go_name,
    name: pricingResult.selectedBundle.esim_go_name,
    duration: pricingResult.selectedBundle.validity_in_days,
    price: pricingResult.pricing.finalPrice,
    currency: "USD",
    countries: pricingResult.selectedBundle.countries,
  };

  // Create session in database
  const sessionData = {
    user_id: input.userId,
    plan_id: pricingResult.selectedBundle.esim_go_name,
    plan_snapshot: JSON.stringify(planSnapshot),
    pricing: pricingResult as any,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    state: CheckoutState.INITIALIZED, // Store state in database column
    steps: mapStateToSteps({
      state: CheckoutState.INITIALIZED,
      userId: input.userId,
      metadata: {},
    }),
    metadata: {
      requestedDays: validInput.numOfDays,
      actualDays: pricingResult.selectedBundle.validity_in_days,
      countries: pricingResult.selectedBundle.countries,
      group: input.group || WEB_APP_BUNDLE_GROUP,
      planSnapshot, // Store for easy access
      isValidated: false, // Initialize as not validated
    } as any,
  };

  const session = await context.repositories.checkoutSessions.create(
    sessionData
  );

  logger.info("Session created successfully", { sessionId: session.id });

  const mappedSession = mapDatabaseSessionToModel(session);

  // Publish initial state
  await publishSessionUpdate(
    mappedSession,
    CheckoutUpdateType.StepCompleted,
    context
  );

  // Start async validation (don't await)
  validateSessionOrder(context, session.id, planSnapshot.name || "")
    .then(() => {
      logger.info("Session validation completed", { sessionId: session.id });
    })
    .catch((error) => {
      logger.error("Session validation failed", error as Error, {
        sessionId: session.id,
      });
    });

  return mappedSession;
};

/**
 * Validates a session's order with eSIM Go API
 */
const validateSessionOrder = async (
  context: Context,
  sessionId: string,
  bundleName: string
): Promise<void> => {
  try {
    logger.info("Starting session order validation", { sessionId, bundleName });

    // Call eSIM Go API to validate the order
    const { BundleOrderTypeEnum, OrderRequestTypeEnum } = await import(
      "@hiilo/esim-go"
    );

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

    const response = await context.services.esimGoClient.ordersApi.ordersPost({
      orderRequest,
    });

    const isValid = Number(response.data.total) > 0;

    // Update session with validation result
    const session = await context.repositories.checkoutSessions.getById(
      sessionId
    );

    if (!session) {
      logger.warn("Session not found for validation update", { sessionId });
      return;
    }

    const updatedMetadata = {
      ...(session.metadata as any),
      isValidated: isValid,
      validationDetails: isValid
        ? {
            bundleDetails: response.data.order?.[0] || null,
            totalPrice: response.data.total || null,
            currency: response.data.currency || "USD",
          }
        : {
            error: "Order validation failed",
          },
    } as any;

    await context.repositories.checkoutSessions.update(sessionId, {
      metadata: updatedMetadata,
    });

    // Get updated session for publishing
    const updatedSession = await context.repositories.checkoutSessions.getById(
      sessionId
    );

    if (updatedSession) {
      const mappedSession = mapDatabaseSessionToModel(updatedSession);

      // Publish validation update
      await publishSessionUpdate(
        mappedSession,
        CheckoutUpdateType.StepCompleted,
        context
      );
    }

    logger.info("Session order validation completed", {
      sessionId,
      isValid,
      totalPrice: response.data.total,
    });
  } catch (error) {
    logger.error("Failed to validate session order", error as Error, {
      sessionId,
      bundleName,
    });

    // Update session to mark validation as failed
    try {
      const session = await context.repositories.checkoutSessions.getById(
        sessionId
      );
      if (session) {
        await context.repositories.checkoutSessions.update(sessionId, {
          metadata: {
            ...session.metadata,
            isValidated: false,
            validationError:
              error instanceof Error ? error.message : "Validation failed",
          } as any,
        });
      }
    } catch (updateError) {
      logger.error(
        "Failed to update session after validation error",
        updateError as Error,
        {
          sessionId,
        }
      );
    }
  }
};

/**
 * Authenticates a session and prepares payment intent
 */
export const authenticateSession = async (
  context: Context,
  sessionId: string,
  userId: string
): Promise<CheckoutSession> => {
  try {
    // Get current session
    const session = await context.repositories.checkoutSessions.getById(
      sessionId
    );

    if (!session) {
      throw new GraphQLError("Session not found", {
        extensions: { code: "SESSION_NOT_FOUND" },
      });
    }

    const currentState =
      (session.metadata as any)?.state || CheckoutState.INITIALIZED;

    // Validate state transition
    if (!validateStateTransition(currentState, CheckoutState.AUTHENTICATED)) {
      throw new GraphQLError(
        `Cannot authenticate session in state: ${currentState}`,
        { extensions: { code: "INVALID_STATE_TRANSITION" } }
      );
    }

    // Get user details for payment (if user exists)
    let user;
    try {
      user = await context.repositories.users.getById(userId);
    } catch (error) {
      // User table might not exist or user not found
      logger.debug("Could not fetch user, using placeholder data", {
        userId,
        error,
      });
      user = null;
    }

    // For anonymous users or when user doesn't exist yet, use placeholder data
    const userEmail = user?.email;
    const userFirstName = user?.first_name;
    const userLastName = user?.last_name;

    if (!userFirstName && !userLastName) {
      throw new GraphQLError("User first name and last name are required", {
        extensions: { code: "USER_NAME_REQUIRED" },
      });
    }

    // Update session with authentication
    const updatedSession = await context.repositories.checkoutSessions.update(
      sessionId,
      {
        state: CheckoutState.AUTHENTICATED, // Update state column
        user_id: userId,
        steps: mapStateToSteps({
          user: {
            email: userEmail,
            firstName: userFirstName,
            lastName: userLastName,
            id: userId,
          },
          state: CheckoutState.AUTHENTICATED,
          userId,
          metadata: {
            authCompletedAt: new Date().toISOString(),
          },
        }),
        metadata: {
          ...session.metadata,
          state: CheckoutState.AUTHENTICATED,
          authCompletedAt: new Date().toISOString(),
        } as any,
      }
    );

    logger.info("Session authenticated", { sessionId, userId });

    const mappedSession = mapDatabaseSessionToModel(updatedSession);

    // Publish update
    await publishSessionUpdate(
      mappedSession,
      CheckoutUpdateType.StepCompleted,
      context
    );

    return mappedSession;
  } catch (error) {
    logger.error("Failed to authenticate session", error as Error, {
      sessionId,
      userId,
    });
    throw error;
  }
};

/**
 * Sets delivery method for the checkout session
 */
export const setDeliveryMethod = async (
  context: Context,
  sessionId: string,
  deliveryData: {
    method: "EMAIL" | "SMS" | "BOTH" | "QR";
    email?: string;
    phoneNumber?: string;
  }
): Promise<CheckoutSession> => {
  try {
    const session = await context.repositories.checkoutSessions.getById(
      sessionId
    );

    if (!session) {
      throw new GraphQLError("Session not found", {
        extensions: { code: "SESSION_NOT_FOUND" },
      });
    }

    const currentState =
      (session.metadata as any)?.state || CheckoutState.INITIALIZED;

    // Validate we're in the right state
    // if (currentState !== CheckoutState.AUTHENTICATED) {
    //   throw new GraphQLError(
    //     `Cannot set delivery method in state: ${currentState}`,
    //     { extensions: { code: "INVALID_STATE_TRANSITION" } }
    //   );
    // }

    // // Validate delivery data
    // if (
    //   (deliveryData.method === "EMAIL" || deliveryData.method === "BOTH") &&
    //   !deliveryData.email
    // ) {
    //   throw new GraphQLError("Email required for email delivery", {
    //     extensions: { code: "VALIDATION_ERROR" },
    //   });
    // }

    // if (
    //   (deliveryData.method === "SMS" || deliveryData.method === "BOTH") &&
    //   !deliveryData.phoneNumber
    // ) {
    //   throw new GraphQLError("Phone number required for SMS delivery", {
    //     extensions: { code: "VALIDATION_ERROR" },
    //   });
    // }

    // Update session
    const updatedSession = await context.repositories.checkoutSessions.update(
      sessionId,
      {
        state: CheckoutState.DELIVERY_SET, // Update state column
        steps: mapStateToSteps({
          state: CheckoutState.DELIVERY_SET,
          userId: session.user_id || undefined,
          metadata: {
            authCompletedAt: (session.metadata as any)?.authCompletedAt,
            deliveryCompletedAt: new Date().toISOString(),
            delivery: deliveryData,
          },
        }),
        metadata: {
          ...session.metadata,
          state: CheckoutState.DELIVERY_SET,
          deliveryCompletedAt: new Date().toISOString(),
          delivery: {
            method: deliveryData.method,
            email: deliveryData.email,
            phoneNumber: deliveryData.phoneNumber,
            setAt: new Date().toISOString(),
          },
        } as any,
      }
    );

    logger.info("Delivery method set", {
      sessionId,
      method: deliveryData.method,
    });

    const mappedSession = mapDatabaseSessionToModel(updatedSession);

    // Publish update for delivery step completion
    await publishSessionUpdate(
      mappedSession,
      CheckoutUpdateType.StepCompleted,
      context
    );

    // Automatically prepare payment after delivery is set
    logger.info("Automatically preparing payment after delivery", {
      sessionId,
    });

    const paymentReadySession = await preparePayment(context, sessionId);

    return paymentReadySession;
  } catch (error) {
    logger.error("Failed to set delivery method", error as Error, {
      sessionId,
    });
    throw error;
  }
};

/**
 * Prepares session for payment
 */
export const preparePayment = async (
  context: Context,
  sessionId: string
): Promise<CheckoutSession> => {
  try {
    const session = await context.repositories.checkoutSessions.getById(
      sessionId
    );

    if (!session) {
      throw new GraphQLError("Session not found", {
        extensions: { code: "SESSION_NOT_FOUND" },
      });
    }
    const userId = session.user_id || "";
    const user = (await context.repositories.users.getById(userId)) || {};

    if (!user) {
      throw new GraphQLError("User not found", {
        extensions: { code: "USER_NOT_FOUND" },
      });
    }

    const { email, first_name, last_name } = user;

    // Parse plan snapshot
    const planSnapshot =
      typeof session.plan_snapshot === "string"
        ? JSON.parse(session.plan_snapshot)
        : session.plan_snapshot;

    // Create payment intent
    const orderId = `order_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;
    const redirectUrl = `${
      env.isDev
        ? "https://hiilo.loca.lt"
        : process.env.NEXT_PUBLIC_APP_URL || "https://hiilo.loca.lt"
    }/payment/callback?sessionId=${sessionId}`;

    const paymentResult =
      await context.services.easycardPayment.createPaymentIntent({
        amount: planSnapshot.price,
        currency: "USD",
        description: `eSIM purchase: ${planSnapshot.name}`,
        costumer: {
          id: userId,
          email,
          firstName: first_name,
          lastName: last_name,
        },
        item: {
          id: planSnapshot.id,
          name: planSnapshot.name,
          price: planSnapshot.price,
          discount: 0,
          duration: planSnapshot.duration,
          currency: "USD",
          countries: planSnapshot.countries,
        },
        order: {
          id: orderId,
          reference: orderId,
        },
        redirectUrl,
        metadata: {
          sessionId,
          planId: session.plan_id,
          idempotencyKey: `session-${sessionId}-auth`,
        },
      });

    if (!paymentResult.success || !paymentResult.payment_intent) {
      throw new GraphQLError("Failed to create payment intent", {
        extensions: { code: "PAYMENT_INTENT_ERROR" },
      });
    }

    const paymentIntent = paymentResult.payment_intent as any;
    const paymentIntentId =
      paymentIntent.entityUID || paymentIntent.entityReference;

    const currentState =
      (session.metadata as any)?.state || CheckoutState.INITIALIZED;

    // Validate state
    if (currentState !== CheckoutState.DELIVERY_SET) {
      throw new GraphQLError(
        `Cannot prepare payment in state: ${currentState}`,
        { extensions: { code: "INVALID_STATE_TRANSITION" } }
      );
    }

    // Update to payment ready
    const updatedSession = await context.repositories.checkoutSessions.update(
      sessionId,
      {
        state: CheckoutState.PAYMENT_READY, // Update state column
        steps: mapStateToSteps({
          state: CheckoutState.PAYMENT_READY,
          userId: session.user_id || undefined,
          paymentIntent: {
            id: paymentIntentId,
            url: paymentIntent.additionalData?.url,
            applePayJavaScriptUrl:
              paymentIntent.additionalData?.applePayJavaScriptUrl,
            createdAt: new Date().toISOString(),
            orderId,
          },
          metadata: session.metadata,
        }),
        metadata: {
          ...(session.metadata as any),
          state: CheckoutState.PAYMENT_READY,
        } as any,
      }
    );

    logger.info("Payment prepared", { sessionId });

    const mappedSession = mapDatabaseSessionToModel(updatedSession);

    // Publish update
    await publishSessionUpdate(
      mappedSession,
      CheckoutUpdateType.StepCompleted,
      context
    );

    return mappedSession;
  } catch (error) {
    logger.error("Failed to prepare payment", error as Error, { sessionId });
    throw error;
  }
};

/**
 * Processes payment for a checkout session
 */
export const processPayment = async (
  context: Context,
  sessionId: string
): Promise<{
  success: boolean;
  orderId?: string;
  error?: string;
}> => {
  try {
    const session = await context.repositories.checkoutSessions.getById(
      sessionId
    );

    if (!session) {
      throw new GraphQLError("Session not found", {
        extensions: { code: "SESSION_NOT_FOUND" },
      });
    }

    const currentState =
      (session.metadata as any)?.state || CheckoutState.INITIALIZED;

    // Check if already completed
    if (currentState === CheckoutState.PAYMENT_COMPLETED) {
      return {
        success: true,
        orderId: session.order_id || undefined,
      };
    }

    // Validate state
    if (currentState !== CheckoutState.PAYMENT_READY) {
      throw new GraphQLError(
        `Cannot process payment in state: ${currentState}`,
        { extensions: { code: "INVALID_STATE_TRANSITION" } }
      );
    }

    // Update to processing state
    await context.repositories.checkoutSessions.update(sessionId, {
      state: CheckoutState.PAYMENT_PROCESSING, // Update state column
      payment_status: "PROCESSING",
      metadata: {
        ...session.metadata,
        state: CheckoutState.PAYMENT_PROCESSING,
      } as any,
    });

    const processingSession = mapDatabaseSessionToModel({
      ...session,
      metadata: {
        ...session.metadata,
        state: CheckoutState.PAYMENT_PROCESSING,
      },
    });

    // Publish processing update
    await publishSessionUpdate(
      processingSession,
      CheckoutUpdateType.PaymentProcessing,
      context
    );

    // For now, simulate payment success (in production, this would wait for webhook)
    // The actual payment processing happens via webhook
    logger.info("Payment processing initiated", {
      sessionId,
      paymentIntentId: session.payment_intent_id,
    });

    return {
      success: true,
      orderId: undefined, // Will be set by webhook
      error: undefined,
    };
  } catch (error) {
    logger.error("Failed to process payment", error as Error, { sessionId });
    throw error;
  }
};

/**
 * Handles payment webhook from payment provider
 */
export const handlePaymentWebhook = async (
  context: Context,
  paymentIntentId: string,
  status: "succeeded" | "failed",
  webhookData: any
): Promise<void> => {
  logger.info("Processing payment webhook", { paymentIntentId, status });

  // Find session by payment intent
  const session =
    await context.repositories.checkoutSessions.findByPaymentIntent(
      paymentIntentId
    );

  if (!session) {
    logger.warn("No session found for payment intent", { paymentIntentId });
    return;
  }

  try {
    const currentState =
      (session.metadata as any)?.state || CheckoutState.INITIALIZED;

    if (status === "succeeded") {
      // Only process if we're in the right state
      if (
        currentState === CheckoutState.PAYMENT_PROCESSING ||
        currentState === CheckoutState.PAYMENT_READY
      ) {
        await completeCheckout(context, session);
      }
    } else {
      // Payment failed
      if (currentState === CheckoutState.PAYMENT_PROCESSING) {
        const failedSession =
          await context.repositories.checkoutSessions.update(session.id, {
            state: CheckoutState.PAYMENT_FAILED, // Update state column
            payment_status: "FAILED",
            metadata: {
              ...session.metadata,
              state: CheckoutState.PAYMENT_FAILED,
              webhookError: webhookData,
            } as any,
          });

        const mappedSession = mapDatabaseSessionToModel(failedSession);
        await publishSessionUpdate(
          mappedSession,
          CheckoutUpdateType.PaymentFailed,
          context
        );
      }
    }
  } catch (error) {
    logger.error("Failed to handle payment webhook", error as Error, {
      paymentIntentId,
      sessionId: session.id,
    });
    throw error;
  }
};

/**
 * Check if payment intent needs renewal
 */
const checkPaymentIntentNeedsRenewal = async (
  context: Context,
  session: any
): Promise<boolean> => {
  // No payment intent exists
  if (!session.payment_intent_id) {
    return true;
  }

  // Check if payment intent metadata indicates expiry
  const paymentIntentMeta = (session.metadata as any)?.paymentIntent;
  if (!paymentIntentMeta) {
    return true;
  }

  // Check if payment intent is older than 25 minutes (EasyCard intents expire after 30 mins)
  const createdAt = new Date(paymentIntentMeta.createdAt);
  const ageInMinutes = (Date.now() - createdAt.getTime()) / (1000 * 60);

  if (ageInMinutes > 25) {
    logger.info("Payment intent is expiring soon", {
      sessionId: session.id,
      ageInMinutes,
      paymentIntentId: session.payment_intent_id,
    });
    return true;
  }

  return false;
};

/**
 * Renew payment intent for a session
 */
const renewPaymentIntent = async (
  context: Context,
  session: any
): Promise<any> => {
  try {
    // Get user details (if user exists)
    let user;
    try {
      user = await context.repositories.users.getById(session.user_id);
    } catch (error) {
      // User table might not exist or user not found
      logger.debug("Could not fetch user for renewal, using placeholder data", {
        userId: session.user_id,
        error,
      });
      user = null;
    }

    // For anonymous users or when user doesn't exist yet, use placeholder data
    const userEmail = user?.email;
    const userFirstName = user?.first_name;
    const userLastName = user?.last_name;

    if (!userFirstName && !userLastName) {
      throw new GraphQLError("User first name and last name are required", {
        extensions: { code: "USER_NAME_REQUIRED" },
      });
    }

    // Parse plan snapshot
    const planSnapshot =
      typeof session.plan_snapshot === "string"
        ? JSON.parse(session.plan_snapshot)
        : session.plan_snapshot;

    // Create new payment intent
    const orderId = `order_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;
    const redirectUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/payment/callback?sessionId=${session.id}`;

    const paymentResult =
      await context.services.easycardPayment.createPaymentIntent({
        amount: planSnapshot.price,
        currency: "USD",
        description: `Hiilo eSIM - ${planSnapshot.name}`,
        costumer: {
          id: session.user_id,
          email: userEmail,
          firstName: userFirstName,
          lastName: userLastName,
        },
        item: {
          id: planSnapshot.id,
          name: planSnapshot.name,
          price: planSnapshot.price,
          discount: 0,
          duration: planSnapshot.duration,
          currency: "USD",
          countries: planSnapshot.countries,
        },
        order: {
          id: orderId,
          reference: orderId,
        },
        redirectUrl,
        metadata: {
          sessionId: session.id,
          planId: session.plan_id,
        },
        idempotencyKey: `session-${session.id}-renewal-${Date.now()}`,
      });

    if (!paymentResult.success || !paymentResult.payment_intent) {
      throw new GraphQLError("Failed to renew payment intent", {
        extensions: { code: "PAYMENT_INTENT_ERROR" },
      });
    }

    const paymentIntent = paymentResult.payment_intent as any;
    const paymentIntentId =
      paymentIntent.entityUID || paymentIntent.entityReference;

    // Update session with new payment intent
    const updatedSession = await context.repositories.checkoutSessions.update(
      session.id,
      {
        payment_intent_id: paymentIntentId,
        metadata: {
          ...session.metadata,
          paymentIntent: {
            id: paymentIntentId,
            url: paymentIntent.additionalData?.url,
            applePayJavaScriptUrl:
              paymentIntent.additionalData?.applePayJavaScriptUrl,
            createdAt: new Date().toISOString(),
            orderId,
            renewed: true,
            renewedAt: new Date().toISOString(),
          },
        } as any,
      }
    );

    logger.info("Payment intent renewed successfully", {
      sessionId: session.id,
      oldPaymentIntentId: session.payment_intent_id,
      newPaymentIntentId: paymentIntentId,
    });

    return updatedSession;
  } catch (error) {
    logger.error("Failed to renew payment intent", error as Error, {
      sessionId: session.id,
    });
    throw error;
  }
};

/**
 * Get session by ID with automatic payment intent renewal
 */
export const getSession = async (
  context: Context,
  sessionId: string,
  options?: { autoRenewPaymentIntent?: boolean }
): Promise<CheckoutSession | null> => {
  const session = await context.repositories.checkoutSessions.getById(
    sessionId
  );

  if (!session) {
    return null;
  }

  // Auto-renew payment intent if needed
  if (options?.autoRenewPaymentIntent && session.user_id) {
    const currentState =
      session.state ||
      (session.metadata as any)?.state ||
      CheckoutState.INITIALIZED;

    // Check if we need to create/renew payment intent
    if (
      currentState === CheckoutState.AUTHENTICATED ||
      currentState === CheckoutState.DELIVERY_SET ||
      currentState === CheckoutState.PAYMENT_READY
    ) {
      const needsRenewal = await checkPaymentIntentNeedsRenewal(
        context,
        session
      );

      if (needsRenewal) {
        logger.info("Auto-renewing payment intent for session", { sessionId });

        try {
          const renewedSession = await renewPaymentIntent(context, session);
          return mapDatabaseSessionToModel(renewedSession);
        } catch (error) {
          logger.error("Failed to auto-renew payment intent", error as Error, {
            sessionId,
          });
          // Return session as-is if renewal fails
        }
      }
    }
  }

  return mapDatabaseSessionToModel(session);
};

/**
 * Validate session is in expected state
 */
export const validateSessionState = async (
  context: Context,
  sessionId: string,
  expectedState: CheckoutState
): Promise<boolean> => {
  const session = await getSession(context, sessionId);

  if (!session) {
    return false;
  }

  return session.state === expectedState;
};

// ===============================================
// HELPER FUNCTIONS
// ===============================================

const completeCheckout = async (
  context: Context,
  session: any
): Promise<{ orderId: string }> => {
  // Parse plan snapshot
  const planSnapshot =
    typeof session.plan_snapshot === "string"
      ? JSON.parse(session.plan_snapshot)
      : session.plan_snapshot;

  const pricing = session.pricing as PricingEngineV2Result;

  // Create order
  const orderRecord = await context.repositories.orders.createOrderWithPricing(
    {
      user_id: session.user_id,
      total_price: pricing.pricing.finalPrice,
      reference:
        (session.metadata as any)?.paymentIntent?.orderId ||
        `order_${session.id}`,
      status: OrderStatus.Processing,
      plan_data: planSnapshot,
      quantity: 1,
    },
    {
      baseCost: pricing.pricing.cost,
      priceAfterDiscount: pricing.pricing.finalPrice,
      finalPrice: pricing.pricing.finalPrice,
      finalRevenue: pricing.pricing.netProfit,
      markup: pricing.pricing.markup,
      maxDiscountPercentage: pricing.pricing.discountRate,
      maxRecommendedPrice: pricing.pricing.finalPrice,
      processingFee: pricing.pricing.processingCost,
      appliedRules: pricing.appliedRules || [],
      discounts: [],
    } as any
  );

  logger.info("Order created", {
    orderId: orderRecord.id,
    sessionId: session.id,
  });

  // Purchase and deliver eSIM
  await purchaseAndDeliverESIM(
    orderRecord.id,
    planSnapshot.name,
    session.user_id,
    (session.metadata as any)?.delivery?.email || "",
    context
  );

  logger.info("eSIM provisioned", { orderId: orderRecord.id });

  // Update session to completed
  const completedSession =
    await context.repositories.checkoutSessions.markCompleted(session.id, {
      orderId: orderRecord.id,
      orderReference: (session.metadata as any)?.paymentIntent?.orderId,
    });

  // Update metadata with completion info
  await context.repositories.checkoutSessions.update(session.id, {
    state: CheckoutState.PAYMENT_COMPLETED, // Update state column
    metadata: {
      ...session.metadata,
      state: CheckoutState.PAYMENT_COMPLETED,
      paymentCompletedAt: new Date().toISOString(),
      orderId: orderRecord.id,
    } as any,
  });

  const mappedSession = mapDatabaseSessionToModel({
    ...completedSession,
    metadata: {
      ...completedSession.metadata,
      state: CheckoutState.PAYMENT_COMPLETED,
      paymentCompletedAt: new Date().toISOString(),
    },
  });

  // Publish completion update
  await publishSessionUpdate(
    mappedSession,
    CheckoutUpdateType.PaymentCompleted,
    context
  );

  // Send notifications (outside transaction)
  await sendCompletionNotifications(context, session, orderRecord.id);

  logger.info("Checkout completed", {
    sessionId: session.id,
    orderId: orderRecord.id,
  });

  return { orderId: orderRecord.id };
};

const sendCompletionNotifications = async (
  context: Context,
  session: any,
  orderId: string
): Promise<void> => {
  try {
    const deliveryMethod = (session.metadata as any)?.delivery;

    if (deliveryMethod?.email) {
      // TODO: Send email notification
      logger.info("Email notification queued", {
        email: deliveryMethod.email,
        orderId,
      });
    }

    if (deliveryMethod?.phoneNumber) {
      // TODO: Send SMS notification
      logger.info("SMS notification queued", {
        phoneNumber: deliveryMethod.phoneNumber,
        orderId,
      });
    }
  } catch (error) {
    // Log but don't fail the checkout
    logger.error("Failed to send notifications", {
      error,
      sessionId: session.id,
    });
  }
};

const mapDatabaseSessionToModel = (dbSession: any): CheckoutSession => {
  const metadata = dbSession.metadata || {};
  // Read state from database column
  const state = dbSession.state || CheckoutState.INITIALIZED;

  return {
    id: dbSession.id,
    state: state as CheckoutState,
    userId: dbSession.user_id,
    bundleId: dbSession.plan_id,
    pricing: dbSession.pricing,
    paymentIntentId: dbSession.payment_intent_id,
    orderId: dbSession.order_id,
    expiresAt: dbSession.expires_at,
    isValidated: metadata.isValidated || false,
    metadata: metadata,
    createdAt: dbSession.created_at,
    updatedAt: dbSession.updated_at,
  };
};

/**
 * Cleanup expired sessions periodically
 */
export const cleanupExpiredSessions = async (
  context: Context
): Promise<number> => {
  const expiredSessions =
    await context.repositories.checkoutSessions.findExpired();

  let cleanedCount = 0;
  for (const session of expiredSessions) {
    const currentState = session.state || CheckoutState.INITIALIZED;

    if (currentState !== CheckoutState.PAYMENT_COMPLETED) {
      await context.repositories.checkoutSessions.update(session.id, {
        state: CheckoutState.EXPIRED,
        metadata: {
          ...session.metadata,
        } as any,
      });
      cleanedCount++;
    }
  }

  logger.info(`Cleaned up ${cleanedCount} expired sessions`);
  return cleanedCount;
};

// ===============================================
// CREATE SERVICE SINGLETON
// ===============================================

let serviceInstance: CheckoutSessionService | null = null;

export const createCheckoutSessionService = (
  context: Context
): CheckoutSessionService => {
  if (!serviceInstance) {
    serviceInstance = {
      createSession: (input) => createSession(context, input),
      authenticateSession: (sessionId, userId) =>
        authenticateSession(context, sessionId, userId),
      setDeliveryMethod: (sessionId, data) =>
        setDeliveryMethod(context, sessionId, data),
      preparePayment: (sessionId) => preparePayment(context, sessionId),
      processPayment: (sessionId) => processPayment(context, sessionId),
      handlePaymentWebhook: (intentId, status, data) =>
        handlePaymentWebhook(context, intentId, status, data),
      getSession: (sessionId, options) =>
        getSession(context, sessionId, options),
      validateSessionState: (sessionId, expectedState) =>
        validateSessionState(context, sessionId, expectedState),
      cleanupExpiredSessions: () => cleanupExpiredSessions(context),
    };
  }

  return serviceInstance;
};

// Export for use in resolvers
export default createCheckoutSessionService;
