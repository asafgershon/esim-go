import type { ActionApplicator, RuleAction } from "../types";
import { ActionType } from "../../rules-engine-types";
import { addMarkup } from "./markup";
import { applyDiscountPercentage, applyDiscountFixed } from "./discount";
import { setProcessingRate, addProcessingFee } from "./fees";
import { setMinimumProfit, setMinimumPrice } from "./constraints";
import { applyUnusedDaysDiscount } from "./unused-days-discount";

/**
 * Map of action types to applicator functions
 */
const applicatorMap: Record<string, ActionApplicator> = {
  [ActionType.AddMarkup]: addMarkup,
  [ActionType.ApplyDiscountPercentage]: applyDiscountPercentage,
  [ActionType.SetProcessingRate]: setProcessingRate,
  [ActionType.SetMinimumProfit]: setMinimumProfit,
  [ActionType.SetMinimumPrice]: setMinimumPrice,
  [ActionType.SetDiscountPerUnusedDay]: applyUnusedDaysDiscount,
  // Add more as needed
  APPLY_DISCOUNT_FIXED: applyDiscountFixed,
  ADD_PROCESSING_FEE: addProcessingFee,
  // Admin-friendly action types
  APPLY_UNUSED_DAYS_DISCOUNT: applyUnusedDaysDiscount,
};

/**
 * Apply a single action to the state
 */
export const applyAction = (
  action: RuleAction,
  draft: any
): void => {
  const applicator = applicatorMap[action.type];
  
  if (applicator) {
    applicator(draft, action.value);
  }
};

/**
 * Apply multiple actions to the state
 */
export const applyActions = (
  actions: RuleAction[],
  draft: any
): void => {
  actions.forEach(action => applyAction(action, draft));
};