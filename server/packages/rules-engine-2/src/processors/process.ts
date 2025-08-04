import { Almanac, Event } from "json-rules-engine";
import { PreviousBundleFact, SelectedBundleFact } from "src/facts/bundle-facts";

export async function processEventType(
  eventType: string,
  events: Event[],
  currentPrice: number,
  almanac: Almanac,
  selectedBundle: SelectedBundleFact
): Promise<{
  newPrice: number;
  description: string;
  details: any;
}> {
  switch (eventType) {
    case "initialize-base-price":
      // This is special - it sets our starting point
      // We're not adding to the price, we're establishing it
      const basePrice = selectedBundle?.price || 0; // Using cost as base
      return {
        newPrice: basePrice,
        description: `Base price set from bundle cost`,
        details: {
          bundleName: selectedBundle?.esim_go_name,
          cost: basePrice,
        },
      };

    case "apply-markup":
      // Markups can be tricky - do we add them all? Take the highest?
      // This is a business decision!
      let totalMarkup = 0;

      for (const event of events) {
        console.log(event);
        const markupAction = event.params?.action;
        if (markupAction.type === "ADD_MARKUP") {
          totalMarkup += markupAction.markupValue;
        }
      }

      return {
        newPrice: currentPrice + totalMarkup,
        description: `Applied markup of $${totalMarkup}`,
        details: {
          markupCount: events.length,
          totalMarkup,
        },
      };

    case "apply-unused-days-discount":
      // This uses our unused days fact to calculate a fair discount
      const unusedDays = await almanac.factValue<number>("unusedDays");

      if (unusedDays <= 0) {
        return {
          newPrice: currentPrice,
          description: "No unused days discount (exact match)",
          details: { unusedDays: 0 },
        };
      }

      // Calculate the discount based on the per-day value
      // This is more complex logic that was previously buried in addMarkup
      const previousBundle = await almanac.factValue<PreviousBundleFact>(
        "previousBundle"
      );

      if (!previousBundle) {
        return {
          newPrice: currentPrice,
          description: "No unused days discount (no previous bundle)",
          details: { unusedDays },
        };
      }

      // Calculate the per-day value difference
      const daysDiff =
        (selectedBundle?.validity_in_days || 0) -
        (previousBundle?.validity_in_days || 0);
      const priceDiff =
        (selectedBundle?.price || 0) - (previousBundle?.price || 0);
      const valuePerDay = daysDiff > 0 ? priceDiff / daysDiff : 0;

      // Apply the discount
      const discountAmount = valuePerDay * unusedDays * 0.8; // 80% of unused value

      return {
        newPrice: currentPrice - discountAmount,
        description: `Unused days discount: $${discountAmount.toFixed(
          2
        )} for ${unusedDays} days`,
        details: {
          unusedDays,
          valuePerDay,
          discountPercentage: 80,
        },
      };

    case "apply-psychological-rounding":
      // This makes prices "feel" better to customers
      const roundingStrategy = events[0]?.params?.strategy || "nearest-99";
      let roundedPrice = currentPrice;

      switch (roundingStrategy) {
        case "nearest-99":
          roundedPrice = Math.floor(currentPrice) + 0.99;
          break;
        case "nearest-95":
          roundedPrice = Math.floor(currentPrice) + 0.95;
          break;
        case "nearest-9":
          roundedPrice = Math.round(currentPrice / 10) * 10 - 1;
          break;
      }

      return {
        newPrice: roundedPrice,
        description: `Applied ${roundingStrategy} rounding`,
        details: {
          strategy: roundingStrategy,
          adjustment: roundedPrice - currentPrice,
        },
      };

    case "apply-profit-constraint":
      // This is a safety net - ensure we don't sell at a loss
      const minimumProfit = events[0]?.params?.minimumProfit || 1.5;
      const minimumPrice = (selectedBundle?.price || 0) + minimumProfit;

      if (currentPrice < minimumPrice) {
        return {
          newPrice: minimumPrice,
          description: `Adjusted to meet minimum profit of $${minimumProfit}`,
          details: {
            originalPrice: currentPrice,
            adjustment: minimumPrice - currentPrice,
            bundleCost: selectedBundle?.price || 0,
          },
        };
      }

      return {
        newPrice: currentPrice,
        description: "Profit constraint satisfied",
        details: {
          profit: currentPrice - (selectedBundle?.price || 0),
          minimumRequired: minimumProfit,
        },
      };

    default:
      // For any unknown event types, pass through unchanged
      return {
        newPrice: currentPrice,
        description: `Unknown event type: ${eventType}`,
        details: { eventType },
      };
  }
}
