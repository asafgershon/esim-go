import { createLogger } from "@hiilo/utils/src/logger";
import { Engine } from "json-rules-engine";
import { markupRule } from "./blocks/markups";
import { rules as processingFeeRules } from "./blocks/processing-fee";
import { unusedDaysDiscountRule } from "./blocks/unused-days";
import { discountRules } from "./blocks/discount";
import { availableBundles } from "./facts/available-bundles";
export { calculatePricing as calculatePricingWithDB } from "./index-with-db";
import {
  isExactMatch,
  PreviousBundleFact,
  previousBundle as previousBundleFact,
  previousBundleMarkup,
  selectBundle,
  SelectedBundleFact,
  selectedBundleMarkup,
  unusedDays as unusedDaysFact,
} from "./facts/bundle-facts";
import { durations } from "./facts/durations";
import {
  userSegment,
  userPurchaseHistory,
  couponValidation,
  emailDomainDiscount,
  timeContext,
  marketTier,
  volumeDiscountTiers,
  bundleDiscountEligibility,
} from "./facts/discount-facts";
import {
  AppliedRule,
  PaymentMethod,
  PricingBreakdown,
} from "./generated/types";
import { processEventType } from "./processors/process";
import { selectEvents } from "./strategies/process-events";
import { costBlockRule } from "./blocks/cost";

let engine: Engine;

const logger = createLogger({
  name: "pricing-engine-v2",
  level: "info",
});

export type RequestFacts = {
  group: string;
  days: number;
  paymentMethod?: PaymentMethod;
  strategyId?: string;
  couponCode?: string;
  userEmail?: string;
  userId?: string;
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
  pricing: Omit<PricingBreakdown, "bundle" | "country" | "duration">;
  appliedRules: AppliedRule[];
};

