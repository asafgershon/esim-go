import { produce } from "immer";
import type { PipelineStep } from "../types";
import type { Bundle, PricingEngineState } from "../../rules-engine-types";
import { RuleCategory } from "../../rules-engine-types";
import { filterRulesByCategory } from "../utils/rule-matcher";
import { evaluateConditions } from "../evaluators";
import { applyActions } from "../applicators";
import { initializePricing } from "../utils/state-helpers";

/**
 * Helper function to calculate pricing for a specific bundle
 */
const calculateBundlePricing = (
  bundle: Bundle,
  rules: any[],
  baseState: PricingEngineState,
  bundleAdjustmentRules: any[]
) => {
  // Create a temporary state with this bundle as the selected bundle
  const tempState = produce(baseState, draft => {
    draft.processing.selectedBundle = bundle;
    draft.response.pricing = initializePricing(bundle);
  });

  // Apply rules to calculate pricing
  const pricingState = produce(tempState, draft => {
    bundleAdjustmentRules.forEach(rule => {
      if (evaluateConditions(rule.conditions || [], tempState)) {
        applyActions(rule.actions, draft);
      }
    });
  });

  return pricingState.response.pricing;
};

/**
 * Bundle adjustment step - applies bundle-specific adjustments
 */
export const bundleAdjustmentStep: PipelineStep = {
  name: "BUNDLE_ADJUSTMENT",
  
  execute: async (state, rules) => {

    const bundleAdjustmentRules = filterRulesByCategory(rules, RuleCategory.BundleAdjustment);
    const appliedRuleIds: string[] = [];
    
    const newState = produce(state, draft => {
      // Calculate pricing for selected bundle
      bundleAdjustmentRules.forEach(rule => {
        const conditionsPassed = evaluateConditions(rule.conditions || [], state);
        
        if (conditionsPassed) {
          applyActions(rule.actions, draft);
          appliedRuleIds.push(rule.id);
        }
      });

      // Calculate pricing for previous bundle if it exists
      if (draft.processing.previousBundle) {
        const previousPricing = calculateBundlePricing(
          draft.processing.previousBundle,
          rules,
          state,
          bundleAdjustmentRules
        );
        
        // Store the pricing in processing since we can't modify Bundle type
        draft.processing.previousBundle.pricingBreakdown = previousPricing;
      }
    });
    
    const selectedPrice = state.processing.selectedBundle?.basePrice || 0;
    const selectedAdjustedPrice = newState.response.pricing.totalCost;
    const selectedMarkup = newState.response.pricing.markup || 0;
    
    const previousPrice = newState.processing.previousBundle?.basePrice || 0;
    const previousMarkup = newState.processing.previousBundle?.pricingBreakdown?.markup || 0;
    
    return {
      name: "BUNDLE_ADJUSTMENT",
      timestamp: new Date(),
      state: newState,
      appliedRules: appliedRuleIds,
      debug: {
        selectedBundle: {
          basePrice: selectedPrice,
          adjustedPrice: selectedAdjustedPrice,
          markup: selectedMarkup,
          adjustment: selectedAdjustedPrice - selectedPrice
        },
        previousBundle: previousPrice ? {
          basePrice: previousPrice,
          markup: previousMarkup
        } : null,
        rulesApplied: appliedRuleIds.length
      }
    };
  }
};