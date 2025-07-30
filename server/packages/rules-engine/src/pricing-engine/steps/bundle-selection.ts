import { produce } from "immer";
import * as dot from "dot-object";
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
    const bundles = dot.pick("context.bundles", state) || [];
    const requestedDuration = dot.pick("request.duration", state) || 0;
    
    // Find the best matching bundle
    const {selectedBundle, previousBundle} = findOptimalBundle(bundles, requestedDuration);
    const unusedDays = Math.max(0, selectedBundle.validityInDays - requestedDuration);
    
    // Initialize pricing for the selected bundle
    const initialPricing = initializePricing(selectedBundle);
    
    // Update state with selected bundle
    const newState = produce(state, draft => {
      // Update response - directly mutate draft
      draft.state.previousBundle = previousBundle;
      draft.response.selectedBundle = selectedBundle;
      draft.response.unusedDays = unusedDays;
      draft.response.pricing = initialPricing;
      
      // Update state - directly mutate draft
      draft.state.selectedBundle = selectedBundle;
      draft.state.pricing = initialPricing;
      draft.state.country = selectedBundle.countries?.[0] || draft.state.country || "";
      draft.state.region = selectedBundle.region || draft.state.region || "";
      draft.state.group = selectedBundle.groups?.[0] || draft.state.group || "";
      draft.state.data = selectedBundle.isUnlimited ? "unlimited" : "fixed";
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