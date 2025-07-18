import { ESIMGoDataSource } from "./esim-go-base";
import type { ESIMGoDataPlan } from "./types";
import { CatalogBackupService } from "../../services/catalog-backup.service";

/**
 * DataSource for eSIM Go Catalogue API
 * Handles browsing and searching available data plans
 */
export class CatalogueDataSource extends ESIMGoDataSource {
  private backupService: CatalogBackupService;

  constructor(config?: any) {
    super(config);
    this.backupService = new CatalogBackupService(this.cache);
  }
  /**
   * Get all available data plans
   * Caches for 1 hour as plans don't change frequently
   */
  async getAllBundels(): Promise<ESIMGoDataPlan[]> {
    const cacheKey = this.getCacheKey("catalogue:all");

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch all pages of data plans
    const plans = await this.getWithErrorHandling<{ bundles: ESIMGoDataPlan[] }>(
      "/v2.5/catalogue"
    );
    // Cache for 1 hour
    await this.cache?.set(cacheKey, JSON.stringify(plans.bundles), {
      ttl: 3600,
    });

    return plans.bundles;
  }

  /**
   * Get data plans filtered by region
   */
  async getPlansByRegion(region: string): Promise<ESIMGoDataPlan[]> {
    const cacheKey = this.getCacheKey("catalogue:region", { region });

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get all plans and filter by region
    const allPlans = await this.getAllBundels();
    const regionPlans = allPlans.filter((plan) =>
      plan.countries.some(
        (country) => country.region.toLowerCase() === region.toLowerCase()
      )
    );

    // Cache for 1 hour
    await this.cache?.set(cacheKey, JSON.stringify(regionPlans), { ttl: 3600 });

    return regionPlans;
  }

  /**
   * Get data plans filtered by country ISO code
   */
  async getPlansByCountry(
    countryISO: string,
    group: string
  ): Promise<ESIMGoDataPlan[]> {
    const cacheKey = this.getCacheKey("catalogue:country", {
      countryISO,
      group,
    });

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get all plans and filter by country
    const allPlans = await this.getWithErrorHandling<{ bundles: ESIMGoDataPlan[] }>(
      "/v2.5/catalogue",
      {
        countries: countryISO.toUpperCase(),
        group,
      }
    );
    const countryPlans = allPlans.bundles;

    // Cache for 1 hour
    await this.cache?.set(cacheKey, JSON.stringify(countryPlans), {
      ttl: 3600,
    });

    return countryPlans;
  }

  /**
   * Get data plans filtered by duration
   */
  async getPlansByDuration(days: number): Promise<ESIMGoDataPlan[]> {
    const cacheKey = this.getCacheKey("catalogue:duration", { days });

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get all plans and filter by duration
    const allPlans = await this.getAllBundels();
    const durationPlans = allPlans.filter((plan) => plan.duration === days);

    // Cache for 1 hour
    await this.cache?.set(cacheKey, JSON.stringify(durationPlans), {
      ttl: 3600,
    });

    return durationPlans;
  }

  /**
   * Get a specific plan by name
   */
  async getPlanByName(name: string): Promise<ESIMGoDataPlan | null> {
    const cacheKey = this.getCacheKey("catalogue:plan", { name });

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get all plans and find the specific one
    const allPlans = await this.getAllBundels();
    const plan = allPlans.find((p) => p.name === name) || null;

    // Cache for 1 hour
    if (plan) {
      await this.cache?.set(cacheKey, JSON.stringify(plan), { ttl: 3600 });
    }

    return plan;
  }

