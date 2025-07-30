import { produce } from "immer";
import * as dot from "dot-object";
import type { PipelineStep } from "../types";
import { RuleCategory } from "../../rules-engine-types";
import { filterRulesByCategory } from "../utils/rule-matcher";
import { evaluateConditions } from "../evaluators";
import { applyActions } from "../applicators";

/**
 * Fee application step - applies processing fees, payment method fees, etc.
 */
export const feeApplicationStep: PipelineStep = {
  name: "APPLY_FEES",
  
  execute: async (state, rules) => {
    const feeRules = filterRulesByCategory(rules, RuleCategory.Fee);
    const appliedRuleIds: string[] = [];
    
    const priceBeforeFees = dot.pick("response.pricing.priceAfterDiscount", state) || 0;
    const processingCostBefore = dot.pick("response.pricing.processingCost", state) || 0;
    
    const newState = produce(state, draft => {
      feeRules.forEach(rule => {
        if (evaluateConditions(rule.conditions || [], state)) {
          applyActions(rule.actions, draft);
          appliedRuleIds.push(rule.id);
        }
      });
      
      // Update final revenue based on current pricing - directly mutate draft
      if (draft.response && draft.response.pricing) {
        // finalRevenue = what customer pays (before processing fee deduction)
        draft.response.pricing.finalRevenue = draft.response.pricing.priceAfterDiscount;
      }
    });
    
    const finalPrice = dot.pick("response.pricing.finalRevenue", newState) || 0;
    const totalFees = dot.pick("response.pricing.processingCost", newState) || 0;
    const processingRate = dot.pick("response.pricing.processingRate", newState) || 0;
    
    return {
      name: "APPLY_FEES",
      timestamp: new Date(),
      state: newState,
      appliedRules: appliedRuleIds,
      debug: {
        priceBeforeFees,
        finalPrice,
        processingCostBefore,
        totalFees,
        newFees: totalFees - processingCostBefore,
        processingRate: `${(processingRate * 100).toFixed(2)}%`,
        rulesApplied: appliedRuleIds.length
      }
    };
  }
};