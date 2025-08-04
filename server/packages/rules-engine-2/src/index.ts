import { Engine, TopLevelCondition } from "json-rules-engine";
import { availableBundles } from "./facts/available-bundles";
import {
  isExactMatch,
  previousBundle,
  selectBundle,
  SelectedBundleFact,
  unusedDays,
} from "./facts/bundle-facts";
import { durations } from "./facts/durations";
import { AppliedRule, PricingBreakdown } from "./generated/types";
import {
  calculateFinalPrice,
  defaultPricingStrategy,
} from "./strategies/default-pricing";
import { loadStrategy } from "./strategies";
import { TopLevelConditionSchema } from "./types";

let engine: Engine;

export type RequestFacts = {
  group: string;
  days: number;
  paymentMethod?: string;
  strategyId?: string;
} & (
  | {
      country: string;
      region?: never;
    }
  | {
      region: string;
      country?: never;
    }
);

export type PricingEngineV2Result = {
  selectedBundle: SelectedBundleFact | undefined;
  unusedDays: number;
  requestedDays: number;
  pricing: Pick<
    PricingBreakdown,
    | "cost"
    | "markup"
    | "totalCost"
    | "discountPerDay"
    | "discountValue"
    | "priceAfterDiscount"
    | "processingCost"
    | "finalRevenue"
  >;
  appliedRules: AppliedRule[];
};

export async function calculatePricing({
  days,
  group,
  country,
  region,
  paymentMethod = "ISRAELI_CARD",
  strategyId,
}: RequestFacts): Promise<PricingEngineV2Result> {
  engine = new Engine();

//   const strategy = await loadStrategy(strategyId);

//   if (!strategy) {
//     throw new Error("Strategy not found");
//   }

//   strategy.strategy_blocks
//     .sort((a, b) => a.priority - b.priority)
//     .forEach((b) => {
//       console.log(b);
//       const { block } = b;
//       engine.addRule({
//         conditions: TopLevelConditionSchema.parse(block.conditions),
//         event: {
//           type: block.action.type,
//           params: { ...block.action.params },
//         },
//         name: block.name
//       })
//       // engine.addRule({
//       //   conditions: b.block.conditions as TopLevelCondition,
//       //   event: {
//       //     type: b.block.action.type,
//       //     params: { ...b.block.action.params },
//       //   },
//       //   name: b.name,
//       //   priority: b.priority || 0,
//       // });
//     });

  // Add static facts
  engine.addFact("durations", durations);
  engine.addFact("availableBundles", availableBundles);

  // Add calculated dynamic facts to be used in rules
  engine.addFact("selectedBundle", selectBundle);
  engine.addFact("previousBundle", previousBundle);
  engine.addFact("unusedDays", unusedDays);
  engine.addFact("isExactMatch", isExactMatch);
  // Load rules from strategy
//   defaultPricingStrategy.strategy_blocks.forEach((r) => engine.addRule(r));

  // Run the engine
  const result = await engine.run({
    requestedGroup: group,
    requestedValidityDays: days,
    country,
    region,
    paymentMethod,
  });

  const finalPrice = await calculateFinalPrice(
    result.events,
    result.almanac,
    defaultPricingStrategy
  );

  const selectedBundle = await result.almanac.factValue<SelectedBundleFact>(
    "selectedBundle"
  );
  const unusedDaysValue = await result.almanac.factValue<number>("unusedDays");
  const baseCost = selectedBundle?.price || 0;

//   return {
//     selectedBundle,
//     requestedDays: days,
//     unusedDays: unusedDaysValue,
//     appliedRules: [],
//   };

  // Extract values from breakdown steps
  const markupStep = finalPrice.breakdown.find(
    (b) => b.step === "apply-markup"
  );
  const discountStep = finalPrice.breakdown.find(
    (b) => b.step === "apply-discount"
  );
  const feeStep = finalPrice.breakdown.find((b) => b.step === "apply-fee");
  const lastStep = finalPrice.breakdown[finalPrice.breakdown.length - 1];

  const markup = markupStep ? markupStep.adjustment : 0;
  const discountValue = discountStep ? Math.abs(discountStep.adjustment) : 0;
  const processingCost = feeStep ? feeStep.adjustment : 0;
  const finalPriceValue = lastStep?.priceAfter || baseCost + markup;

  // Calculate derived values
  const totalCost = baseCost + markup;
  const priceAfterDiscount = totalCost - discountValue;
  const finalRevenue = priceAfterDiscount - processingCost;

  console.log("Pricing breakdown:", {
    baseCost,
    markup,
    totalCost,
    discountValue,
    priceAfterDiscount,
    processingCost,
    finalRevenue,
  });

  return {
    appliedRules: [],
    pricing: {
      cost: baseCost,
      markup: markup,
      totalCost: totalCost,
      discountPerDay: days > 0 ? discountValue / days : 0,
      discountValue: discountValue,
      priceAfterDiscount: priceAfterDiscount,
      processingCost: processingCost,
      finalRevenue: finalRevenue,
    },
    selectedBundle,
    unusedDays: await result.almanac.factValue<number>("unusedDays"),
    requestedDays: days,
  };
}

// const results = Promise.all(
//   new Array(10).fill(0).map((_, index) => {
//     return calculatePricing({
//       days: index + 1,
//       country: "AU",
//       group: "Standard Unlimited Essential",
//     });
//   })
// )

// calculatePricing({
//   days: 7 + 1,
//   country: "AU",
//   group: "Standard Unlimited Essential",
// }).then((results) => {
//   console.log(results);
// });

// Export main types and interfaces
export { type KeepProfitEvent } from "./blocks/keep-profit";
export { type MarkupEvent } from "./blocks/markups";
export { type PsychologicalRoundingEvent } from "./blocks/psychological-rounding";
export { type SelectedBundleFact } from "./facts/bundle-facts";
export { type DefaultPricingStrategy } from "./strategies/default-pricing";

// Export strategy
export { defaultPricingStrategy } from "./strategies/default-pricing";

// Export action and condition types from generated files
export { ActionType, ConditionOperator } from "./generated/types";
