import { GraphQLError } from 'graphql';
import { createLogger } from '../lib/logger';
import type {
  MutationResolvers,
  PricingRule,
  PricingRuleFilter,
  QueryResolvers
} from '../types';

const logger = createLogger({ 
  component: 'PricingRulesResolvers',
  operationType: 'graphql-resolver'
});

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
  }

  // Note: Pricing calculation methods (calculatePriceWithRules, calculateBatchPricing, simulatePricingRule)
  // have been moved to unified pricing-resolvers.ts to eliminate duplication and use the new pricing engine pipeline
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
      category: input.category 
    });
    
    try {
      const userId = context.auth?.user?.id;
      const rule = await context.repositories.pricingRules.createRule(input, userId);
      
      logger.info('Pricing rule created successfully', { 
        id: rule.id,
        name: rule.name 
      });
      
      // Rules will be automatically loaded on next pricing calculation
      logger.info('Pricing rule will be applied on next calculation');
      
      return rule;
    } catch (error) {
      logger.error('Failed to create pricing rule', error as Error, {
        name: input.name,
        category: input.category,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      throw new GraphQLError('Failed to create pricing rule', {
        extensions: { 
          code: 'INTERNAL_SERVER_ERROR',
          originalError: error instanceof Error ? error.message : String(error)
        }
      });
    }
  },

  updatePricingRule: async (
    _parent,
    { id, input },
    context,
    _info
  ): Promise<PricingRule> => {
    logger.info('Updating pricing rule', { 
      id,
      name: input.name,
      category: input.category 
    });
    
    try {
      const rule = await context.repositories.pricingRules.updateRule(id, input);
      
      // Rules will be automatically loaded on next pricing calculation
      
      logger.info('Pricing rule updated successfully', { 
        id: rule.id,
        name: rule.name 
      });
      
      return rule;
    } catch (error) {
      logger.error('Failed to update pricing rule', error as Error, {
        id,
        name: input.name
      });
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
      await context.repositories.pricingRules.delete(id);
      
      // Rules will be automatically loaded on next pricing calculation
      
      logger.info('Pricing rule deleted successfully', { id });
      
      return true;
    } catch (error) {
      logger.error('Failed to delete pricing rule', error as Error, { id });
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
    logger.info('Toggling pricing rule active status', { id });
    
    try {
      const rule = await context.repositories.pricingRules.toggleActive(id);
      
      // Rules will be automatically loaded on next pricing calculation
      logger.info('Pricing rule status will be applied on next calculation');
      
      logger.info('Pricing rule toggled successfully', { 
        id: rule.id,
        isActive: rule.isActive 
      });
      
      return rule;
    } catch (error) {
      logger.error('Failed to toggle pricing rule', error as Error, { id });
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
      
      // Rules will be automatically loaded on next pricing calculation
      logger.info('Cloned rule will be applied on next calculation');
      
      logger.info('Pricing rule cloned successfully', { 
        id: rule.id,
        name: rule.name 
      });
      
      return rule;
    } catch (error) {
      logger.error('Failed to clone pricing rule', error as Error, { id, newName });
      throw new GraphQLError('Failed to clone pricing rule', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  }
};

export const pricingRulesResolvers = {
  Query: pricingRulesQueries,
  Mutation: pricingRulesMutations
};