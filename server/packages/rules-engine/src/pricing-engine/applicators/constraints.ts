import * as dot from "dot-object";
import type { ActionApplicator } from "../types";

/**
 * Set minimum profit constraint
 */
export const setMinimumProfit: ActionApplicator = (draft, value) => {
  const pricing = dot.pick("state.pricing", draft);
  
  if (pricing) {
    // Calculate current profit (revenue after all costs)
    const currentProfit = pricing.priceAfterDiscount - pricing.cost;
    
    // If current profit is below minimum, adjust the price
    if (currentProfit < value) {
      // Calculate the minimum required price to achieve target profit
      const requiredPrice = pricing.cost + value;
      
      // Only adjust if the current price is below the required price
      if (pricing.priceAfterDiscount < requiredPrice) {
        pricing.priceAfterDiscount = requiredPrice;
        
        // Recalculate discount values to reflect the adjustment
        const totalDiscount = pricing.totalCost - pricing.priceAfterDiscount;
        pricing.discountValue = Math.max(0, totalDiscount);
        pricing.discountRate = pricing.totalCost > 0
          ? (pricing.discountValue / pricing.totalCost) * 100
          : 0;
        
        // Update net profit
        pricing.netProfit = pricing.priceAfterDiscount - pricing.cost;
      }
    }
    
    // Update the draft with modified pricing
    dot.set("state.pricing", pricing, draft);
    dot.set("response.pricing", pricing, draft);
  }
};

/**
 * Set minimum price constraint
 */
export const setMinimumPrice: ActionApplicator = (draft, value) => {
  const pricing = dot.pick("state.pricing", draft);
  
  if (pricing) {
    // Ensure final price doesn't go below a minimum threshold
    if (pricing.priceAfterDiscount < value) {
      pricing.priceAfterDiscount = value;
      
      // Recalculate discount values
      const totalDiscount = pricing.totalCost - pricing.priceAfterDiscount;
      pricing.discountValue = Math.max(0, totalDiscount);
      pricing.discountRate = pricing.totalCost > 0
        ? (pricing.discountValue / pricing.totalCost) * 100
        : 0;
    }
    
    // Update the draft with modified pricing
    dot.set("state.pricing", pricing, draft);
    dot.set("response.pricing", pricing, draft);
  }
};