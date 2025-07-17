import { ESIMGoDataSource } from "./esim-go-base";
import type { ESIMGoDataPlan } from "./types";

/**
 * DataSource for eSIM Go Catalogue API
 * Handles browsing and searching available data plans
 */
export class CatalogueDataSource extends ESIMGoDataSource {
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
    
    // Check if we can use country-specific cache (for country-filtered requests)
    if (criteria.country) {
      console.log(`🔍 Checking country cache for ${criteria.country}...`);
      const countryCatalog = await this.cache?.get(`esim-go:country-catalog:${criteria.country}`);
      if (countryCatalog) {
        console.log(`💾 Using country cache for ${criteria.country}`);
        const catalogData = JSON.parse(countryCatalog);
        console.log(`💾 ${criteria.country} durations:`, [...new Set(catalogData.bundles.map(b => b.duration))]);
        
        let filteredBundles = catalogData.bundles;
        
        // Apply additional filters
        if (criteria.duration !== undefined) {
          filteredBundles = filteredBundles.filter(bundle => bundle.duration === criteria.duration);
        }
        if (criteria.bundleGroup) {
          filteredBundles = filteredBundles.filter(bundle => bundle.bundleGroup === criteria.bundleGroup);
        }
        if (criteria.search) {
          filteredBundles = filteredBundles.filter(bundle => 
            bundle.name.toLowerCase().includes(criteria.search.toLowerCase()) ||
            bundle.description?.toLowerCase().includes(criteria.search.toLowerCase())
          );
        }
        
        // Apply pagination to cached data
        const limit = criteria.limit || 50;
        const offset = criteria.offset || 0;
        const paginatedBundles = filteredBundles.slice(offset, offset + limit);
        
        return {
          bundles: paginatedBundles,
          totalCount: filteredBundles.length,
          lastFetched: catalogData.syncedAt
        };
      }
    }

    // Check if we can use the full catalog cache (for unfiltered requests)
    const isUnfilteredRequest = !criteria.country && !criteria.region && !criteria.bundleGroup && !criteria.search && !criteria.duration;
    
    if (isUnfilteredRequest) {
      console.log('🔍 Checking full catalog cache...');
      const fullCatalog = await this.cache?.get('esim-go:full-catalog');
      if (fullCatalog) {
        console.log('💾 Using full catalog cache');
        const catalogData = JSON.parse(fullCatalog);
        console.log('💾 Full catalog durations:', [...new Set(catalogData.bundles.map(b => b.duration))]);
        
        // Apply pagination to cached data
        const limit = criteria.limit || 50;
        const offset = criteria.offset || 0;
        const paginatedBundles = catalogData.bundles.slice(offset, offset + limit);
        
        return {
          bundles: paginatedBundles,
          totalCount: catalogData.totalCount,
          lastFetched: catalogData.syncedAt
        };
      }
    }
    
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
      params.perPage = Math.min(criteria.limit, 200); // Max 200 items per page
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
