import type { PricingEngineState, PricingRule } from "../../rules-engine-types";
import type { PipelineStepResult } from "../types";

/**
 * Debug information levels
 */
export enum DebugLevel {
  NONE = 0,
  BASIC = 1,
  DETAILED = 2,
  VERBOSE = 3,
}

/**
 * Debug context for tracking information
 */
export interface DebugContext {
  correlationId: string;
  level: DebugLevel;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Debug entry interface
 */
export interface DebugEntry {
  id: string;
  timestamp: Date;
  level: DebugLevel;
  category: string;
  message: string;
  data?: Record<string, any>;
  stepName?: string;
  ruleId?: string;
  correlationId: string;
}

/**
 * Centralized debug information collector
 */
export class DebugCollector {
  private entries: DebugEntry[] = [];
  private context: DebugContext;
  private entryIdCounter = 0;
  
  constructor(context: DebugContext) {
    this.context = context;
  }
  
  /**
   * Add a debug entry
   */
  addEntry(
    level: DebugLevel,
    category: string,
    message: string,
    data?: Record<string, any>,
    stepName?: string,
    ruleId?: string
  ): void {
    if (level > this.context.level) {
      return; // Skip if level is higher than configured
    }
    
    const entry: DebugEntry = {
      id: this.generateEntryId(),
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      stepName,
      ruleId,
      correlationId: this.context.correlationId,
    };
    
    this.entries.push(entry);
  }
  
  /**
   * Add basic debug information
   */
  basic(category: string, message: string, data?: Record<string, any>): void {
    this.addEntry(DebugLevel.BASIC, category, message, data);
  }
  
  /**
   * Add detailed debug information
   */
  detailed(category: string, message: string, data?: Record<string, any>): void {
    this.addEntry(DebugLevel.DETAILED, category, message, data);
  }
  
  /**
   * Add verbose debug information
   */
  verbose(category: string, message: string, data?: Record<string, any>): void {
    this.addEntry(DebugLevel.VERBOSE, category, message, data);
  }
  
  /**
   * Add step-specific debug information
   */
  step(
    stepName: string,
    level: DebugLevel,
    message: string,
    data?: Record<string, any>
  ): void {
    this.addEntry(level, "step", message, data, stepName);
  }
  
  /**
   * Add rule-specific debug information
   */
  rule(
    ruleId: string,
    level: DebugLevel,
    message: string,
    data?: Record<string, any>,
    stepName?: string
  ): void {
    this.addEntry(level, "rule", message, data, stepName, ruleId);
  }
  
  /**
   * Add state transition debug information
   */
  stateTransition(
    fromState: any,
    toState: any,
    reason: string,
    stepName?: string
  ): void {
    this.addEntry(DebugLevel.DETAILED, "state", `State transition: ${reason}`, {
      fromState: this.sanitizeState(fromState),
      toState: this.sanitizeState(toState),
    }, stepName);
  }
  
  /**
   * Add pricing calculation debug information
   */
  pricingCalculation(
    calculation: string,
    before: number,
    after: number,
    stepName?: string,
    ruleId?: string
  ): void {
    this.addEntry(DebugLevel.DETAILED, "pricing", `${calculation}: ${before} → ${after}`, {
      calculation,
      before,
      after,
      change: after - before,
    }, stepName, ruleId);
  }
  
  /**
   * Add performance metrics
   */
  performance(
    operation: string,
    duration: number,
    metadata?: Record<string, any>,
    stepName?: string
  ): void {
    this.addEntry(DebugLevel.BASIC, "performance", `${operation} took ${duration}ms`, {
      operation,
      duration,
      ...metadata,
    }, stepName);
  }
  
  /**
   * Add error debug information
   */
  error(
    error: Error,
    context?: Record<string, any>,
    stepName?: string,
    ruleId?: string
  ): void {
    this.addEntry(DebugLevel.BASIC, "error", error.message, {
      errorName: error.name,
      stack: error.stack,
      ...context,
    }, stepName, ruleId);
  }
  
