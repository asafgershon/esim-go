import { Almanac, Event } from "json-rules-engine";
import { MarkUpEventSchema } from "src/blocks/markups";
import { ProcessingFeeEventSchema } from "src/blocks/processing-fee";
import { PreviousBundleFact, SelectedBundleFact } from "src/facts/bundle-facts";
import { PaymentMethod } from "src/generated/types";

type ProcessingFeeDetails = {
  method: PaymentMethod;
  rate: number;
};

type UnusedDaysDiscountDetails = {
  unusedDays: number;
  valuePerDay: number;
  discountRate: number;
};

type PsychologicalRoundingDetails = {
  strategy: "nearest-whole";
  adjustment: number;
};

export async function processEventType(
  eventType: string,
  events: Event[],
  currentPrice: number,
  almanac: Almanac
): Promise<{
  change: number;
  newPrice: number;
  description: string;
  details:
    | any
    | ProcessingFeeDetails
    | UnusedDaysDiscountDetails
    | PsychologicalRoundingDetails;
}> {
  const [selectedBundle, previousBundle] = await Promise.all([
    almanac.factValue<SelectedBundleFact>("selectedBundle"),
    almanac.factValue<PreviousBundleFact>("previousBundle"),
  ]);
  switch (eventType) {
    case "set-base-price":
      // This is special - it sets our starting point
      // We're not adding to the price, we're establishing it
      const basePrice = selectedBundle?.price || 0; // Using cost as base
      return {
        change: basePrice - currentPrice,
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
        const { params } = MarkUpEventSchema.parse(event);
        const { markupMatrix } = params;
        const markupValue =
          markupMatrix[selectedBundle?.group_name || ""]?.[
            selectedBundle?.validity_in_days || 0
          ];
        if (markupValue) {
          totalMarkup += markupValue;
        }
      }

      return {
        newPrice: currentPrice + totalMarkup,
        change: totalMarkup,
        description: `Applied markup of $${totalMarkup}`,
        details: {
          markupCount: events.length,
          totalMarkup,
        },
      };

    case "apply-processing-fee":
      const { params } = ProcessingFeeEventSchema.parse(events[0]);
      const { value: rate } = params;
      const processingFee = (currentPrice * rate) / 100;
      return {
        newPrice: currentPrice,
        change: Number(processingFee.toFixed(2)),
        description: `Applied processing fee of $${processingFee}`,
        details: {
          rate,
          method: params.method,
        },
      };

    case "apply-unused-days-discount":
      // This uses our unused days fact to calculate a fair discount
      const unusedDays = await almanac.factValue<number>("unusedDays");

      if (unusedDays <= 0) {
        return {
          newPrice: currentPrice,
          change: 0,
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
          change: 0,
          description: "No unused days discount (no previous bundle)",
          details: { unusedDays },
        };
      }

      // Calculate the per-day value difference
      const daysDiff =
        (selectedBundle?.validity_in_days || 0) -
        (previousBundle?.validity_in_days || 0);

      const [selectedBundleMarkup, previousBundleMarkup] = await Promise.all([
        almanac.factValue<number>("selectedBundleMarkup"),
        almanac.factValue<number>("previousBundleMarkup"),
      ]);
      // TODO: change calculation to be: discountPerDay = (selectedBundle markup) - (previousBundle markup)/ (selectedBundle.validity_in_days - previousBundle.validity_in_days)
      const discountPerDay =
        (selectedBundleMarkup - previousBundleMarkup) / daysDiff;

      // Apply the discount
      const discountAmount = Number((discountPerDay * unusedDays).toFixed(2));

      return {
        newPrice: currentPrice - discountAmount,
        change: -discountAmount,
        description: `Unused days discount: $${discountAmount.toFixed(
          2
        )} for ${unusedDays} days`,
        details: {
          unusedDays,
          valuePerDay: Number(discountPerDay.toFixed(2)),
          discountRate: Number(
            (((discountAmount || 0) / currentPrice) * 100).toFixed(2)
          ),
        },
      };

    case "apply-psychological-rounding":
      // This makes prices "feel" better to customers
      const roundingStrategy = events[0]?.params?.strategy || "nearest-whole";
      let roundedPrice = currentPrice;

      switch (roundingStrategy) {
        case "nearest-whole":
          roundedPrice = Math.round(currentPrice);
          break;
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
        change: roundedPrice - currentPrice,
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
          change: minimumPrice - currentPrice,
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
        change: 0,
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
        change: 0,
        description: `Unknown event type: ${eventType}`,
        details: { eventType },
      };
  }
}
