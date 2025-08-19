import { createLogger } from "@hiilo/utils";
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
  PricingStep,
  CustomerDiscount,
} from "./generated/types";
import { processEventType } from "./processors/process-event";
import { selectEvents } from "./strategies/process-events";
import {
  getCachedPricingRules,
  loadStrategyBlocks,
  clearRulesCache,
} from "./loaders/database-loader";

const logger = createLogger({
  name: "pricing-engine-v2-enhanced",
  level: "info",
});

export type RequestFacts = {
  group: string;
  days: number;
  paymentMethod?: PaymentMethod;
  strategyId?: string;
  includeDebugInfo?: boolean;
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

export type EnhancedPricingEngineResult = {
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
      logger.info(`Loading rules for strategy: ${strategyId}`);
      rules = await loadStrategyBlocks(strategyId);
    } else {
      logger.info("Loading default pricing rules from database");
      rules = await getCachedPricingRules();
    }

    if (rules.length === 0) {
      logger.warn("No pricing rules found, using empty ruleset");
    }

    return rules;
  } catch (error) {
    logger.error("Failed to load pricing rules:", error as Error);
    throw new Error("Failed to initialize pricing engine");
  }
}

/**
 * Convert applied rules to customer-friendly discounts
 */
function generateCustomerDiscounts(
  appliedRules: AppliedRule[],
  baseCost: number,
  markup: number
): CustomerDiscount[] {
  const discounts: CustomerDiscount[] = [];

  appliedRules.forEach((rule) => {
    // Only include actual discounts (negative impact)
    if (rule.impact < 0) {
      const amount = Math.abs(rule.impact);
      const basePrice = baseCost + markup;
      const percentage = basePrice > 0 ? (amount / basePrice) * 100 : 0;

      // Generate customer-friendly name and reason
      let name = rule.name;
      let reason = "";

      if (rule.name.toLowerCase().includes("unused days")) {
        name = "Multi-day Savings";
        reason = "Save more with longer validity periods";
      } else if (rule.name.toLowerCase().includes("volume")) {
        name = "Volume Discount";
        reason = "Bulk purchase savings";
      } else if (rule.name.toLowerCase().includes("loyalty")) {
        name = "Loyalty Reward";
        reason = "Thank you for being a valued customer";
      } else if (rule.name.toLowerCase().includes("promotional")) {
        name = "Special Promotion";
        reason = "Limited time offer";
      } else {
        reason = "Special discount applied";
      }

      discounts.push({
        name,
        amount,
        percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
        reason,
      });
    }
  });

  return discounts;
}

/**
 * Enhanced pricing calculation with step-by-step tracking
 */
