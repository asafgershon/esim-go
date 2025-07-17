import { supabaseAdmin } from '../../context/supabase-auth';
import type { Database } from '../../database.types';
import { GraphQLError } from 'graphql';
import { z } from 'zod';
import { BaseSupabaseRepository } from '../base-supabase.repository';

type PricingConfigRow = Database['public']['Tables']['pricing_configurations']['Row'];
type PricingConfigInsert = Database['public']['Tables']['pricing_configurations']['Insert'];
type PricingConfigUpdate = Database['public']['Tables']['pricing_configurations']['Update'];

export interface PricingConfigurationRule {
  id: string;
  name: string;
  description: string;
  countryId?: string;
  regionId?: string;
  duration?: number;
  bundleGroup?: string;
  costSplitPercent: number;
  discountRate: number;
  processingRate: number;
  isActive: boolean;
  priority: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export class PricingConfigRepository extends BaseSupabaseRepository<
  PricingConfigRow,
  PricingConfigInsert,
  PricingConfigUpdate
> {
  constructor() {
    super('pricing_configurations');
  }

  protected async validateInsert(data: PricingConfigInsert): Promise<void> {
    if (data.cost_split_percent < 0 || data.cost_split_percent > 1) {
      throw new GraphQLError('Cost split percent must be between 0 and 1');
    }
    if (data.discount_rate < 0 || data.discount_rate > 1) {
      throw new GraphQLError('Discount rate must be between 0 and 1');
    }
    if (data.processing_rate < 0 || data.processing_rate > 1) {
      throw new GraphQLError('Processing rate must be between 0 and 1');
    }
  }

  protected async validateUpdate(data: PricingConfigUpdate): Promise<void> {
    if (data.cost_split_percent !== undefined && (data.cost_split_percent < 0 || data.cost_split_percent > 1)) {
      throw new GraphQLError('Cost split percent must be between 0 and 1');
    }
    if (data.discount_rate !== undefined && (data.discount_rate < 0 || data.discount_rate > 1)) {
      throw new GraphQLError('Discount rate must be between 0 and 1');
    }
    if (data.processing_rate !== undefined && (data.processing_rate < 0 || data.processing_rate > 1)) {
      throw new GraphQLError('Processing rate must be between 0 and 1');
    }
  }

  /**
   * Get all active pricing configurations ordered by priority
   */
  async getActiveConfigurations(): Promise<PricingConfigurationRule[]> {
    const { data: configs, error } = await this.supabase
      .from('pricing_configurations')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false }); // Higher priority first

    if (error) {
      this.handleError(error, 'fetching active pricing configurations');
    }

    return (configs || []).map(this.mapToRule);
  }

  /**
   * Get all pricing configurations (active and inactive)
   */
  async getAllConfigurations(): Promise<PricingConfigurationRule[]> {
    const { data: configs, error } = await this.supabase
      .from('pricing_configurations')
      .select('*')
      .order('priority', { ascending: false });

    if (error) {
      this.handleError(error, 'fetching all pricing configurations');
    }

    return (configs || []).map(this.mapToRule);
  }

  /**
   * Find the best matching configuration for a bundle
   */
  async findMatchingConfiguration(
    countryId: string,
    regionId: string,
    duration: number,
    bundleGroup?: string
  ): Promise<PricingConfigurationRule | null> {
    const activeConfigs = await this.getActiveConfigurations();

    // Find the highest priority configuration that matches
    for (const config of activeConfigs) {
      if (this.configMatches(config, countryId, regionId, duration, bundleGroup)) {
        return config;
      }
    }

    return null;
  }

  /**
   * Create or update a pricing configuration
   */
  async upsertConfiguration(
    input: {
      id?: string;
      name: string;
      description: string;
      countryId?: string;
      regionId?: string;
      duration?: number;
      bundleGroup?: string;
      costSplitPercent: number;
      discountRate: number;
      processingRate: number;
      isActive: boolean;
      priority: number;
    },
    userId: string
  ): Promise<PricingConfigurationRule> {
    const now = new Date().toISOString();

    const configData = {
      name: input.name,
      description: input.description,
      country_id: input.countryId,
      region_id: input.regionId,
      duration: input.duration,
      bundle_group: input.bundleGroup,
      cost_split_percent: input.costSplitPercent,
      discount_rate: input.discountRate,
      processing_rate: input.processingRate,
      is_active: input.isActive,
      priority: input.priority,
      updated_at: now,
    };

    if (input.id) {
      // Update existing
      const updated = await this.update(input.id, configData);
      return this.mapToRule(updated);
    } else {
      // Create new
      const created = await this.create({
        ...configData,
        created_by: userId,
        created_at: now,
      });
      return this.mapToRule(created);
    }
  }

  /**
   * Check if a configuration matches the given bundle parameters
   */
  private configMatches(
    config: PricingConfigurationRule,
    countryId: string,
    regionId: string,
    duration: number,
    bundleGroup?: string
  ): boolean {
    // Check country match (null means applies to all countries)
    if (config.countryId && config.countryId !== countryId) {
      return false;
    }

    // Check region match (null means applies to all regions)
    if (config.regionId && config.regionId !== regionId) {
      return false;
    }

    // Check duration match (null means applies to all durations)
    if (config.duration && config.duration !== duration) {
      return false;
    }

    // Check bundle group match (null means applies to all bundle groups)
    if (config.bundleGroup && config.bundleGroup !== bundleGroup) {
      return false;
    }

    return true;
  }

  /**
   * Map database row to domain object
   */
  private mapToRule(row: PricingConfigRow): PricingConfigurationRule {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      countryId: row.country_id,
      regionId: row.region_id,
      duration: row.duration,
      bundleGroup: row.bundle_group,
      costSplitPercent: row.cost_split_percent,
      discountRate: row.discount_rate,
      processingRate: row.processing_rate,
      isActive: row.is_active,
      priority: row.priority,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}