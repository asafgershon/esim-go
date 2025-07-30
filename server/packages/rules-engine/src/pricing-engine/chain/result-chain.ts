import type { PricingEngineState, PricingEngineOutput } from "../../rules-engine-types";
import type { PipelineStepResult } from "../types";
import { StateBuilder } from "../state";
import { ErrorFactory } from "../errors";

/**
 * Result chain for composing pipeline step results
 */
export class ResultChain {
  private results: PipelineStepResult[] = [];
  private currentState: PricingEngineState;
  
  constructor(initialState: PricingEngineState) {
    this.currentState = initialState;
  }
  
  /**
   * Add a step result to the chain
   */
  addResult(result: PipelineStepResult): ResultChain {
    try {
      // Validate the result
      this.validateStepResult(result);
      
      // Add result to chain
      this.results.push(result);
      
      // Update current state using the result's state
      this.currentState = result.state;
      
      return this;
    } catch (error) {
      throw ErrorFactory.stateManagement(
        `Failed to add result to chain: ${(error as Error).message}`,
        `chain.results[${this.results.length}]`,
        { stepName: result.name, resultCount: this.results.length },
        this.currentState.metadata?.correlationId
      );
    }
  }
  
  /**
   * Add multiple results to the chain
   */
  addResults(results: PipelineStepResult[]): ResultChain {
    results.forEach(result => this.addResult(result));
    return this;
  }
  
  /**
   * Get the current state
   */
  getCurrentState(): PricingEngineState {
    return this.currentState;
  }
  
  /**
   * Get all results in the chain
   */
  getResults(): PipelineStepResult[] {
    return [...this.results];
  }
  
  /**
   * Get applied rule IDs from all results
   */
  getAllAppliedRuleIds(): string[] {
    return this.results.flatMap(result => result.appliedRules || []);
  }
  
  /**
   * Get results by step name
   */
  getResultsByStep(stepName: string): PipelineStepResult[] {
    return this.results.filter(result => result.name === stepName);
  }
  
  /**
   * Create final output from the chain
   */
  toOutput(): PricingEngineOutput {
    // Update state with complete processing history
    const finalState = new StateBuilder(this.currentState)
      .update(draft => {
        draft.processing.steps = this.results;
      })
      .getState();
    
    return new StateBuilder(finalState).toOutput();
  }
  
  /**
   * Get chain statistics
   */
  getStatistics(): {
    stepCount: number;
    totalRulesApplied: number;
    executionTime: number;
    stepNames: string[];
  } {
    const totalRulesApplied = this.getAllAppliedRuleIds().length;
    const executionTime = this.calculateTotalExecutionTime();
    const stepNames = this.results.map(r => r.name);
    
    return {
      stepCount: this.results.length,
      totalRulesApplied,
      executionTime,
      stepNames,
    };
  }
  
  /**
   * Validate a step result before adding to chain
   */
  private validateStepResult(result: PipelineStepResult): void {
    const correlationId = this.currentState.metadata?.correlationId;
    
    if (!result.name) {
      throw ErrorFactory.validation(
        "Step result must have a name",
        "result.name",
        result.name,
        correlationId
      );
    }
    
    if (!result.state) {
      throw ErrorFactory.validation(
        "Step result must have a state",
        "result.state",
        result.state,
        correlationId
      );
    }
    
    if (!result.timestamp) {
      throw ErrorFactory.validation(
        "Step result must have a timestamp",
        "result.timestamp",
        result.timestamp,
        correlationId
      );
    }
    
    if (!Array.isArray(result.appliedRules)) {
      throw ErrorFactory.validation(
        "Step result appliedRules must be an array",
        "result.appliedRules",
        result.appliedRules,
        correlationId
      );
    }
    
    // Validate state consistency
    if (result.state.metadata?.correlationId !== correlationId) {
      throw ErrorFactory.stateManagement(
        "Step result state has inconsistent correlation ID",
        "result.state.metadata.correlationId",
        {
          expected: correlationId,
          actual: result.state.metadata?.correlationId,
        },
        correlationId
      );
    }
  }
  
  /**
   * Calculate total execution time from debug information
   */
  private calculateTotalExecutionTime(): number {
    return this.results.reduce((total, result) => {
      const executionTime = result.debug?.executionTime || 0;
      return total + (typeof executionTime === 'number' ? executionTime : 0);
    }, 0);
  }
}

/**
 * Result chain builder for fluent API
 */
export class ResultChainBuilder {
  private chain: ResultChain;
  
  constructor(initialState: PricingEngineState) {
    this.chain = new ResultChain(initialState);
  }
  
  /**
   * Create a new result chain builder
   */
  static fromState(state: PricingEngineState): ResultChainBuilder {
    return new ResultChainBuilder(state);
  }
  
  /**
   * Add a step result
   */
  withResult(result: PipelineStepResult): ResultChainBuilder {
    this.chain.addResult(result);
    return this;
  }
  
  /**
   * Add multiple step results
   */
  withResults(results: PipelineStepResult[]): ResultChainBuilder {
    this.chain.addResults(results);
    return this;
  }
  
  /**
   * Build the final result chain
   */
  build(): ResultChain {
    return this.chain;
  }
  
  /**
   * Build and return the output directly
   */
  buildOutput(): PricingEngineOutput {
    return this.chain.toOutput();
  }
  
  /**
   * Build and return the current state
   */
  buildState(): PricingEngineState {
    return this.chain.getCurrentState();
  }
}