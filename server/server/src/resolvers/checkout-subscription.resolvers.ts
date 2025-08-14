import { GraphQLError } from "graphql";
import { withFilter } from "graphql-subscriptions";
import jwt from "jsonwebtoken";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import { getPubSub, PubSubEvents } from "../context/pubsub";
import type {
  SubscriptionResolvers,
  CheckoutSessionUpdate,
  CheckoutUpdateType,
  CheckoutSession,
} from "../types";

const logger = createLogger({
  component: "CheckoutSubscriptionResolvers",
  operationType: "graphql-subscription",
});

// Validate and decode checkout token
function validateCheckoutToken(token: string): { userId: string; sessionId: string } {
  try {
    const decoded = jwt.verify(
      token,
      process.env.CHECKOUT_JWT_SECRET!
    ) as { userId: string; sessionId: string; exp: number; iss: string };

    if (decoded.iss !== "esim-go-checkout") {
      throw new Error("Invalid token issuer");
    }

    return { userId: decoded.userId, sessionId: decoded.sessionId };
  } catch (error) {
    logger.error("Failed to validate checkout token", error as Error);
    throw new GraphQLError("Invalid or expired checkout token", {
      extensions: { code: "INVALID_TOKEN" },
    });
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
          // Validate token and extract session info
          const { sessionId } = validateCheckoutToken(token);

          // Get the Redis PubSub instance
          const pubsub = await getPubSub();

          // Create a channel specific to this session
          const channel = `${PubSubEvents.CHECKOUT_SESSION_UPDATED}:${sessionId}`;

          logger.info("Checkout subscription setup successful", {
            sessionId,
            channel,
            operationType: "subscription-setup-success",
          });

          // Return the async iterator for this specific session
          return pubsub.asyncIterator(channel);
        } catch (error) {
          logger.error("Failed to setup checkout subscription", error as Error, {
            operationType: "subscription-setup-error",
          });

          if (error instanceof GraphQLError) {
            throw error;
          }

          throw new GraphQLError("Failed to setup checkout session subscription", {
            extensions: {
              code: "SUBSCRIPTION_SETUP_FAILED",
              originalError: error instanceof Error ? error.message : String(error),
            },
          });
        }
      },
      // Filter to ensure the update is for the correct session
      (payload: { checkoutSessionUpdated: CheckoutSessionUpdate }, variables: { token: string }) => {
        try {
          const { sessionId } = validateCheckoutToken(variables.token);
          return payload.checkoutSessionUpdated.session.id === sessionId;
        } catch {
          return false;
        }
      }
    ),
  },
};

// Helper function to publish checkout session updates
export async function publishCheckoutSessionUpdate(
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