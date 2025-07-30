import { createLogger } from "@esim-go/utils";
import type { BasePipelineStep } from "../abstracts";
import type { PricingEngineState, PricingRule } from "../../rules-engine-types";
import type { PipelineStepResult } from "../types";
import { ErrorFactory, TimeoutError } from "../errors";
import { RuleValidator } from "../validation";
import type { 
  PipelineConfig, 
  PipelineStepDependencies,
  StepExecutionContext 
} from "./pipeline-config";

/**
 * Injectable pipeline executor with dependency management
 */
export class PipelineExecutor {
  private readonly steps: BasePipelineStep[] = [];
  private readonly config: PipelineConfig;
  private readonly logger = createLogger({
    component: "PipelineExecutor",
    operationType: "pipeline-execution",
  });
  
  constructor(config: PipelineConfig) {
    this.config = config;
    this.initializeSteps();
  }
  
  /**
   * Execute the complete pipeline
   */
  async *executePipeline(
    state: PricingEngineState,
    rules: PricingRule[],
    context: StepExecutionContext
  ): AsyncGenerator<PipelineStepResult, PricingEngineState> {
    const { correlationId, timeout } = context;
    
    this.logger.info("Starting pipeline execution", {
      correlationId,
      stepsCount: this.steps.length,
      rulesCount: rules.length,
    });
    
    try {
      // Validate inputs if enabled
      if (this.config.enableRuleValidation) {
        this.validateRules(rules, correlationId);
      }
      
      let currentState = state;
      
      // Execute steps sequentially
      for (const step of this.steps) {
        const stepStartTime = Date.now();
        
        try {
          // Set timeout for step execution
          const stepResult = await this.executeStepWithTimeout(
            step,
            currentState,
            rules,
            timeout || this.config.timeout || 30000
          );
          
          // Update current state
          currentState = stepResult.state;
          
          const executionTime = Date.now() - stepStartTime;
          
          this.logger.debug(`Step completed: ${step.name}`, {
            correlationId,
            stepName: step.name,
            executionTime,
            appliedRules: stepResult.appliedRules.length,
          });
          
          yield stepResult;
          
        } catch (error) {
          const executionTime = Date.now() - stepStartTime;
          
          this.logger.error(`Step failed: ${step.name}`, error as Error, {
            correlationId,
            stepName: step.name,
            executionTime,
          });
          
          throw ErrorFactory.stepExecution(
            `Pipeline step ${step.name} failed: ${(error as Error).message}`,
            step.name,
            executionTime,
            {},
            correlationId
          );
        }
      }
      
      this.logger.info("Pipeline execution completed", {
        correlationId,
        stepsExecuted: this.steps.length,
        finalPrice: currentState.response.pricing?.finalRevenue,
      });
      
      return currentState;
      
    } catch (error) {
      this.logger.error("Pipeline execution failed", error as Error, {
        correlationId,
      });
      throw error;
    }
  }
  
  /**
   * Execute a single step with timeout
   */
  private async executeStepWithTimeout(
    step: BasePipelineStep,
    state: PricingEngineState,
    rules: PricingRule[],
    timeoutMs: number
  ): Promise<PipelineStepResult> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new TimeoutError(
          `Step execution timed out after ${timeoutMs}ms`,
          step.name,
          timeoutMs,
          {},
          state.metadata?.correlationId
        ));
      }, timeoutMs);
      
      step.execute(state, rules)
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
  
  /**
   * Initialize pipeline steps from configuration
   */
  private initializeSteps(): void {
    const sortedStepDefs = this.config.steps
      .filter(stepDef => stepDef.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    for (const stepDef of sortedStepDefs) {
      try {
        const dependencies = this.createDependencies(stepDef.dependencies);
        const stepConfig = stepDef.config || {};
        
        const step = new stepDef.stepClass(stepConfig, dependencies);
        this.steps.push(step);
        
        this.logger.debug(`Initialized pipeline step: ${stepDef.name}`, {
          stepName: stepDef.name,
          config: stepConfig,
          hasDependencies: !!stepDef.dependencies,
        });
        
      } catch (error) {
        this.logger.error(`Failed to initialize step: ${stepDef.name}`, error as Error, {
          stepName: stepDef.name,
        });
        throw ErrorFactory.configuration(
          `Failed to initialize pipeline step ${stepDef.name}: ${(error as Error).message}`,
          `steps.${stepDef.name}`,
          { stepDefinition: stepDef }
        );
      }
    }
    
    this.logger.info("Pipeline steps initialized", {
      stepsCount: this.steps.length,
      stepNames: this.steps.map(s => s.name),
    });
  }
  
  /**
   * Create dependencies for step injection
   */
  private createDependencies(dependencies?: PipelineStepDependencies): PipelineStepDependencies {
    return {
      ruleFilter: dependencies?.ruleFilter || this.defaultRuleFilter,
      logger: dependencies?.logger || this.logger,
      validator: dependencies?.validator || new RuleValidator(),
      cache: dependencies?.cache,
      metrics: dependencies?.metrics,
    };
  }
  
  /**
   * Default rule filter implementation
   */
  private defaultRuleFilter = (rules: PricingRule[], category: string): PricingRule[] => {
    return rules.filter(
      rule =>
        (rule.isActive === undefined || rule.isActive === true) &&
        rule.category?.toUpperCase() === category.toUpperCase()
    );
  };
  
  /**
   * Validate rules before pipeline execution
   */
  private validateRules(rules: PricingRule[], correlationId: string): void {
    const validator = new RuleValidator();
    const validation = validator.validateRules(rules);
    
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(e => e.message).join(', ');
      throw ErrorFactory.ruleEvaluation(
        `Rule validation failed: ${errorMessages}`,
        'multiple',
        'validation',
        { validationErrors: validation.errors },
        correlationId
      );
    }
    
    if (validation.warnings.length > 0) {
      this.logger.warn("Rule validation warnings", {
        correlationId,
        warnings: validation.warnings,
      });
    }
  }
  
  /**
   * Get pipeline statistics
   */
  getStatistics(): {
    stepsCount: number;
    stepNames: string[];
    configuration: PipelineConfig;
  } {
    return {
      stepsCount: this.steps.length,
      stepNames: this.steps.map(s => s.name),
      configuration: this.config,
    };
  }
}