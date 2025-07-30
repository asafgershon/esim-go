import * as dot from "dot-object";
import type { ActionApplicator } from "../types";

/**
 * Apply percentage discount to the pricing
 */
export const applyDiscountPercentage: ActionApplicator = (draft, value) => {
  // Directly mutate draft instead of using dot.pick/set
  if (draft.response && draft.response.pricing && draft.response.pricing.totalCost > 0) {
    const discountAmount = draft.response.pricing.totalCost * (value / 100);
    draft.response.pricing.discountValue += discountAmount;
    draft.response.pricing.discountRate = (draft.response.pricing.discountValue / draft.response.pricing.totalCost) * 100;
    draft.response.pricing.priceAfterDiscount = draft.response.pricing.totalCost - draft.response.pricing.discountValue;
  }
};

/**
 * Apply fixed amount discount to the pricing
 */
export const applyDiscountFixed: ActionApplicator = (draft, value) => {
  // Directly mutate draft instead of using dot.pick/set
  if (draft.response && draft.response.pricing && draft.response.pricing.totalCost > 0) {
    draft.response.pricing.discountValue += value;
    draft.response.pricing.discountRate = (draft.response.pricing.discountValue / draft.response.pricing.totalCost) * 100;
    draft.response.pricing.priceAfterDiscount = Math.max(0, draft.response.pricing.totalCost - draft.response.pricing.discountValue);
  }
};