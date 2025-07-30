import { produce } from "immer";
import type { PipelineStep } from "../types";

/**
 * Result compilation step - finalizes all calculations and ensures consistency
 */
export const resultCompilationStep: PipelineStep = {
  name: "FINALIZE",
  
  execute: async (state, rules) => {
    const newState = produce(state, draft => {
      const pricing = draft.response.pricing;
      
      if (pricing) {
        // Ensure all calculations are complete
        // finalRevenue = what customer pays (before processing fee deduction)
        pricing.finalRevenue = pricing.priceAfterDiscount;
        
        // revenueAfterProcessing = bottom line revenue after processing fees are deducted
        pricing.revenueAfterProcessing = 
          pricing.priceAfterDiscount - pricing.processingCost;
        
        pricing.totalCostBeforeProcessing = 
          pricing.priceAfterDiscount - pricing.processingCost;
        
        // Net profit is what we keep after paying the supplier cost
        // Processing fees are passed to the payment processor, not kept as profit
        pricing.netProfit = pricing.priceAfterDiscount - pricing.cost;
        
        // Update response pricing - directly mutate draft
        draft.response.pricing = pricing;
        
        // Add this step to the steps array
        if (!draft.processing.steps) {
          draft.processing.steps = [];
        }
        draft.processing.steps.push({
          name: "FINALIZE",
          timestamp: new Date(),
          state: { 
            response: { 
              unusedDays: draft.response.unusedDays,
              selectedBundle: draft.response.selectedBundle,
              pricing: pricing,
              appliedRules: draft.response.appliedRules
            } 
          },
          debug: {
            finalPrice: pricing.finalRevenue,
            profit: pricing.netProfit,
            calculationComplete: true
          }
        });
      }
    });
    
    const finalPricing = newState.response.pricing;
    
    return {
      name: "FINALIZE",
      timestamp: new Date(),
      state: newState,
      appliedRules: [],
      debug: {
        finalPrice: finalPricing?.finalRevenue || 0,
        cost: finalPricing?.cost || 0,
        markup: finalPricing?.markup || 0,
        totalDiscount: finalPricing?.discountValue || 0,
        processingFees: finalPricing?.processingCost || 0,
        netProfit: finalPricing?.netProfit || 0,
        revenueAfterProcessing: finalPricing?.revenueAfterProcessing || 0,
        calculationComplete: true
      }
    };
  }
};