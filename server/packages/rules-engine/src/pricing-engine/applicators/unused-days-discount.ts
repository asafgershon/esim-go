import type { ActionApplicator } from "../types";

/**
 * Apply unused days discount using pre-computed values
 * This action type uses the automatically calculated discount values
 * making it admin-friendly without requiring complex calculations in rules
 */
export const applyUnusedDaysDiscount: ActionApplicator = (draft, value) => {
  if (!draft.response?.pricing || !draft.processing) {
    return;
  }

  // Value can be:
  // - "auto" for automatic calculation using computed fields
  // - A number for manual override
  let discountAmount = 0;

  if (typeof value === "string" && value === "auto") {
    // Use the pre-computed effective discount
    discountAmount = draft.processing.effectiveDiscount || 0;
  } else if (typeof value === "number") {
    if (value === 1) {
      // Special case: 1 means "auto" for compatibility
      discountAmount = draft.processing.effectiveDiscount || 0;
    } else {
      // Use manual override value
      discountAmount = value;
    }
  }

  if (discountAmount > 0) {
    // Apply the discount
    draft.response.pricing.discountValue = (draft.response.pricing.discountValue || 0) + discountAmount;
    draft.response.pricing.priceAfterDiscount = draft.response.pricing.totalCost - draft.response.pricing.discountValue;
    
    // Update discount per day for tracking
    if (draft.response.unusedDays > 0) {
      draft.response.pricing.discountPerDay = draft.processing.unusedDaysDiscountPerDay || 0;
    }
  }
};