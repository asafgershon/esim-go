import { produce } from "immer";
import type { PricingEngineState, PricingRule } from "../../rules-engine-types";
import type { PipelineStepResult } from "../types";
import { createLogger } from "@esim-go/utils";

/**
 * Configuration for pipeline step execution
 */
export interface StepConfig {
  enableDebug?: boolean;
  timeout?: number;
  retries?: number;
}

/**
 * Abstract base class for pipeline steps
 */
export abstract class BasePipelineStep {
  protected readonly logger = createLogger({
    component: "PipelineStep",
    operationType: "pipeline-step",
  });
  
  abstract readonly name: string;
  protected readonly config: StepConfig;
  
  constructor(config: StepConfig = {}) {
    this.config = {
      enableDebug: false,
      timeout: 5000,
      retries: 0,
      ...config,
    };
  }
  
  /**
   * Execute the pipeline step
   */
  async execute(
    state: PricingEngineState,
    rules: PricingRule[]
  ): Promise<PipelineStepResult> {
    const startTime = Date.now();
    const correlationId = state.metadata?.correlationId;
    
    this.logger.debug(`Starting step execution: ${this.name}`, {
      correlationId,
      step: this.name,
    });
    
    try {
      // Validate inputs
      this.validateInputs(state, rules);
      
      // Execute the step logic
      const result = await this.executeStep(state, rules);
      
      const executionTime = Date.now() - startTime;
      
      this.logger.debug(`Completed step execution: ${this.name}`, {
        correlationId,
        step: this.name,
        executionTime,
        appliedRules: result.appliedRules.length,
      });
      
      return {
        ...result,
        timestamp: new Date(),
        debug: {
          ...result.debug,
          executionTime,
          stepName: this.name,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error(`Step execution failed: ${this.name}`, error as Error, {
        correlationId,
        step: this.name,
        executionTime,
      });
      
      throw new Error(`Step ${this.name} failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Abstract method to be implemented by concrete steps
   */
  protected abstract executeStep(
    state: PricingEngineState,
    rules: PricingRule[]
  ): Promise<Omit<PipelineStepResult, 'timestamp'>>;
  
  /**
   * Validate inputs before step execution
   */
  protected validateInputs(state: PricingEngineState, rules: PricingRule[]): void {
    if (!state) {
      throw new Error("State is required for pipeline step execution");
    }
    
    if (!rules) {
      throw new Error("Rules array is required for pipeline step execution");
    }
    
    if (!state.metadata?.correlationId) {
      throw new Error("Correlation ID is required in state metadata");
    }
  }
  
  /**
   * Create a new state with updates applied immutably
   */
  protected updateState(
    state: PricingEngineState,
    updater: (draft: PricingEngineState) => void
  ): PricingEngineState {
    return produce(state, updater);
  }
  
  /**
   * Filter rules by category for this step
   */
  protected filterRules(rules: PricingRule[], category: string): PricingRule[] {
    return rules.filter(
      rule =>
        (rule.isActive === undefined || rule.isActive === true) &&
        rule.category?.toUpperCase() === category.toUpperCase()
    );
  }
  
  /**
   * Create debug information for the step
   */
  protected createDebugInfo(additionalInfo: Record<string, any> = {}): Record<string, any> {
    return {
      stepName: this.name,
      timestamp: new Date().toISOString(),
      ...additionalInfo,
    };
  }
  
  /**
   * Check if debug mode is enabled
   */
  protected isDebugEnabled(): boolean {
    return this.config.enableDebug === true;
  }
}