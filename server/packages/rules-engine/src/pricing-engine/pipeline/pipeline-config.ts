import type { BasePipelineStep, StepConfig } from "../abstracts";
import type { PricingRule } from "../../rules-engine-types";

/**
 * Pipeline configuration interface
 */
export interface PipelineConfig {
  steps: PipelineStepDefinition[];
  enableParallelExecution?: boolean;
  enableRuleValidation?: boolean;
  timeout?: number;
  retries?: number;
}

/**
 * Pipeline step definition for dependency injection
 */
export interface PipelineStepDefinition {
  name: string;
  stepClass: new (config: StepConfig, dependencies?: PipelineStepDependencies) => BasePipelineStep;
  config?: StepConfig;
  dependencies?: PipelineStepDependencies;
  enabled?: boolean;
  order?: number;
}

/**
 * Dependencies that can be injected into pipeline steps
 */
export interface PipelineStepDependencies {
  ruleFilter?: (rules: PricingRule[], category: string) => PricingRule[];
  logger?: any;
  validator?: any;
  cache?: any;
  metrics?: any;
}

/**
 * Default pipeline configuration
 */
export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  steps: [],
  enableParallelExecution: false,
  enableRuleValidation: true,
  timeout: 30000, // 30 seconds
  retries: 0,
};

/**
 * Step execution context
 */
export interface StepExecutionContext {
  correlationId: string;
  timestamp: Date;
  timeout?: number;
  retries?: number;
  metadata?: Record<string, any>;
}