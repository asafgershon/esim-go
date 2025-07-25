import { GraphQLError } from 'graphql';
import type { Context } from '../context/types';
import { createLogger } from '../lib/logger';
import { PricingEngineService } from '../services/pricing-engine.service';
import type { 
  PricingEngineInput, 
  PricingEngineOutput, 
  Bundle 
} from '@esim-go/rules-engine';
import type {
  QueryResolvers,
  CalculatePriceInput,
  PricingBreakdown,
  CountryBundle,
  Country,
  PaymentMethod
} from '../types';

const logger = createLogger({ 
  component: 'PricingResolvers',
  operationType: 'graphql-resolver'
});

// Helper function to get pricing engine service
const getPricingEngineService = (context: Context): PricingEngineService => {
  return PricingEngineService.getInstance(context.services.db, context.services.pubsub);
};

// Helper function to map payment method enum
const mapPaymentMethodEnum = (paymentMethod: any): PaymentMethod => {
  return paymentMethod || 'ISRAELI_CARD';
};

// Helper function to generate correlation ID
const generateCorrelationId = (): string => {
  return `pricing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Core function that maps PricingEngineOutput to PricingBreakdown
 * This is the single source of truth for pricing data transformation
 */
function mapEngineToPricingBreakdown(
  engineOutput: PricingEngineOutput,
  input: CalculatePriceInput
): PricingBreakdown {
  const pricing = engineOutput.pricing;
  const selectedBundle = engineOutput.selectedBundle;
  
  // Extract bundle selection reason from pipeline steps
  const bundleSelectionStep = engineOutput.steps?.find(step => step.name === 'BUNDLE_SELECTION');
  const selectedReason = bundleSelectionStep?.debug?.reason || 'calculated';

  return {
    __typename: 'PricingBreakdown',
    
    // Bundle Information - Public
    bundle: {
      __typename: 'CountryBundle',
      id: selectedBundle?.name || `bundle_${input.countryId}_${input.numOfDays}d`,
      name: selectedBundle?.name || `${input.numOfDays} Day Plan`,
      duration: selectedBundle?.validityInDays || input.numOfDays || 1,
      data: selectedBundle?.dataAmountMB || null,
      isUnlimited: selectedBundle?.isUnlimited || false,
      currency: selectedBundle?.currency || 'USD',
      country: {
        iso: input.countryId || '',
        name: input.countryId || '', // Will be resolved by country resolver
        region: selectedBundle?.region || ''
      } as Country
    },
    
    country: {
      iso: input.countryId || '',
      name: input.countryId || '',
      region: selectedBundle?.region || ''
    },
    
    duration: input.numOfDays || 1,
    currency: selectedBundle?.currency || 'USD',
    
    // Public pricing fields (what users pay)
    totalCost: pricing?.costPlus || 0, // Subtotal before discounts
    discountValue: pricing?.discountValue || 0, // Total discount amount
    priceAfterDiscount: pricing?.priceAfterDiscount || 0, // Final price users pay
    
    // Admin-only business sensitive fields (auto-hidden by @auth directive)
    cost: pricing?.cost || 0, // Base cost from supplier
    costPlus: pricing?.costPlus || 0, // Cost + markup
    discountRate: pricing?.discountRate || 0, // Discount percentage
    processingRate: pricing?.processingRate || 0, // Processing fee percentage
    processingCost: pricing?.processingCost || 0, // Processing fee amount
    finalRevenue: pricing?.finalRevenue || 0, // Revenue after processing
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

/**
 * Convert CalculatePriceInput to PricingEngineInput
 * Handles the interface conversion between GraphQL and pricing engine
 */
async function convertToPricingEngineInput(
  input: CalculatePriceInput,
  context: Context,
  correlationId?: string
): Promise<PricingEngineInput> {
  // Get available bundles from catalog
  const catalogResponse = await context.repositories.bundles.search({
    countries: [input.countryId || ''],
    maxValidityInDays: input.numOfDays,
    minValidityInDays: 1, // Get all available durations
  });

  if (!catalogResponse.data || catalogResponse.data.length === 0) {
    throw new GraphQLError('No bundles found for the specified country', {
      extensions: { code: 'NO_BUNDLES_FOUND', countryId: input.countryId }
    });
  }

  // Map catalog bundles to pricing engine Bundle format
  const availableBundles: Bundle[] = catalogResponse.data.map(bundle => ({
    name: bundle.esim_go_name || 'Unknown Bundle',
    description: bundle.description || '',
    groups: bundle.groups || [],
    validityInDays: bundle.validity_in_days || input.numOfDays,
    dataAmountMB: bundle.data_amount_mb || null,
    dataAmountReadable: bundle.data_amount_readable || 'Unknown',
    isUnlimited: bundle.is_unlimited || false,
    countries: [input.countryId],
    region: bundle.region || '',
    speed: [],
    currency: 'USD', // Default currency
    basePrice: bundle.price || 0
  }));

  return {
    bundles: availableBundles,
    costumer: {
      id: context.auth?.user?.id || 'anonymous',
      segment: 'default' // TODO: Get from user context
    },
    payment: {
      method: mapPaymentMethodEnum(input.paymentMethod),
      promo: input.promo || undefined
    },
    rules: [], // Will be loaded by PricingEngineService
    request: {
      duration: input.numOfDays,
      paymentMethod: mapPaymentMethodEnum(input.paymentMethod),
      promo: input.promo || undefined,
      countryISO: input.countryId || undefined,
      region: input.regionId || undefined,
      dataType: 'DEFAULT' as any
    },
    steps: [],
    unusedDays: 0,
    country: input.countryId || '',
    region: input.regionId || '',
    group: '',
    dataType: 'DEFAULT' as any,
    metadata: {
      correlationId: correlationId || generateCorrelationId(),
      userId: context.auth?.user?.id
    }
  };
}

// Unified pricing resolvers
export const pricingQueries: QueryResolvers = {
  /**
   * Public pricing calculation - returns PricingBreakdown with public fields only
   */
  calculatePrice: async (
    _,
    { numOfDays, countryId, paymentMethod, regionId },
    context: Context
  ): Promise<PricingBreakdown> => {
    const correlationId = generateCorrelationId();
    
    try {
      logger.info('Calculating single price (public)', {
        countryId,
        numOfDays,
        paymentMethod,
        correlationId,
        operationType: 'calculate-price-public'
      });

      const input: CalculatePriceInput = {
        numOfDays,
        countryId,
        paymentMethod,
        regionId
      };

      const engineInput = await convertToPricingEngineInput(input, context, correlationId);
      const engineService = getPricingEngineService(context);
      
      // Use non-streaming calculation for public API
      const result = await engineService.calculatePrice(engineInput, false);
      
      const pricingBreakdown = mapEngineToPricingBreakdown(result, input);

      logger.info('Single price calculated successfully (public)', {
        countryId,
        numOfDays,
        finalPrice: pricingBreakdown.priceAfterDiscount,
        correlationId,
        operationType: 'calculate-price-public'
      });

      return pricingBreakdown;
    } catch (error) {
      logger.error('Failed to calculate single price (public)', error as Error, {
        countryId,
        numOfDays,
        correlationId,
        operationType: 'calculate-price-public'
      });
      throw new GraphQLError('Failed to calculate price', {
        extensions: { code: 'CALCULATION_FAILED' }
      });
    }
  },

  /**
   * Public batch pricing calculation - returns PricingBreakdown[] with public fields only
   */
  calculatePrices: async (
    _,
    { inputs },
    context: Context
  ): Promise<PricingBreakdown[]> => {
    const correlationId = generateCorrelationId();
    
    try {
      logger.info('Calculating batch prices (public)', {
        requestCount: inputs.length,
        correlationId,
        operationType: 'calculate-prices-public'
      });

      const engineService = getPricingEngineService(context);
      const results: PricingBreakdown[] = [];

      // Process each request
      for (const input of inputs) {
        const engineInput = await convertToPricingEngineInput(input, context, `${correlationId}-${results.length}`);
        const result = await engineService.calculatePrice(engineInput, false);
        const pricingBreakdown = mapEngineToPricingBreakdown(result, input);
        results.push(pricingBreakdown);
      }

      logger.info('Batch prices calculated successfully (public)', {
        requestCount: inputs.length,
        correlationId,
        operationType: 'calculate-prices-public'
      });

      return results;
    } catch (error) {
      logger.error('Failed to calculate batch prices (public)', error as Error, {
        requestCount: inputs.length,
        correlationId,
        operationType: 'calculate-prices-public'
      });
      throw new GraphQLError('Failed to calculate batch prices', {
        extensions: { code: 'BATCH_CALCULATION_FAILED' }
      });
    }
  },

  /**
   * Admin pricing calculation with rules visibility - returns PricingBreakdown with all fields
   */
  calculatePriceWithRules: async (
    _,
    { input },
    context: Context
  ): Promise<PricingBreakdown> => {
    const correlationId = generateCorrelationId();
    
    try {
      logger.info('Calculating single price with rules (admin)', {
        countryId: input.countryId,
        numOfDays: input.numOfDays,
        correlationId,
        operationType: 'calculate-price-admin'
      });

      const engineInput = await convertToPricingEngineInput(input, context, correlationId);
      const engineService = getPricingEngineService(context);
      
      // Use streaming calculation for admin visibility (optional)
      const result = await engineService.calculatePrice(engineInput, false);
      
      const pricingBreakdown = mapEngineToPricingBreakdown(result, input);

      logger.info('Single price with rules calculated successfully (admin)', {
        countryId: input.countryId,
        numOfDays: input.numOfDays,
        finalPrice: pricingBreakdown.priceAfterDiscount,
        appliedRulesCount: pricingBreakdown.appliedRules?.length || 0,
        correlationId,
        operationType: 'calculate-price-admin'
      });

      return pricingBreakdown;
    } catch (error) {
      logger.error('Failed to calculate single price with rules (admin)', error as Error, {
        countryId: input.countryId,
        numOfDays: input.numOfDays,
        correlationId,
        operationType: 'calculate-price-admin'
      });
      throw new GraphQLError('Failed to calculate price with rules', {
        extensions: { code: 'ADMIN_CALCULATION_FAILED' }
      });
    }
  },

  /**
   * Admin batch pricing calculation with rules visibility - returns PricingBreakdown[] with all fields
   */
  calculateBatchPricing: async (
    _,
    { requests },
    context: Context
  ): Promise<PricingBreakdown[]> => {
    const correlationId = generateCorrelationId();
    
    try {
      logger.info('Calculating batch pricing with rules (admin)', {
        requestCount: requests.length,
        correlationId,
        operationType: 'calculate-batch-pricing-admin'
      });

      const engineService = getPricingEngineService(context);
      const results: PricingBreakdown[] = [];

      // Process each request with admin visibility
      for (const request of requests) {
        const engineInput = await convertToPricingEngineInput(request, context, `${correlationId}-${results.length}`);
        const result = await engineService.calculatePrice(engineInput, false);
        const pricingBreakdown = mapEngineToPricingBreakdown(result, request);
        results.push(pricingBreakdown);
      }

      logger.info('Batch pricing with rules calculated successfully (admin)', {
        requestCount: requests.length,
        correlationId,
        operationType: 'calculate-batch-pricing-admin'
      });

      return results;
    } catch (error) {
      logger.error('Failed to calculate batch pricing with rules (admin)', error as Error, {
        requestCount: requests.length,
        correlationId,
        operationType: 'calculate-batch-pricing-admin'
      });
      throw new GraphQLError('Failed to calculate batch pricing with rules', {
        extensions: { code: 'ADMIN_BATCH_CALCULATION_FAILED' }
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
    const correlationId = generateCorrelationId();
    
    try {
      logger.info('Simulating pricing rule (admin)', {
        ruleName: rule.name,
        ruleType: rule.type,
        correlationId,
        operationType: 'simulate-pricing-rule'
      });

      // TODO: Implement rule simulation
      // For now, return a basic calculation
      const input: CalculatePriceInput = {
        numOfDays: testContext.duration || 7,
        countryId: testContext.countryId || 'US',
        paymentMethod: testContext.paymentMethod
      };

      const engineInput = await convertToPricingEngineInput(input, context, correlationId);
      const engineService = getPricingEngineService(context);
      
      const result = await engineService.calculatePrice(engineInput, false);
      const pricingBreakdown = mapEngineToPricingBreakdown(result, input);

      logger.info('Pricing rule simulation completed (admin)', {
        ruleName: rule.name,
        finalPrice: pricingBreakdown.priceAfterDiscount,
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
  }
};

// Export unified pricing resolvers
export const pricingResolvers = {
  Query: pricingQueries
};