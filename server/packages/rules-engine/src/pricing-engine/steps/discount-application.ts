import { produce } from "immer";
import * as dot from "dot-object";
import type { PipelineStep } from "../types";
import { RuleCategory } from "../../rules-engine-types";
import { filterRulesByCategory } from "../utils/rule-matcher";
import { evaluateConditions } from "../evaluators";
import { applyActions } from "../applicators";

/**
 * Discount application step - applies all discount rules
 */
export const discountApplicationStep: PipelineStep = {
  name: "APPLY_DISCOUNTS",
  
  execute: async (state, rules) => {
    const discountRules = filterRulesByCategory(rules, RuleCategory.Discount);
    const appliedRuleIds: string[] = [];
    
    const originalPrice = dot.pick("response.pricing.totalCost", state) || 0;
    const originalDiscount = dot.pick("response.pricing.discountValue", state) || 0;
    
    const newState = produce(state, draft => {
      discountRules.forEach(rule => {
        if (evaluateConditions(rule.conditions || [], state)) {
          applyActions(rule.actions, draft);
          appliedRuleIds.push(rule.id);
        }
      });
    });
    
    const finalPrice = dot.pick("response.pricing.priceAfterDiscount", newState) || 0;
    const totalDiscount = dot.pick("response.pricing.discountValue", newState) || 0;
    
    return {
      name: "APPLY_DISCOUNTS",
      timestamp: new Date(),
      state: newState,
      appliedRules: appliedRuleIds,
      debug: {
        originalSubtotal: originalPrice,
        discountedSubtotal: finalPrice,
        previousDiscount: originalDiscount,
        totalDiscount: totalDiscount,
        newDiscount: totalDiscount - originalDiscount,
        rulesApplied: appliedRuleIds.length
      }
    };
  }
};