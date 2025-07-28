import { PricingEngine, type Bundle as EngineBundle, type PricingEngineInput, type PricingEngineOutput } from '@esim-go/rules-engine';
import { GraphQLError } from 'graphql';
import type { Context } from '../context/types';
import { createLogger } from '../lib/logger';
import type {
  Bundle,
  CalculatePriceInput,
  Country,
  PaymentMethod,
  PricingBreakdown,
  PricingRule,
  QueryResolvers
} from '../types';

const logger = createLogger({ 
  component: 'PricingResolvers',
  operationType: 'graphql-resolver'
});

// Create a pricing engine instance
const pricingEngine = new PricingEngine();

// Helper function to map payment method enum
const mapPaymentMethodEnum = (paymentMethod: any): PaymentMethod => {
  return paymentMethod || 'ISRAELI_CARD';
};

// Helper function to generate correlation ID
const generateCorrelationId = (): string => {
  return `pricing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to get correlation ID from context or generate new one
const getCorrelationId = (context: Context): string => {
  // Check for correlation ID in request headers
  const headerCorrelationId = context.req?.headers?.['x-correlation-id'] || 
                             context.req?.get?.('x-correlation-id');
  
  if (headerCorrelationId) {
    logger.debug('Using client-provided correlation ID', {
      correlationId: headerCorrelationId,
      operationType: 'correlation-id'
    });
    return headerCorrelationId;
  }
  
  // Generate new one if not provided
  const newCorrelationId = generateCorrelationId();
  logger.debug('Generated new correlation ID', {
    correlationId: newCorrelationId,
    operationType: 'correlation-id'
  });
  return newCorrelationId;
};

/**
 * Get active pricing rules using repository
 */
async function getActivePricingRules(context: Context): Promise<PricingRule[]> {
  try {
    const rules = await context.repositories.pricingRules.findActiveRules();
    return rules;
  } catch (error) {
    logger.error('Failed to fetch pricing rules', error as Error, {
      operationType: 'fetch-pricing-rules'
    });
    return [];
  }
}

/**
 * Convert GraphQL Bundle to Engine Bundle format
 */
function convertToEngineBundle(bundle: Bundle | any): EngineBundle {
  return {
    name: bundle.name || bundle.esimGoName || 'Unknown Bundle',
    description: bundle.description || '',
    groups: bundle.groups || [],
    validityInDays: bundle.validityInDays || bundle.validity_in_days || 1,
    dataAmountMB: bundle.dataAmountMB || bundle.data_amount_mb || null,
    dataAmountReadable: bundle.dataAmountReadable || bundle.data_amount_readable || 'Unknown',
    isUnlimited: bundle.isUnlimited || bundle.is_unlimited || false,
    countries: bundle.countries || [],
    region: bundle.region || '',
    speed: bundle.speed || [],
    currency: bundle.currency || 'USD',
    basePrice: bundle.basePrice || bundle.price || 0
  };
}

/**
 * Shared function to calculate pricing for a single bundle
 * This is the single source of truth for all pricing calculations
 */
export async function calculatePricingForBundle(
  bundle: Bundle,
  paymentMethod: PaymentMethod,
  context: Context,
  correlationId?: string
): Promise<PricingBreakdown> {
  const finalCorrelationId = correlationId || getCorrelationId(context);
  
  try {
    logger.info('Calculating pricing for bundle', {
      bundleName: bundle.name,
      paymentMethod,
      correlationId: finalCorrelationId,
      operationType: 'calculate-bundle-pricing'
    });

    // 1. Get active pricing rules
    const rules = await getActivePricingRules(context);
    
    // 2. Clear and add rules to engine
    pricingEngine.clearRules();
    pricingEngine.addRules(rules);

    // 3. Convert bundle to engine format
    const engineBundle = convertToEngineBundle(bundle);

    // 4. Create pricing engine input
    const engineInput: PricingEngineInput = {
      bundles: [engineBundle],
      costumer: {
        id: context.auth?.user?.id || 'anonymous',
        segment: 'default'
      },
      payment: {
        method: paymentMethod,
        promo: undefined
      },
      rules,
      request: {
        duration: bundle.validityInDays,
        paymentMethod,
        countryISO: bundle.countries?.[0],
        region: bundle.region || '',
        dataType: 'DEFAULT' as any
      },
      steps: [],
      unusedDays: 0,
      country: bundle.countries?.[0] || '',
      region: bundle.region || '',
      group: bundle.groups?.[0] || '',
      dataType: 'DEFAULT' as any,
      metadata: {
        correlationId: finalCorrelationId,
        userId: context.auth?.user?.id
      }
    };

    // 5. Calculate pricing
    const result = await pricingEngine.calculatePrice(engineInput);

    // 6. Map to GraphQL PricingBreakdown
    return mapEngineToPricingBreakdown(result, bundle);
  } catch (error) {
    logger.error('Failed to calculate bundle pricing', error as Error, {
      bundleName: bundle.name,
      correlationId: finalCorrelationId,
      operationType: 'calculate-bundle-pricing'
    });
    throw new GraphQLError('Failed to calculate pricing', {
      extensions: { code: 'PRICING_CALCULATION_FAILED' }
    });
  }
}

/**
 * Core function that maps PricingEngineOutput to PricingBreakdown
 * This is the single source of truth for pricing data transformation
 */
function mapEngineToPricingBreakdown(
  engineOutput: PricingEngineOutput,
  bundleOrInput: Bundle | CalculatePriceInput
): PricingBreakdown {
  const pricing = engineOutput.pricing;
  const selectedBundle = engineOutput.selectedBundle;
  
  // Extract bundle selection reason from pipeline steps
  const bundleSelectionStep = engineOutput.steps?.find(step => step.name === 'BUNDLE_SELECTION');
  const selectedReason = bundleSelectionStep?.debug?.reason || 'calculated';

  // Determine country based on input type
  const countryIso = 'countryId' in bundleOrInput 
    ? bundleOrInput.countryId 
    : bundleOrInput.countries?.[0] || '';

  const duration = 'numOfDays' in bundleOrInput
    ? bundleOrInput.numOfDays
    : bundleOrInput.validityInDays;

  return {
    __typename: 'PricingBreakdown',
    
    // Bundle Information - Public
    bundle: {
      __typename: 'CountryBundle',
      id: selectedBundle?.name || `bundle_${countryIso}_${duration}d`,
      name: selectedBundle?.name || `${duration} Day Plan`,
      duration: selectedBundle?.validityInDays || duration || 1,
      data: selectedBundle?.dataAmountMB || null,
      isUnlimited: selectedBundle?.isUnlimited || false,
      currency: selectedBundle?.currency || 'USD',
      country: {
        iso: countryIso || '',
        name: countryIso || '', // Will be resolved by country resolver
        region: selectedBundle?.region || ''
      } as Country
    },
    
    country: {
      iso: countryIso || '',
      name: countryIso || '',
      region: selectedBundle?.region || ''
    },
    
    duration: duration || 1,
    currency: selectedBundle?.currency || 'USD',
    
    // Public pricing fields (what users pay)
    totalCost: pricing?.totalCost || 0, // Total cost (cost + markup) before discounts
    discountValue: pricing?.discountValue || 0, // Total discount amount
    priceAfterDiscount: pricing?.priceAfterDiscount || 0, // Final price users pay
    
    // Admin-only business sensitive fields (auto-hidden by @auth directive)
    cost: pricing?.cost || 0, // Base cost from supplier
    markup: pricing?.markup || 0, // Markup amount added to cost
    discountRate: pricing?.discountRate || 0, // Discount percentage
    processingRate: pricing?.processingRate || 0, // Processing fee percentage
    processingCost: pricing?.processingCost || 0, // Processing fee amount
    finalRevenue: pricing?.finalRevenue || 0, // What customer pays
    revenueAfterProcessing: pricing?.revenueAfterProcessing || 0, // What we receive after processing fees
    netProfit: pricing?.netProfit || 0, // Final profit
    discountPerDay: pricing?.discountPerDay || 0, // Per-day discount rate
    
    // Rule-based pricing breakdown - Admin only
    appliedRules: engineOutput.appliedRules?.map(rule => ({
      id: rule.id,
      name: rule.name,
      type: rule.type,
      impact: 0 // TODO: Calculate impact from rule actions
    })) || [],
    
    discounts: pricing.discounts?.map(discount => ({
      ruleName: discount.ruleName || 'Unknown',
      amount: discount.amount || 0,
      type: discount.type || 'fixed'
    })) || [],
    
    // Pipeline metadata - Admin only
    unusedDays: engineOutput.unusedDays || 0,
    selectedReason,
    
    // Additional pricing engine fields - Admin only
    totalCostBeforeProcessing: pricing?.priceAfterDiscount || 0 // Price before processing fees
  } as PricingBreakdown;
}


// Payment method configurations - single source of truth
const PAYMENT_METHODS_CONFIG = [
  {
    value: 'ISRAELI_CARD' as PaymentMethod,
    label: 'Israeli Card',
    description: '1.4% processing fee',
    processingRate: 0.014,
    icon: 'credit-card',
    isActive: true
  },
  {
    value: 'FOREIGN_CARD' as PaymentMethod,
    label: 'Foreign Card',
    description: '3.9% processing fee',
    processingRate: 0.039,
    icon: 'credit-card',
    isActive: true
  },
  {
    value: 'BIT' as PaymentMethod,
    label: 'Bit Payment',
    description: '0.7% processing fee',
    processingRate: 0.007,
    icon: 'smartphone',
    isActive: true
  },
  {
    value: 'AMEX' as PaymentMethod,
    label: 'American Express',
    description: '5.7% processing fee',
    processingRate: 0.057,
    icon: 'credit-card',
    isActive: true
  },
  {
    value: 'DINERS' as PaymentMethod,
    label: 'Diners Club',
    description: '6.4% processing fee',
    processingRate: 0.064,
    icon: 'credit-card',
    isActive: true
  }
];

// Unified pricing resolvers
export const pricingQueries: QueryResolvers = {
  /**
   * Single pricing calculation - returns PricingBreakdown with all fields
   * Field-level auth directives control access to sensitive data
   */
  calculatePrice: async (
    _,
    { numOfDays, countryId, paymentMethod, regionId, groups },
    context: Context
  ): Promise<PricingBreakdown> => {
    const correlationId = getCorrelationId(context);
    
    try {
      logger.info('Calculating single price', {
        countryId,
        numOfDays,
        paymentMethod,
        correlationId,
        operationType: 'calculate-price'
      });

      // 1. Get available bundles from catalog
      const catalogResponse = await context.repositories.bundles.search({
        countries: [countryId || ''],
        maxValidityInDays: numOfDays * 2, // Get bundles with longer duration too
        minValidityInDays: 1,
        groups: groups,
      });

      if (!catalogResponse.data || catalogResponse.data.length === 0) {
        throw new GraphQLError('No bundles found for the specified country', {
          extensions: { code: 'NO_BUNDLES_FOUND', countryId }
        });
      }

      // 2. Convert catalog bundles to GraphQL Bundle format
      const bundles: Bundle[] = catalogResponse.data.map(catalogBundle => ({
        __typename: 'CatalogBundle',
        esimGoName: catalogBundle.esim_go_name || '',
        name: catalogBundle.esim_go_name || 'Unknown Bundle',
        description: catalogBundle.description,
        groups: catalogBundle.groups || [],
        validityInDays: catalogBundle.validity_in_days || 1,
        dataAmountMB: catalogBundle.data_amount_mb,
        dataAmountReadable: catalogBundle.data_amount_readable || 'Unknown',
        isUnlimited: catalogBundle.is_unlimited || false,
        countries: [countryId],
        region: catalogBundle.region,
        speed: [],
        basePrice: catalogBundle.price || 0,
        currency: 'USD',
        createdAt: catalogBundle.created_at,
        updatedAt: catalogBundle.updated_at,
        syncedAt: catalogBundle.synced_at,
        pricingBreakdown: undefined
      } as any));

      // 3. Get active rules and configure engine
      const rules = await getActivePricingRules(context);
      pricingEngine.clearRules();
      pricingEngine.addRules(rules);

      // 4. Create engine input with all bundles
      const engineInput: PricingEngineInput = {
        bundles: bundles.map(convertToEngineBundle),
        costumer: {
          id: context.auth?.user?.id || 'anonymous',
          segment: 'default'
        },
        payment: {
          method: mapPaymentMethodEnum(paymentMethod),
          promo: undefined
        },
        rules,
        request: {
          duration: numOfDays,
          paymentMethod: mapPaymentMethodEnum(paymentMethod),
          countryISO: countryId,
          region: regionId,
          dataType: 'DEFAULT' as any
        },
        steps: [],
        unusedDays: 0,
        country: countryId || '',
        region: regionId || '',
        group: groups?.[0] || '',
        dataType: 'DEFAULT' as any,
        metadata: {
          correlationId,
          userId: context.auth?.user?.id
        }
      };

      // 5. Let engine select best bundle and calculate pricing
      const result = await pricingEngine.calculatePrice(engineInput);
      
      // Debug log for unused days (single pricing)
      logger.info('DEBUG: Single pricing engine result for unused days', {
        correlationId,
        requestedDuration: numOfDays,
        selectedBundleDuration: result.selectedBundle?.validityInDays,
        unusedDays: result.unusedDays,
        discountPerDay: result.pricing?.discountPerDay,
        operationType: 'unused-days-debug-single'
      });
      
      // 6. Map result to GraphQL format
      const pricingBreakdown = mapEngineToPricingBreakdown(result, { 
        numOfDays, 
        countryId, 
        paymentMethod, 
        regionId, 
        groups 
      });
      
      // Debug log for mapped result (single pricing)
      logger.info('DEBUG: Single mapped pricing breakdown for unused days', {
        correlationId,
        unusedDays: pricingBreakdown.unusedDays,
        discountPerDay: pricingBreakdown.discountPerDay,
        operationType: 'unused-days-debug-single'
      });

      logger.info('Single price calculated successfully', {
        countryId,
        numOfDays,
        finalPrice: pricingBreakdown.priceAfterDiscount,
        selectedBundle: result.selectedBundle?.name,
        correlationId,
        operationType: 'calculate-price'
      });

      return pricingBreakdown;
    } catch (error) {
      logger.error('Failed to calculate single price', error as Error, {
        countryId,
        numOfDays,
        correlationId,
        operationType: 'calculate-price'
      });
      
      // Preserve specific error codes and messages for better debugging
      if (error instanceof GraphQLError) {
        throw error;
      }
      
      throw new GraphQLError('Failed to calculate price', {
        extensions: { 
          code: 'CALCULATION_FAILED',
          originalError: error instanceof Error ? error.message : String(error)
        }
      });
    }
  },

  /**
   * Batch pricing calculation - returns PricingBreakdown[] with all fields
   * Field-level auth directives control access to sensitive data
   */
  calculatePrices: async (
    _,
    { inputs },
    context: Context
  ): Promise<PricingBreakdown[]> => {
    const correlationId = getCorrelationId(context);
    
    try {
      logger.info('Calculating batch prices', {
        requestCount: inputs.length,
        correlationId,
        operationType: 'calculate-prices'
      });

      // Get active rules once for all calculations
      const rules = await getActivePricingRules(context);
      pricingEngine.clearRules();
      pricingEngine.addRules(rules);

      const results: PricingBreakdown[] = [];

      // Process each request
      for (const input of inputs) {
        // Use the same logic as calculatePrice
        const catalogResponse = await context.repositories.bundles.search({
          countries: [input.countryId || ''],
          maxValidityInDays: input.numOfDays * 2,
          minValidityInDays: 1,
          groups: input.groups,
        });

        if (!catalogResponse.data || catalogResponse.data.length === 0) {
          throw new GraphQLError(`No bundles found for country: ${input.countryId}`, {
            extensions: { code: 'NO_BUNDLES_FOUND', countryId: input.countryId }
          });
        }

        // Create engine input
        const engineInput: PricingEngineInput = {
          bundles: catalogResponse.data.map(b => convertToEngineBundle({
            name: b.esim_go_name || 'Unknown',
            groups: b.groups || [],
            validityInDays: b.validity_in_days || 1,
            dataAmountMB: b.data_amount_mb,
            dataAmountReadable: b.data_amount_readable || 'Unknown',
            isUnlimited: b.is_unlimited || false,
            countries: [input.countryId],
            region: b.region,
            basePrice: b.price || 0,
            currency: 'USD'
          })),
          costumer: {
            id: context.auth?.user?.id || 'anonymous',
            segment: 'default'
          },
          payment: {
            method: mapPaymentMethodEnum(input.paymentMethod),
            promo: undefined
          },
          rules,
          request: {
            duration: input.numOfDays,
            paymentMethod: mapPaymentMethodEnum(input.paymentMethod),
            countryISO: input.countryId,
            region: input.regionId,
            dataType: 'DEFAULT' as any
          },
          steps: [],
          unusedDays: 0,
          country: input.countryId || '',
          region: input.regionId || '',
          group: input.groups?.[0] || '',
          dataType: 'DEFAULT' as any,
          metadata: {
            correlationId: `${correlationId}-${results.length}`,
            userId: context.auth?.user?.id
          }
        };

        const result = await pricingEngine.calculatePrice(engineInput);
        
        // Debug log for unused days
        logger.info('DEBUG: Pricing engine result for unused days', {
          correlationId: `${correlationId}-${results.length}`,
          requestedDuration: input.numOfDays,
          selectedBundleDuration: result.selectedBundle?.validityInDays,
          unusedDays: result.unusedDays,
          discountPerDay: result.pricing?.discountPerDay,
          operationType: 'unused-days-debug'
        });
        
        const pricingBreakdown = mapEngineToPricingBreakdown(result, input);
        
        // Debug log for mapped result
        logger.info('DEBUG: Mapped pricing breakdown for unused days', {
          correlationId: `${correlationId}-${results.length}`,
          unusedDays: pricingBreakdown.unusedDays,
          discountPerDay: pricingBreakdown.discountPerDay,
          operationType: 'unused-days-debug'
        });
        
        results.push(pricingBreakdown);
      }

      logger.info('Batch prices calculated successfully', {
        requestCount: inputs.length,
        correlationId,
        operationType: 'calculate-prices'
      });

      return results;
    } catch (error) {
      logger.error('Failed to calculate batch prices', error as Error, {
        requestCount: inputs.length,
        correlationId,
        operationType: 'calculate-prices'
      });
      
      if (error instanceof GraphQLError) {
        throw error;
      }
      
      throw new GraphQLError('Failed to calculate batch prices', {
        extensions: { code: 'BATCH_CALCULATION_FAILED' }
      });
    }
  },

  /**
   * Admin pricing rule simulation - returns PricingBreakdown with simulated rule effects
   */
  simulatePricingRule: async (
    _,
    { rule, testContext },
    context: Context
  ): Promise<PricingBreakdown> => {
    const correlationId = getCorrelationId(context);
    
    try {
      logger.info('Simulating pricing rule (admin)', {
        ruleName: rule.name,
        ruleType: rule.category,
        correlationId,
        operationType: 'simulate-pricing-rule'
      });

      // Get existing rules and add the test rule
      const existingRules = await getActivePricingRules(context);
      const testRuleWithId = {
        ...rule,
        id: 'test-rule-simulation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: context.auth?.user?.id || 'system'
      };
      
      // Configure engine with test rule
      pricingEngine.clearRules();
      pricingEngine.addRules([...existingRules, testRuleWithId]);

      // Use calculatePrice logic with test context
      const input: CalculatePriceInput = {
        numOfDays: testContext.duration || 7,
        countryId: testContext.countryId || 'US',
        paymentMethod: testContext.paymentMethod
      };

      // Get bundles for simulation
      const catalogResponse = await context.repositories.bundles.search({
        countries: [input.countryId],
        maxValidityInDays: input.numOfDays * 2,
        minValidityInDays: 1,
      });

      if (!catalogResponse.data || catalogResponse.data.length === 0) {
        throw new GraphQLError('No bundles found for simulation', {
          extensions: { code: 'NO_BUNDLES_FOUND', countryId: input.countryId }
        });
      }

      // Create engine input
      const engineInput: PricingEngineInput = {
        bundles: catalogResponse.data.map(b => convertToEngineBundle({
          name: b.esim_go_name || 'Unknown',
          groups: b.groups || [],
          validityInDays: b.validity_in_days || 1,
          dataAmountMB: b.data_amount_mb,
          dataAmountReadable: b.data_amount_readable || 'Unknown',
          isUnlimited: b.is_unlimited || false,
          countries: [input.countryId],
          region: b.region,
          basePrice: b.price || 0,
          currency: 'USD'
        })),
        costumer: {
          id: context.auth?.user?.id || 'anonymous',
          segment: 'default'
        },
        payment: {
          method: mapPaymentMethodEnum(input.paymentMethod),
          promo: undefined
        },
        rules: [...existingRules, testRuleWithId],
        request: {
          duration: input.numOfDays,
          paymentMethod: mapPaymentMethodEnum(input.paymentMethod),
          countryISO: input.countryId,
          region: undefined,
          dataType: 'DEFAULT' as any
        },
        steps: [],
        unusedDays: 0,
        country: input.countryId || '',
        region: '',
        group: '',
        dataType: 'DEFAULT' as any,
        metadata: {
          correlationId,
          userId: context.auth?.user?.id,
          isSimulation: true
        }
      };

      const result = await pricingEngine.calculatePrice(engineInput);
      const pricingBreakdown = mapEngineToPricingBreakdown(result, input);

      logger.info('Pricing rule simulation completed (admin)', {
        ruleName: rule.name,
        finalPrice: pricingBreakdown.priceAfterDiscount,
        appliedRules: result.pricing?.appliedRules?.length || 0,
        correlationId,
        operationType: 'simulate-pricing-rule'
      });

      return pricingBreakdown;
    } catch (error) {
      logger.error('Failed to simulate pricing rule (admin)', error as Error, {
        ruleName: rule.name,
        correlationId,
        operationType: 'simulate-pricing-rule'
      });
      throw new GraphQLError('Failed to simulate pricing rule', {
        extensions: { code: 'RULE_SIMULATION_FAILED' }
      });
    }
  },

  /**
   * Get available payment methods with their processing rates
   * This is the single source of truth for payment method configurations
   */
  paymentMethods: async (_, __, context: Context) => {
    logger.info('Fetching payment methods', {
      operationType: 'get-payment-methods',
      hasAuth: !!context.auth
    });
    
    // Return the configured payment methods
    // In the future, this will be fetched from the rules system
    return PAYMENT_METHODS_CONFIG;
  }
};

// Export unified pricing resolvers
export const pricingResolvers = {
  Query: pricingQueries
};