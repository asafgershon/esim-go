import { produce } from "immer";
import type { PipelineStep } from "../types";
import { calculateUnusedDayDiscount } from "../utils/bundle-selector";

/**
 * Unused days discount step - applies discount for unused days
 */
export const unusedDaysDiscountStep: PipelineStep = {
  name: "APPLY_UNUSED_DAYS_DISCOUNT",
  
  execute: async (state, rules) => {
    const unusedDays = state.response.unusedDays || 0;
    
    // If no unused days, skip
    if (unusedDays <= 0) {
      return {
        name: "APPLY_UNUSED_DAYS_DISCOUNT",
        timestamp: new Date(),
        state: state,
        appliedRules: [],
        debug: {
          unusedDays: 0,
          discountPerDay: 0,
          totalUnusedDiscount: 0,
          message: "No unused days discount needed"
        }
      };
    }
    
    const selectedBundle = state.processing.selectedBundle;
    const previousBundle = state.processing.previousBundle;
    const requestedDuration = state.request.duration || 0;
    
    if (!selectedBundle) {
      return {
        name: "APPLY_UNUSED_DAYS_DISCOUNT",
        timestamp: new Date(),
        state: state,
        appliedRules: [],
        debug: {
          unusedDays,
          error: "No selected bundle found"
        }
      };
    }
    
    // Calculate discount per day using markup difference formula
    let discountPerDay = 0;
    
    const selectedPricing = state.response.pricing;
    const previousPricing = state.processing.previousBundle?.pricingBreakdown;
    
    if (previousBundle && selectedPricing && previousPricing) {
      // Formula: (selectedBundle.markup - previousBundle.markup) / (selectedBundle.validityInDays - requestedDuration)
      const markupDifference = (selectedPricing.markup || 0) - (previousPricing.markup || 0);
      const daysDifference = selectedBundle.validityInDays - requestedDuration;
      
      if (daysDifference > 0) {
        discountPerDay = markupDifference / daysDifference;
      }
    }
    
    if (discountPerDay <= 0) {
      return {
        name: "APPLY_UNUSED_DAYS_DISCOUNT",
        timestamp: new Date(),
        state: state,
        appliedRules: [],
        debug: {
          unusedDays,
          discountPerDay: 0,
          totalUnusedDiscount: 0,
          message: "No discount per day calculated"
        }
      };
    }
    
    // Apply unused days discount
    const totalUnusedDiscount = discountPerDay * unusedDays;
    
    const newState = produce(state, draft => {
      // Directly mutate draft instead of using dot.pick/set
      if (draft.response && draft.response.pricing) {
        // Add to existing discount
        draft.response.pricing.discountValue = (draft.response.pricing.discountValue || 0) + totalUnusedDiscount;
        draft.response.pricing.discountPerDay = discountPerDay;
        draft.response.pricing.priceAfterDiscount = draft.response.pricing.totalCost - draft.response.pricing.discountValue;
      }
    });
    
    return {
      name: "APPLY_UNUSED_DAYS_DISCOUNT",
      timestamp: new Date(),
      state: newState,
      appliedRules: [`unused-days-${unusedDays}d-@${discountPerDay.toFixed(2)}`],
      debug: {
        unusedDays,
        discountPerDay,
        totalUnusedDiscount,
        selectedMarkup: selectedPricing?.markup || 0,
        previousMarkup: previousPricing?.markup || 0,
        markupDifference: (selectedPricing?.markup || 0) - (previousPricing?.markup || 0),
        message: `Applied ${unusedDays} unused days discount at $${discountPerDay.toFixed(2)}/day`
      }
    };
  }
};