export async function calculatePricingEnhanced({
  days,
  group,
  country,
  region,
  paymentMethod = PaymentMethod.IsraeliCard,
  strategyId,
  includeDebugInfo = false,
}: RequestFacts): Promise<EnhancedPricingEngineResult> {
  const startTime = performance.now();
  const engine = new Engine();

  // Initialize tracking
  const pricingSteps: PricingStep[] = [];
  let stepOrder = 0;
  let rulesEvaluated = 0;
  const debugInfo: Record<string, any> = {};

  // Add static facts
  engine.addFact("durations", durations);
  engine.addFact("availableBundles", availableBundles);

  // Add calculated dynamic facts
  engine.addFact("selectedBundle", selectBundle);
  engine.addFact("previousBundle", previousBundleFact);
  engine.addFact("unusedDays", unusedDaysFact);
  engine.addFact("isExactMatch", isExactMatch);
  engine.addFact("selectedBundleMarkup", selectedBundleMarkup);
  engine.addFact("previousBundleMarkup", previousBundleMarkup);

  // Load rules from database
  const rules = await initializeEngine(strategyId);
  rulesEvaluated = rules.length;

  rules.forEach((rule) => {
    logger.debug(`Adding rule: ${rule.name} (priority: ${rule.priority})`);
    engine.addRule(rule);
  });

  logger.info(`Engine initialized with ${rules.length} rules`);

  const request = {
    requestedGroup: group,
    requestedValidityDays: days,
    country,
    region,
    paymentMethod,
  };

  logger.debug("Running engine", request);
  const { almanac, events, results } = await engine.run(request);

  if (includeDebugInfo) {
    debugInfo.ruleResults = results.map((r) => ({
      name: r.name,
      result: r.result,
      event: r.event,
    }));
    debugInfo.totalEvents = events.length;
  }

  logger.info(`Engine returned ${events.length} events`);

  const selectedBundle = await almanac.factValue<SelectedBundleFact>(
    "selectedBundle"
  );
  const unusedDays = await almanac.factValue<number>("unusedDays");
  const previousBundle = await almanac.factValue<PreviousBundleFact>(
    "previousBundle"
  );

  // Define the correct processing order
  const eventProcessingOrder = [
    "set-base-price",
    "apply-markup",
    "apply-unused-days-discount",
    "apply-processing-fee",
    "apply-profit-constraint",
    "apply-psychological-rounding",
  ];

  const appliedRules: AppliedRule[] = [];
  let currentPrice = selectedBundle?.price || previousBundle?.price || 0;
  const initialPrice = currentPrice;

  // Track the initial bundle selection step
  pricingSteps.push({
    order: stepOrder++,
    name: "Bundle Selection",
    priceBefore: 0,
    priceAfter: currentPrice,
    impact: currentPrice,
    ruleId: null,
    metadata: {
      bundle: selectedBundle?.esim_go_name,
      days: selectedBundle?.validity_in_days,
      selectionReason: selectedBundle ? "exact_match" : "fallback",
    },
    timestamp: Date.now(),
  });

  // Process events in the defined order
  for (const eventType of eventProcessingOrder) {
    const eventsOfType = events.filter((e) => {
      const normalizedEventType = e.type.toLowerCase().replace(/_/g, "-");
      return normalizedEventType === eventType;
    });

    if (eventsOfType.length > 0) {
      logger.info(
        `Processing ${eventsOfType.length} events of type: ${eventType}`
      );
    }

    for (const event of eventsOfType) {
      const previousPrice = currentPrice;
      const stepTimestamp = Date.now();

      // Process the event
      currentPrice = processEventType(
        event,
        currentPrice,
        appliedRules,
        { selectedBundle, previousBundle, unusedDays, paymentMethod },
        logger
      );

      // Track the step
      const impact = currentPrice - previousPrice;
      const stepName = formatStepName(event.type);

      pricingSteps.push({
        order: stepOrder++,
        name: stepName,
        priceBefore: previousPrice,
        priceAfter: currentPrice,
        impact,
        ruleId: event.params?.ruleId || null,
        metadata: event.params,
        timestamp: stepTimestamp,
      });

      logger.info(
        `Step ${stepOrder}: ${stepName} changed price from ${previousPrice} to ${currentPrice}`
      );
    }
  }

  const endTime = performance.now();
  const calculationTimeMs = endTime - startTime;

  logger.info(`Pricing calculation completed in ${calculationTimeMs}ms`);

  // Calculate all pricing fields
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

  const discountPerDay =
    unusedDays > 0 && selectedBundle?.validity_in_days
      ? discountValue / unusedDays
      : 0;

  const discountRate =
    discountValue > 0 && cost + markup > 0
      ? (discountValue / (cost + markup)) * 100
      : 0;

  // Calculate savings
  const originalPrice = cost + markup;
  const savingsAmount = discountValue;
  const savingsPercentage =
    originalPrice > 0 ? (savingsAmount / originalPrice) * 100 : 0;

  // Generate customer-friendly discounts
  const customerDiscounts = generateCustomerDiscounts(
    appliedRules,
    cost,
    markup
  );

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
    finalPrice: Number(currentPrice.toFixed(2)),
    appliedRules,
    selectedReason: "calculated",

    // Enhanced fields
    pricingSteps,
    customerDiscounts,
    savingsAmount: Number(savingsAmount.toFixed(2)),
    savingsPercentage: Number(savingsPercentage.toFixed(1)),
    calculationTimeMs: Number(calculationTimeMs.toFixed(2)),
    rulesEvaluated,

    // Optional debug info
    ...(includeDebugInfo && { debugInfo }),
  };

  return {
    selectedBundle,
    unusedDays,
    requestedDays: days,
    pricing,
    appliedRules,
  };
}

/**
 * Format event type to user-friendly step name
 */
function formatStepName(eventType: string): string {
  const mapping: Record<string, string> = {
    "set-base-price": "Base Price",
    "apply-markup": "Markup Application",
    "apply-unused-days-discount": "Multi-day Discount",
    "apply-processing-fee": "Processing Fee",
    "apply-profit-constraint": "Profit Adjustment",
    "apply-psychological-rounding": "Price Rounding",
  };

  const normalized = eventType.toLowerCase().replace(/_/g, "-");
  return mapping[normalized] || eventType;
}

// Export both versions for backward compatibility
export { calculatePricingEnhanced as calculatePricingWithDB };
