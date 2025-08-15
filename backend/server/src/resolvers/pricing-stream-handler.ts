import { Engine, Rule } from "json-rules-engine";
import {
  isExactMatch,
  previousBundle as previousBundleFact,
  previousBundleMarkup,
  selectBundle,
  selectedBundleMarkup,
  unusedDays as unusedDaysFact,
  type SelectedBundleFact,
  type PreviousBundleFact,
} from "@hiilo/rules-engine-2/src/facts/bundle-facts";
import { durations } from "@hiilo/rules-engine-2/src/facts/durations";
import {
  getCachedPricingRules,
  loadStrategyBlocks,
} from "@hiilo/rules-engine-2/src/loaders/database-loader";
import { processEventType } from "@hiilo/rules-engine-2/src/processors/process-event";
import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import {
  type CalculatePriceInput,
  type Country,
  type PaymentMethod,
  type PricingBreakdown,
  type PricingStep,
  type PricingStepUpdate,
  type CustomerDiscount,
  type AppliedRule,
  RuleCategory,
} from "../types";
import { availableBundles } from "@hiilo/rules-engine-2/src/facts/available-bundles";

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
const mapPaymentMethodEnum = (paymentMethod: any): PaymentMethod => {
  return paymentMethod || "ISRAELI_CARD";
};

/**
 * Format event type to user-friendly step name
 */
function formatStepName(eventType: string): string {
  const mapping: Record<string, string> = {
    'set-base-price': 'Base Price',
    'apply-markup': 'Markup Application',
    'apply-unused-days-discount': 'Multi-day Discount',
    'apply-processing-fee': 'Processing Fee',
    'apply-profit-constraint': 'Profit Adjustment',
    'apply-psychological-rounding': 'Price Rounding',
  };
  
  const normalized = eventType.toLowerCase().replace(/_/g, '-');
  return mapping[normalized] || eventType;
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
  
  appliedRules.forEach(rule => {
    // Only include actual discounts (negative impact)
    if (rule.impact < 0) {
      const amount = Math.abs(rule.impact);
      const basePrice = baseCost + markup;
      const percentage = basePrice > 0 ? (amount / basePrice) * 100 : 0;
      
      // Generate customer-friendly name and reason
      let name = rule.name;
      let reason = "";
      
      if (rule.name.toLowerCase().includes('unused days')) {
        name = "Multi-day Savings";
        reason = "Save more with longer validity periods";
      } else if (rule.name.toLowerCase().includes('volume')) {
        name = "Volume Discount";
        reason = "Bulk purchase savings";
      } else if (rule.name.toLowerCase().includes('loyalty')) {
        name = "Loyalty Reward";
        reason = "Thank you for being a valued customer";
      } else if (rule.name.toLowerCase().includes('promotional')) {
        name = "Special Promotion";
        reason = "Limited time offer";
      } else {
        reason = "Special discount applied";
      }
      
      discounts.push({
        __typename: 'CustomerDiscount',
        name,
        amount,
        percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
        reason
      });
    }
  });
  
  return discounts;
}

/**
 * Calculate pricing with step-by-step streaming
 */
