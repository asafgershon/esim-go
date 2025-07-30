import type {
  Bundle,
  PricingEngineInput,
  PricingEngineOutput,
  PricingEngineState,
  PricingRule
} from "../rules-engine-types";

/**
 * Common interface for all pipeline steps
 */
export interface PipelineStep<TState = PricingEngineState> {
  name: string;
  execute: (
    state: TState,
    rules: PricingRule[]
  ) => Promise<PipelineStepResult<TState>>;
}

/**
 * Result returned by each pipeline step
 */
export interface PipelineStepResult<TState = PricingEngineState> {
  name: string;
  timestamp: Date;
  state: TState;
  appliedRules: string[];
  debug?: Record<string, any>;
}

/**
 * Condition evaluator function type
 */
export type ConditionEvaluator = (
  fieldValue: any,
  conditionValue: any
) => boolean;

/**
 * Action applicator function type
 */
export type ActionApplicator = (
  draft: any, // Will be Draft<PricingEngineState> from immer
  value: number
) => void;

/**
 * Rule condition interface
 */
export interface RuleCondition {
  field: string;
  operator: string;
  value: any;
}

/**
 * Rule action interface
 */
export interface RuleAction {
  type: string;
  value: number;
}

/**
 * Pricing engine configuration
 */
export interface PricingEngineConfig {
  enableDebugLogging?: boolean;
  maxRulesPerCategory?: number;
  defaultCurrency?: string;
}

/**
 * Bundle selector function type
 */
export type BundleSelector = (
  bundles: Bundle[],
  requestedDuration: number
) => {
  selectedBundle: Bundle;
  previousBundle?: Bundle;
};

/**
 * Rule filter function type
 */
export type RuleFilter = (
  rules: PricingRule[],
  category: string
) => PricingRule[];

/**
 * State initializer function type
 */
export type StateInitializer = (
  input: PricingEngineInput
) => PricingEngineState;

/**
 * Output creator function type
 */
export type OutputCreator = (
  state: PricingEngineState
) => PricingEngineOutput;