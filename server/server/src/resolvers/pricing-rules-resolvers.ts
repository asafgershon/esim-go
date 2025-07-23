import { GraphQLError } from 'graphql';
import type { Context } from '../context/types';
import { createLogger } from '../lib/logger';
import { PricingRuleEngine } from '../rules-engine/rule-engine';
import { PricingEngineService } from '../services/pricing-engine.service';
import type {
  MutationResolvers,
  PricingRule,
  PricingRuleCalculation,
  PricingRuleFilter,
  QueryResolvers
} from '../types';

const logger = createLogger({ 
  component: 'PricingRulesResolvers',
  operationType: 'graphql-resolver'
});

// Singleton instance of pricing engine service
let pricingEngineService: PricingEngineService | null = null;

const getPricingEngineService = (context: Context): PricingEngineService => {
  return PricingEngineService.getInstance(context.services.db);
};

export const pricingRulesQueries: QueryResolvers = {
  pricingRules: async (
    _parent,
    { filter },
    context,
    _info
  ): Promise<PricingRule[]> => {
    logger.info('Fetching pricing rules', { filter });
    
    try {
      return await context.repositories.pricingRules.findAll(filter as PricingRuleFilter | undefined);
    } catch (error) {
      logger.error('Failed to fetch pricing rules', error as Error, { filter });
      throw new GraphQLError('Failed to fetch pricing rules', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  },

  pricingRule: async (
    _parent,
    { id },
    context,
    _info
  ): Promise<PricingRule | null> => {
    logger.info('Fetching pricing rule', { id });
    
    try {
      const rule = await context.repositories.pricingRules.findById(id);
      
      if (!rule) {
        logger.warn('Pricing rule not found', { id });
      }
      
      return rule;
    } catch (error) {
      logger.error('Failed to fetch pricing rule', error as Error, { id });
      throw new GraphQLError('Failed to fetch pricing rule', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  },

  activePricingRules: async (
    _parent,
    _args,
    context,
    _info
  ): Promise<PricingRule[]> => {
    logger.info('Fetching active pricing rules');
    
    try {
      return await context.repositories.pricingRules.findActiveRules();
    } catch (error) {
      logger.error('Failed to fetch active pricing rules', error as Error);
      throw new GraphQLError('Failed to fetch active pricing rules', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  },

  conflictingPricingRules: async (
    _parent,
    { ruleId },
    context,
    _info
  ): Promise<PricingRule[]> => {
    logger.info('Finding conflicting pricing rules', { ruleId });
    
    try {
      return await context.repositories.pricingRules.getConflictingRules(ruleId);
    } catch (error) {
      logger.error('Failed to find conflicting rules', error as Error, { ruleId });
      throw new GraphQLError('Failed to find conflicting rules', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  },

  calculatePriceWithRules: async (
    _parent,
    { input },
    context,
    _info
  ): Promise<PricingRuleCalculation> => {
    logger.info('Calculating single price with rules', { 
      countryId: input.countryId,
      numOfDays: input.numOfDays,
      regionId: input.regionId,
      paymentMethod: input.paymentMethod
    });
    
    try {
      const engine = getPricingEngineService(context);
      
      // Get bundle information from catalog
      const bundles = await context.dataSources.catalogue.searchPlans({
        country: input.countryId,
        duration: input.numOfDays
      });
      
      if (!bundles.bundles || bundles.bundles.length === 0) {
        throw new GraphQLError('No bundles found for the specified criteria', {
          extensions: { code: 'NO_BUNDLES_FOUND' }
        });
      }
      
      // Use the first matching bundle
      const bundle = bundles.bundles[0];
      
      // Create pricing context for the rule engine
      const pricingContext = PricingEngineService.createContext({
        availableBundles: [{
          id: bundle?.id || '',
          name: bundle?.esim_go_name || 'Bundle',
          cost: bundle?.price_cents || 0,
          duration: input.numOfDays,
          countryId: input.countryId,
          countryName: input.countryId, // Will be resolved later
          regionId: input.regionId || 'UNKNOWN',
          regionName: 'Unknown',
          group: bundle?.bundle_group || 'Standard Fixed',
          isUnlimited: bundle?.unlimited || bundle?.data_amount === -1,
          dataAmount: (bundle?.data_amount || 0).toString()
        }],
        requestedDuration: input.numOfDays,
        paymentMethod: input.paymentMethod || 'ISRAELI_CARD'
      });
      
      // Validate context
      const errors = engine.validateContext(pricingContext);
      if (errors.length > 0) {
        logger.warn('Invalid pricing context', { 
          countryId: input.countryId,
          errors 
        });
        throw new GraphQLError('Invalid pricing request', {
          extensions: { 
            code: 'BAD_USER_INPUT',
            errors 
          }
        });
      }
      
      // Calculate price
      const result = await engine.calculatePrice(pricingContext);
      
      logger.info('Single price calculated with rules', { 
        countryId: input.countryId,
        finalPrice: result.finalPrice,
        appliedRulesCount: result.appliedRules?.length || 0
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to calculate single price with rules', error as Error, {
        countryId: input.countryId,
        numOfDays: input.numOfDays
      });
      throw new GraphQLError('Failed to calculate pricing', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  },

  calculateBatchPricing: async (
    _parent,
    { requests },
    context,
    _info
  ): Promise<PricingRuleCalculation[]> => {
    logger.info('Calculating batch pricing', { 
      count: requests.length 
    });
    
    try {
      const engine = getPricingEngineService(context);
      const results: PricingRuleCalculation[] = [];
      
      for (const request of requests) {
        // Create pricing context from request
        const pricingContext = PricingEngineService.createContext({
          availableBundles: [{
            id: request.countryId, // Use countryId as bundle ID
            name: `${request.numOfDays} Day Bundle`,
            cost: 0, // Will be calculated by pricing engine
            duration: request.numOfDays,
            countryId: request.countryId,
            countryName: request.countryId,
            regionId: 'UNKNOWN',
            regionName: 'Unknown',
            group: 'Standard',
            isUnlimited: false,
            dataAmount: '0'
          }],
          requestedDuration: request.numOfDays,
          user: undefined, // CalculatePriceInput doesn't have userId
          paymentMethod: request.paymentMethod || 'ISRAELI_CARD'
        });
        
        // Validate context
        const errors = engine.validateContext(pricingContext);
        if (errors.length > 0) {
          logger.warn('Invalid pricing context', { 
            countryId: request.countryId,
            errors,
            request,
            pricingContext: {
              availableBundles: pricingContext.availableBundles?.length || 0,
              requestedDuration: pricingContext.requestedDuration
            }
          });
          throw new GraphQLError(`Invalid pricing request: ${errors.join(', ')}`, {
            extensions: { 
              code: 'BAD_USER_INPUT',
              errors 
            }
          });
        }
        
        // Calculate price
        const result = await engine.calculatePrice(pricingContext);
        results.push(result);
      }
      
      logger.info('Batch pricing calculated', { 
        count: results.length 
      });
      
      return results;
    } catch (error) {
      logger.error('Failed to calculate batch pricing', error as Error, {
        requestCount: requests.length,
        operationType: 'batch-pricing-calculation'
      });
      
      // Include the actual error message for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new GraphQLError(`Failed to calculate pricing: ${errorMessage}`, {
        extensions: { 
          code: 'INTERNAL_SERVER_ERROR',
          originalError: errorMessage
        }
      });
    }
  },

  simulatePricingRule: async (
    _parent,
    { rule, testContext },
    context,
    _info
  ): Promise<PricingRuleCalculation> => {
    logger.info('Simulating pricing rule', { 
      ruleName: rule.name,
      ruleType: rule.type
    });
    
    try {
      const engine = getPricingEngineService(context);
      
      // Create a temporary pricing context for simulation
      const pricingContext = PricingEngineService.createContext({
        availableBundles: [{
          id: testContext.bundleId || 'test-bundle',
          name: testContext.bundleName || 'Test Bundle',
          cost: testContext.cost || 0,
          duration: testContext.duration || 7,
          countryId: testContext.countryId || 'US',
          countryName: testContext.countryId,
          regionId: testContext.regionId || 'AMERICA',
          regionName: testContext.regionId || 'America',
          group: testContext.bundleGroup || 'Standard Fixed',
          isUnlimited: false, // Will be determined from bundle data
          dataAmount: 'Unknown' // Will be determined from bundle data
        }],
        requestedDuration: testContext.requestedDuration || testContext.duration || 7,
        paymentMethod: testContext.paymentMethod || 'ISRAELI_CARD',
        user: testContext.userId ? {
          id: testContext.userId,
          isNew: testContext.isNewUser || false,
          segment: 'STANDARD'
        } : undefined
      });
      
      // Create a new temporary engine instance with the test rule
      const tempEngine = new PricingRuleEngine();
      
      // Add the test rule to the temporary engine
      tempEngine.addRules([{
        ...rule,
        id: 'temp-test-rule',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]);
      
      // Calculate price with the test rule
      const result = await tempEngine.calculatePrice(pricingContext);
      
      logger.info('Pricing rule simulated', { 
        ruleName: rule.name,
        simulatedPrice: result.finalPrice
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to simulate pricing rule', error as Error, {
        ruleName: rule.name,
        ruleType: rule.type
      });
      throw new GraphQLError('Failed to simulate pricing rule', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  }
};

export const pricingRulesMutations: MutationResolvers = {
  createPricingRule: async (
    _parent,
    { input },
    context,
    _info
  ): Promise<PricingRule> => {
    logger.info('Creating pricing rule', { 
      name: input.name,
      type: input.type 
    });
    
    try {
      const rule = await context.repositories.pricingRules.createRule(input);
      
      // Reload rules in the engine
      const engine = getPricingEngineService(context);
      await engine.reloadRules();
      
      logger.info('Pricing rule created', { 
        id: rule.id,
        name: rule.name 
      });
      
      return rule;
    } catch (error) {
      logger.error('Failed to create pricing rule', error as Error, { input });
      throw new GraphQLError('Failed to create pricing rule', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  },

  updatePricingRule: async (
    _parent,
    { id, input },
    context,
    _info
  ): Promise<PricingRule> => {
    logger.info('Updating pricing rule', { id, input });
    
    try {
      const rule = await context.repositories.pricingRules.updateRule(id, input);
      
      // Reload rules in the engine
      const engine = getPricingEngineService(context);
      await engine.reloadRules();
      
      logger.info('Pricing rule updated', { 
        id: rule.id,
        name: rule.name 
      });
      
      return rule;
    } catch (error) {
      logger.error('Failed to update pricing rule', error as Error, { id, input });
      
      if (error instanceof Error && error.message.includes('not found')) {
        throw new GraphQLError('Pricing rule not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }
      
      // Allow system rule editing for admins - UI will show warnings
      
      throw new GraphQLError('Failed to update pricing rule', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  },

  deletePricingRule: async (
    _parent,
    { id },
    context,
    _info
  ): Promise<boolean> => {
    logger.info('Deleting pricing rule', { id });
    
    try {
      const result = await context.repositories.pricingRules.delete(id);
      
      if (result.success) {
        // Reload rules in the engine
        const engine = getPricingEngineService(context);
        await engine.reloadRules();
        
        logger.info('Pricing rule deleted', { id });
      } else {
        logger.warn('Pricing rule not found for deletion', { id });
      }
      
      return result.success;
    } catch (error) {
      logger.error('Failed to delete pricing rule', error as Error, { id });
      
      if (error instanceof Error && error.message.includes('not editable')) {
        throw new GraphQLError('System rules cannot be deleted', {
          extensions: { code: 'FORBIDDEN' }
        });
      }
      
      throw new GraphQLError('Failed to delete pricing rule', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  },

  togglePricingRule: async (
    _parent,
    { id },
    context,
    _info
  ): Promise<PricingRule> => {
    logger.info('Toggling pricing rule', { id });
    
    try {
      const rule = await context.repositories.pricingRules.toggleActive(id);
      
      // Reload rules in the engine
      const engine = getPricingEngineService(context);
      await engine.reloadRules();
      
      logger.info('Pricing rule toggled', { 
        id: rule.id,
        isActive: rule.isActive 
      });
      
      return rule;
    } catch (error) {
      logger.error('Failed to toggle pricing rule', error as Error, { id });
      
      if (error instanceof Error && error.message.includes('not found')) {
        throw new GraphQLError('Pricing rule not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }
      
      throw new GraphQLError('Failed to toggle pricing rule', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  },

  clonePricingRule: async (
    _parent,
    { id, newName },
    context,
    _info
  ): Promise<PricingRule> => {
    logger.info('Cloning pricing rule', { id, newName });
    
    try {
      const rule = await context.repositories.pricingRules.cloneRule(id, newName);
      
      // Reload rules in the engine
      const engine = getPricingEngineService(context);
      await engine.reloadRules();
      
      logger.info('Pricing rule cloned', { 
        originalId: id,
        newId: rule.id,
        newName: rule.name 
      });
      
      return rule;
    } catch (error) {
      logger.error('Failed to clone pricing rule', error as Error, { id, newName });
      
      if (error instanceof Error && error.message.includes('not found')) {
        throw new GraphQLError('Original pricing rule not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }
      
      throw new GraphQLError('Failed to clone pricing rule', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  },

  reorderPricingRules: async (
    _parent,
    { updates },
    context,
    _info
  ): Promise<PricingRule[]> => {
    logger.info('Reordering pricing rules', { 
      count: updates.length 
    });
    
    try {
      const rules = await context.repositories.pricingRules.bulkUpdatePriorities(updates);
      
      // Reload rules in the engine
      const engine = getPricingEngineService(context);
      await engine.reloadRules();
      
      logger.info('Pricing rules reordered', { 
        count: rules.length 
      });
      
      return rules;
    } catch (error) {
      logger.error('Failed to reorder pricing rules', error as Error);
      throw new GraphQLError('Failed to reorder pricing rules', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  }
};

// Export combined resolvers
export const pricingRulesResolvers = {
  Query: pricingRulesQueries,
  Mutation: pricingRulesMutations
};