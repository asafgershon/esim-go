import { createLogger } from "@hiilo/utils";
import { Engine, Rule } from "json-rules-engine";
import { availableBundles, availableBundlesByProvider } from "./facts/available-bundles";
import { 
  selectedProvider,
  availableProviders,
  preferredProvider,
  isProviderAvailable
} from "./facts/provider-facts";
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
  CountryBundle, 
  Country, 
  CustomerDiscount 
} from "./generated/types";
import {
  clearRulesCache,
  getCachedPricingRules,
  loadStrategyBlocks,
  getDefaultStrategyId,
} from "./loaders/database-loader";
import { processEventType } from "./processors/process-event";

// Export cache clear function for manual cache invalidation
export { clearRulesCache };

let engine: Engine;

const logger = createLogger({
  name: "pricing-engine-v2",
  level: "info",
});

// Streaming types (to avoid circular dependencies with server types)
export type PricingStep = {
  order: number;
  name: string;
  priceBefore: number;
  priceAfter: number;
  impact: number;
  ruleId: string | null;
  metadata?: any;
  timestamp: number;
};

export type PricingStepUpdate = {
  correlationId: string;
  step: PricingStep;
  isComplete: boolean;
  totalSteps: number;
  completedSteps: number;
  error?: string;
};

export type StreamingCallback = (stepUpdate: PricingStepUpdate) => void | Promise<void>;

export type RequestFacts = {
  group: string;
  days: number;
  paymentMethod?: PaymentMethod;
  strategyId?: string;
  onStep?: StreamingCallback;
  correlationId?: string;
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
      // Load rules from default strategy
      logger.info("Loading rules from default strategy");
      const defaultStrategyId = await getDefaultStrategyId();

      if (defaultStrategyId) {
        logger.info(`Using default strategy: ${defaultStrategyId}`);
        rules = await loadStrategyBlocks(defaultStrategyId);
      } else {
        // Fallback to direct pricing_blocks if no default strategy
        logger.warn(
          "No default strategy found, falling back to pricing_blocks table"
        );
        rules = await getCachedPricingRules();
      }
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

/**
 * Generate customer-friendly discounts from applied rules
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
 * Convert PricingEngineV2Result to PricingBreakdown format
 */
function engineResultToPricingBreakdown(
  result: PricingEngineV2Result,
  input: {
    numOfDays: number;
    countryId?: string;
    regionId?: string;
    group?: string;
  },
  pricingSteps?: PricingStep[],
  calculationTimeMs?: number,
  rulesEvaluated?: number,
  includeDebugInfo?: boolean,
  debugInfo?: any
): PricingBreakdown {
  const { selectedBundle, unusedDays, pricing, appliedRules } = result;

  // Create bundle object
  const bundle: CountryBundle = {
    id: selectedBundle?.esim_go_name || `bundle_${input.countryId || input.regionId}_${input.numOfDays}d`,
    name: selectedBundle?.esim_go_name || "",
    duration: input.numOfDays,
    data: selectedBundle?.data_amount_mb || 0,
    isUnlimited: selectedBundle?.is_unlimited || false,
    currency: "USD",
    group: input.group,
    price: selectedBundle?.price,
    country: {
      iso: selectedBundle?.countries?.[0] || input.countryId || "",
      name: input.countryId || "",
      region: input.regionId || "",
    } as Country,
  };

  // Create country object
  const country: Country = {
    iso: input.countryId || "",
    name: input.countryId || "",
    region: input.regionId || "",
  };

  // Calculate savings
  const originalPrice = pricing.cost + pricing.markup;
  const savingsAmount = pricing.discountValue;
  const savingsPercentage = originalPrice > 0 ? (savingsAmount / originalPrice) * 100 : 0;

  // Generate customer-friendly discounts
  const customerDiscounts = generateCustomerDiscounts(
    appliedRules,
    pricing.cost,
    pricing.markup
  );

  // Create PricingBreakdown
  const pricingBreakdown: PricingBreakdown = {
    // Bundle and country info
    bundle,
    country,
    duration: input.numOfDays,

    // Core pricing fields (flatten from pricing object)
    cost: pricing.cost,
    markup: pricing.markup,
    currency: pricing.currency,
    unusedDays: unusedDays,
    processingCost: pricing.processingCost,
    discountPerDay: pricing.discountPerDay,
    discountValue: pricing.discountValue,
    priceAfterDiscount: pricing.priceAfterDiscount,
    discountRate: pricing.discountRate,
    totalCost: pricing.totalCost,
    processingRate: pricing.processingRate,
    finalRevenue: pricing.finalRevenue,
    revenueAfterProcessing: pricing.revenueAfterProcessing,
    netProfit: pricing.netProfit,
    totalCostBeforeProcessing: pricing.totalCostBeforeProcessing,
    finalPrice: pricing.finalPrice,
    appliedRules: pricing.appliedRules,
    selectedReason: "calculated",

    // Enhanced fields
    pricingSteps: pricingSteps || [],
    customerDiscounts,
    savingsAmount: Number(savingsAmount.toFixed(2)),
    savingsPercentage: Number(savingsPercentage.toFixed(1)),
    calculationTimeMs: calculationTimeMs,
    rulesEvaluated: rulesEvaluated,

    // Optional debug info
    ...(includeDebugInfo && debugInfo && { debugInfo }),
  };

  return pricingBreakdown;
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
    "select-provider": "Provider Selection",
  };

  const normalized = eventType.toLowerCase().replace(/_/g, "-");
  return mapping[normalized] || eventType;
}

