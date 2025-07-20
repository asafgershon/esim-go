import { GraphQLError } from 'graphql';
import type { Context } from '../context/types';
import type { Resolvers } from '../types';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '../lib/logger';

const logger = createLogger({ component: 'markup-config-resolvers' });

export const markupConfigResolvers: Resolvers = {
  Query: {
    markupConfig: async (_, __, context: Context) => {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
          .from('pricing_markup_config')
          .select('*')
          .order('bundle_group, duration_days');

        if (error) {
          logger.error('Failed to fetch markup configuration', error as Error, {
            operationType: 'markup-config-query'
          });
          throw new GraphQLError('Failed to fetch markup configuration', {
            extensions: { code: 'DATABASE_ERROR' }
          });
        }

        return data.map(item => ({
          id: item.id,
          bundleGroup: item.bundle_group,
          durationDays: item.duration_days,
          markupAmount: item.markup_amount,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));
      } catch (error) {
        logger.error('Error in markupConfig query', error as Error, {
          operationType: 'markup-config-query-error'
        });
        throw error;
      }
    },
  },

  Mutation: {
    createMarkupConfig: async (_, { input }, context: Context) => {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check for duplicate combination
        const { data: existing } = await supabase
          .from('pricing_markup_config')
          .select('id')
          .eq('bundle_group', input.bundleGroup)
          .eq('duration_days', input.durationDays)
          .single();

        if (existing) {
          throw new GraphQLError(
            `Markup configuration already exists for ${input.bundleGroup} with ${input.durationDays} days`,
            { extensions: { code: 'DUPLICATE_ENTRY' } }
          );
        }

        const { data, error } = await supabase
          .from('pricing_markup_config')
          .insert({
            bundle_group: input.bundleGroup,
            duration_days: input.durationDays,
            markup_amount: input.markupAmount,
          })
          .select()
          .single();

        if (error) {
          logger.error('Failed to create markup configuration', error as Error, {
            input,
            operationType: 'markup-config-create'
          });
          throw new GraphQLError('Failed to create markup configuration', {
            extensions: { code: 'DATABASE_ERROR' }
          });
        }

        logger.info('Markup configuration created', {
          id: data.id,
          bundleGroup: input.bundleGroup,
          durationDays: input.durationDays,
          markupAmount: input.markupAmount,
          operationType: 'markup-config-created'
        });

        return {
          id: data.id,
          bundleGroup: data.bundle_group,
          durationDays: data.duration_days,
          markupAmount: data.markup_amount,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      } catch (error) {
        logger.error('Error in createMarkupConfig mutation', error as Error, {
          input,
          operationType: 'markup-config-create-error'
        });
        throw error;
      }
    },

    updateMarkupConfig: async (_, { id, input }, context: Context) => {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Build update object with only provided fields
        const updateData: any = {};
        if (input.bundleGroup !== undefined) updateData.bundle_group = input.bundleGroup;
        if (input.durationDays !== undefined) updateData.duration_days = input.durationDays;
        if (input.markupAmount !== undefined) updateData.markup_amount = input.markupAmount;
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('pricing_markup_config')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          logger.error('Failed to update markup configuration', error as Error, {
            id,
            input,
            operationType: 'markup-config-update'
          });
          throw new GraphQLError('Failed to update markup configuration', {
            extensions: { code: 'DATABASE_ERROR' }
          });
        }

        if (!data) {
          throw new GraphQLError('Markup configuration not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        logger.info('Markup configuration updated', {
          id,
          updates: input,
          operationType: 'markup-config-updated'
        });

        return {
          id: data.id,
          bundleGroup: data.bundle_group,
          durationDays: data.duration_days,
          markupAmount: data.markup_amount,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      } catch (error) {
        logger.error('Error in updateMarkupConfig mutation', error as Error, {
          id,
          input,
          operationType: 'markup-config-update-error'
        });
        throw error;
      }
    },

    deleteMarkupConfig: async (_, { id }, context: Context) => {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabase
          .from('pricing_markup_config')
          .delete()
          .eq('id', id);

        if (error) {
          logger.error('Failed to delete markup configuration', error as Error, {
            id,
            operationType: 'markup-config-delete'
          });
          throw new GraphQLError('Failed to delete markup configuration', {
            extensions: { code: 'DATABASE_ERROR' }
          });
        }

        logger.info('Markup configuration deleted', {
          id,
          operationType: 'markup-config-deleted'
        });

        return {
          success: true,
          message: 'Markup configuration deleted successfully',
        };
      } catch (error) {
        logger.error('Error in deleteMarkupConfig mutation', error as Error, {
          id,
          operationType: 'markup-config-delete-error'
        });
        throw error;
      }
    },
  },
};