import type { PricingEngineInput, Bundle } from "../../rules-engine-types";
import { ValidationError, ErrorFactory } from "../errors";

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Input validator for pricing engine
 */
export class InputValidator {
  private errors: ValidationError[] = [];
  private warnings: string[] = [];
  private correlationId?: string;
  
  /**
   * Validate pricing engine input
   */
  validate(input: PricingEngineInput): ValidationResult {
    this.errors = [];
    this.warnings = [];
    this.correlationId = input.metadata?.correlationId;
    
    this.validateContext(input.context);
    this.validateRequest(input.request);
    this.validateMetadata(input.metadata);
    
    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }
  
  /**
   * Validate context section
   */
  private validateContext(context: PricingEngineInput['context']): void {
    if (!context) {
      this.addError("Context is required", "context", context);
      return;
    }
    
    this.validateBundles(context.bundles);
    this.validateCustomer(context.customer);
    this.validatePayment(context.payment);
  }
  
  /**
   * Validate bundles array
   */
  private validateBundles(bundles: Bundle[] | undefined): void {
    if (!bundles || !Array.isArray(bundles)) {
      this.addError("Bundles array is required", "context.bundles", bundles);
      return;
    }
    
    if (bundles.length === 0) {
      this.addError("At least one bundle is required", "context.bundles", bundles);
      return;
    }
    
    bundles.forEach((bundle, index) => {
      this.validateBundle(bundle, `context.bundles[${index}]`);
    });
  }
  
  /**
   * Validate individual bundle
   */
  private validateBundle(bundle: Bundle, path: string): void {
    if (!bundle) {
      this.addError("Bundle cannot be null or undefined", path, bundle);
      return;
    }
    
    // Bundle ID is not available in the current Bundle type, skip this validation
    
    if (!bundle.name) {
      this.addError("Bundle name is required", `${path}.name`, bundle.name);
    }
    
    if (typeof bundle.basePrice !== 'number' || bundle.basePrice < 0) {
      this.addError("Bundle base price must be a non-negative number", `${path}.basePrice`, bundle.basePrice);
    }
    
    if (typeof bundle.validityInDays !== 'number' || bundle.validityInDays <= 0) {
      this.addError("Bundle validity must be a positive number", `${path}.validityInDays`, bundle.validityInDays);
    }
    
    if (!bundle.currency) {
      this.addError("Bundle currency is required", `${path}.currency`, bundle.currency);
    } else if (!/^[A-Z]{3}$/.test(bundle.currency)) {
      this.addError("Bundle currency must be a 3-letter ISO code", `${path}.currency`, bundle.currency);
    }
    
    if (!bundle.countries || bundle.countries.length === 0) {
      this.addError("Bundle countries are required", `${path}.countries`, bundle.countries);
    }
  }
  
  /**
   * Validate customer information
   */
  private validateCustomer(customer: any): void {
    if (!customer) {
      this.addWarning("Customer information is missing - this may affect rule evaluation");
      return;
    }
    
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      this.addError("Invalid customer email format", "context.customer.email", customer.email);
    }
    
    if (customer.countryISO && !/^[A-Z]{2}$/.test(customer.countryISO)) {
      this.addError("Customer country ISO must be a 2-letter code", "context.customer.countryISO", customer.countryISO);
    }
  }
  
  /**
   * Validate payment information
   */
  private validatePayment(payment: any): void {
    if (!payment) {
      this.addWarning("Payment information is missing - this may affect rule evaluation");
      return;
    }
    
    if (payment.method && !['card', 'paypal', 'apple_pay', 'google_pay'].includes(payment.method)) {
      this.addError("Invalid payment method", "context.payment.method", payment.method);
    }
    
    if (payment.currency && !/^[A-Z]{3}$/.test(payment.currency)) {
      this.addError("Payment currency must be a 3-letter ISO code", "context.payment.currency", payment.currency);
    }
  }
  
  /**
   * Validate request section
   */
  private validateRequest(request: PricingEngineInput['request']): void {
    if (!request) {
      this.addError("Request is required", "request", request);
      return;
    }
    
    if (typeof request.duration !== 'number' || request.duration <= 0) {
      this.addError("Duration must be a positive number", "request.duration", request.duration);
    }
    
    if (!request.countryISO) {
      this.addError("Country ISO is required", "request.countryISO", request.countryISO);
    } else if (!/^[A-Z]{2}$/.test(request.countryISO)) {
      this.addError("Country ISO must be a 2-letter code", "request.countryISO", request.countryISO);
    }
    
    if (!request.dataType) {
      this.addError("Data type is required", "request.dataType", request.dataType);
    } else if (!['fixed', 'unlimited', 'shared'].includes(request.dataType)) {
      this.addError("Invalid data type", "request.dataType", request.dataType);
    }
    
    if (request.paymentMethod && !['card', 'paypal', 'apple_pay', 'google_pay'].includes(request.paymentMethod)) {
      this.addError("Invalid payment method", "request.paymentMethod", request.paymentMethod);
    }
  }
  
  /**
   * Validate metadata section
   */
  private validateMetadata(metadata: PricingEngineInput['metadata']): void {
    if (!metadata) {
      this.addWarning("Metadata is missing - correlation ID will be auto-generated");
      return;
    }
    
    if (metadata.correlationId && typeof metadata.correlationId !== 'string') {
      this.addError("Correlation ID must be a string", "metadata.correlationId", metadata.correlationId);
    }
    
    if (metadata.timestamp && !(metadata.timestamp instanceof Date)) {
      this.addError("Timestamp must be a Date object", "metadata.timestamp", metadata.timestamp);
    }
    
    if (metadata.version && typeof metadata.version !== 'string') {
      this.addError("Version must be a string", "metadata.version", metadata.version);
    }
  }
  
  /**
   * Add validation error
   */
  private addError(message: string, field: string, value: any): void {
    this.errors.push(ErrorFactory.validation(message, field, value, this.correlationId));
  }
  
  /**
   * Add validation warning
   */
  private addWarning(message: string): void {
    this.warnings.push(message);
  }
}