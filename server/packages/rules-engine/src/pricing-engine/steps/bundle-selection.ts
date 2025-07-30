import { produce } from "immer";
import type { PipelineStep, PipelineStepResult } from "../types";
import type { PricingEngineState, PricingRule } from "../../rules-engine-types";
import { findOptimalBundle } from "../utils/bundle-selector";
import { initializePricing, updateStateWithBundle } from "../utils/state-helpers";

/**
 * Bundle selection step - finds the best matching bundle for the requested duration
 */
export const bundleSelectionStep: PipelineStep = {
  name: "BUNDLE_SELECTION",
  
  execute: async (state) => {
    const bundles = state.context.bundles || [];
    const requestedDuration = state.request.duration || 0;
    
    // Find the best matching bundle
    const {selectedBundle, previousBundle} = findOptimalBundle(bundles, requestedDuration);
    const unusedDays = Math.max(0, selectedBundle.validityInDays - requestedDuration);
    
    // Initialize pricing for the selected bundle
    const initialPricing = initializePricing(selectedBundle);
    
    // Update state with selected bundle
    const newState = produce(state, draft => {
      // Update response - directly mutate draft
      draft.response.selectedBundle = selectedBundle;
      draft.response.unusedDays = unusedDays;
      draft.response.pricing = initialPricing;
      
      // Update processing - directly mutate draft
      draft.processing.previousBundle = previousBundle;
      draft.processing.selectedBundle = selectedBundle;
      draft.processing.region = selectedBundle.region || "";
      draft.processing.group = selectedBundle.groups?.[0] || "";
    });
    
    return {
      name: "BUNDLE_SELECTION",
      timestamp: new Date(),
      state: newState,
      appliedRules: [],
      debug: {
        reason: selectedBundle.validityInDays === requestedDuration ? "exact_match" : "next_available",
        requestedDuration,
        selectedDuration: selectedBundle.validityInDays,
        unusedDays,
        bundleName: selectedBundle.name,
        basePrice: selectedBundle.basePrice
      }
    };
  }
};