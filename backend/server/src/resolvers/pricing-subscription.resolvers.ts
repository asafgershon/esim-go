import { GraphQLError } from "graphql";
import { withFilter } from "graphql-subscriptions";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import { getPubSub, PubSubEvents, publishEvent } from "../context/pubsub";
import type {
  SubscriptionResolvers,
  PricingStepUpdate,
  CalculatePriceInput,
  PaymentMethod,
} from "../types";
import { streamCalculatePricing } from "@hiilo/rules-engine-2";

const logger = createLogger({
  component: "PricingSubscriptionResolvers",
  operationType: "graphql-subscription",
});

// Channel names for different subscription topics
const PRICING_STEP_CHANNEL = "PRICING_CALCULATION_STEPS";

export const pricingSubscriptions: SubscriptionResolvers = {
  /**
   * Real-time pricing calculation steps subscription
   * Streams each step of the pricing calculation as it happens
   */
  pricingCalculationSteps: {
    subscribe: async (_, { input }: { input: CalculatePriceInput }, context: Context) => {
      logger.info("Setting up pricing calculation steps subscription", {
        input,
        operationType: "subscription-setup",
      });

      try {
        // Validate input
        if (!input.numOfDays || input.numOfDays < 1) {
          throw new GraphQLError("Invalid number of days", {
            extensions: { code: "INVALID_INPUT" },
          });
        }

        if (!input.countryId && !input.regionId) {
          throw new GraphQLError("Either countryId or regionId is required", {
            extensions: { code: "INVALID_INPUT" },
          });
        }

        // Get the Redis PubSub instance
        const pubsub = await getPubSub();

        // Generate a unique correlation ID for this calculation
        const correlationId = `sub-pricing-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        
        // Start the async calculation with streaming
        const calculationPromise = streamCalculatePricing({
          days: input.numOfDays,
          group: input.groups?.[0] || "Standard Unlimited Essential",
          ...(input.countryId ? { country: input.countryId } : {}),
          ...(input.regionId ? { region: input.regionId } : {}),
          paymentMethod: input.paymentMethod || "ISRAELI_CARD" as PaymentMethod,
          ...(input.promo ? { couponCode: input.promo } : {}),
          ...(context.auth?.user?.id ? { userId: context.auth.user.id } : {}),
          ...(context.auth?.user?.email ? { userEmail: context.auth.user.email } : {}),
          includeEnhancedData: true,
          includeDebugInfo: input.includeDebugInfo || false,
          correlationId,
          onStep: async (stepUpdate) => {
            // Transform the step update to match GraphQL type
            const graphqlStepUpdate: PricingStepUpdate = {
              __typename: "PricingStepUpdate",
              correlationId,
              step: stepUpdate.step,
              isComplete: stepUpdate.isComplete,
              totalSteps: stepUpdate.totalSteps,
              completedSteps: stepUpdate.completedSteps,
              ...(stepUpdate.error ? { error: stepUpdate.error } : {}),
              ...(stepUpdate.finalBreakdown ? {
                finalBreakdown: {
                  ...stepUpdate.finalBreakdown,
                  __typename: "PricingBreakdown",
                  bundle: stepUpdate.finalBreakdown.bundle ? {
                    ...stepUpdate.finalBreakdown.bundle,
                    __typename: "CountryBundle",
                    country: stepUpdate.finalBreakdown.bundle.country ? {
                      ...stepUpdate.finalBreakdown.bundle.country,
                      __typename: "Country",
                    } : undefined,
                  } : undefined,
                  country: stepUpdate.finalBreakdown.country ? {
                    ...stepUpdate.finalBreakdown.country,
                    __typename: "Country",
                  } : undefined,
                }
              } : {}),
            };
            
            // Publish each step to the subscription channel
            await publishEvent(pubsub, `${PRICING_STEP_CHANNEL}:${correlationId}` as any, {
              pricingCalculationSteps: graphqlStepUpdate,
            });
          },
        });

        // Handle calculation completion
        calculationPromise
          .then(async (finalBreakdown) => {
            // Send the final update with the complete breakdown
            const finalUpdate: PricingStepUpdate = {
              __typename: "PricingStepUpdate",
              correlationId,
              step: null,
              isComplete: true,
              finalBreakdown,
              totalSteps: finalBreakdown.pricingSteps?.length || 0,
              completedSteps: finalBreakdown.pricingSteps?.length || 0,
            };

            await publishEvent(pubsub, `${PRICING_STEP_CHANNEL}:${correlationId}` as any, {
              pricingCalculationSteps: finalUpdate,
            });

            logger.info("Pricing calculation completed", {
              correlationId,
              totalSteps: finalBreakdown.pricingSteps?.length,
              operationType: "subscription-complete",
            });
          })
          .catch(async (error) => {
            logger.error("Pricing calculation failed", error as Error, {
              correlationId,
              operationType: "subscription-error",
            });

            // Send error update
            const errorUpdate: PricingStepUpdate = {
              __typename: "PricingStepUpdate",
              correlationId,
              step: null,
              isComplete: true,
              error: error instanceof Error ? error.message : "Calculation failed",
              totalSteps: 0,
              completedSteps: 0,
            };

            await publishEvent(pubsub, `${PRICING_STEP_CHANNEL}:${correlationId}` as any, {
              pricingCalculationSteps: errorUpdate,
            });
          });

        // Return the async iterator for this specific correlation ID
        return pubsub.asyncIterator(`${PRICING_STEP_CHANNEL}:${correlationId}`);
      } catch (error) {
        logger.error("Failed to setup pricing subscription", error as Error, {
          input,
          operationType: "subscription-setup-error",
        });

        if (error instanceof GraphQLError) {
          throw error;
        }

        throw new GraphQLError("Failed to setup pricing calculation subscription", {
          extensions: {
            code: "SUBSCRIPTION_SETUP_FAILED",
            originalError: error instanceof Error ? error.message : String(error),
          },
        });
      }
    },
  },
};

// Export subscription resolvers
export const pricingSubscriptionResolvers = {
  Subscription: pricingSubscriptions,
};