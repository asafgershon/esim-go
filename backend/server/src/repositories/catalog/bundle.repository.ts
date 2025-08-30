import { type Database } from "@hiilo/supabase";
import { createLogger } from "../../lib/logger";
import { BaseSupabaseRepository } from "../base-supabase.repository";
import type { Provider } from "../../types";

// Database types from Supabase
type CatalogBundle = Database["public"]["Tables"]["catalog_bundles"]["Row"];
type CatalogBundleInsert =
  Database["public"]["Tables"]["catalog_bundles"]["Insert"];
type CatalogBundleUpdate =
  Database["public"]["Tables"]["catalog_bundles"]["Update"];

// RPC function types (these should be in your database.types.ts from Supabase)
export type GetBundlesByCountriesResponse =
  Database["public"]["Functions"]["get_bundles_by_countries"]["Returns"];
export type GetBundlesByRegionsResponse =
  Database["public"]["Functions"]["get_bundles_by_regions"]["Returns"];
export type GetBundlesByGroupsResponse =
  Database["public"]["Functions"]["get_bundles_by_groups"]["Returns"];
export type GetBundlesForCountryResponse =
  Database["public"]["Functions"]["get_bundles_for_country"]["Returns"];
export type GetBundlesForRegionResponse =
  Database["public"]["Functions"]["get_bundles_for_region"]["Returns"];
export type GetBundlesForGroupResponse =
  Database["public"]["Functions"]["get_bundles_for_group"]["Returns"];

export interface SearchCatalogCriteria {
  countries?: string[];
  groups?: string[];
  regions?: string[];
  minValidityInDays?: number;
  maxValidityInDays?: number;
  isUnlimited?: boolean;
  dataAmountMB?: number;
  minPrice?: number;
  maxPrice?: number;
  name?: string;
  limit?: number;
  offset?: number;
  orderBy?: "price" | "validity" | "data" | "name";
  orderDirection?: "asc" | "desc";
}

export class BundleRepository extends BaseSupabaseRepository<
  CatalogBundle & { id?: string },
  CatalogBundleInsert,
  CatalogBundleUpdate
