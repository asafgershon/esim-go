import type { GraphQLResolveInfo } from 'graphql';
import type { Context } from '../apollo-context';
import type { 
  QueryResolvers,
  MutationResolvers,
  PricingRule,
  CreatePricingRuleInput,
  UpdatePricingRuleInput,
  PricingRuleFilter,
  PricingRuleCalculation
} from '../types';
import { PricingRulesRepository } from '../repositories/pricing-rules/pricing-rules.repository';
import { PricingEngineService } from '../services/pricing-engine.service';
import { createLogger } from '../lib/logger';
import { GraphQLError } from 'graphql';

const logger = createLogger({ 
  component: 'PricingRulesResolvers',
  operationType: 'graphql-resolver'
});

// Singleton instance of pricing engine service
let pricingEngineService: PricingEngineService | null = null;

const getPricingEngineService = (context: Context): PricingEngineService => {
  if (!pricingEngineService) {
    pricingEngineService = new PricingEngineService(context.supabase);
    // Initialize in background
    pricingEngineService.initialize().catch(error => {
      logger.error('Failed to initialize pricing engine', error);
    });
  }
  return pricingEngineService;
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
      const repository = new PricingRulesRepository(context.supabase);
      return await repository.findAll(filter as PricingRuleFilter | undefined);
    } catch (error) {
      logger.error('Failed to fetch pricing rules', error, { filter });
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
      const repository = new PricingRulesRepository(context.supabase);
      const rule = await repository.findById(id);
      
      if (!rule) {
        logger.warn('Pricing rule not found', { id });
      }
      
      return rule;
    } catch (error) {
      logger.error('Failed to fetch pricing rule', error, { id });
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
      const repository = new PricingRulesRepository(context.supabase);
      return await repository.findActiveRules();
    } catch (error) {
      logger.error('Failed to fetch active pricing rules', error);
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
      const repository = new PricingRulesRepository(context.supabase);
      return await repository.getConflictingRules(ruleId);
    } catch (error) {
      logger.error('Failed to find conflicting rules', error, { ruleId });
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
        bundle: {
          id: bundle.name || `${input.countryId}-${input.numOfDays}d`,
          name: bundle.name || 'Bundle',
          cost: bundle.price || 0,
          duration: input.numOfDays,
          countryId: input.countryId,
          countryName: input.countryId, // Will be resolved later
          regionId: input.regionId || bundle.baseCountry?.region || 'UNKNOWN',
          regionName: input.regionId || bundle.baseCountry?.region || 'Unknown',
          group: bundle.bundleGroup || 'Standard Fixed',
          isUnlimited: bundle.unlimited || bundle.dataAmount === -1,
          dataAmount: bundle.dataAmount || 0
        },
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
      logger.error('Failed to calculate single price with rules', error, {
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
          bundle: {
            id: request.bundleId,
            name: request.bundleName || 'Bundle',
            cost: request.cost,
            duration: request.duration,
            countryId: request.countryId,
            countryName: request.countryName || request.countryId,
            regionId: request.regionId || 'UNKNOWN',
            regionName: request.regionName || 'Unknown',
            group: request.bundleGroup || 'Standard',
            isUnlimited: request.isUnlimited || false,
            dataAmount: request.dataAmount || 'Unknown'
          },
          user: request.userId ? {
            id: request.userId,
            segment: request.userSegment
          } : undefined,
          paymentMethod: request.paymentMethod,
          requestedDuration: request.requestedDuration
        });
        
        // Validate context
        const errors = engine.validateContext(pricingContext);
        if (errors.length > 0) {
          logger.warn('Invalid pricing context', { 
            bundleId: request.bundleId,
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
        results.push(result);
      }
      
      logger.info('Batch pricing calculated', { 
        count: results.length 
      });
      
      return results;
    } catch (error) {
      logger.error('Failed to calculate batch pricing', error);
      throw new GraphQLError('Failed to calculate pricing', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
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
        bundle: {
          id: testContext.bundleId || 'test-bundle',
          name: testContext.bundleName || 'Test Bundle',
          cost: testContext.baseCost || 10.0,
          duration: testContext.duration || 7,
          countryId: testContext.countryId || 'US',
          countryName: testContext.countryName || 'United States',
          regionId: testContext.regionId || 'AMERICA',
          regionName: testContext.regionName || 'America',
          group: testContext.bundleGroup || 'Standard Fixed',
          isUnlimited: testContext.isUnlimited || false,
          dataAmount: testContext.dataAmount || 1024
        },
        paymentMethod: testContext.paymentMethod || 'ISRAELI_CARD',
        user: testContext.userId ? {
          id: testContext.userId,
          segment: testContext.userSegment || 'STANDARD'
        } : undefined
      });
      
      // Simulate the rule by temporarily adding it to the engine
      const result = await engine.simulateRule(rule, pricingContext);
      
      logger.info('Pricing rule simulated', { 
        ruleName: rule.name,
        simulatedPrice: result.finalPrice
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to simulate pricing rule', error, {
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
      const repository = new PricingRulesRepository(context.supabase);
      const rule = await repository.create(input);
      
      // Reload rules in the engine
      const engine = getPricingEngineService(context);
      await engine.reloadRules();
      
      logger.info('Pricing rule created', { 
        id: rule.id,
        name: rule.name 
      });
      
      return rule;
    } catch (error) {
      logger.error('Failed to create pricing rule', error, { input });
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
      const repository = new PricingRulesRepository(context.supabase);
      const rule = await repository.update(id, input);
      
      // Reload rules in the engine
      const engine = getPricingEngineService(context);
      await engine.reloadRules();
      
      logger.info('Pricing rule updated', { 
        id: rule.id,
        name: rule.name 
      });
      
      return rule;
    } catch (error) {
      logger.error('Failed to update pricing rule', error, { id, input });
      
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
      const repository = new PricingRulesRepository(context.supabase);
      const deleted = await repository.delete(id);
      
      if (deleted) {
        // Reload rules in the engine
        const engine = getPricingEngineService(context);
        await engine.reloadRules();
        
        logger.info('Pricing rule deleted', { id });
      } else {
        logger.warn('Pricing rule not found for deletion', { id });
      }
      
      return deleted;
    } catch (error) {
      logger.error('Failed to delete pricing rule', error, { id });
      
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
      const repository = new PricingRulesRepository(context.supabase);
      const rule = await repository.toggleActive(id);
      
      // Reload rules in the engine
      const engine = getPricingEngineService(context);
      await engine.reloadRules();
      
      logger.info('Pricing rule toggled', { 
        id: rule.id,
        isActive: rule.isActive 
      });
      
      return rule;
    } catch (error) {
      logger.error('Failed to toggle pricing rule', error, { id });
      
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
      const repository = new PricingRulesRepository(context.supabase);
      const rule = await repository.cloneRule(id, newName);
      
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
      logger.error('Failed to clone pricing rule', error, { id, newName });
      
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
      const repository = new PricingRulesRepository(context.supabase);
      const rules = await repository.bulkUpdatePriorities(updates);
      
      // Reload rules in the engine
      const engine = getPricingEngineService(context);
      await engine.reloadRules();
      
      logger.info('Pricing rules reordered', { 
        count: rules.length 
      });
      
      return rules;
    } catch (error) {
      logger.error('Failed to reorder pricing rules', error);
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