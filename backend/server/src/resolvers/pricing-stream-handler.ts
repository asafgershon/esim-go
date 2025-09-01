import {
  streamCalculatePricing,
  PaymentMethod as RulesEnginePaymentMethod,
} from "@hiilo/rules-engine-2";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import {
  type CalculatePriceInput,
  type PricingBreakdown,
  type PricingStepUpdate,
} from "../types";

const logger = createLogger({
  component: "PricingStreamHandler",
  operationType: "pricing-stream",
});

type StreamingOptions = {
  input: CalculatePriceInput;
  context: Context;
  correlationId: string;
  onStep: (stepUpdate: PricingStepUpdate) => void | Promise<void>;
};

// Helper function to map payment method enum
const mapPaymentMethodEnum = (paymentMethod: any): RulesEnginePaymentMethod => {
  return paymentMethod || RulesEnginePaymentMethod.IsraeliCard;
};


/**
 * Calculate pricing with step-by-step streaming using unified engine
 */
export async function calculatePricingEnhancedWithStreaming({
  input,
  context,
  correlationId,
  onStep,
}: StreamingOptions): Promise<PricingBreakdown> {
  logger.info("Starting streaming pricing calculation", {
    correlationId,
    input,
    operationType: "streaming-start",
  });

  try {
    const { numOfDays, countryId, regionId, groups, paymentMethod } = input;

    // Map GraphQL input to our RequestFacts format
    const group = groups?.[0] || "Standard Unlimited Essential";
    const mappedPaymentMethod = mapPaymentMethodEnum(paymentMethod);

    // Create wrapper for onStep to add GraphQL typename
    const wrappedOnStep = async (stepUpdate: any) => {
      await onStep({
        __typename: "PricingStepUpdate",
        ...stepUpdate,
        step: {
          __typename: "PricingStep",
          ...stepUpdate.step,
        },
      });
    };

    // Call our unified streaming function
    const pricingBreakdown = await streamCalculatePricing({
      days: numOfDays,
      group,
      country: countryId,
      region: regionId,
      paymentMethod: mappedPaymentMethod,
      strategyId: input.strategyId,
      onStep: wrappedOnStep,
      correlationId,
      includeEnhancedData: true,
      includeDebugInfo: input.includeDebugInfo || false,
    });

    logger.info("Streaming pricing calculation completed", {
      correlationId,
      selectedBundle: pricingBreakdown.bundle?.name,
      finalPrice: pricingBreakdown.finalPrice,
      operationType: "streaming-complete",
    });

    return pricingBreakdown;
  } catch (error) {
    logger.error("Failed to calculate streaming price", error as Error, {
      correlationId,
      input,
      operationType: "streaming-error",
    });

    throw error;
  }
}
