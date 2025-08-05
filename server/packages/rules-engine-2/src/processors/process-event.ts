import { Event } from "json-rules-engine";
import { AppliedRule, RuleCategory } from "../generated/types";
import { SelectedBundleFact, PreviousBundleFact } from "../facts/bundle-facts";
import type { Logger } from "pino";

interface ProcessContext {
  selectedBundle: SelectedBundleFact | null;
  previousBundle: PreviousBundleFact | null;
  unusedDays: number;
}

/**
 * Map event types to rule categories
 */
function mapEventTypeToCategory(eventType: string): RuleCategory {
  switch (eventType) {
    case "set-base-price":
    case "apply-markup":
      return RuleCategory.BundleAdjustment;
    case "apply-discount":
    case "apply-unused-days-discount":
      return RuleCategory.Discount;
    case "apply-processing-fee":
      return RuleCategory.Fee;
    case "apply-profit-constraint":
    case "apply-psychological-rounding":
    case "apply-region-rounding":
    case "apply-fixed-price":
      return RuleCategory.Constraint;
    default:
      return RuleCategory.BundleAdjustment;
  }
}

/**
 * Process a single pricing event and update the price
 */
export function processEventType(
  event: Event,
  currentPrice: number,
  appliedRules: AppliedRule[],
  context: ProcessContext,
  logger: Logger
): number {
  const { selectedBundle, previousBundle, unusedDays } = context;
  
  logger.debug(`Processing event: ${event.type}`, { 
    currentPrice,
    eventParams: event.params 
  });

  let newPrice = currentPrice;
  let description = '';
  let details: any = {};

  // Normalize event type to lowercase with dashes for consistency
  const normalizedType = event.type.toLowerCase().replace(/_/g, '-');

  switch (normalizedType) {
    case "set-base-price":
      // Initialize base price from bundle cost
      const basePrice = selectedBundle?.price || previousBundle?.price || 0;
      newPrice = basePrice;
      description = `Base price set from ${selectedBundle ? 'selected' : 'previous'} bundle`;
      details = { 
        bundleName: selectedBundle?.esim_go_name || previousBundle?.esim_go_name,
        originalPrice: basePrice 
      };
      break;

    case "apply-markup":
      // Apply markup to current price
      const markupParams = event.params as any;
      if (markupParams.markupMatrix && selectedBundle) {
        const groupName = selectedBundle.group_name || '';
        const days = (selectedBundle.validity_in_days || 0).toString();
        const markupValue = groupName ? markupParams.markupMatrix[groupName]?.[days] || 0 : 0;
        newPrice = currentPrice + markupValue;
        description = `Applied markup of $${markupValue} for ${groupName} (${days} days)`;
        details = { groupName, days, markupAmount: markupValue };
      } else if (markupParams.value) {
        const markupValue = markupParams.value;
        newPrice = currentPrice + markupValue;
        description = `Applied fixed markup of $${markupValue}`;
        details = { markupAmount: markupValue };
      }
      break;

    case "apply-discount":
      // Apply percentage or fixed discount
      const discountParams = event.params as any;
      const discountActions = discountParams.actions;
      if (discountActions.type === "APPLY_DISCOUNT_PERCENTAGE") {
        const discountPercent = discountActions.value;
        const discountAmount = currentPrice * (discountPercent / 100);
        newPrice = currentPrice - discountAmount;
        description = `Applied ${discountPercent}% discount`;
        details = { discountPercent, discountAmount };
      } else if (discountActions.type === "APPLY_FIXED_DISCOUNT") {
        const discountAmount = discountActions.value;
        newPrice = currentPrice - discountAmount;
        description = `Applied fixed discount of $${discountAmount}`;
        details = { discountAmount };
      }
      break;

    case "apply-unused-days-discount":
      // Apply discount for unused days
      if (unusedDays > 0 && selectedBundle && selectedBundle.price && selectedBundle.validity_in_days) {
        const dailyRate = selectedBundle.price / selectedBundle.validity_in_days;
        const discountAmount = dailyRate * unusedDays * 0.5; // 50% discount on unused days
        newPrice = currentPrice - discountAmount;
        description = `Applied unused days discount for ${unusedDays} days`;
        details = { unusedDays, dailyRate, discountAmount };
      }
      break;

    case "apply-processing-fee":
      // Apply payment processing fee
      const feeParams = event.params as any;
      const feeRate = feeParams.value / 100;
      const feeAmount = currentPrice * feeRate;
      newPrice = currentPrice + feeAmount;
      description = `Applied ${feeParams.value}% processing fee for ${feeParams.method}`;
      details = { method: feeParams.method, rate: feeParams.value, feeAmount };
      break;

    case "apply-profit-constraint":
      // Ensure minimum profit
      const profitParams = event.params as any;
      const minProfit = profitParams.value;
      const cost = selectedBundle?.price || 0;
      if (newPrice - cost < minProfit) {
        newPrice = cost + minProfit;
        description = `Adjusted price to ensure minimum profit of $${minProfit}`;
        details = { minProfit, cost, adjustment: newPrice - currentPrice };
      }
      break;

    case "apply-psychological-rounding":
      // Round to psychological price point
      const roundingParams = event.params as any;
      const strategy = roundingParams.strategy;
      if (strategy === "nearest-whole") {
        const rounded = Math.round(newPrice);
        const adjustment = rounded - newPrice;
        newPrice = rounded;
        description = `Applied psychological rounding to nearest whole number`;
        details = { strategy, adjustment };
      }
      break;

    case "apply-region-rounding":
      // Apply region-specific rounding
      const regionParams = event.params as any;
      const roundingValue = regionParams.actions?.value || 0.99;
      newPrice = Math.floor(newPrice) + roundingValue;
      description = `Applied region rounding to .${roundingValue * 100}`;
      details = { roundingValue };
      break;

    case "apply-fixed-price":
      // Set fixed price
      const fixedPriceParams = event.params as any;
      newPrice = fixedPriceParams.actions.value;
      description = `Set fixed price to $${newPrice}`;
      details = { fixedPrice: newPrice };
      break;

    default:
      logger.warn(`Unknown event type: ${event.type}`);
  }

  // Add to applied rules if price changed
  if (newPrice !== currentPrice) {
    const rule: AppliedRule = {
      id: event.params?.ruleId || event.type,
      name: description,
      category: mapEventTypeToCategory(event.type),
      impact: newPrice - currentPrice,
    };
    appliedRules.push(rule);
  }

  return newPrice;
}