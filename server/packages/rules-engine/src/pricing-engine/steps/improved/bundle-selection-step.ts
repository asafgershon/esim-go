import { BasePipelineStep } from "../../abstracts";
import { StateBuilder, ResultBuilder } from "../../state";
import { ErrorFactory } from "../../errors";
import type { PricingEngineState, PricingRule, Bundle } from "../../../rules-engine-types";
import type { PipelineStepResult } from "../../types";

/**
 * Improved bundle selection step using new architecture patterns
 */
export class BundleSelectionStep extends BasePipelineStep {
  readonly name = "BUNDLE_SELECTION";
  
  protected async executeStep(
    state: PricingEngineState,
    rules: PricingRule[]
  ): Promise<Omit<PipelineStepResult, 'timestamp'>> {
    const correlationId = state.metadata?.correlationId;
    
    try {
      // Validate prerequisites
      this.validateBundleSelectionInputs(state);
      
      // Find optimal bundle
      const { selectedBundle, previousBundle, selectionReason } = this.findOptimalBundle(
        state.context.bundles || [],
        state.request.duration || 0
      );
      
      // Calculate unused days
      const unusedDays = Math.max(0, selectedBundle.validityInDays - (state.request.duration || 0));
      
      // Update state using StateBuilder
      const updatedState = new StateBuilder(state)
        .withSelectedBundle(selectedBundle, unusedDays)
        .withPreviousBundle(previousBundle!)
        .getState();
      
      // Create result using ResultBuilder
      return new ResultBuilder(this.name)
        .withState(updatedState)
        .withAppliedRules([]) // No rules applied in bundle selection
        .withDebugInfo({
          reason: selectionReason,
          requestedDuration: state.request.duration,
          selectedDuration: selectedBundle.validityInDays,
          unusedDays,
          bundleName: selectedBundle.name,
          basePrice: selectedBundle.basePrice,
          previousBundleName: previousBundle?.name,
        })
        .build();
        
    } catch (error) {
      throw ErrorFactory.stepExecution(
        `Bundle selection failed: ${(error as Error).message}`,
        this.name,
        Date.now(),
        {
          availableBundles: state.context.bundles?.length || 0,
          requestedDuration: state.request.duration,
          countryISO: state.request.countryISO,
        },
        correlationId
      );
    }
  }
  
  /**
   * Validate inputs specific to bundle selection
   */
  private validateBundleSelectionInputs(state: PricingEngineState): void {
    const correlationId = state.metadata?.correlationId;
    
    if (!state.context.bundles || state.context.bundles.length === 0) {
      throw ErrorFactory.bundleProcessing(
        "No bundles available for selection",
        undefined,
        undefined,
        { availableBundles: 0 },
        correlationId
      );
    }
    
    if (!state.request.duration || state.request.duration <= 0) {
      throw ErrorFactory.validation(
        "Valid duration is required for bundle selection",
        "request.duration",
        state.request.duration,
        correlationId
      );
    }
    
    if (!state.request.countryISO) {
      throw ErrorFactory.validation(
        "Country ISO is required for bundle selection",
        "request.countryISO",
        state.request.countryISO,
        correlationId
      );
    }
  }
  
  /**
   * Find the optimal bundle for the requested duration
   */
  private findOptimalBundle(
    bundles: Bundle[],
    requestedDuration: number
  ): {
    selectedBundle: Bundle;
    previousBundle?: Bundle;
    selectionReason: string;
  } {
    // Filter valid bundles
    const validBundles = bundles.filter(bundle => 
      bundle.validityInDays >= requestedDuration &&
      bundle.basePrice > 0
    );
    
    if (validBundles.length === 0) {
      throw new Error("No valid bundles found for the requested duration");
    }
    
    // Sort by validity days ascending (prefer shorter validity periods)
    validBundles.sort((a, b) => a.validityInDays - b.validityInDays);
    
    // Find exact match first
    const exactMatch = validBundles.find(bundle => 
      bundle.validityInDays === requestedDuration
    );
    
    if (exactMatch) {
      return {
        selectedBundle: exactMatch,
        selectionReason: "exact_match",
      };
    }
    
    // Find the bundle with minimal unused days
    const selectedBundle = validBundles[0];
    
    // Find previous bundle (one step down in validity)
    const previousBundle = bundles
      .filter(bundle => bundle.validityInDays < selectedBundle.validityInDays)
      .sort((a, b) => b.validityInDays - a.validityInDays)[0];
    
    return {
      selectedBundle,
      previousBundle,
      selectionReason: "next_available",
    };
  }
}