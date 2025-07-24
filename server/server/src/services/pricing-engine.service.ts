import { PricingRuleEngine, Bundle, PricingContext, PricingRuleCalculation } from '@esim-go/rules-engine';
import { PricingRulesRepository } from '../repositories/pricing-rules.repository';
import { DefaultRulesService } from './default-rules.service';
import { createLogger, withPerformanceLogging } from '../lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ExtendedPricingCalculation extends PricingRuleCalculation {
  selectedBundle?: {
    bundleId: string;
    bundleName: string;
    duration: number;
    reason: string;
  };
  metadata?: {
    discountPerUnusedDay?: number;
  };
}

export class PricingEngineService {
  private engine: PricingRuleEngine;
  private repository: PricingRulesRepository;
  private logger = createLogger({ 
    component: 'PricingEngineService',
    operationType: 'pricing-calculation'
  });
  
  // Cache rules for 5 minutes
  private static readonly RULES_CACHE_KEY = 'pricing:rules:active';
  private static readonly RULES_CACHE_TTL = 300; // 5 minutes
  
  // Singleton instance
  private static instance: PricingEngineService | null = null;

  constructor(supabase: SupabaseClient) {
    this.engine = new PricingRuleEngine();
    this.repository = new PricingRulesRepository(supabase);
  }

  /**
   * Get singleton instance of the pricing engine service
   */
  static getInstance(supabase: SupabaseClient): PricingEngineService {
    if (!PricingEngineService.instance) {
      PricingEngineService.instance = new PricingEngineService(supabase);
      // Initialize in background
      PricingEngineService.instance.initialize().catch(error => {
        const logger = createLogger({ component: 'PricingEngineService' });
        logger.error('Failed to initialize pricing engine', error as Error, {
          operationType: 'pricing-engine-init'
        });
      });
    }
    return PricingEngineService.instance;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  static resetInstance(): void {
    PricingEngineService.instance = null;
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
  async calculatePrice(context: PricingContext): Promise<ExtendedPricingCalculation> {
    // Ensure rules are loaded
    await this.ensureRulesLoaded();
    
    return withPerformanceLogging(
      this.logger,
      'calculate-price',
      async () => {
        const result = await this.engine.calculatePrice(context);
        return result as ExtendedPricingCalculation;
      },
      {
        availableBundlesCount: context.availableBundles?.length || 0,
        requestedDuration: context.requestedDuration || 0
      }
    );
  }

  /**
   * Stream pricing calculation steps for real-time updates
   * Useful for showing calculation progress in UI
   */
  async *streamPricingSteps(context: PricingContext): AsyncGenerator<any, ExtendedPricingCalculation, undefined> {
    // Ensure rules are loaded
    await this.ensureRulesLoaded();
    
    const generator = this.engine.calculatePriceSteps(context);
    let result: ExtendedPricingCalculation;
    
    for await (const step of generator) {
      if (step && typeof step === 'object' && 'finalPrice' in step) {
        result = step as unknown as ExtendedPricingCalculation;
      } else {
        yield step;
      }
    }
    
    return result!;
  }

  /**
   * Reload rules from database
   * Call this when rules are updated
   */
  async reloadRules(): Promise<void> {
    this.logger.info('Reloading pricing rules');
    
    // Clear cache if available
    // if (this.cache) { // This line was removed as per the new_code, as the cache property is removed.
    //   await this.cache.delete(PricingEngineService.RULES_CACHE_KEY);
    // }
    
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
    
    if (!context.availableBundles || context.availableBundles.length === 0) {
      errors.push('At least one bundle is required');
    } else {
      // Validate each bundle
      context.availableBundles.forEach((bundle, index) => {
        if (!bundle.id) errors.push(`Bundle ${index}: ID is required`);
        if (!bundle.cost || bundle.cost < 0) {
          errors.push(`Bundle ${index}: cost must be a positive number`);
        }
        if (!bundle.duration || bundle.duration < 1) {
          errors.push(`Bundle ${index}: duration must be at least 1 day`);
        }
      });
    }
    
    if (!context.requestedDuration || context.requestedDuration < 1) {
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
    bundleGroup: string,
    availableDurations: number[]
  ): Promise<number> {
    return this.engine.calculateUnusedDayDiscount(
      selectedBundleMarkup,
      selectedBundleDuration,
      requestedDuration,
      bundleGroup,
      availableDurations
    );
  }

  private async loadRules(): Promise<void> {
    // Try to load from cache first if available
    // if (this.cache) { // This line was removed as per the new_code, as the cache property is removed.
    //   const cachedRules = await this.cache.get(PricingEngineService.RULES_CACHE_KEY);
      
    //   if (cachedRules) {
    //     this.logger.info('Loading rules from cache');
    //     const rules = JSON.parse(cachedRules);
        
    //     // Separate system and business rules
    //     const systemRules = rules.filter((r: any) => !r.isEditable);
    //     const businessRules = rules.filter((r: any) => r.isEditable);
        
    //     // Add to engine
    //     this.engine.addSystemRules(systemRules);
    //     this.engine.addRules(businessRules);
        
    //     this.logger.info('Rules loaded from cache', {
    //       systemCount: systemRules.length,
    //       businessCount: businessRules.length
    //     });
        
    //     return;
    //   }
    // }
    
    // Load from database
    this.logger.info('Loading rules from database');
    
    let activeRules = await this.repository.findActiveRules();
    
    // If no rules exist, create default system rules
    if (activeRules.length === 0) {
      this.logger.info('No pricing rules found, creating default system rules');
      
      const defaultRules = DefaultRulesService.createSystemRulesFromDefaults();
      
      // Create the default rules in the database
      for (const rule of defaultRules) {
        try {
          await this.repository.create(rule);
          this.logger.info('Created default rule', { ruleName: rule.name, ruleType: rule.type });
        } catch (error) {
          this.logger.error('Failed to create default rule', error as Error, {
            ruleName: rule.name,
            ruleType: rule.type
          });
        }
      }
      
      // Reload rules after creating defaults
      activeRules = await this.repository.findActiveRules();
      
      this.logger.info('Default system rules created', {
        createdCount: defaultRules.length,
        loadedCount: activeRules.length
      });
    }
    
    // Separate system and business rules
    const systemRules = activeRules.filter(r => !r.isEditable);
    const businessRules = activeRules.filter(r => r.isEditable);
    
    // Add to engine
    this.engine.addSystemRules(systemRules);
    this.engine.addRules(businessRules);
    
    // Cache the rules if cache is available
    // if (this.cache) { // This line was removed as per the new_code, as the cache property is removed.
    //   await this.cache.set(
    //     PricingEngineService.RULES_CACHE_KEY,
    //     JSON.stringify(activeRules),
    //     { ttl: PricingEngineService.RULES_CACHE_TTL }
    //   );
    // }
    
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
      availableBundles: Array<Bundle>;
    requestedDuration: number;
    user?: {
      id: string;
      isNew?: boolean;
      isFirstPurchase?: boolean;
      purchaseCount?: number;
      segment?: string;
    };
    paymentMethod?: string;
  }): PricingContext {
    return {
      availableBundles: params.availableBundles,
      requestedDuration: params.requestedDuration,
      user: params.user,
      paymentMethod: params.paymentMethod || 'ISRAELI_CARD',
      currentDate: new Date()
    };
  }
}

