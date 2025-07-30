import { produce } from "immer";
import * as dot from "dot-object";
import type { PipelineStep } from "../types";
import { RuleCategory } from "../../rules-engine-types";
import { filterRulesByCategory } from "../utils/rule-matcher";
import { evaluateConditions } from "../evaluators";
import { applyActions } from "../applicators";

/**
 * Bundle adjustment step - applies bundle-specific adjustments
 */
export const bundleAdjustmentStep: PipelineStep = {
  name: "BUNDLE_ADJUSTMENT",
  
  execute: async (state, rules) => {
    const bundleAdjustmentRules = filterRulesByCategory(rules, RuleCategory.BundleAdjustment);
    const appliedRuleIds: string[] = [];
    
    const newState = produce(state, draft => {
      bundleAdjustmentRules.forEach(rule => {
        if (evaluateConditions(rule.conditions || [], state)) {
          applyActions(rule.actions, draft);
          appliedRuleIds.push(rule.id);
        }
      });
    });
    
    const originalPrice = dot.pick("state.selectedBundle.basePrice", state);
    const adjustedPrice = dot.pick("state.pricing.totalCost", newState);
    
    return {
      name: "BUNDLE_ADJUSTMENT",
      timestamp: new Date(),
      state: newState,
      appliedRules: appliedRuleIds,
      debug: {
        basePrice: originalPrice,
        adjustedPrice: adjustedPrice,
        rulesApplied: appliedRuleIds.length,
        adjustment: adjustedPrice - originalPrice
      }
    };
  }
};