import {
  calculatePricingWithDB,
  type RequestFacts,
} from "@hiilo/rules-engine-2";
import { GraphQLError } from "graphql";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import { getPubSub, publishEvent } from "../context/pubsub";
import * as countriesList from "countries-list";

import type {
  CalculatePriceInput,
  Country,
  PaymentMethod,
  PricingBreakdown,
  SubscriptionResolvers,
} from "../types";
import { getCountryNameHebrew } from "../datasources/esim-go/hebrew-names";

const logger = createLogger({
  component: "BatchPricingSubscription",
  operationType: "subscription",
});

// Channel names for batch pricing subscription
const BATCH_PRICING_CHANNEL = "CALCULATE_PRICES_BATCH_STREAM";

// Helper function to map payment method enum
const mapPaymentMethodEnum = (paymentMethod: any): PaymentMethod => {
  return paymentMethod || "ISRAELI_CARD";
};

// Helper to convert pricing result to PricingBreakdown
const createPricingBreakdown = (
  result: any,
  duration: number,
  country: Country
): PricingBreakdown => {
  return {
    __typename: "PricingBreakdown",
    ...result.pricing,

    // Bundle Information
    bundle: {
      __typename: "CountryBundle",
      id: result.selectedBundle?.esim_go_name || "",
      name: result.selectedBundle?.name || "",
      duration: result.selectedBundle?.validity_in_days || duration,
      data: result.selectedBundle?.data_amount_mb || null,
      isUnlimited: result.selectedBundle?.is_unlimited || false,
      country: {
        __typename: "Country",
        iso: country.iso,
        name: country.name,
        nameHebrew: getCountryNameHebrew(country.iso),
        region: country.region,
        flag: country.flag,
      },
      group: result.selectedBundle?.group || null,
      price: result.pricing.totalCost || 0,
    },

    // Country Information
    country: {
      __typename: "Country",
      iso: country.iso,
      name: country.name,
      nameHebrew: country.nameHebrew,
      region: country.region,
      flag: country.flag,
    },

    // Duration
    duration,

    // Additional fields
    totalCostBeforeProcessing: result.pricing.totalCostBeforeProcessing,
  };
};

// Process inputs batch and publish results
async function processInputsBatch({
  inputs,
  requestedDays,
  context,
  subscriptionId,
  pubsub,
}: {
  inputs: CalculatePriceInput[];
  requestedDays?: number;
  context: Context;
  subscriptionId: string;
  pubsub: any;
}) {
  // Sort inputs to prioritize requested days
  let sortedInputs = [...inputs];
  if (requestedDays) {
    sortedInputs = [
      ...inputs.filter((i) => i.numOfDays === requestedDays),
      ...inputs.filter((i) => Math.abs(i.numOfDays - requestedDays) <= 3), // Nearby days
      ...inputs.filter((i) => Math.abs(i.numOfDays - requestedDays) > 3), // Rest
    ];
  }

  let successCount = 0;

  // Process and publish each price calculation
  for (const input of sortedInputs) {
    try {
      // Validate input
      if (!input.numOfDays || input.numOfDays < 1) {
        logger.warn("Skipping invalid input", { input });
        continue;
      }

      if (!input.countryId) {
        logger.warn("Skipping input without countryId", { input });
        continue;
      }

      // Get country information - use a simpler approach
      let country: Country;
      try {
        const foundCountry = countriesList.getCountryData(
          input.countryId as countriesList.TCountryCode
        );
        if (!foundCountry) {
          // Create a minimal country object if not found
          country = {
            iso: input.countryId.toUpperCase(),
            name: input.countryId.toUpperCase(),
            nameHebrew: null,
            region: null,
            flag: null,
          } as Country;
        } else {
          country = {
            iso: foundCountry.iso2,
            name: foundCountry.name,
            nameHebrew: getCountryNameHebrew(foundCountry.iso2),
            region: foundCountry.continent,
            flag: countriesList.getEmojiFlag(
              input.countryId as countriesList.TCountryCode
            ),
          } as Country;
        }
      } catch (error) {
        logger.warn("Error fetching country, using fallback", {
          error,
          countryId: input.countryId,
        });
        country = {
          iso: input.countryId.toUpperCase(),
          name: input.countryId.toUpperCase(),
          nameHebrew: null,
          region: null,
          flag: null,
        } as Country;
      }

      // Get the group
      const group = input.groups?.[0] || "Standard Unlimited Essential";

      // Prepare request facts
      const requestFacts = {
        group,
        days: input.numOfDays,
        paymentMethod: mapPaymentMethodEnum(input.paymentMethod),
        country: input.countryId,
        ...(input.promo ? { couponCode: input.promo } : {}),
        ...(context.auth?.user?.id ? { userId: context.auth.user.id } : {}),
        ...(context.auth?.user?.email
          ? { userEmail: context.auth.user.email }
          : {}),
      } as RequestFacts;

      // Calculate pricing
      const startTime = Date.now();
      const result = await calculatePricingWithDB(requestFacts);
      const calculationTime = Date.now() - startTime;

      logger.debug("Calculated price for day", {
        subscriptionId,
        days: input.numOfDays,
        price: result.pricing.finalPrice,
        calculationTime,
      });

      // Create pricing breakdown
      const pricingBreakdown = createPricingBreakdown(
        result,
        input.numOfDays,
        country
      );

      // Publish the result
      await publishEvent(
        pubsub,
        `${BATCH_PRICING_CHANNEL}:${subscriptionId}` as any,
        {
          calculatePricesBatchStream: pricingBreakdown,
        }
      );

      successCount++;

      // Small delay to prevent overwhelming the client
      if (calculationTime < 50) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    } catch (error) {
      logger.error("Error calculating price for input", error as Error, {
        subscriptionId,
        input,
      });
      // Continue with next input instead of failing entire subscription
    }
  }

  logger.info("Batch pricing stream processing completed", {
    subscriptionId,
    totalProcessed: sortedInputs.length,
    successCount,
  });
}

export const batchPricingSubscriptionResolvers: Partial<SubscriptionResolvers> =
  {
    calculatePricesBatchStream: {
      subscribe: async (_, { inputs, requestedDays }, context: Context) => {
        const subscriptionId = `batch-pricing-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 11)}`;

        logger.info("Setting up batch pricing stream subscription", {
          subscriptionId,
          totalInputs: inputs.length,
          requestedDays,
        });

        try {
          // Validate inputs
          if (!inputs || inputs.length === 0) {
            throw new GraphQLError("No inputs provided", {
              extensions: { code: "INVALID_INPUT" },
            });
          }

          // Get the Redis PubSub instance
          const pubsub = await getPubSub();

          // Start async processing
          const processingPromise = processInputsBatch({
            inputs,
            requestedDays: requestedDays || undefined,
            context,
            subscriptionId,
            pubsub,
          });

          // Handle processing completion/errors
          processingPromise
            .then(() => {
              logger.info("Batch pricing stream completed successfully", {
                subscriptionId,
              });
            })
            .catch((error) => {
              logger.error("Batch pricing stream failed", error as Error, {
                subscriptionId,
              });
            });

          // Return the async iterator for this specific subscription
          return pubsub.asyncIterator(
            `${BATCH_PRICING_CHANNEL}:${subscriptionId}`
          );
        } catch (error) {
          logger.error(
            "Failed to setup batch pricing subscription",
            error as Error,
            {
              inputs,
              requestedDays,
            }
          );

          if (error instanceof GraphQLError) {
            throw error;
          }

          throw new GraphQLError(
            "Failed to setup batch pricing stream subscription",
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
    },
  };