export async function calculatePricingEnhancedWithStreaming({
  input,
  context,
  correlationId,
  onStep,
}: StreamingOptions): Promise<PricingBreakdown> {
  const startTime = performance.now();
  const engine = new Engine();
  
  logger.info("Starting streaming pricing calculation", {
    correlationId,
    input,
    operationType: "streaming-start",
  });

  try {
    const { numOfDays, countryId, regionId, groups, paymentMethod } = input;
    
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
    
    // Notify about initialization
    const initStep: PricingStepUpdate = {
      __typename: "PricingStepUpdate",
      correlationId,
      step: {
        __typename: "PricingStep",
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
    };
    await onStep(initStep);
    
    // Load rules from database
    const strategyId = input.strategyId || "default";
    let rules: Rule[];
    
    if (strategyId) {
      logger.info(`Loading rules for strategy: ${strategyId}`);
      rules = await loadStrategyBlocks(strategyId);
    } else {
      logger.info('Loading default pricing rules from database');
      rules = await getCachedPricingRules();
    }
    
    rulesEvaluated = rules.length;
    
    rules.forEach(rule => {
      logger.debug(`Adding rule: ${rule.name} (priority: ${rule.priority})`);
      engine.addRule(rule);
    });
    
    logger.info(`Engine initialized with ${rules.length} rules`);
    
    // Get the group - for now using the first group or a default
    const group = groups?.[0] || "Standard Unlimited Essential";
    
    const request = {
      requestedGroup: group,
      requestedValidityDays: numOfDays,
      country: countryId,
      region: regionId,
      paymentMethod: mapPaymentMethodEnum(paymentMethod),
    };
    
    // Run the engine
    logger.debug("Running engine", request);
    const { almanac, events, results } = await engine.run(request);
    
    if (input.includeDebugInfo) {
      debugInfo.ruleResults = results.map(r => ({
        name: r.name,
        result: r.result,
        event: r.event,
      }));
      debugInfo.totalEvents = events.length;
    }
    
    logger.info(`Engine returned ${events.length} events`);
    
    const selectedBundle = await almanac.factValue<SelectedBundleFact>("selectedBundle");
    const unusedDays = await almanac.factValue<number>("unusedDays");
    const previousBundle = await almanac.factValue<PreviousBundleFact>("previousBundle");
    
    // Define the correct processing order
    const eventProcessingOrder = [
      'set-base-price',
      'apply-markup',
      'apply-unused-days-discount',
      'apply-processing-fee',
      'apply-profit-constraint',
      'apply-psychological-rounding',
    ];
    
    const appliedRules: AppliedRule[] = [];
    let currentPrice = selectedBundle?.price || previousBundle?.price || 0;
    const initialPrice = currentPrice;
    
    // Track and stream the initial bundle selection step
    const bundleSelectionStep: PricingStep = {
      __typename: 'PricingStep',
      order: stepOrder++,
      name: "Bundle Selection",
      priceBefore: 0,
      priceAfter: currentPrice,
      impact: currentPrice,
      ruleId: null,
      metadata: {
        bundle: selectedBundle?.esim_go_name,
        days: selectedBundle?.validity_in_days,
        selectionReason: selectedBundle ? "exact_match" : "fallback"
      },
      timestamp: Date.now()
    };
    
    pricingSteps.push(bundleSelectionStep);
    
    // Stream the bundle selection step
    await onStep({
      __typename: "PricingStepUpdate",
      correlationId,
      step: bundleSelectionStep,
      isComplete: false,
      totalSteps: events.length + 1, // +1 for bundle selection
      completedSteps: 1,
    });
    
    // Process events in the defined order
    for (const eventType of eventProcessingOrder) {
      const eventsOfType = events.filter(e => {
        const normalizedEventType = e.type.toLowerCase().replace(/_/g, '-');
        return normalizedEventType === eventType;
      });
      
      if (eventsOfType.length > 0) {
        logger.info(`Processing ${eventsOfType.length} events of type: ${eventType}`);
      }
      
      for (const event of eventsOfType) {
        const previousPrice = currentPrice;
        const stepTimestamp = Date.now();
        
        // Process the event
        currentPrice = processEventType(
          event,
          currentPrice,
          appliedRules,
          { selectedBundle, previousBundle, unusedDays },
          logger
        );
        
        // Track the step
        const impact = currentPrice - previousPrice;
        const stepName = formatStepName(event.type);
        
        const pricingStep: PricingStep = {
          __typename: 'PricingStep',
          order: stepOrder++,
          name: stepName,
          priceBefore: previousPrice,
          priceAfter: currentPrice,
          impact,
          ruleId: event.params?.ruleId || null,
          metadata: event.params,
          timestamp: stepTimestamp
        };
        
        pricingSteps.push(pricingStep);
        
        // Stream this step
        await onStep({
          __typename: "PricingStepUpdate",
          correlationId,
          step: pricingStep,
          isComplete: false,
          totalSteps: events.length + 1,
          completedSteps: stepOrder,
        });
        
        logger.info(`Step ${stepOrder}: ${stepName} changed price from ${previousPrice} to ${currentPrice}`);
        
        // Add a small delay for demonstration purposes (optional, can be removed in production)
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const endTime = performance.now();
    const calculationTimeMs = endTime - startTime;
    
    logger.info(`Pricing calculation completed in ${calculationTimeMs}ms`);
    
    // Calculate all pricing fields
    const cost = selectedBundle?.price || 0;
    const markup = appliedRules
      .filter(r => r.name.toLowerCase().includes('markup'))
      .reduce((sum, r) => sum + r.impact, 0);
    
    const discountValue = Math.abs(appliedRules
      .filter(r => r.category === RuleCategory.Discount || r.name.toLowerCase().includes('discount'))
      .reduce((sum, r) => sum + r.impact, 0));
    
    const processingCost = appliedRules
      .filter(r => r.category === RuleCategory.Fee || r.name.toLowerCase().includes('processing'))
      .reduce((sum, r) => sum + r.impact, 0);
    
    const processingRate = processingCost > 0 ? (processingCost / (currentPrice - processingCost)) * 100 : 0;
    
    const priceAfterDiscount = cost + markup - discountValue;
    const totalCostBeforeProcessing = cost + processingCost;
    const finalRevenue = currentPrice - processingCost;
    const revenueAfterProcessing = currentPrice - processingCost;
    const netProfit = currentPrice - (cost + processingCost);
    
    const discountPerDay = unusedDays > 0 && selectedBundle?.validity_in_days
      ? discountValue / unusedDays
      : 0;
    
    const discountRate = discountValue > 0 && (cost + markup) > 0
      ? (discountValue / (cost + markup)) * 100
      : 0;
    
    // Calculate savings
    const originalPrice = cost + markup;
    const savingsAmount = discountValue;
    const savingsPercentage = originalPrice > 0 ? (savingsAmount / originalPrice) * 100 : 0;
    
    // Generate customer-friendly discounts
    const customerDiscounts = generateCustomerDiscounts(appliedRules, cost, markup);
    
    // Create the final pricing breakdown
    const pricingBreakdown: PricingBreakdown = {
      __typename: "PricingBreakdown",
      
      // Bundle Information
      bundle: {
        __typename: "CountryBundle",
        id: selectedBundle?.esim_go_name || `bundle_${countryId || regionId}_${numOfDays}d`,
        name: selectedBundle?.esim_go_name || "",
        duration: numOfDays,
        data: selectedBundle?.data_amount_mb || 0,
        isUnlimited: selectedBundle?.is_unlimited || false,
        currency: "USD",
        group,
        country: {
          __typename: "Country",
          iso: selectedBundle?.countries?.[0] || countryId || "",
        } as Country,
      },
      
      country: {
        __typename: "Country",
        iso: countryId || "",
        name: countryId || "",
        region: regionId || "",
      } as Country,
      
      duration: numOfDays,
      
      // Pricing fields
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
      ...(input.includeDebugInfo && { debugInfo })
    };
    
    logger.info("Streaming pricing calculation completed", {
      correlationId,
      selectedBundle: selectedBundle?.esim_go_name,
      finalPrice: pricingBreakdown.finalPrice,
      totalSteps: pricingSteps.length,
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