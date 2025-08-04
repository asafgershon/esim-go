// @ts-nocheck: TODO: finish
import { Almanac, Event, Rule } from "json-rules-engine";
import { costBlockRule } from "src/blocks/cost";
import { keepProfit } from "src/blocks/keep-profit";
import { rules } from "src/blocks/markups";
import { psychologicalRounding } from "src/blocks/psychological-rounding";
import { regionRoundingRule } from "src/blocks/region-rounding";
import { unusedDaysDiscountRule } from "src/blocks/unused-days";
import { SelectedBundleFact } from "src/facts/bundle-facts";
import { processEventType } from "src/processors/process";
import { Strategy } from "src/types";
import {
  internationalCardRule,
  israeliCardRule,
} from "../blocks/processing-fee";

export type DefaultPricingStrategy = {
  id: string;
  name: string;
  description: string;
  blocks: Rule[];
};

type PriceBreakdown = {
  step: string;
  description: string;
  priceBefore: number;
  priceAfter: number;
  adjustment: number;
  details?: Record<string, any>;
};

const blocks = [
  costBlockRule,
  // Fixed price overrides (highest priority)
  // fixedPriceRule, // Commented out - only enable when needed

  // Markup rules
  ...rules,

  // Discount rules
  // discountRule, // Commented out - enable when needed

  // Profit protection
  keepProfit,

  // Processing fees
  israeliCardRule,
  internationalCardRule,

  // Rounding rules (lowest priority, applied last)
  regionRoundingRule,
  unusedDaysDiscountRule,
  psychologicalRounding,
];


export const defaultPricingStrategy: Strategy = {
  id: "default-pricing",
  name: "Default Pricing Strategy",
  description:
    "Standard pricing with markup, psychological rounding, and profit protection",
  strategy_blocks: blocks.map((b) => ({
    ...b,
    block: b,
  })),
};

export const processEvents = async (
  events: Event[],
  almanac: Almanac,
  strategy: Strategy
): Promise<{
  price: number;
  breakdown: PriceBreakdown[];
  success: boolean;
  error?: string;
}> => {
  // First, let's set up our tracking variables
  let currentPrice = 0;
  const breakdown: PriceBreakdown[] = [];

  try {
    // Step 1: Get the base price from our facts
    // This is our starting point - like setting the foundation of a house
    const selectedBundle = await almanac.factValue<SelectedBundleFact>(
      "selectedBundle"
    );

    if (!selectedBundle) {
      return {
        price: 0,
        breakdown: [],
        success: false,
        error: "No bundle selected - cannot calculate price",
      };
    }

    // The strategy defines the order of operations
    // Think of this like a recipe - you can't frost a cake before you bake it!
    const processingOrder = new Set(
      strategy.strategy_blocks.map((b) => b.block.action)
    );
    console.log(processingOrder);

    // console.log(processingOrder);
    // Now we process each event type in the correct order
    for (const eventType of processingOrder) {
      // Find all events of this type
      const eventsOfType = events.filter((e) => e.type === eventType);

      if (eventsOfType.length === 0) {
        continue; // No events of this type, move to next
      }

      // Track the price before processing
      const priceBeforeProcessing = currentPrice;

      // Process this event type
      const result = await processEventType(
        eventType,
        eventsOfType,
        currentPrice,
        almanac,
        selectedBundle
      );

      // Update our current price
      currentPrice = result.newPrice;

      // Record what happened for transparency
      breakdown.push({
        step: eventType,
        description: result.description,
        priceBefore: priceBeforeProcessing,
        priceAfter: currentPrice,
        adjustment: currentPrice - priceBeforeProcessing,
        details: result.details,
      });
    }

    // Final validation - make sure we haven't done anything crazy
    if (currentPrice < 0) {
      return {
        price: 0,
        breakdown,
        success: false,
        error: "Price calculation resulted in negative value",
      };
    }

    return {
      price: Math.round(currentPrice * 100) / 100, // Round to cents
      breakdown,
      success: true,
    };
  } catch (error: unknown) {
    return {
      price: 0,
      breakdown,
      success: false,
      error: `Price calculation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};
