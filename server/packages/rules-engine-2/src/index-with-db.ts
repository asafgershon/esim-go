import { createLogger } from "@hiilo/utils/src/logger";
import { Engine, Rule } from "json-rules-engine";
import { availableBundles } from "./facts/available-bundles";
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
  AppliedRule,
  PaymentMethod,
  PricingBreakdown,
  RuleCategory,
} from "./generated/types";
import {
  clearRulesCache,
  getCachedPricingRules,
  loadStrategyBlocks,
} from "./loaders/database-loader";
import { processEventType } from "./processors/process-event";

// Export cache clear function for manual cache invalidation
export { clearRulesCache };

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

/**
 * Initialize the engine with rules from database
 */
async function initializeEngine(strategyId?: string): Promise<Rule[]> {
  try {
    let rules: Rule[];

    if (strategyId) {
      // Load rules for specific strategy with overrides
      logger.info(`Loading rules for strategy: ${strategyId}`);
      rules = await loadStrategyBlocks(strategyId);
    } else {
      // Load default rules from pricing_blocks table
      logger.info("Loading default pricing rules from database");
      rules = await getCachedPricingRules();
    }

    if (rules.length === 0) {
      logger.warn("No pricing rules found, using empty ruleset");
    }

    return rules;
  } catch (error) {
    logger.error("Failed to load pricing rules:", error as Error);
    // Could fallback to hardcoded rules here if needed
    throw new Error("Failed to initialize pricing engine");
  }
}

export async function calculatePricing({
  days,
  group,
  country,
  region,
  paymentMethod = PaymentMethod.IsraeliCard,
  strategyId,
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
  engine.addFact("selectedBundleMarkup", selectedBundleMarkup);
  engine.addFact("previousBundleMarkup", previousBundleMarkup);

  // Load rules from database
  try {
    const rules = await initializeEngine(strategyId);

    // Add each rule to the engine
    rules.forEach((rule) => {
      logger.debug(`Adding rule: ${rule.name} (priority: ${rule.priority})`);
      engine.addRule(rule);
    });

    logger.info(`Engine initialized with ${rules.length} rules`);
  } catch (error) {
    logger.error("Failed to load rules from database:", error as Error);
    throw error;
  }

  const request = {
    requestedGroup: group,
    requestedValidityDays: days,
    country,
    region,
    paymentMethod,
  };

  logger.debug("Running engine", request);
  const { almanac, events, results } = await engine.run({
    ...request,
  });

  // Log all rule results for debugging
  logger.info(
    "Rule results:",
    results.map((r) => ({
      name: r.name,
      result: r.result,
      event: r.event,
      conditions: r.conditions,
    }))
  );

  logger.info(`Engine returned ${events.length} events:`, {
    eventTypes: events.map((e) => e.type),
    request,
  });

  const paymentMethod_ = await almanac.factValue("paymentMethod");
  const selectedBundle = await almanac.factValue<SelectedBundleFact>(
    "selectedBundle"
  );
  const unusedDays = await almanac.factValue<number>("unusedDays");
  const previousBundle = await almanac.factValue<PreviousBundleFact>(
    "previousBundle"
  );

  // Define the correct processing order based on the original index.ts
  const eventProcessingOrder = [
    "set-base-price",
    "apply-markup",
    "apply-unused-days-discount",
    "apply-processing-fee",
    "apply-profit-constraint",
    "apply-psychological-rounding",
    // These are not implemented yet but included for future:
    // 'apply-region-rounding',
    // 'apply-fixed-price'
  ];

  const appliedRules: AppliedRule[] = [];
  let currentPrice = selectedBundle?.price || previousBundle?.price || 0;

  // Process events in the defined order
  for (const eventType of eventProcessingOrder) {
    const eventsOfType = events.filter((e) => {
      // Normalize event type for comparison
      const normalizedEventType = e.type.toLowerCase().replace(/_/g, "-");
      return normalizedEventType === eventType;
    });

    if (eventsOfType.length > 0) {
      logger.info(`Found ${eventsOfType.length} events of type: ${eventType}`);
    }

    for (const event of eventsOfType) {
      logger.debug(`Processing event: ${event.type}`, { params: event.params });
      const previousPrice = currentPrice;
      currentPrice = processEventType(
        event,
        currentPrice,
        appliedRules,
        { selectedBundle, previousBundle, unusedDays, paymentMethod },
        logger
      );
      logger.info(
        `Price changed from ${previousPrice} to ${currentPrice} after ${event.type}`
      );
    }
  }

  const endTime = performance.now();
  logger.info(`Pricing calculation completed in ${endTime - startTime}ms`);

  logger.info("Final pricing state:", {
    currentPrice,
    selectedBundle: selectedBundle?.esim_go_name,
    days: days,
    appliedRules: appliedRules.map((r) => ({ name: r.name, impact: r.impact })),
    hasRoundingApplied: appliedRules.some((r) =>
      r.name.toLowerCase().includes("psychological")
    ),
  });

  // Calculate all pricing fields similar to original index.ts
  const cost = selectedBundle?.price || 0;
  const markup = appliedRules
    .filter((r) => r.name.toLowerCase().includes("markup"))
    .reduce((sum, r) => sum + r.impact, 0);

  const discountValue = Math.abs(
    appliedRules
      .filter(
        (r) =>
          r.category === RuleCategory.Discount ||
          r.name.toLowerCase().includes("discount")
      )
      .reduce((sum, r) => sum + r.impact, 0)
  );

  const processingCost = appliedRules
    .filter(
      (r) =>
        r.category === RuleCategory.Fee ||
        r.name.toLowerCase().includes("processing")
    )
    .reduce((sum, r) => sum + r.impact, 0);

  const processingRate =
    processingCost > 0
      ? (processingCost / (currentPrice - processingCost)) * 100
      : 0;

  const priceAfterDiscount = cost + markup - discountValue;
  const totalCostBeforeProcessing = cost + processingCost;
  const finalRevenue = currentPrice - processingCost;
  const revenueAfterProcessing = currentPrice - processingCost;
  const netProfit = currentPrice - (cost + processingCost);

  // Calculate discount per day if unused days discount was applied
  const unusedDaysRule = appliedRules.find((r) =>
    r.name.toLowerCase().includes("unused days")
  );
  const discountPerDay =
    unusedDaysRule && unusedDays > 0 && selectedBundle?.validity_in_days
      ? Math.abs(unusedDaysRule.impact) / unusedDays
      : 0;

  const discountRate =
    discountValue > 0 && cost + markup > 0
      ? (discountValue / (cost + markup)) * 100
      : 0;

  const pricing: Omit<PricingBreakdown, "bundle" | "country" | "duration"> = {
    cost,
    markup,
    currency: "USD",
    unusedDays,
    processingCost,
    discountPerDay,
    discountValue,
    priceAfterDiscount,
    discountRate,
    totalCost: Number((cost + processingCost).toFixed(2)),
    processingRate: Number(processingRate.toFixed(2)),
    finalRevenue: Number(finalRevenue.toFixed(2)),
    revenueAfterProcessing: Number(revenueAfterProcessing.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    totalCostBeforeProcessing: Number((cost + processingCost).toFixed(2)),
    finalPrice: currentPrice,
    appliedRules,
  };

  return {
    selectedBundle,
    unusedDays,
    requestedDays: days,
    pricing,
    appliedRules,
  };
}