  /**
   * Search plans by multiple criteria with pagination
   */
  async searchPlans(criteria: {
    region?: string;
    country?: string;
    duration?: number;
    maxPrice?: number;
    bundleGroup?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ bundles: ESIMGoDataPlan[], totalCount: number, lastFetched?: string }> {
    console.log('🚀 searchPlans called with criteria:', criteria);
    
    // Check if catalog is fresh
    const metadata = await this.cache?.get('esim-go:catalog:metadata');
    if (!metadata) {
      console.log('⚠️ No catalog metadata found, triggering sync...');
      // Note: In production, this would trigger an async sync
      // For now, fallback to API call
      return this.fallbackToApiCall(criteria);
    }

    const catalogMetadata = JSON.parse(metadata);
    console.log(`💾 Using cached catalog (last synced: ${catalogMetadata.lastSynced})`);
    
    let bundles: ESIMGoDataPlan[] = [];

    // Optimized query path based on criteria
    if (criteria.bundleGroup) {
      console.log(`🔍 Direct bundle group lookup: ${criteria.bundleGroup}`);
      bundles = await this.getBundlesByGroup(criteria.bundleGroup);
    } else if (criteria.country && criteria.duration) {
      console.log(`🔍 Using combined index: ${criteria.country}:${criteria.duration}`);
      bundles = await this.getBundlesByCountryAndDuration(criteria.country, criteria.duration);
    } else if (criteria.country) {
      console.log(`🔍 Using country index: ${criteria.country}`);
      bundles = await this.getBundlesByCountry(criteria.country);
    } else if (criteria.duration) {
      console.log(`🔍 Using duration index: ${criteria.duration}`);
      bundles = await this.getBundlesByDuration(criteria.duration);
    } else {
      console.log('🔍 Getting all bundles from all groups');
      bundles = await this.getAllBundles(catalogMetadata);
    }

    // Apply additional filters if not already filtered
    if (criteria.country && !criteria.bundleGroup) {
      bundles = bundles.filter(b => 
        b.countries?.some(c => c.iso === criteria.country)
      );
    }
    if (criteria.duration && !criteria.bundleGroup) {
      bundles = bundles.filter(b => b.duration === criteria.duration);
    }
    if (criteria.search) {
      bundles = bundles.filter(b => 
        b.name.toLowerCase().includes(criteria.search!.toLowerCase()) ||
        b.description?.toLowerCase().includes(criteria.search!.toLowerCase())
      );
    }
    
    // Apply pagination
    const limit = criteria.limit || 50;
    const offset = criteria.offset || 0;
    const paginatedBundles = bundles.slice(offset, offset + limit);
    
    console.log(`📊 Found ${bundles.length} bundles, returning ${paginatedBundles.length} with pagination`);
    
    return {
      bundles: paginatedBundles,
      totalCount: bundles.length,
      lastFetched: catalogMetadata.lastSynced
    };
  }

  /**
   * Get bundles by bundle group
   */
  private async getBundlesByGroup(groupName: string): Promise<ESIMGoDataPlan[]> {
    const groupKey = this.getGroupKey(groupName);
    const groupData = await this.cache?.get(groupKey);
    if (groupData) {
      return JSON.parse(groupData);
    }
    return [];
  }

  /**
   * Get bundles by country using index
   */
  private async getBundlesByCountry(country: string): Promise<ESIMGoDataPlan[]> {
    const indexKey = `esim-go:catalog:index:country:${country}`;
    const bundleIds = await this.cache?.get(indexKey);
    if (bundleIds) {
      return this.getBundlesByIds(JSON.parse(bundleIds));
    }
    return [];
  }

  /**
   * Get bundles by duration using index
   */
  private async getBundlesByDuration(duration: number): Promise<ESIMGoDataPlan[]> {
    const indexKey = `esim-go:catalog:index:duration:${duration}`;
    const bundleIds = await this.cache?.get(indexKey);
    if (bundleIds) {
      return this.getBundlesByIds(JSON.parse(bundleIds));
    }
    return [];
  }

  /**
   * Get bundles by country and duration using combined index
   */
  private async getBundlesByCountryAndDuration(country: string, duration: number): Promise<ESIMGoDataPlan[]> {
    const indexKey = `esim-go:catalog:index:country:${country}:duration:${duration}`;
    const bundleIds = await this.cache?.get(indexKey);
    if (bundleIds) {
      return this.getBundlesByIds(JSON.parse(bundleIds));
    }
    return [];
  }

  /**
   * Get all bundles from all groups
   */
  private async getAllBundles(metadata: any): Promise<ESIMGoDataPlan[]> {
    const allBundles: ESIMGoDataPlan[] = [];
    
    for (const groupName of metadata.bundleGroups || []) {
      const groupKey = this.getGroupKey(groupName);
      const groupData = await this.cache?.get(groupKey);
      if (groupData) {
        allBundles.push(...JSON.parse(groupData));
      }
    }
    
    return allBundles;
  }

  /**
   * Get individual bundles by their IDs
   */
  private async getBundlesByIds(bundleIds: string[]): Promise<ESIMGoDataPlan[]> {
    const bundles: ESIMGoDataPlan[] = [];
    
    // Batch get bundles
    for (const id of bundleIds) {
      const bundleData = await this.cache?.get(`esim-go:catalog:bundle:${id}`);
      if (bundleData) {
        bundles.push(JSON.parse(bundleData));
      }
    }
    
    return bundles;
  }

  /**
   * Get Redis key for bundle group
   */
  private getGroupKey(groupName: string): string {
    return `esim-go:catalog:group:${groupName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
  }

  /**
   * Fallback to API call if cache is not available
   */
  private async fallbackToApiCall(criteria: any): Promise<{ bundles: ESIMGoDataPlan[], totalCount: number, lastFetched?: string }> {
    console.log('🔄 Falling back to API call...');
    
    try {
      // First try the API call
      return await this.performApiCall(criteria);
    } catch (error) {
      this.log.error('API call failed, trying backup data:', error);
      
      // If API fails, try backup data
      const backupData = await this.getBackupData(criteria);
      if (backupData.bundles.length > 0) {
        console.log('✅ Using backup data as fallback');
        return backupData;
      }
      
      // If no backup data, re-throw the original error
      throw error;
    }
  }

  /**
   * Get backup data based on criteria
   */
  private async getBackupData(criteria: any): Promise<{ bundles: ESIMGoDataPlan[], totalCount: number, lastFetched?: string }> {
    let bundles: ESIMGoDataPlan[] = [];
    
    // Check if backup data is available
    const hasBackup = await this.backupService.hasBackupData();
    if (!hasBackup) {
      console.log('⚠️ No backup data available');
      return { bundles: [], totalCount: 0 };
    }
    
    // Get backup data based on criteria
    if (criteria.country) {
      bundles = await this.backupService.getBackupPlansForCountry(criteria.country);
    } else if (criteria.bundleGroup) {
      bundles = await this.backupService.getBackupPlansByGroup(criteria.bundleGroup);
    } else {
      // Get all available backup data
      const metadata = await this.backupService.getBackupMetadata();
      if (metadata) {
        // We don't have a method to get all backup data, so we'll try common bundle groups
        const commonGroups = ['Standard - Fixed', 'Standard - Unlimited Lite', 'Standard - Unlimited Essential'];
        for (const group of commonGroups) {
          const groupBundles = await this.backupService.getBackupPlansByGroup(group);
          bundles.push(...groupBundles);
        }
      }
    }
    
    // Apply additional filters
    if (criteria.duration !== undefined) {
      bundles = bundles.filter(b => b.duration === criteria.duration);
    }
    if (criteria.search) {
      bundles = bundles.filter(b => 
        b.name.toLowerCase().includes(criteria.search.toLowerCase()) ||
        b.description?.toLowerCase().includes(criteria.search.toLowerCase())
      );
    }
    
    // Apply pagination
    const limit = criteria.limit || 50;
    const offset = criteria.offset || 0;
    const paginatedBundles = bundles.slice(offset, offset + limit);
    
    const metadata = await this.backupService.getBackupMetadata();
    
    return {
      bundles: paginatedBundles,
      totalCount: bundles.length,
      lastFetched: metadata?.lastLoaded || new Date().toISOString()
    };
  }

  /**
   * Perform the actual API call
   */
  private async performApiCall(criteria: any): Promise<{ bundles: ESIMGoDataPlan[], totalCount: number, lastFetched?: string }> {
    // Keep the existing API call logic as fallback
    
    const cacheKey = this.getCacheKey("catalogue:search", criteria);

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      console.log('💾 Returning cached result for:', cacheKey);
      const cachedResult = JSON.parse(cached);
      console.log('💾 Cached durations:', [...new Set(cachedResult.bundles.map(b => b.duration))]);
      return cachedResult;
    }

    // Prepare API parameters
    const params: Record<string, any> = {};
    
    // Add pagination parameters - eSIM-Go uses 'perPage' and 'page'
    if (criteria.limit !== undefined) {
      params.perPage = Math.min(criteria.limit, 50); // Max 200 items per page
    } else {
      params.perPage = 50; // Default limit
    }
    
    if (criteria.offset !== undefined) {
      const page = Math.floor(criteria.offset / (criteria.limit || 50)) + 1;
      params.page = Math.max(1, page); // Ensure page is at least 1
    }
    
    // Add filtering parameters that the eSIM Go API supports
    if (criteria.country) {
      params.countries = criteria.country.toUpperCase();
    }
    
    if (criteria.bundleGroup) {
      params.group = criteria.bundleGroup;
    }
    
    if (criteria.region) {
      params.region = criteria.region;
    }
    
    // NOTE: eSIM Go API doesn't support duration filtering - we'll filter client-side
    // if (criteria.duration !== undefined) {
    //   params.duration = criteria.duration;
    // }
    
    if (criteria.maxPrice !== undefined) {
      params.maxPrice = criteria.maxPrice;
    }
    
    // Add search parameter - eSIM-Go API uses 'description' for wildcard search
    if (criteria.search) {
      params.description = criteria.search;
    }
    
    console.log('🎯 Trying to fetch multiple pages to get diverse durations...');

    // Call the eSIM Go API with all parameters (now supports search and region natively)
    console.log('🔍 Calling eSIM Go API with params:', params);
    const response = await this.getWithErrorHandling<{ 
      bundles: ESIMGoDataPlan[], 
      totalCount: number,
      limit: number,
      offset: number 
    }>("/v2.5/catalogue", params);
    
    // For now, only fetch additional pages if we're getting the full catalog (no specific filters)
    const shouldFetchMultiplePages = !criteria.country && !criteria.region && !criteria.bundleGroup;
    
    if (shouldFetchMultiplePages) {
      console.log('🔍 Fetching additional pages to get diverse durations...');
      const additionalPages = [];
      
      // Fetch pages 2-5 to get more diverse bundles (compromise between performance and completeness)
      for (let page = 2; page <= 5; page++) {
        try {
          const pageResponse = await this.getWithErrorHandling<{ 
            bundles: ESIMGoDataPlan[], 
            totalCount: number,
            limit: number,
            offset: number 
          }>("/v2.5/catalogue", { ...params, page });
          
          if (pageResponse.bundles.length === 0) {
            console.log(`📄 Page ${page} is empty, stopping pagination`);
            break;
          }
          
          additionalPages.push(...pageResponse.bundles);
          console.log(`📄 Page ${page} durations:`, [...new Set(pageResponse.bundles.map(b => b.duration))]);
        } catch (error) {
          console.log(`❌ Error fetching page ${page}:`, error);
          break;
        }
      }
      
      // Combine all bundles from multiple pages
      const allBundles = [...response.bundles, ...additionalPages];
      console.log('🔍 Combined durations from all pages:', [...new Set(allBundles.map(b => b.duration))]);
      
      // Update response with combined bundles
      response.bundles = allBundles;
    } else {
      console.log('🚀 Skipping multi-page fetch due to specific filters');
    }
    
    console.log('📦 eSIM Go API response:', {
      totalCount: response.totalCount,
      bundleCount: response.bundles.length,
      durations: [...new Set(response.bundles.map(b => b.duration))],
      sampleBundles: response.bundles.slice(0, 3).map(b => ({
        name: b.name,
        duration: b.duration,
        region: b.region
      }))
    });

    const totalCount = response.totalCount || response.bundles.length;
    let plans = response.bundles;

    // Apply client-side filtering for duration (since API doesn't support it)
    if (criteria.duration !== undefined) {
      console.log(`🔍 Filtering ${plans.length} bundles for duration: ${criteria.duration}`);
      plans = plans.filter(plan => plan.duration === criteria.duration);
      console.log(`✅ Found ${plans.length} bundles matching duration ${criteria.duration}`);
    }

    // Sort by price (lowest first)
    plans.sort((a, b) => a.price - b.price);

    const result = {
      bundles: plans,
      totalCount: totalCount,
      lastFetched: new Date().toISOString()
    };

    // Cache for 1 hour
    await this.cache?.set(cacheKey, JSON.stringify(result), { ttl: 3600 });

    return result;
  }

  /**
   * Get featured/popular plans
   * This is a business logic method that returns curated plans
   */
  async getFeaturedPlans(): Promise<ESIMGoDataPlan[]> {
    const cacheKey = this.getCacheKey("catalogue:featured");

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get all plans
    const allPlans = await this.getAllBundels();

    // Featured plans logic: Get popular durations (7, 30 days) from major regions
    const featuredBundles = [
      "EUROPE_UNLIMITED",
      "ASIA_UNLIMITED",
      "USA_UNLIMITED",
      "GLOBAL_UNLIMITED",
    ];

    const featuredPlans = allPlans.filter(
      (plan) =>
        featuredBundles.includes(plan.bundleGroup || "") &&
        [7, 30].includes(plan.duration)
    );

    // Sort by region popularity and duration
    featuredPlans.sort((a, b) => {
      const regionOrder = [
        "GLOBAL_UNLIMITED",
        "EUROPE_UNLIMITED",
        "USA_UNLIMITED",
        "ASIA_UNLIMITED",
      ];
      const aIndex = regionOrder.indexOf(a.bundleGroup || "");
      const bIndex = regionOrder.indexOf(b.bundleGroup || "");
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.duration - b.duration;
    });

    // Cache for 1 hour
    await this.cache?.set(cacheKey, JSON.stringify(featuredPlans), {
      ttl: 3600,
    });

    return featuredPlans;
  }
}
