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
      
      if (error instanceof Error && error.message.includes('not editable')) {
        throw new GraphQLError('System rules cannot be edited', {
          extensions: { code: 'FORBIDDEN' }
        });
      }
      
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