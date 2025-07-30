import { BasePipelineStep } from "../../abstracts";
import { StateBuilder, ResultBuilder } from "../../state";
import { ErrorFactory } from "../../errors";
import { RuleCategory } from "../../../rules-engine-types";
import type { PricingEngineState, PricingRule } from "../../../rules-engine-types";
import type { PipelineStepResult } from "../../types";
import { evaluateConditions } from "../../evaluators";
import { applyActions } from "../../applicators";

/**
 * Improved discount application step using new architecture patterns
 */
export class DiscountApplicationStep extends BasePipelineStep {
  readonly name = "APPLY_DISCOUNTS";
  
  protected async executeStep(
    state: PricingEngineState,
    rules: PricingRule[]
  ): Promise<Omit<PipelineStepResult, 'timestamp'>> {
    const correlationId = state.metadata?.correlationId;
    
    try {
      // Validate prerequisites
      this.validateDiscountApplicationInputs(state);
      
      // Filter discount rules
      const discountRules = this.filterRules(rules, RuleCategory.Discount);
      
      if (discountRules.length === 0) {
        this.logger.debug("No discount rules found, skipping discount application", {
          correlationId,
        });
        
        return new ResultBuilder(this.name)
          .withState(state)
          .withAppliedRules([])
          .withDebugInfo({
            rulesEvaluated: 0,
            rulesApplied: 0,
            originalPrice: state.response.pricing?.totalCost || 0,
            finalPrice: state.response.pricing?.priceAfterDiscount || 0,
            totalDiscount: 0,
          })
          .build();
      }
      
      // Capture original values for debugging
      const originalPrice = state.response.pricing?.totalCost || 0;
      const originalDiscount = state.response.pricing?.discountValue || 0;
      
      // Apply discount rules
      const { updatedState, appliedRuleIds } = await this.applyDiscountRules(
        state,
        discountRules
      );
      
      // Calculate final values for debugging
      const finalPrice = updatedState.response.pricing?.priceAfterDiscount || 0;
      const totalDiscount = updatedState.response.pricing?.discountValue || 0;
      
      return new ResultBuilder(this.name)
        .withState(updatedState)
        .withAppliedRules(appliedRuleIds)
        .withDebugInfo({
          rulesEvaluated: discountRules.length,
          rulesApplied: appliedRuleIds.length,
          originalSubtotal: originalPrice,
          discountedSubtotal: finalPrice,
          previousDiscount: originalDiscount,
          totalDiscount: totalDiscount,
          newDiscount: totalDiscount - originalDiscount,
          appliedRuleNames: discountRules
            .filter(rule => appliedRuleIds.includes(rule.id))
            .map(rule => rule.name),
        })
        .build();
        
    } catch (error) {
      throw ErrorFactory.stepExecution(
        `Discount application failed: ${(error as Error).message}`,
        this.name,
        Date.now(),
        {
          availableRules: rules.length,
          discountRules: this.filterRules(rules, RuleCategory.Discount).length,
        },
        correlationId
      );
    }
  }
  
  /**
   * Validate inputs specific to discount application
   */
  private validateDiscountApplicationInputs(state: PricingEngineState): void {
    const correlationId = state.metadata?.correlationId;
    
    if (!state.response.selectedBundle) {
      throw ErrorFactory.validation(
        "Bundle must be selected before applying discounts",
        "response.selectedBundle",
        state.response.selectedBundle,
        correlationId
      );
    }
    
    if (!state.response.pricing) {
      throw ErrorFactory.validation(
        "Pricing must be initialized before applying discounts",
        "response.pricing",
        state.response.pricing,
        correlationId
      );
    }
    
    if (typeof state.response.pricing.totalCost !== 'number' || state.response.pricing.totalCost <= 0) {
      throw ErrorFactory.validation(
        "Valid total cost is required for discount application",
        "response.pricing.totalCost",
        state.response.pricing.totalCost,
        correlationId
      );
    }
  }
  
  /**
   * Apply discount rules to the state
   */
  private async applyDiscountRules(
    state: PricingEngineState,
    discountRules: PricingRule[]
  ): Promise<{ updatedState: PricingEngineState; appliedRuleIds: string[] }> {
    const appliedRuleIds: string[] = [];
    
    let currentState = state;
    
    for (const rule of discountRules) {
      try {
        // Evaluate rule conditions
        if (evaluateConditions(rule.conditions || [], currentState)) {
          this.logger.debug(`Applying discount rule: ${rule.name}`, {
            correlationId: currentState.metadata?.correlationId,
            ruleId: rule.id,
            ruleName: rule.name,
          });
          
          // Apply rule actions using StateBuilder
          currentState = new StateBuilder(currentState)
            .update(draft => {
              applyActions(rule.actions, draft);
            })
            .getState();
          
          appliedRuleIds.push(rule.id);
        } else {
          this.logger.debug(`Discount rule conditions not met: ${rule.name}`, {
            correlationId: currentState.metadata?.correlationId,
            ruleId: rule.id,
            ruleName: rule.name,
          });
        }
      } catch (error) {
        // Log error but continue with other rules
        this.logger.error(`Failed to apply discount rule: ${rule.name}`, error as Error, {
          correlationId: currentState.metadata?.correlationId,
          ruleId: rule.id,
          ruleName: rule.name,
        });
        
        throw ErrorFactory.ruleEvaluation(
          `Failed to apply discount rule: ${(error as Error).message}`,
          rule.id,
          rule.name,
          { originalPricing: state.response.pricing },
          currentState.metadata?.correlationId
        );
      }
    }
    
    return {
      updatedState: currentState,
      appliedRuleIds,
    };
  }
}