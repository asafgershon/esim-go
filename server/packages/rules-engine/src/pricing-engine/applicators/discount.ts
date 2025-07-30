import * as dot from "dot-object";
import type { ActionApplicator } from "../types";

/**
 * Apply percentage discount to the pricing
 */
export const applyDiscountPercentage: ActionApplicator = (draft, value) => {
  // Directly mutate draft instead of using dot.pick/set
  if (draft.state && draft.state.pricing && draft.state.pricing.totalCost > 0) {
    const discountAmount = draft.state.pricing.totalCost * (value / 100);
    draft.state.pricing.discountValue += discountAmount;
    draft.state.pricing.discountRate = (draft.state.pricing.discountValue / draft.state.pricing.totalCost) * 100;
    draft.state.pricing.priceAfterDiscount = draft.state.pricing.totalCost - draft.state.pricing.discountValue;
    
    // Update response as well
    if (!draft.response) draft.response = {};
    draft.response.pricing = draft.state.pricing;
  }
};

/**
 * Apply fixed amount discount to the pricing
 */
export const applyDiscountFixed: ActionApplicator = (draft, value) => {
  // Directly mutate draft instead of using dot.pick/set
  if (draft.state && draft.state.pricing && draft.state.pricing.totalCost > 0) {
    draft.state.pricing.discountValue += value;
    draft.state.pricing.discountRate = (draft.state.pricing.discountValue / draft.state.pricing.totalCost) * 100;
    draft.state.pricing.priceAfterDiscount = Math.max(0, draft.state.pricing.totalCost - draft.state.pricing.discountValue);
    
    // Update response as well
    if (!draft.response) draft.response = {};
    draft.response.pricing = draft.state.pricing;
  }
};