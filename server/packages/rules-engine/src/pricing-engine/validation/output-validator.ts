import type { PricingEngineOutput, PricingBreakdown } from "../../rules-engine-types";
import { ValidationError, ErrorFactory } from "../errors";
import type { ValidationResult } from "./input-validator";

/**
 * Output validator for pricing engine
 */
export class OutputValidator {
  private errors: ValidationError[] = [];
  private warnings: string[] = [];
  private correlationId?: string;
  
  /**
   * Validate pricing engine output
   */
  validate(output: PricingEngineOutput): ValidationResult {
    this.errors = [];
    this.warnings = [];
    this.correlationId = output.metadata?.correlationId;
    
    this.validateResponse(output.response);
    this.validateProcessing(output.processing);
    this.validateMetadata(output.metadata);
    
    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }
  
  /**
   * Validate response section
   */
  private validateResponse(response: PricingEngineOutput['response']): void {
    if (!response) {
      this.addError("Response is required", "response", response);
      return;
    }
    
    this.validateSelectedBundle(response.selectedBundle);
    this.validatePricing(response.pricing);
    this.validateUnusedDays(response.unusedDays);
    this.validateAppliedRules(response.appliedRules);
  }
  
  /**
   * Validate selected bundle
   */
  private validateSelectedBundle(bundle: any): void {
    if (!bundle) {
      this.addError("Selected bundle is required", "response.selectedBundle", bundle);
      return;
    }
    
    // Bundle ID is not available in the current Bundle type, skip this validation
    
    if (!bundle.name) {
      this.addError("Selected bundle must have a name", "response.selectedBundle.name", bundle.name);
    }
    
    if (typeof bundle.basePrice !== 'number' || bundle.basePrice < 0) {
      this.addError("Selected bundle base price must be non-negative", "response.selectedBundle.basePrice", bundle.basePrice);
    }
  }
  
  /**
   * Validate pricing breakdown
   */
  private validatePricing(pricing: PricingBreakdown | null): void {
    if (!pricing) {
      this.addError("Pricing breakdown is required", "response.pricing", pricing);
      return;
    }
    
    this.validatePricingField(pricing.cost, "cost", 0);
    this.validatePricingField(pricing.totalCost, "totalCost", 0);
    this.validatePricingField(pricing.finalRevenue, "finalRevenue", 0);
    this.validatePricingField(pricing.markup, "markup");
    this.validatePricingField(pricing.discountValue, "discountValue");
    this.validatePricingField(pricing.processingCost, "processingCost");
    
    // Validate pricing consistency
    if (pricing.finalRevenue < 0) {
      this.addError("Final revenue cannot be negative", "response.pricing.finalRevenue", pricing.finalRevenue);
    }
    
    if (pricing.discountValue > pricing.totalCost) {
      this.addError("Discount value cannot exceed total cost", "response.pricing.discountValue", pricing.discountValue);
    }
    
    if (pricing.processingRate && (pricing.processingRate < 0 || pricing.processingRate > 100)) {
      this.addError("Processing rate must be between 0 and 100", "response.pricing.processingRate", pricing.processingRate);
    }
    
    // Validate currency
    if (!pricing.currency) {
      this.addError("Pricing currency is required", "response.pricing.currency", pricing.currency);
    } else if (!/^[A-Z]{3}$/.test(pricing.currency)) {
      this.addError("Pricing currency must be a 3-letter ISO code", "response.pricing.currency", pricing.currency);
    }
    
    // Validate duration
    if (typeof pricing.duration !== 'number' || pricing.duration <= 0) {
      this.addError("Pricing duration must be positive", "response.pricing.duration", pricing.duration);
    }
  }
  
  /**
   * Validate individual pricing field
   */
  private validatePricingField(value: number, fieldName: string, minValue?: number): void {
    if (typeof value !== 'number' || isNaN(value)) {
      this.addError(`Pricing ${fieldName} must be a valid number`, `response.pricing.${fieldName}`, value);
      return;
    }
    
    if (minValue !== undefined && value < minValue) {
      this.addError(`Pricing ${fieldName} must be at least ${minValue}`, `response.pricing.${fieldName}`, value);
    }
  }
  
  /**
   * Validate unused days
   */
  private validateUnusedDays(unusedDays: number): void {
    if (typeof unusedDays !== 'number' || unusedDays < 0) {
      this.addError("Unused days must be a non-negative number", "response.unusedDays", unusedDays);
    }
  }
  
  /**
   * Validate applied rules
   */
  private validateAppliedRules(appliedRules: any[]): void {
    if (!Array.isArray(appliedRules)) {
      this.addError("Applied rules must be an array", "response.appliedRules", appliedRules);
      return;
    }
    
    appliedRules.forEach((rule, index) => {
      if (!rule.id) {
        this.addError(`Applied rule at index ${index} must have an ID`, `response.appliedRules[${index}].id`, rule.id);
      }
      
      if (!rule.name) {
        this.addError(`Applied rule at index ${index} must have a name`, `response.appliedRules[${index}].name`, rule.name);
      }
    });
  }
  
  /**
   * Validate processing section
   */
  private validateProcessing(processing: PricingEngineOutput['processing']): void {
    if (!processing) {
      this.addError("Processing information is required", "processing", processing);
      return;
    }
    
    if (!Array.isArray(processing.steps)) {
      this.addError("Processing steps must be an array", "processing.steps", processing.steps);
    } else if (processing.steps.length === 0) {
      this.addWarning("No processing steps found - this may indicate incomplete execution");
    }
    
    if (!processing.selectedBundle) {
      this.addError("Processing selected bundle is required", "processing.selectedBundle", processing.selectedBundle);
    }
    
    // Validate step consistency
    processing.steps?.forEach((step, index) => {
      if (!step.name) {
        this.addError(`Step at index ${index} must have a name`, `processing.steps[${index}].name`, step.name);
      }
      
      if (!step.timestamp) {
        this.addError(`Step at index ${index} must have a timestamp`, `processing.steps[${index}].timestamp`, step.timestamp);
      }
      
      if (!Array.isArray(step.appliedRules)) {
        this.addError(`Step at index ${index} applied rules must be an array`, `processing.steps[${index}].appliedRules`, step.appliedRules);
      }
    });
  }
  
  /**
   * Validate metadata section
   */
  private validateMetadata(metadata: PricingEngineOutput['metadata']): void {
    if (!metadata) {
      this.addError("Metadata is required", "metadata", metadata);
      return;
    }
    
    if (!metadata.correlationId) {
      this.addError("Correlation ID is required", "metadata.correlationId", metadata.correlationId);
    }
    
    if (!metadata.timestamp) {
      this.addError("Timestamp is required", "metadata.timestamp", metadata.timestamp);
    } else if (!(metadata.timestamp instanceof Date)) {
      this.addError("Timestamp must be a Date object", "metadata.timestamp", metadata.timestamp);
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