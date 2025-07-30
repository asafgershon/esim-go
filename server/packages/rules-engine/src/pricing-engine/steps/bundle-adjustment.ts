import { produce } from "immer";
import * as dot from "dot-object";
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
    draft.state.selectedBundle = bundle;
    draft.state.pricing = initializePricing(bundle);
  });

  // Apply rules to calculate pricing
  const pricingState = produce(tempState, draft => {
    bundleAdjustmentRules.forEach(rule => {
      if (evaluateConditions(rule.conditions || [], tempState)) {
        applyActions(rule.actions, draft);
      }
    });
  });

  return dot.pick("state.pricing", pricingState);
};

/**
 * Bundle adjustment step - applies bundle-specific adjustments
 */
export const bundleAdjustmentStep: PipelineStep = {
  name: "BUNDLE_ADJUSTMENT",
  
  execute: async (state, rules) => {
    const bundleAdjustmentRules = filterRulesByCategory(rules, RuleCategory.BundleAdjustment);
    const appliedRuleIds: string[] = [];
    const previousBundleAppliedRules: string[] = [];
    
    const newState = produce(state, draft => {
      // Calculate pricing for selected bundle
      bundleAdjustmentRules.forEach(rule => {
        if (evaluateConditions(rule.conditions || [], state)) {
          applyActions(rule.actions, draft);
          appliedRuleIds.push(rule.id);
        }
      });

      // Calculate pricing for previous bundle if it exists
      if (draft.state.previousBundle) {
        const previousPricing = calculateBundlePricing(
          draft.state.previousBundle,
          rules,
          state,
          bundleAdjustmentRules
        );
        
        // Store previous bundle pricing in state
        (draft.state as any).previousBundlePricing = previousPricing;
      }
    });
    
    const selectedPrice = dot.pick("state.selectedBundle.basePrice", state);
    const selectedAdjustedPrice = dot.pick("state.pricing.totalCost", newState);
    const selectedMarkup = dot.pick("state.pricing.markup", newState) || 0;
    
    const previousPrice = dot.pick("state.previousBundle.basePrice", newState);
    const previousMarkup = dot.pick("state.previousBundlePricing.markup", newState) || 0;
    
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