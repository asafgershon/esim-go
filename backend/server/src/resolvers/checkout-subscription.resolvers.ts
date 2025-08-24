import { GraphQLError } from "graphql";
import { withFilter } from "graphql-subscriptions";
import jwt from "jsonwebtoken";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import { getPubSub, PubSubEvents } from "../context/pubsub";
import {
  createCheckoutSessionService,
  CheckoutState,
} from "../services/checkout-session.service";
import type {
  SubscriptionResolvers,
  CheckoutSessionUpdate,
  CheckoutUpdateType,
  CheckoutSession,
} from "../types";
import { getCheckoutTokenService } from "../services/checkout-token.service";
import { create } from "node:domain";

const logger = createLogger({
  component: "CheckoutSubscriptionResolvers",
  operationType: "graphql-subscription",
});

const checkoutTokenService = getCheckoutTokenService();
// Validate and decode checkout token

// Format session for subscription response
function formatSessionForSubscription(
  session: any,
  token: string
): CheckoutSession {
  const planSnapshot =
    session.metadata?.planSnapshot ||
    (typeof session.plan_snapshot === "string"
      ? JSON.parse(session.plan_snapshot)
      : session.plan_snapshot);

  // Import mapStateToSteps from the service
  const { mapStateToSteps } = require("../services/checkout-session.service");

  // Generate steps from the current state
  const steps = mapStateToSteps({
    state:
      session.state || session.metadata?.state || CheckoutState.INITIALIZED,
    userId: session.user_id || session.userId,
    paymentIntentId: session.payment_intent_id || session.paymentIntentId,
    metadata: session.metadata || {},
  });

  // Extract payment URL from metadata (same as regular checkout resolver)
  const paymentUrl = (session.metadata as any)?.paymentIntent?.url || null;
  const paymentIntentId =
    session.payment_intent_id || session.paymentIntentId || null;

  return {
    __typename: "CheckoutSession",
    id: session.id,
    token,
    expiresAt: session.expiresAt || session.expires_at,
    isComplete: session.state === CheckoutState.PAYMENT_COMPLETED,
    timeRemaining: Math.max(
      0,
      Math.floor(
        (new Date(session.expiresAt || session.expires_at).getTime() -
          Date.now()) /
          1000
      )
    ),
    createdAt: session.createdAt || session.created_at,
    planSnapshot,
    pricing: session.pricing,
    steps: steps || session.metadata?.steps || session.steps, // Fallback to stored steps if mapStateToSteps fails
    paymentStatus: mapStateToPaymentStatus(
      session.state || session.metadata?.state || CheckoutState.INITIALIZED
    ),
    paymentUrl,
    paymentIntentId,
    orderId: session.orderId || session.order_id || null,
    metadata: session.metadata,
    isValidated: Boolean(session.metadata?.isValidated),
  } as CheckoutSession;
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

export const checkoutSubscriptions: SubscriptionResolvers = {
  /**
   * Real-time checkout session updates subscription
   * Streams updates whenever the checkout session changes
   */
  checkoutSessionUpdated: {
    subscribe: withFilter(
      async (_, { token }: { token: string }, context: Context) => {
        logger.info("Setting up checkout session subscription", {
          operationType: "subscription-setup",
        });

        try {

          const service = createCheckoutSessionService(context);

          // Validate token and extract session info
          const { sessionId } = checkoutTokenService.validateToken(token);

          // Validate session exists using the service
          const session = await service.getSession(sessionId);

          if (!session) {
            throw new GraphQLError("Session not found or expired", {
              extensions: { code: "SESSION_NOT_FOUND" },
            });
          }

          // Create a channel specific to this session
          const channel = `${PubSubEvents.CHECKOUT_SESSION_UPDATED}:${sessionId}`;

          // Format session for GraphQL and emit initial state
          const sessionData = formatSessionForSubscription(session, token);

          const initialUpdate: CheckoutSessionUpdate = {
            __typename: "CheckoutSessionUpdate",
            session: sessionData,
            updateType: "INITIAL" as CheckoutUpdateType,
            timestamp: new Date().toISOString(),
          };

          // Use setImmediate to emit the initial state after subscription is established
          setImmediate(async () => {
            await context.services.pubsub.publish(channel, {
              checkoutSessionUpdated: initialUpdate,
            });

            logger.debug("Published initial session state", {
              sessionId,
              state: session.state,
              operationType: "subscription-initial-state",
            });
          });

          logger.info("Checkout subscription setup successful", {
            sessionId,
            channel,
            state: session.state,
            operationType: "subscription-setup-success",
          });

          // Return the async iterator for this specific session
          return context.services.pubsub.asyncIterator(channel);
        } catch (error) {
          logger.error(
            "Failed to setup checkout subscription",
            error as Error,
            {
              operationType: "subscription-setup-error",
            }
          );

          if (error instanceof GraphQLError) {
            throw error;
          }

          throw new GraphQLError(
            "Failed to setup checkout session subscription",
            {
              extensions: {
                code: "SUBSCRIPTION_SETUP_FAILED",
                originalError:
                  error instanceof Error ? error.message : String(error),
              },
            }
          );
        }
      },
      // Filter to ensure the update is for the correct session
      (
        payload: { checkoutSessionUpdated: CheckoutSessionUpdate },
        variables: { token: string }
      ) => {
        try {
          const { sessionId } = checkoutTokenService.validateToken(
            variables.token
          );
          return payload.checkoutSessionUpdated.session.id === sessionId;
        } catch {
          return false;
        }
      }
    ),
  },
};

// Helper function to publish checkout session updates
// This is now mostly handled by the service, but kept for backward compatibility
export async function publish(
  sessionId: string,
  session: CheckoutSession,
  updateType: CheckoutUpdateType
): Promise<void> {
  try {
    const pubsub = await getPubSub();
    const channel = `${PubSubEvents.CHECKOUT_SESSION_UPDATED}:${sessionId}`;

    const update: CheckoutSessionUpdate = {
      __typename: "CheckoutSessionUpdate",
      session,
      updateType,
      timestamp: new Date().toISOString(),
    };

    await pubsub.publish(channel, {
      checkoutSessionUpdated: update,
    });

    logger.debug("Published checkout session update", {
      sessionId,
      updateType,
      operationType: "pubsub-publish",
    });
  } catch (error) {
    logger.error("Failed to publish checkout session update", error as Error, {
      sessionId,
      updateType,
      operationType: "pubsub-publish-error",
    });
  }
}

// Export subscription resolvers
export const checkoutSubscriptionResolvers = {
  Subscription: checkoutSubscriptions,
};
