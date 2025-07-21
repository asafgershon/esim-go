import { GraphQLError } from "graphql";
import type { Database } from "../../database.types";
import type { UpdatePricingConfigurationInput } from "../../types";
import { BaseSupabaseRepository } from "../base-supabase.repository";

type PricingConfigRow =
  Database["public"]["Tables"]["pricing_configurations"]["Row"];
type PricingConfigInsert =
  Database["public"]["Tables"]["pricing_configurations"]["Insert"];
type PricingConfigUpdate =
  Database["public"]["Tables"]["pricing_configurations"]["Update"];

export interface PricingConfigurationRule {
  id: string;
  name: string;
  description: string;
  countryId?: string;
  regionId?: string;
  duration?: number;
  bundleGroup?: string;
  discountRate: number;
  markupAmount?: number;
  discountPerDay?: number;
  isActive: boolean;
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
    super("pricing_configurations");
  }

  protected async validateInsert(data: PricingConfigInsert): Promise<void> {
    if (data.discount_rate < 0 || data.discount_rate > 1) {
      throw new GraphQLError("Discount rate must be between 0 and 1");
    }
    if (data.discount_per_day !== undefined && (data.discount_per_day < 0 || data.discount_per_day > 1)) {
      throw new GraphQLError("Discount per day must be between 0 and 1");
    }
  }

  protected async validateUpdate(data: PricingConfigUpdate): Promise<void> {
    if (
      data.discount_rate !== undefined &&
      (data.discount_rate < 0 || data.discount_rate > 1)
    ) {
      throw new GraphQLError("Discount rate must be between 0 and 1");
    }
    if (data.discount_per_day !== undefined && (data.discount_per_day < 0 || data.discount_per_day > 1)) {
      throw new GraphQLError("Discount per day must be between 0 and 1");
    }
  }

  /**
   * Get all active pricing configurations
   */
  async getActiveConfigurations(): Promise<PricingConfigurationRule[]> {
    const { data: configs, error } = await this.supabase
      .from("pricing_configurations")
      .select("*")
      .eq("is_active", true)
      .order('created_at', { ascending: false }) // Most recent first

    if (error) {
      this.handleError(error, "fetching active pricing configurations");
    }

    return (configs || []).map(this.mapToRule);
  }

  /**
   * Get all pricing configurations (active and inactive)
   */
  async getAllConfigurations(): Promise<PricingConfigurationRule[]> {
    const { data: configs, error } = await this.supabase
      .from("pricing_configurations")
      .select("*")
      .order('created_at', { ascending: false }) // Most recent first

    if (error) {
      this.handleError(error, "fetching all pricing configurations");
    }

    return (configs || []).map(this.mapToRule);
  }

  /**
   * Find the best matching configuration for a bundle using hierarchy:
   * 1. Bundle-specific (country + duration + bundle_group)
   * 2. Country-specific (country only)
   * 3. Default (no filters)
   */
  async findMatchingConfiguration(
    countryId: string,
    regionId: string,
    duration: number,
    bundleGroup?: string
  ): Promise<PricingConfigurationRule | null> {
    const activeConfigs = await this.getActiveConfigurations();

    // 1. Try bundle-specific match (most specific)
    const bundleSpecific = activeConfigs.find(config => 
      config.countryId === countryId &&
      config.duration === duration &&
      config.bundleGroup === bundleGroup
    );
    
    if (bundleSpecific) {
      return bundleSpecific;
    }

    // 2. Try country-specific match (medium specific)
    const countrySpecific = activeConfigs.find(config => 
      config.countryId === countryId &&
      !config.duration && // No duration specified (applies to all)
      !config.bundleGroup // No bundle group specified (applies to all)
    );
    
    if (countrySpecific) {
      return countrySpecific;
    }

    // 3. Try default/global configuration (fallback)
    const defaultConfig = activeConfigs.find(config => 
      !config.countryId && // No country specified (global)
      !config.duration && // No duration specified (applies to all)
      !config.bundleGroup // No bundle group specified (applies to all)
    );
    
    return defaultConfig || null;
  }

  /**
   * Create or update a pricing configuration
   */
  async upsertConfiguration(
    input: UpdatePricingConfigurationInput,
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
      discount_rate: input.discountRate,
      markup_amount: input.markupAmount,
      discount_per_day: input.discountPerDay,
      is_active: input.isActive,
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
   * Check if a country has any active custom discount configuration
   */
  async hasActiveConfigForCountry(countryId: string): Promise<boolean> {
    const { data: configs, error } = await this.supabase
      .from("pricing_configurations")
      .select("id")
      .eq("country_id", countryId)
      .eq("is_active", true)
      .limit(1);

    if (error) {
      this.handleError(
        error,
        `checking active configurations for country ${countryId}`
      );
    }

    return (configs || []).length > 0;
  }

  /**
   * Map database row to domain object
   */
  private mapToRule(row: PricingConfigRow): PricingConfigurationRule {
    return {
      id: row.id,
      name: row.name,
      description: row.description || "",
      countryId: row.country_id || "",
      regionId: row.region_id || "",
      duration: row.duration || 0,
      bundleGroup: row.bundle_group || "",
      discountRate: row.discount_rate,
      markupAmount: row.markup_amount,
      discountPerDay: row.discount_per_day,
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: row.created_at || "",
      updatedAt: row.updated_at || "",
    };
  }
}