export async function calculatePricing({
  days,
  group,
  country,
  region,
  paymentMethod = PaymentMethod.IsraeliCard,
  strategyId,
  couponCode,
  userEmail,
  userId,
}: RequestFacts): Promise<PricingEngineV2Result> {
  engine = new Engine();

  const startTime = performance.now();

  // Add static facts
  engine.addFact("durations", durations);
  engine.addFact("availableBundles", availableBundles);

  // Add calculated dynamic facts to be used in rules
  engine.addFact("selectedBundle", selectBundle);
  engine.addFact("previousBundle", previousBundleFact);
  engine.addFact("unusedDays", unusedDaysFact);
  engine.addFact("isExactMatch", isExactMatch);
  engine.addFact("markupRule", markupRule);
  engine.addFact("selectedBundleMarkup", selectedBundleMarkup);
  engine.addFact("previousBundleMarkup", previousBundleMarkup);
  
  // Add discount-related facts
  engine.addFact("userSegment", userSegment);
  engine.addFact("userPurchaseHistory", userPurchaseHistory);
  engine.addFact("couponValidation", couponValidation);
  engine.addFact("emailDomainDiscount", emailDomainDiscount);
  engine.addFact("timeContext", timeContext);
  engine.addFact("marketTier", marketTier);
  engine.addFact("volumeDiscountTiers", volumeDiscountTiers);
  engine.addFact("bundleDiscountEligibility", bundleDiscountEligibility);
  // Load rules from strategy
  //   defaultPricingStrategy.strategy_blocks.forEach((r) => engine.addRule(r));

  // Load rules:
  engine.addRule(costBlockRule);
  engine.addRule(markupRule);
  processingFeeRules.forEach((r) => engine.addRule(r));
  const request = {
    requestedGroup: group,
    requestedValidityDays: days,
    country,
    region,
    paymentMethod,
    couponCode,
    userEmail,
    userId,
  };
  engine.addRule(unusedDaysDiscountRule);
  
  // Add discount rules - these have high priority and need to be loaded
  discountRules.forEach((rule) => engine.addRule(rule));
  
  logger.debug("Running engine", request);
  const { almanac, events, results } = await engine.run({
    ...request,
  });
  const endTime = performance.now();
  logger.debug(
    `Time taken: ${((endTime - startTime) * 1000).toFixed(2)} seconds`
  );
  console.log(results[0].result);
  // const finalPrice = await processEvents(
  //   result.events,
  //   result.almanac,
  //   defaultPricingStrategy
  // );

  let costumerPrice = 0;

  const { newPrice: cost } = await processEventType(
    "set-base-price",
    selectEvents(events, "set-base-price"),
    0,
    almanac
  );
  costumerPrice = cost;

  const markups = selectEvents(events, "apply-markup");
  const { change: markup, newPrice: priceWithMarkup } = await processEventType(
    "apply-markup",
    markups,
    cost,
    almanac
  );
  costumerPrice = priceWithMarkup;

  const discount = selectEvents(events, "apply-unused-days-discount");
  const {
    change: discountValue,
    newPrice: priceAfterDiscount,
    details: { valuePerDay, discountRate, unusedDays },
  } = await processEventType(
    "apply-unused-days-discount",
    discount,
    priceWithMarkup,
    almanac
  );
  costumerPrice = priceAfterDiscount;

  // Process new discount rules (coupon codes, email domain discounts, etc.)
  const generalDiscounts = selectEvents(events, "apply-discount");
  let additionalDiscountValue = 0;
  let priceAfterGeneralDiscounts = priceAfterDiscount;
  
  if (generalDiscounts.length > 0) {
    const {
      change: generalDiscountChange,
      newPrice: priceAfterGeneralDiscount,
      details: generalDiscountDetails,
    } = await processEventType(
      "apply-discount",
      generalDiscounts,
      priceAfterDiscount,
      almanac
    );
    additionalDiscountValue = -generalDiscountChange; // Change is negative for discounts
    priceAfterGeneralDiscounts = priceAfterGeneralDiscount;
    costumerPrice = priceAfterGeneralDiscounts;
  }

  const keepProfit = selectEvents(events, "apply-profit-constraint");
  const { newPrice: priceAfterKeepProfit } = await processEventType(
    "apply-profit-constraint",
    keepProfit,
    priceAfterGeneralDiscounts,
    almanac
  );

  const processingFees = selectEvents(events, "apply-processing-fee");
  const {
    change: processingFee,
    details: { rate },
  } = await processEventType(
    "apply-processing-fee",
    processingFees,
    priceAfterGeneralDiscounts,
    almanac
  );

  const psychologicalRounding = selectEvents(
    events,
    "apply-psychological-rounding"
  );
  const { newPrice: priceAfterPsychologicalRounding } = await processEventType(
    "apply-psychological-rounding",
    psychologicalRounding,
    priceAfterKeepProfit,
    almanac
  );

  const totalCost = Number((cost + processingFee).toFixed(2));

  const totalDiscountValue = discountValue + additionalDiscountValue;
  const finalPriceAfterDiscounts = priceAfterGeneralDiscounts;

  const pricing: Omit<PricingBreakdown, "bundle" | "country" | "duration"> = {
    cost,
    markup,
    currency: "USD",
    unusedDays,
    processingCost: processingFee,
    discountPerDay: valuePerDay,
    discountValue: totalDiscountValue,
    priceAfterDiscount: finalPriceAfterDiscounts,
    discountRate: Number(((totalDiscountValue / (cost + markup)) * 100).toFixed(2)),
    totalCost,
    processingRate: rate,
    finalRevenue: Number(priceAfterPsychologicalRounding.toFixed(2)), // TODO: rename to revenue
    revenueAfterProcessing: Number((costumerPrice - processingFee).toFixed(2)),
    netProfit: Number((costumerPrice - totalCost).toFixed(2)),
    totalCostBeforeProcessing: totalCost,
    finalPrice: Number(priceAfterPsychologicalRounding.toFixed(2)),
  };
  return {
    pricing,
    selectedBundle: await almanac.factValue<SelectedBundleFact>(
      "selectedBundle"
    ),
    unusedDays: await almanac.factValue<number>("unusedDays"),
    requestedDays: days,
    appliedRules: [],
  };

  //   return {
  //     selectedBundle,
  //     requestedDays: days,
  //     unusedDays: unusedDaysValue,
  //     appliedRules: [],
  //   };
  // const {} = processEvents(result.events, result.almanac);
  // // Extract values from breakdown steps
  // const markupStep = finalPrice.breakdown.find(
  //   (b) => b.step === "apply-markup"
  // );
  // const discountStep = finalPrice.breakdown.find(
  //   (b) => b.step === "apply-discount"
  // );
  // const feeStep = finalPrice.breakdown.find((b) => b.step === "apply-fee");
  // const lastStep = finalPrice.breakdown[finalPrice.breakdown.length - 1];

  // const markup = markupStep ? markupStep.adjustment : 0;
  // const discountValue = discountStep ? Math.abs(discountStep.adjustment) : 0;
  // const processingCost = feeStep ? feeStep.adjustment : 0;
  // const finalPriceValue = lastStep?.priceAfter || cost + markup;

  // // Calculate derived values
  // const totalCost = cost + markup;
  // const priceAfterDiscount = totalCost - discountValue;
  // const finalRevenue = priceAfterDiscount - processingCost;

  // console.log("Pricing breakdown:", {
  //   baseCost: cost,
  //   markup,
  //   totalCost,
  //   discountValue,
  //   priceAfterDiscount,
  //   processingCost,
  //   finalRevenue,
  // });
}

// calculatePricing({
//   days: 8,
//   country: "AU",
//   group: "Standard Unlimited Essential",
// });

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
