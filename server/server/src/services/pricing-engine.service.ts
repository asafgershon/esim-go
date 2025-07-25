import { PricingEngine, PricingEngineInput, PricingEngineOutput, Bundle, PricingContext, PricingRuleCalculation } from '@esim-go/rules-engine';
import { PricingRulesRepository } from '../repositories/pricing-rules.repository';
import { DefaultRulesService } from './default-rules.service';
import { createLogger, withPerformanceLogging } from '../lib/logger';
import { publishEvent, PubSubEvents } from '../context/pubsub';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RedisPubSub } from 'graphql-redis-subscriptions';

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
  private engine: PricingEngine;
  private repository: PricingRulesRepository;
  private pubsub: RedisPubSub | null = null;
  private logger = createLogger({ 
    component: 'PricingEngineService',
    operationType: 'pricing-calculation'
  });
  
  // Cache rules for 5 minutes
  private static readonly RULES_CACHE_KEY = 'pricing:rules:active';
  private static readonly RULES_CACHE_TTL = 300; // 5 minutes
  
  // Singleton instance
  private static instance: PricingEngineService | null = null;

  constructor(supabase: SupabaseClient, pubsub?: RedisPubSub) {
    this.engine = new PricingEngine();
    this.repository = new PricingRulesRepository(supabase);
    this.pubsub = pubsub || null;
  }

  /**
   * Get singleton instance of the pricing engine service
   */
  static getInstance(supabase: SupabaseClient, pubsub?: RedisPubSub): PricingEngineService {
    if (!PricingEngineService.instance) {
      PricingEngineService.instance = new PricingEngineService(supabase, pubsub);
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
   * Calculate price with optional streaming support
   * @param input - Pricing engine input
   * @param streaming - Enable real-time step streaming via WebSocket
   */
  async calculatePrice(input: PricingEngineInput, streaming = false): Promise<PricingEngineOutput> {
    // Ensure rules are loaded
    await this.ensureRulesLoaded();
    
    return withPerformanceLogging(
      this.logger,
      'calculate-price',
      async () => {
        if (!streaming) {
          // Non-streaming calculation - use legacy method
          return await this.engine.calculatePrice(input);
        }
        
        // Streaming calculation - emit each step via PubSub
        if (!this.pubsub) {
          this.logger.warn('Streaming requested but PubSub not available, falling back to non-streaming', {
            correlationId: input.metadata.correlationId
          });
          return await this.engine.calculatePrice(input);
        }
        
        const generator = this.engine.calculatePriceSteps(input);
        let finalResult: PricingEngineOutput | null = null;
        
        try {
          // Process all steps and capture the final result
          let result = await generator.next();
          
          while (!result.done) {
            const step = result.value;
            
            // Log step for debugging
            this.logger.debug('Publishing pricing pipeline step', {
              correlationId: input.metadata.correlationId,
              stepName: step.name,
              operationType: 'pricing-pipeline-publish'
            });
            
            // Publish step to PubSub for real-time streaming
            await publishEvent(this.pubsub, PubSubEvents.PRICING_PIPELINE_STEP, {
              correlationId: input.metadata.correlationId,
              name: step.name,
              timestamp: step.timestamp.toISOString(),
              state: step.state,
              appliedRules: step.appliedRules || [],
              debug: step.debug || {}
            });
            
            // Get next step
            result = await generator.next();
          }
          
          // The final value is the PricingEngineOutput
          finalResult = result.value;
          
        } catch (error) {
          this.logger.error('Error during streaming calculation', error as Error, {
            correlationId: input.metadata.correlationId,
            operationType: 'streaming-calculation'
          });
          throw error;
        }
        
        if (!finalResult) {
          throw new Error('Failed to get final result from pricing engine');
        }
        
        return finalResult;
      },
      {
        bundleCount: input.bundles?.length || 0,
        requestedDuration: input.request.duration,
        streaming
      }
    );
  }

  /**
   * Legacy method for backward compatibility
   * Converts old PricingContext to new PricingEngineInput
   */
  async calculatePriceLegacy(context: PricingContext): Promise<ExtendedPricingCalculation> {
    // Convert PricingContext to PricingEngineInput format
    const input: PricingEngineInput = {
      bundles: context.availableBundles || [],
      costumer: {
        id: context.user?.id || 'anonymous',
        segment: context.user?.segment || 'default'
      },
      payment: {
        method: context.paymentMethod as any || 'ISRAELI_CARD'
      },
      rules: [], // Will be loaded from repository
      request: {
        duration: context.requestedDuration,
        paymentMethod: context.paymentMethod as any || 'ISRAELI_CARD'
      },
      steps: [],
      unusedDays: 0,
      country: '',
      region: '',
      group: '',
      dataType: 'DEFAULT' as any,
      metadata: {
        correlationId: `legacy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    };
    
    const result = await this.calculatePrice(input, false);
    
    // Convert back to legacy format
    return {
      ...result.pricing,
      selectedBundle: {
        bundleId: result.selectedBundle?.name || '',
        bundleName: result.selectedBundle?.name || '',
        duration: result.selectedBundle?.validityInDays || 0,
        reason: 'calculated'
      }
    } as ExtendedPricingCalculation;
  }

  /**
   * Reload rules from database
   * Call this when rules are updated
   */
  async reloadRules(): Promise<void> {
    this.logger.info('Reloading pricing rules');
    
    // Clear engine rules
    this.engine.clearRules();
    
    // Load fresh rules
    await this.loadRules();
  }

  /**
   * Get all loaded rules (for debugging/admin UI)
   */
  getLoadedRules() {
    // Note: The new PricingEngine doesn't separate system/business rules
    // This method is kept for backward compatibility
    return {
      all: [], // TODO: Implement rules getter in new PricingEngine
      system: [],
      business: []
    };
  }

  /**
   * Validate a pricing engine input (useful for API validation)
   */
  validateInput(input: PricingEngineInput): string[] {
    const errors: string[] = [];
    
    if (!input.bundles || input.bundles.length === 0) {
      errors.push('At least one bundle is required');
    } else {
      // Validate each bundle
      input.bundles.forEach((bundle, index) => {
        if (!bundle.name) errors.push(`Bundle ${index}: name is required`);
        if (!bundle.basePrice || bundle.basePrice < 0) {
          errors.push(`Bundle ${index}: basePrice must be a positive number`);
        }
        if (!bundle.validityInDays || bundle.validityInDays < 1) {
          errors.push(`Bundle ${index}: validityInDays must be at least 1`);
        }
      });
    }
    
    if (!input.request.duration || input.request.duration < 1) {
      errors.push('Requested duration must be at least 1 day');
    }
    
    if (!input.metadata?.correlationId) {
      errors.push('Correlation ID is required for tracking');
    }
    
    return errors;
  }

  /**
   * Legacy validate method for backward compatibility
   */
  validateContext(context: PricingContext): string[] {
    // Convert to new format and validate
    const input: Partial<PricingEngineInput> = {
      bundles: context.availableBundles?.map(bundle => ({
        name: (bundle as any).id || 'unknown',
        basePrice: (bundle as any).cost || 0,
        validityInDays: (bundle as any).duration || 0,
        countries: [],
        currency: 'USD',
        dataAmountReadable: 'Unknown',
        groups: [],
        isUnlimited: false,
        speed: []
      })) || [],
      request: {
        duration: context.requestedDuration,
        paymentMethod: context.paymentMethod as any
      },
      metadata: {
        correlationId: 'validation'
      }
    };
    
    return this.validateInput(input as PricingEngineInput);
  }

  /**
   * Calculate unused day discount for a specific scenario
   * Note: This method is deprecated in the new pricing engine
   */
  async calculateUnusedDayDiscount(
    selectedBundleMarkup: number,
    selectedBundleDuration: number,
    requestedDuration: number,
    bundleGroup: string,
    availableDurations: number[]
  ): Promise<number> {
    // Legacy method - the new pricing engine handles this internally
    const unusedDays = Math.max(0, selectedBundleDuration - requestedDuration);
    // Simple calculation for backward compatibility
    return unusedDays * (selectedBundleMarkup / selectedBundleDuration);
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
    
    // Add all rules to the new pricing engine
    // The new engine doesn't separate system/business rules
    this.engine.addRules(activeRules);
    
    // Cache the rules if cache is available
    // if (this.cache) { // This line was removed as per the new_code, as the cache property is removed.
    //   await this.cache.set(
    //     PricingEngineService.RULES_CACHE_KEY,
    //     JSON.stringify(activeRules),
    //     { ttl: PricingEngineService.RULES_CACHE_TTL }
    //   );
    // }
    
    this.logger.info('Rules loaded from database', {
      totalCount: activeRules.length
    });
  }

  private async ensureRulesLoaded(): Promise<void> {
    // TODO: Implement rules count check in new PricingEngine
    // For now, always try to load rules if not loaded yet
    try {
      await this.loadRules();
    } catch (error) {
      this.logger.warn('Failed to ensure rules loaded, continuing with empty rules', {
        error: (error as Error).message
      });
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

