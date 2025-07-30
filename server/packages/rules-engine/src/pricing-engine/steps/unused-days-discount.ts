import { produce } from "immer";
import * as dot from "dot-object";
import type { PipelineStep } from "../types";
import { calculateUnusedDayDiscount } from "../utils/bundle-selector";

/**
 * Unused days discount step - applies discount for unused days
 */
export const unusedDaysDiscountStep: PipelineStep = {
  name: "APPLY_UNUSED_DAYS_DISCOUNT",
  
  execute: async (state, rules) => {
    const unusedDays = dot.pick("response.unusedDays", state) || 0;
    
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
    
    const bundles = dot.pick("context.bundles", state) || [];
    const selectedBundle = dot.pick("response.selectedBundle", state);
    const requestedDuration = dot.pick("request.duration", state) || 0;
    
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
    
    // Calculate discount per day
    const discountPerDay = calculateUnusedDayDiscount(
      bundles,
      selectedBundle,
      requestedDuration
    );
    
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
      if (draft.state && draft.state.pricing) {
        // Add to existing discount
        draft.state.pricing.discountValue = (draft.state.pricing.discountValue || 0) + totalUnusedDiscount;
        draft.state.pricing.discountPerDay = discountPerDay;
        draft.state.pricing.priceAfterDiscount = draft.state.pricing.totalCost - draft.state.pricing.discountValue;
        
        // Update response as well
        draft.response.pricing = draft.state.pricing;
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
        message: `Applied ${unusedDays} unused days discount at $${discountPerDay.toFixed(2)}/day`
      }
    };
  }
};