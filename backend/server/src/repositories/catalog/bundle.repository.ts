import { type Database } from "../../types/database.types";
import { createLogger } from "../../lib/logger";
import { BaseSupabaseRepository } from "../base-supabase.repository";
import type { Provider } from "../../types";

// Types are now correctly sourced from our generated file (public schema)
type CatalogBundle = Database["public"]["Tables"]["catalog_bundles"]["Row"];
type CatalogBundleInsert = Database["public"]["Tables"]["catalog_bundles"]["Insert"];
type CatalogBundleUpdate = Database["public"]["Tables"]["catalog_bundles"]["Update"];

// This is a special type created to satisfy the BaseSupabaseRepository constraint.
// It removes the original 'id: number' and adds a compatible 'id: string'.
type BundleForRepository = Omit<CatalogBundle, 'id'> & { id: string };


export type GetBundlesByCountriesResponse = Database["public"]["Functions"]["get_bundles_by_countries"]["Returns"];
export type GetBundlesByRegionsResponse = Database["public"]["Functions"]["get_bundles_by_regions"]["Returns"];
// ... etc ...

export interface SearchCatalogCriteria {
  countries?: string[];
  groups?: string[];
  regions?: string[];
  minValidityInDays?: number;
  maxValidityInDays?: number;
  isUnlimited?: boolean;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

export class BundleRepository extends BaseSupabaseRepository<
  BundleForRepository,
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

  async getById(id: string): Promise<BundleForRepository | null> {
    const { data, error } = await this.supabase
      .from("catalog_bundles")
      .select("*")
      .eq("external_id", id) 
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      this.logger.error("Failed to get bundle by id", error, { id });
      throw error;
    }
    return data as any;
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
      minPrice,
      maxPrice,
      limit = 50,
      offset = 0,
    } = criteria;

    let query = this.supabase
      .from("catalog_bundles")
      .select("*", { count: "exact" });

    if (countries?.length) {
      const { data: bundleIdsData, error: bundleIdsError } = await this.supabase
        .from("catalog_bundle_countries") 
        .select("bundle_id")
        .in("country_iso2", countries);

      if (bundleIdsError) {
        this.logger.error("Failed to fetch bundle IDs for country filter", bundleIdsError);
        throw bundleIdsError;
      }
      
      const bundleIds = bundleIdsData.map((row) => row.bundle_id);
      if (bundleIds.length > 0) {
        query = query.in("id", bundleIds);
      } else {
        return { data: [], count: 0, hasNextPage: false, hasPreviousPage: false };
      }
    }

    if (groups?.length) {
      query = query.in("group_name", groups);
    }

    if (regions?.length) {
      query = query.in("region", regions);
    }

    if (minValidityInDays !== undefined) {
      query = query.gte("validity_days", minValidityInDays);
    }

    if (maxValidityInDays !== undefined) {
      query = query.lte("validity_days", maxValidityInDays);
    }

    if (isUnlimited !== undefined) {
      query = query.eq("unlimited", isUnlimited);
    }
   
    if (minPrice !== undefined) {
      query = query.gte("price_usd", minPrice);
    }

    if (maxPrice !== undefined) {
      query = query.lte("price_usd", maxPrice);
    }

    const { data, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      this.logger.error("Failed to search bundles", error, { criteria });
      throw error;
    }

    return {
      data: data || [],
      count: count || 0,
      hasNextPage: offset + limit < (count || 0),
      hasPreviousPage: offset > 0,
    };
  }

  // ========== Filter Options ==========
  
  // ADDED: Re-implementation of the missing 'getDataTypes' function.
  async getDataTypes(): Promise<Array<{
    label: string;
    value: string;
    isUnlimited: boolean;
    minDataMB?: number;
    maxDataMB?: number;
  }>> {
    try {
      const { data: limitedData, error: limitedError } = await this.supabase
        .from('catalog_bundles')
        .select('data_amount_mb')
        .eq('unlimited', false)
        .not('data_amount_mb', 'is', null);

      if (limitedError) throw limitedError;

      const { count: unlimitedCount, error: unlimitedError } = await this.supabase
        .from('catalog_bundles')
        .select('*', { count: 'exact', head: true })
        .eq('unlimited', true);

      if (unlimitedError) throw unlimitedError;

      const dataTypes = [];
      if (unlimitedCount && unlimitedCount > 0) {
        dataTypes.push({
          label: "Unlimited",
          value: "unlimited",
          isUnlimited: true
        });
      }

      if (limitedData && limitedData.length > 0) {
        const dataAmounts = limitedData.map(d => d.data_amount_mb).filter((d): d is number => d !== null);
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
      this.logger.error('Failed to get data types from bundles', error as Error);
      throw error;
    }
  }
  
  // ADDED: Re-implementation of the missing 'getDistinctDurations' function.
  async getDistinctDurations(): Promise<Array<{
    label: string;
    value: string;
    minDays: number;
    maxDays: number;
  }>> {
    try {
      const { data, error } = await this.supabase.rpc('get_distinct_durations');

      if (error) {
        this.logger.error('Supabase RPC error for get_distinct_durations', error);
        throw error;
      }
      
      // The function returns the data in the correct format.
      return (data || []).map(item => ({
        label: item.label,
        value: item.value,
        minDays: item.min_days,
        maxDays: item.max_days
      }));
    } catch (error) {
      this.logger.error('Failed to get distinct durations from bundles', error as Error);
      throw error;
    }
  }

  async getCountries(): Promise<string[]> {
    const { data, error } = await this.supabase
    .rpc("get_distinct_bundle_countries"); 

    if (error) {
      this.logger.error("Failed to get countries", error);
      throw error;
    }
    return data?.map((row) => row.country_iso2) || [];
  }

  async getGroups(): Promise<string[]> {
    const { data, error } = await this.supabase.rpc("get_unique_groups_from_bundles");

    if (error) {
        this.logger.error("Error fetching groups:", error);
        throw error;
    }

    return data?.map((row) => row.group_name) || [];
  }

  async getRegions(): Promise<string[]> {
      const { data, error } = await this.supabase.rpc("get_unique_regions");

      if (error) {
          this.logger.error("Failed to get regions", error);
          throw error;
      }

      return data?.map((row) => row.region) || [];
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
      this.logger.error("Failed to get bundles for country", error, { countryCode });
      throw error;
    }
    return data;
  }

  async byRegions() {
    const { data, error } = await this.supabase.rpc("get_bundles_by_regions");
    if (error) {
      this.logger.error("Error fetching bundles by regions", error);
      throw error;
    }
    return data;
  }

async getCountryByIso(iso: string) {
  console.log("[DEBUG] getCountryByIso called with:", iso);

  const { data, error } = await this.supabase
    .from("catalog_countries")
    .select("iso2, name, name_hebrew")
    .eq("iso2", iso.toUpperCase())
    .single();

  if (error) {
    console.error("[ERROR] getCountryByIso failed:", error);
  } else {
    console.log("[DEBUG] getCountryByIso result:", data);
  }

  return data;
}



  async byGroups() {
    const { data, error } = await this.supabase.rpc("get_bundles_by_groups");
    if (error) {
      this.logger.error("Error fetching bundles by groups", error);
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
}