  /**
   * Get all debug entries
   */
  getEntries(): DebugEntry[] {
    return [...this.entries];
  }
  
  /**
   * Get entries by category
   */
  getEntriesByCategory(category: string): DebugEntry[] {
    return this.entries.filter(entry => entry.category === category);
  }
  
  /**
   * Get entries by step
   */
  getEntriesByStep(stepName: string): DebugEntry[] {
    return this.entries.filter(entry => entry.stepName === stepName);
  }
  
  /**
   * Get entries by rule
   */
  getEntriesByRule(ruleId: string): DebugEntry[] {
    return this.entries.filter(entry => entry.ruleId === ruleId);
  }
  
  /**
   * Get entries by level
   */
  getEntriesByLevel(level: DebugLevel): DebugEntry[] {
    return this.entries.filter(entry => entry.level === level);
  }
  
  /**
   * Generate debug report
   */
  generateReport(): DebugReport {
    const categories = [...new Set(this.entries.map(e => e.category))];
    const steps = [...new Set(this.entries.map(e => e.stepName).filter(Boolean))];
    const rules = [...new Set(this.entries.map(e => e.ruleId).filter(Boolean))];
    
    return {
      context: this.context,
      summary: {
        totalEntries: this.entries.length,
        categories: categories.length,
        steps: steps.length,
        rules: rules.length,
        timeSpan: this.calculateTimeSpan(),
      },
      entries: this.entries,
      categorySummary: categories.map(cat => ({
        category: cat,
        count: this.getEntriesByCategory(cat).length,
      })),
      stepSummary: steps.map(step => ({
        stepName: step!,
        count: this.getEntriesByStep(step!).length,
      })),
    };
  }
  
  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
    this.entryIdCounter = 0;
  }
  
  /**
   * Generate unique entry ID
   */
  private generateEntryId(): string {
    return `debug-${this.context.correlationId}-${++this.entryIdCounter}`;
  }
  
  /**
   * Sanitize state for debug output (remove sensitive/large data)
   */
  private sanitizeState(state: any): any {
    if (!state) return state;
    
    // Create a simplified version of state for debug output
    return {
      type: typeof state,
      hasResponse: !!state.response,
      hasProcessing: !!state.processing,
      correlationId: state.metadata?.correlationId,
      pricing: state.response?.pricing ? {
        cost: state.response.pricing.cost,
        finalRevenue: state.response.pricing.finalRevenue,
        discountValue: state.response.pricing.discountValue,
      } : undefined,
    };
  }
  
  /**
   * Calculate time span of all entries
   */
  private calculateTimeSpan(): { start: Date; end: Date; duration: number } {
    if (this.entries.length === 0) {
      return { start: new Date(), end: new Date(), duration: 0 };
    }
    
    const timestamps = this.entries.map(e => e.timestamp.getTime());
    const start = new Date(Math.min(...timestamps));
    const end = new Date(Math.max(...timestamps));
    
    return {
      start,
      end,
      duration: end.getTime() - start.getTime(),
    };
  }
}

/**
 * Debug report interface
 */
export interface DebugReport {
  context: DebugContext;
  summary: {
    totalEntries: number;
    categories: number;
    steps: number;
    rules: number;
    timeSpan: { start: Date; end: Date; duration: number };
  };
  entries: DebugEntry[];
  categorySummary: Array<{ category: string; count: number }>;
  stepSummary: Array<{ stepName: string; count: number }>;
}

/**
 * Debug collector factory
 */
export class DebugCollectorFactory {
  static create(
    correlationId: string,
    level: DebugLevel = DebugLevel.BASIC,
    metadata?: Record<string, any>
  ): DebugCollector {
    const context: DebugContext = {
      correlationId,
      level,
      timestamp: new Date(),
      metadata,
    };
    
    return new DebugCollector(context);
  }
  
  static createFromState(
    state: PricingEngineState,
    level: DebugLevel = DebugLevel.BASIC
  ): DebugCollector {
    return this.create(
      state.metadata?.correlationId || 'unknown',
      level,
      { version: state.metadata?.version }
    );
  }
}