import type { ActionApplicator } from "../types";

/**
 * Add markup to the pricing
 */
export const addMarkup: ActionApplicator = (draft, value) => {
  // Directly mutate draft instead of using dot.pick/set
  if (draft.response && draft.response.pricing) {
    draft.response.pricing.markup += value;
    draft.response.pricing.totalCost = draft.response.pricing.cost + draft.response.pricing.markup;
    
    // Update price after discount if no discounts have been applied yet
    if (draft.response.pricing.discountValue === 0) {
      draft.response.pricing.priceAfterDiscount = draft.response.pricing.totalCost;
    }
  }
};