> {
  private logger = createLogger({
    component: "BundleRepository",
    operationType: "catalog-persistence",
  });

  constructor() {
    super("catalog_bundles");
  }

  // ========== CRUD Operations ==========

  async getById(id: string): Promise<CatalogBundle | null> {
    const { data, error } = await this.supabase
      .from("catalog_bundles")
      .select("*")
      .eq("esim_go_name", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      this.logger.error("Failed to get bundle by id", error, { id });
      throw error;
    }

    return data;
  }

  async search(criteria: SearchCatalogCriteria): Promise<{
    data: CatalogBundle[];
    count: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    const {
      countries,
      groups,
      regions,
      minValidityInDays,
      maxValidityInDays,
      isUnlimited,
      dataAmountMB,
      minPrice,
      maxPrice,
      name,
      limit = 50,
      offset = 0,
      orderBy = "price",
      orderDirection = "asc",
    } = criteria;

    let query = this.supabase
      .from("catalog_bundles")
      .select("*", { count: "exact" });

    // Apply filters
    if (name) {
      query = query.eq("esim_go_name", name);
    }

    if (countries?.length) {
      console.log("Bundle repository: Searching for countries:", countries);
      query = query.contains("countries", countries);
    }

    if (groups?.length) {
      query = query.contains("groups", groups);
    }

    if (regions?.length) {
      query = query.in("region", regions);
    }

    if (minValidityInDays !== undefined) {
      query = query.gte("validity_in_days", minValidityInDays);
    }

    if (maxValidityInDays !== undefined) {
      query = query.lte("validity_in_days", maxValidityInDays);
    }

    if (isUnlimited !== undefined) {
      query = query.eq("is_unlimited", isUnlimited);
    }

    if (dataAmountMB !== undefined) {
      query = query.eq("data_amount_mb", dataAmountMB);
    }

    if (minPrice !== undefined) {
      query = query.gte("price", minPrice);
    }

    if (maxPrice !== undefined) {
      query = query.lte("price", maxPrice);
    }

    // Apply ordering
    const orderColumn = {
      price: "price",
      validity: "validity_in_days",
      data: "data_amount_mb",
      name: "esim_go_name",
    }[orderBy];

    query = query.order(orderColumn, { ascending: orderDirection === "asc" });

    // Apply pagination
    const { data, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      this.logger.error("Failed to search bundles", error, { criteria });
      throw error;
    }

    // Debug logging
    console.log("Bundle repository search completed:", {
      criteriaCountries: criteria.countries,
      resultCount: data?.length || 0,
      totalCount: count || 0,
      sampleBundles: data?.slice(0, 2).map(b => ({
        name: b.esim_go_name,
        countries: b.countries,
        region: b.region
      }))
    });

    return {
      data: data || [],
      count: count || 0,
      hasNextPage: offset + limit < (count || 0),
      hasPreviousPage: offset > 0,
    };
  }

  // ========== Filter Options ==========

  async getGroups(): Promise<string[]> {
    const { data, error } = await this.supabase.rpc(
      "get_unique_groups_from_bundles"
    );

    if (error) {
      this.logger.error("Error fetching groups:", error);
      throw error;
    }

    return data || [];
  }

  async getCountries(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("bundles_by_country")
      .select("country_code")
      .order("country_code");

    if (error) {
      this.logger.error("Failed to get countries", error);
      throw error;
    }

    // Deduplicate and return
    return [...new Set(data?.map((row) => row.country_code || "") || [])];
  }

  async getRegions(): Promise<string[]> {
    const { data, error } = await this.supabase.rpc("get_unique_regions");

    if (error) {
      this.logger.error("Failed to get regions", error);
      throw error;
    }

    return data || [];
  }

  // ========== Aggregation Methods ==========

  async byCountries() {
    const { data, error } = await this.supabase.rpc("get_bundles_by_countries");

    if (error) {
      this.logger.error("Error fetching bundles by countries", error);
      throw error;
    }

    return data;
  }

  async byCountry(countryCode: string) {
    const { data, error } = await this.supabase.rpc("get_bundles_for_country", {
      country_param: countryCode,
    });

    if (error) {
      this.logger.error("Failed to get bundles for country", error, {
        countryCode,
      });
      throw error;
    }

    return data;
  }

  async byRegions() {
    const { data, error } = await this.supabase.rpc("get_bundles_by_regions");

    if (error) {
      this.logger.error("Failed to get bundles by regions", error);
      throw error;
    }

    return data;
  }

  async byRegion(region: string) {
    const { data, error } = await this.supabase.rpc("get_bundles_for_region", {
      region_param: region,
    });

    if (error) {
      this.logger.error("Failed to get bundles for region", error, { region });
      throw error;
    }

    return data;
  }

  async byGroups() {
    const { data, error } = await this.supabase.rpc("get_bundles_by_groups");

    if (error) {
      this.logger.error("Failed to get bundles by groups", error);
      throw error;
    }

    return data;
  }

  async byGroup(group: string) {
    const { data, error } = await this.supabase.rpc("get_bundles_for_group", {
      group_param: group,
    });

    if (error) {
      this.logger.error("Failed to get bundles for group", error, { group });
      throw error;
    }

    return data;
  }

  // ========== Data Type and Duration Aggregations ==========
  
  async getDataTypes(): Promise<Array<{
    label: string;
    value: string;
    isUnlimited: boolean;
    minDataMB?: number;
    maxDataMB?: number;
  }>> {
    try {
      // Get aggregated data for limited bundles
      const { data: limitedData, error: limitedError } = await this.supabase
        .from('catalog_bundles')
        .select('data_amount_mb')
        .eq('is_unlimited', false)
        .not('data_amount_mb', 'is', null);

      if (limitedError) throw limitedError;

      // Check if we have unlimited bundles
      const { count: unlimitedCount, error: unlimitedError } = await this.supabase
        .from('catalog_bundles')
        .select('*', { count: 'exact', head: true })
        .eq('is_unlimited', true);

      if (unlimitedError) throw unlimitedError;

      const dataTypes = [];

      // Add unlimited type if we have unlimited bundles
      if (unlimitedCount && unlimitedCount > 0) {
        dataTypes.push({
          label: "Unlimited",
          value: "unlimited",
          isUnlimited: true
        });
      }

      // Add limited type if we have limited bundles
      if (limitedData && limitedData.length > 0) {
        const dataAmounts = limitedData.map(d => d.data_amount_mb).filter(d => d !== null);
        const minDataMB = Math.min(...dataAmounts);
        const maxDataMB = Math.max(...dataAmounts);

        dataTypes.push({
          label: "Limited",
          value: "limited",
          isUnlimited: false,
          minDataMB,
          maxDataMB
        });
      }

      return dataTypes;
    } catch (error) {
      this.logger.error('Failed to get data types from bundles', error as Error, {
        operationType: 'bundle-data-types-fetch'  
      });
      throw error;
    }
  }

  async getDurationRanges(): Promise<Array<{
    label: string;
    value: string;
    minDays: number;
    maxDays: number;
  }>> {
    try {
      const { data, error } = await this.supabase
        .from('catalog_bundles')
        .select('validity_in_days')
        .not('validity_in_days', 'is', null)
        .order('validity_in_days');

      if (error) throw error;

      const durations = data?.map(d => d.validity_in_days) || [];
      
      // Create predefined duration ranges
      const ranges = [
        { label: "1-7 days", value: "1-7", minDays: 1, maxDays: 7 },
        { label: "8-14 days", value: "8-14", minDays: 8, maxDays: 14 },
        { label: "15-30 days", value: "15-30", minDays: 15, maxDays: 30 },
        { label: "31+ days", value: "31+", minDays: 31, maxDays: 999 }
      ];

      // Only return ranges that have bundles
      return ranges.filter(range => 
        durations.filter(d => d !== null).some(d => d >= range.minDays && d <= range.maxDays)
      );
    } catch (error) {
      this.logger.error('Failed to get duration ranges from bundles', error as Error, {
        operationType: 'bundle-duration-ranges-fetch'
      });
      throw error;
    }
  }

  async getDistinctDurations(): Promise<Array<{
    label: string;
    value: string;
    minDays: number;
    maxDays: number;
  }>> {
    try {
      this.logger.info('Calling get_distinct_durations Supabase function', {
        operationType: 'bundle-distinct-durations-fetch'
      });

      const { data, error } = await this.supabase
        .rpc('get_distinct_durations');

      if (error) {
        this.logger.error('Supabase RPC error for get_distinct_durations', error, {
          operationType: 'bundle-distinct-durations-fetch',
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details
        });
        throw error;
      }

      this.logger.info('Raw Supabase RPC response', {
        rawData: data,
        dataType: typeof data,
        dataLength: data?.length || 0,
        operationType: 'bundle-distinct-durations-fetch'
      });

      // The function returns the data in the correct format
      // Map the database response to ensure consistent format
      const durations = (data || []).map((item, index) => {
        this.logger.debug(`Mapping duration item ${index}`, {
          rawItem: item,
          operationType: 'bundle-distinct-durations-fetch'
        });
        
        return {
          label: item.label,
          value: item.value,
          minDays: item.min_days,
          maxDays: item.max_days
        };
      });

      this.logger.info('Successfully mapped distinct durations', {
        durationsCount: durations.length,
        mappedData: durations,
        operationType: 'bundle-distinct-durations-fetch'
      });

      return durations;
    } catch (error) {
      this.logger.error('Failed to get distinct durations from bundles', error as Error, {
        operationType: 'bundle-distinct-durations-fetch',
        errorName: (error as Error).name,
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack
      });
      throw error;
    }
  }

  // ========== Bundle Transformation ==========
  // This is kept in the repository as a utility function
  static transformCatalogToBundle(dbBundle: CatalogBundle) {
    return {
      esimGoName: dbBundle.esim_go_name,
      name: dbBundle.esim_go_name, // Or use a display name if you have one
      description: dbBundle.description,
      groups: dbBundle.groups || [],
      validityInDays: dbBundle.validity_in_days || 0,
      dataAmountMB: dbBundle.data_amount_mb,
      dataAmountReadable: dbBundle.data_amount_readable || "Unknown",
      isUnlimited: dbBundle.is_unlimited || false,
      countries: dbBundle.countries || [],
      region: dbBundle.region,
      speed: dbBundle.speed || ["4G"],
      basePrice: dbBundle.price || 0,
      currency: dbBundle.currency || "USD",
      provider: dbBundle.provider as Provider,
    };
  }
}
