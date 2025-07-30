import { produce } from "immer";
import * as dot from "dot-object";
import type { PipelineStep } from "../types";
import { RuleCategory } from "../../rules-engine-types";
import { filterRulesByCategory } from "../utils/rule-matcher";
import { evaluateConditions } from "../evaluators";
import { applyActions } from "../applicators";

/**
 * Constraint application step - applies constraint rules (minimum profit, minimum price, etc.)
 */
export const constraintApplicationStep: PipelineStep = {
  name: "APPLY_CONSTRAINTS",
  
  execute: async (state, rules) => {
    const constraintRules = filterRulesByCategory(rules, RuleCategory.Constraint);
    const appliedRuleIds: string[] = [];
    
    const priceBeforeConstraints = dot.pick("response.pricing.priceAfterDiscount", state) || 0;
    
    const newState = produce(state, draft => {
      constraintRules.forEach(rule => {
        if (evaluateConditions(rule.conditions || [], state)) {
          applyActions(rule.actions, draft);
          appliedRuleIds.push(rule.id);
        }
      });
    });
    
    const priceAfterConstraints = dot.pick("response.pricing.priceAfterDiscount", newState) || 0;
    const priceAdjustment = priceAfterConstraints - priceBeforeConstraints;
    
    return {
      name: "APPLY_CONSTRAINTS",
      timestamp: new Date(),
      state: newState,
      appliedRules: appliedRuleIds,
      debug: {
        constraintsApplied: appliedRuleIds.length,
        priceBeforeConstraints,
        priceAfterConstraints,
        priceAdjustment,
        adjustmentReason: priceAdjustment > 0 ? "minimum_constraints_enforced" : "no_adjustment_needed"
      }
    };
  }
};