export async function calculatePricing({
  days,
  group,
  country,
  region,
  paymentMethod = PaymentMethod.IsraeliCard,
  strategyId,
  onStep,
  correlationId,
}: RequestFacts): Promise<PricingEngineV2Result> {
  engine = new Engine();

  const startTime = performance.now();

  // Add static facts
  engine.addFact("durations", durations);
  engine.addFact("availableBundles", availableBundles);
  
  // Add provider selection facts
  engine.addFact("availableBundlesByProvider", availableBundlesByProvider);
  engine.addFact("selectedProvider", selectedProvider);
  engine.addFact("availableProviders", availableProviders);
  engine.addFact("preferredProvider", preferredProvider);
  
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

  const appliedRules: AppliedRule[] = [];
  let currentPrice = selectedBundle?.price || previousBundle?.price || 0;
  const pricingSteps: PricingStep[] = [];
  let stepOrder = 0;

  // Stream initial bundle selection step if streaming is enabled
  if (onStep && correlationId) {
    const bundleSelectionStep: PricingStep = {
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
    };

    pricingSteps.push(bundleSelectionStep);

    await onStep({
      correlationId,
      step: bundleSelectionStep,
      isComplete: false,
      totalSteps: events.length + 1, // +1 for bundle selection
      completedSteps: 1,
    });
  }

  // Process events in the order they were fired by the engine (already sorted by priority DESC from database)  
  logger.info(
    `Processing ${events.length} events in database-defined priority order`
  );

  for (const event of events) {
    logger.debug(`Processing event: ${event.type}`, { params: event.params });
    const previousPrice = currentPrice;
    const stepTimestamp = Date.now();

    currentPrice = processEventType(
      event,
      currentPrice,
      appliedRules,
      { selectedBundle, previousBundle, unusedDays, paymentMethod },
      logger,
      almanac
    );

    logger.info(
      `Price changed from ${previousPrice} to ${currentPrice} after ${event.type}`
    );

    // Track step for streaming if enabled
    if (onStep && correlationId) {
      const impact = currentPrice - previousPrice;
      const stepName = formatStepName(event.type);

      const pricingStep: PricingStep = {
        order: stepOrder++,
        name: stepName,
        priceBefore: previousPrice,
        priceAfter: currentPrice,
        impact,
        ruleId: event.params?.ruleId || null,
        metadata: event.params,
        timestamp: stepTimestamp,
      };

      pricingSteps.push(pricingStep);

      await onStep({
        correlationId,
        step: pricingStep,
        isComplete: false,
        totalSteps: events.length + 1,
        completedSteps: stepOrder,
      });

      // Add a small delay for demonstration purposes (optional)
      await new Promise((resolve) => setTimeout(resolve, 100));
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

/**
 * Streaming wrapper for calculatePricing that returns PricingBreakdown
 */
export async function streamCalculatePricing({
  days,
  group,
  country,
  region,
  paymentMethod = PaymentMethod.IsraeliCard,
  strategyId,
  onStep,
  correlationId,
  includeEnhancedData = true,
  includeDebugInfo = false,
}: RequestFacts & { 
  includeEnhancedData?: boolean; 
  includeDebugInfo?: boolean 
}): Promise<PricingBreakdown> {
  const startTime = performance.now();
  
  logger.info("Starting streaming pricing calculation", {
    correlationId,
    days,
    group,
    country,
    region,
  });

  // Send initialization step if streaming
  if (onStep && correlationId) {
    await onStep({
      correlationId,
      step: {
        order: 0,
        name: "Initialization",
        priceBefore: 0,
        priceAfter: 0,
        impact: 0,
        ruleId: null,
        metadata: { status: "Loading pricing rules" },
        timestamp: Date.now(),
      },
      isComplete: false,
      totalSteps: 0,
      completedSteps: 0,
    });
  }

  // Call the main calculatePricing function
  const requestFacts: RequestFacts = country
    ? { days, group, country, paymentMethod, strategyId, onStep, correlationId }
    : { days, group, region: region!, paymentMethod, strategyId, onStep, correlationId };
  
  const result = await calculatePricing(requestFacts);

  const endTime = performance.now();
  const calculationTimeMs = endTime - startTime;

  // Convert to PricingBreakdown format
  const pricingBreakdown = engineResultToPricingBreakdown(
    result,
    {
      numOfDays: days,
      countryId: country,
      regionId: region,
      group,
    },
    undefined, // pricingSteps will be populated by streaming
    calculationTimeMs,
    undefined, // rulesEvaluated - we can add this later if needed
    includeDebugInfo
  );

  // Send completion step if streaming
  if (onStep && correlationId) {
    await onStep({
      correlationId,
      step: {
        order: 999,
        name: "Calculation Complete",
        priceBefore: pricingBreakdown.finalPrice,
        priceAfter: pricingBreakdown.finalPrice,
        impact: 0,
        ruleId: null,
        metadata: { 
          calculationTimeMs,
          finalPrice: pricingBreakdown.finalPrice 
        },
        timestamp: Date.now(),
      },
      isComplete: true,
      totalSteps: 999,
      completedSteps: 999,
    });
  }

  logger.info("Streaming pricing calculation completed", {
    correlationId,
    selectedBundle: result.selectedBundle?.esim_go_name,
    finalPrice: pricingBreakdown.finalPrice,
    calculationTimeMs,
  });

  return pricingBreakdown;
}

// Export alias for backward compatibility
export { calculatePricing as calculatePricingWithDB };

// Export enhanced version with step tracking
export {
  calculatePricingEnhanced,
  EnhancedPricingEngineResult,
} from "./calculate-pricing-enhanced";
export {
  isExactMatch,
  previousBundle as previousBundleFact,
  previousBundleMarkup,
  selectBundle,
  selectedBundleMarkup,
  unusedDays as unusedDaysFact,
  type SelectedBundleFact,
  type PreviousBundleFact,
} from "./facts/bundle-facts";
export { durations } from "./facts/durations";
export { availableBundles, availableBundlesByProvider } from "./facts/available-bundles";
export {
  selectedProvider,
  availableProviders,
  preferredProvider,
  isProviderAvailable
} from "./facts/provider-facts";
export {
  getCachedPricingRules,
  loadStrategyBlocks,
} from "./loaders/database-loader";
export { processEventType } from "./processors/process-event";
export {
  AppliedRule,
  PaymentMethod,
  PricingBreakdown,
  RuleCategory,
  Provider
} from "./generated/types";
