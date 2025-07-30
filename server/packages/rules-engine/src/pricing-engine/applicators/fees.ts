import * as dot from "dot-object";
import type { ActionApplicator } from "../types";

/**
 * Set processing rate (as percentage)
 */
export const setProcessingRate: ActionApplicator = (draft, value) => {
  const pricing = dot.pick("state.pricing", draft);
  
  if (pricing) {
    pricing.processingRate = value / 100;
    pricing.processingCost = pricing.priceAfterDiscount * pricing.processingRate;
    
    // Update the draft with modified pricing
    dot.set("state.pricing", pricing, draft);
    dot.set("response.pricing", pricing, draft);
  }
};

/**
 * Add fixed processing fee
 */
export const addProcessingFee: ActionApplicator = (draft, value) => {
  const pricing = dot.pick("state.pricing", draft);
  
  if (pricing) {
    pricing.processingCost += value;
    
    // Update the draft with modified pricing
    dot.set("state.pricing", pricing, draft);
    dot.set("response.pricing", pricing, draft);
  }
};