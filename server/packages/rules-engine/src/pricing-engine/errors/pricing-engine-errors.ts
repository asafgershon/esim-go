/**
 * Base error class for all pricing engine errors
 */
export abstract class PricingEngineError extends Error {
  public readonly code: string;
  public readonly context: Record<string, any>;
  public readonly timestamp: Date;
  public readonly correlationId?: string;
  
  constructor(
    message: string,
    code: string,
    context: Record<string, any> = {},
    correlationId?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    this.correlationId = correlationId;
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Convert error to JSON for logging/serialization
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      correlationId: this.correlationId,
      stack: this.stack,
    };
  }
}

/**
 * Validation errors for input/output validation
 */
export class ValidationError extends PricingEngineError {
  constructor(
    message: string,
    field: string,
    value: any,
    correlationId?: string
  ) {
    super(
      message,
      'VALIDATION_ERROR',
      { field, value },
      correlationId
    );
  }
}

/**
 * Configuration errors for rule setup and engine configuration
 */
export class ConfigurationError extends PricingEngineError {
  constructor(
    message: string,
    configPath: string,
    context: Record<string, any> = {},
    correlationId?: string
  ) {
    super(
      message,
      'CONFIGURATION_ERROR',
      { configPath, ...context },
      correlationId
    );
  }
}

/**
 * Rule evaluation errors
 */
export class RuleEvaluationError extends PricingEngineError {
  public readonly ruleId: string;
  public readonly ruleName: string;
  
  constructor(
    message: string,
    ruleId: string,
    ruleName: string,
    context: Record<string, any> = {},
    correlationId?: string
  ) {
    super(
      message,
      'RULE_EVALUATION_ERROR',
      { ruleId, ruleName, ...context },
      correlationId
    );
    
    this.ruleId = ruleId;
    this.ruleName = ruleName;
  }
}

/**
 * Pipeline step execution errors
 */
export class StepExecutionError extends PricingEngineError {
  public readonly stepName: string;
  public readonly executionTime: number;
  
  constructor(
    message: string,
    stepName: string,
    executionTime: number,
    context: Record<string, any> = {},
    correlationId?: string
  ) {
    super(
      message,
      'STEP_EXECUTION_ERROR',
      { stepName, executionTime, ...context },
      correlationId
    );
    
    this.stepName = stepName;
    this.executionTime = executionTime;
  }
}

/**
 * Bundle selection and processing errors
 */
export class BundleProcessingError extends PricingEngineError {
  public readonly bundleId?: string;
  public readonly bundleName?: string;
  
  constructor(
    message: string,
    bundleId?: string,
    bundleName?: string,
    context: Record<string, any> = {},
    correlationId?: string
  ) {
    super(
      message,
      'BUNDLE_PROCESSING_ERROR',
      { bundleId, bundleName, ...context },
      correlationId
    );
    
    this.bundleId = bundleId;
    this.bundleName = bundleName;
  }
}

/**
 * Pricing calculation errors
 */
export class PricingCalculationError extends PricingEngineError {
  public readonly calculationType: string;
  
  constructor(
    message: string,
    calculationType: string,
    context: Record<string, any> = {},
    correlationId?: string
  ) {
    super(
      message,
      'PRICING_CALCULATION_ERROR',
      { calculationType, ...context },
      correlationId
    );
    
    this.calculationType = calculationType;
  }
}

/**
 * State management errors
 */
export class StateManagementError extends PricingEngineError {
  public readonly statePath: string;
  
  constructor(
    message: string,
    statePath: string,
    context: Record<string, any> = {},
    correlationId?: string
  ) {
    super(
      message,
      'STATE_MANAGEMENT_ERROR',
      { statePath, ...context },
      correlationId
    );
    
    this.statePath = statePath;
  }
}

/**
 * Timeout errors for long-running operations
 */
export class TimeoutError extends PricingEngineError {
  public readonly timeoutMs: number;
  public readonly operation: string;
  
  constructor(
    message: string,
    operation: string,
    timeoutMs: number,
    context: Record<string, any> = {},
    correlationId?: string
  ) {
    super(
      message,
      'TIMEOUT_ERROR',
      { operation, timeoutMs, ...context },
      correlationId
    );
    
    this.timeoutMs = timeoutMs;
    this.operation = operation;
  }
}

/**
 * Error factory for creating specific error types
 */
export class ErrorFactory {
  static validation(
    message: string,
    field: string,
    value: any,
    correlationId?: string
  ): ValidationError {
    return new ValidationError(message, field, value, correlationId);
  }
  
  static configuration(
    message: string,
    configPath: string,
    context: Record<string, any> = {},
    correlationId?: string
  ): ConfigurationError {
    return new ConfigurationError(message, configPath, context, correlationId);
  }
  
  static ruleEvaluation(
    message: string,
    ruleId: string,
    ruleName: string,
    context: Record<string, any> = {},
    correlationId?: string
  ): RuleEvaluationError {
    return new RuleEvaluationError(message, ruleId, ruleName, context, correlationId);
  }
  
  static stepExecution(
    message: string,
    stepName: string,
    executionTime: number,
    context: Record<string, any> = {},
    correlationId?: string
  ): StepExecutionError {
    return new StepExecutionError(message, stepName, executionTime, context, correlationId);
  }
  
  static bundleProcessing(
    message: string,
    bundleId?: string,
    bundleName?: string,
    context: Record<string, any> = {},
    correlationId?: string
  ): BundleProcessingError {
    return new BundleProcessingError(message, bundleId, bundleName, context, correlationId);
  }
  
  static pricingCalculation(
    message: string,
    calculationType: string,
    context: Record<string, any> = {},
    correlationId?: string
  ): PricingCalculationError {
    return new PricingCalculationError(message, calculationType, context, correlationId);
  }
  
  static stateManagement(
    message: string,
    statePath: string,
    context: Record<string, any> = {},
    correlationId?: string
  ): StateManagementError {
    return new StateManagementError(message, statePath, context, correlationId);
  }
  
  static timeout(
    message: string,
    operation: string,
    timeoutMs: number,
    context: Record<string, any> = {},
    correlationId?: string
  ): TimeoutError {
    return new TimeoutError(message, operation, timeoutMs, context, correlationId);
  }
}