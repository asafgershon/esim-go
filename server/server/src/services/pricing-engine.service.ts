import { PricingRuleEngine } from '../rules-engine/rule-engine';
import { PricingRulesRepository } from '../repositories/pricing-rules/pricing-rules.repository';
import type { PricingContext } from '../rules-engine/types';
import type { PricingRuleCalculation, PricingStep } from '../types';
import { createLogger, withPerformanceLogging } from '../lib/logger';
import { RedisCache } from '../lib/redis-cache';
import type { SupabaseClient } from '@supabase/supabase-js';

export class PricingEngineService {
  private engine: PricingRuleEngine;
  private repository: PricingRulesRepository;
  private cache: RedisCache;
  private logger = createLogger({ 
    component: 'PricingEngineService',
    operationType: 'pricing-calculation'
  });
  
  // Cache rules for 5 minutes
  private static readonly RULES_CACHE_KEY = 'pricing:rules:active';
  private static readonly RULES_CACHE_TTL = 300; // 5 minutes

  constructor(supabase: SupabaseClient) {
    this.engine = new PricingRuleEngine();
    this.repository = new PricingRulesRepository(supabase);
    this.cache = new RedisCache();
  }

  /**
   * Initialize the engine with active rules from the database
   * This should be called once during startup and periodically to refresh rules
   */
  async initialize(): Promise<void> {
    return withPerformanceLogging(
      this.logger,
      'initialize-pricing-engine',
      async () => {
        await this.loadRules();
      }
    );
  }

  /**
   * Calculate price for a given context
   * This is the main entry point for pricing calculations
   */
  async calculatePrice(context: PricingContext): Promise<PricingRuleCalculation> {
    // Ensure rules are loaded
    await this.ensureRulesLoaded();
    
    return withPerformanceLogging(
      this.logger,
      'calculate-price',
      async () => {
        return this.engine.calculatePrice(context);
      },
      {
        bundleId: context.bundle.id,
        country: context.bundle.countryId,
        duration: context.bundle.duration
      }
    );
  }

  /**
   * Stream pricing calculation steps for real-time updates
   * Useful for showing calculation progress in UI
   */
  async *streamPricingSteps(context: PricingContext): AsyncGenerator<PricingStep, PricingRuleCalculation, undefined> {
    // Ensure rules are loaded
    await this.ensureRulesLoaded();
    
    yield* this.engine.calculatePriceSteps(context);
  }

  /**
   * Reload rules from database
   * Call this when rules are updated
   */
  async reloadRules(): Promise<void> {
    this.logger.info('Reloading pricing rules');
    
    // Clear cache
    await this.cache.delete(PricingEngineService.RULES_CACHE_KEY);
    
    // Clear engine rules
    this.engine.clearRules();
    
    // Load fresh rules
    await this.loadRules();
  }

  /**
   * Get all loaded rules (for debugging/admin UI)
   */
  getLoadedRules() {
    return {
      all: this.engine.getRules(),
      system: this.engine.getSystemRules(),
      business: this.engine.getBusinessRules()
    };
  }

  /**
   * Validate a pricing context (useful for API validation)
   */
  validateContext(context: PricingContext): string[] {
    const errors: string[] = [];
    
    if (!context.bundle) {
      errors.push('Bundle is required');
    } else {
      if (!context.bundle.id) errors.push('Bundle ID is required');
      if (!context.bundle.cost || context.bundle.cost < 0) {
        errors.push('Bundle cost must be a positive number');
      }
      if (!context.bundle.duration || context.bundle.duration < 1) {
        errors.push('Bundle duration must be at least 1 day');
      }
    }
    
    if (context.requestedDuration && context.requestedDuration < 1) {
      errors.push('Requested duration must be at least 1 day');
    }
    
    return errors;
  }

  /**
   * Calculate unused day discount for a specific scenario
   */
  async calculateUnusedDayDiscount(
    selectedBundleMarkup: number,
    selectedBundleDuration: number,
    requestedDuration: number,
    bundleGroup: string
  ): Promise<number> {
    return this.engine.calculateUnusedDayDiscount(
      selectedBundleMarkup,
      selectedBundleDuration,
      requestedDuration,
      bundleGroup
    );
  }

  private async loadRules(): Promise<void> {
    // Try to load from cache first
    const cachedRules = await this.cache.get(PricingEngineService.RULES_CACHE_KEY);
    
    if (cachedRules) {
      this.logger.info('Loading rules from cache');
      const rules = JSON.parse(cachedRules);
      
      // Separate system and business rules
      const systemRules = rules.filter((r: any) => !r.isEditable);
      const businessRules = rules.filter((r: any) => r.isEditable);
      
      // Add to engine
      this.engine.addSystemRules(systemRules);
      this.engine.addRules(businessRules);
      
      this.logger.info('Rules loaded from cache', {
        systemCount: systemRules.length,
        businessCount: businessRules.length
      });
      
      return;
    }
    
    // Load from database
    this.logger.info('Loading rules from database');
    
    const activeRules = await this.repository.findActiveRules();
    
    // Separate system and business rules
    const systemRules = activeRules.filter(r => !r.isEditable);
    const businessRules = activeRules.filter(r => r.isEditable);
    
    // Add to engine
    this.engine.addSystemRules(systemRules);
    this.engine.addRules(businessRules);
    
    // Cache the rules
    await this.cache.set(
      PricingEngineService.RULES_CACHE_KEY,
      JSON.stringify(activeRules),
      PricingEngineService.RULES_CACHE_TTL
    );
    
    this.logger.info('Rules loaded from database', {
      systemCount: systemRules.length,
      businessCount: businessRules.length,
      totalCount: activeRules.length
    });
  }

  private async ensureRulesLoaded(): Promise<void> {
    if (this.engine.getRules().length === 0) {
      await this.loadRules();
    }
  }

  /**
   * Create a pricing context from common inputs
   * Helper method for GraphQL resolvers
   */
  static createContext(params: {
    bundle: {
      id: string;
      name: string;
      cost: number;
      duration: number;
      countryId: string;
      countryName: string;
      regionId: string;
      regionName: string;
      group: string;
      isUnlimited: boolean;
      dataAmount: string;
    };
    user?: {
      id: string;
      isNew?: boolean;
      isFirstPurchase?: boolean;
      purchaseCount?: number;
      segment?: string;
    };
    paymentMethod?: string;
    requestedDuration?: number;
  }): PricingContext {
    return {
      bundle: params.bundle,
      user: params.user,
      paymentMethod: params.paymentMethod,
      requestedDuration: params.requestedDuration,
      currentDate: new Date(),
      // Add shortcuts for convenience
      country: params.bundle.countryId,
      region: params.bundle.regionName,
      bundleGroup: params.bundle.group,
      duration: params.bundle.duration
    };
  }
}