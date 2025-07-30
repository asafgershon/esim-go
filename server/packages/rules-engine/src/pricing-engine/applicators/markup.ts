import type { ActionApplicator } from "../types";

/**
 * Add markup to the pricing
 */
export const addMarkup: ActionApplicator = (draft, value) => {
  // Directly mutate draft instead of using dot.pick/set
  if (draft.state && draft.state.pricing) {
    draft.state.pricing.markup += value;
    draft.state.pricing.totalCost = draft.state.pricing.cost + draft.state.pricing.markup;
    
    // Update price after discount if no discounts have been applied yet
    if (draft.state.pricing.discountValue === 0) {
      draft.state.pricing.priceAfterDiscount = draft.state.pricing.totalCost;
    }
    
    // Update response as well
    draft.response.pricing = draft.state.pricing;
  }
};