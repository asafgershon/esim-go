import { ESIMGoDataSource } from "./esim-go-base";
import { BundleRepository, type SearchCatalogCriteria } from "../../repositories/catalog/bundle.repository";
import { createLogger, withPerformanceLogging } from "../../lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../database.types";

type CatalogBundle = Database['public']['Tables']['catalog_bundles']['Row'];

/**
 * DataSource for eSIM Go Catalogue API
 * Simplified version that uses database directly instead of Redis caching
 */
export class CatalogueDataSource extends ESIMGoDataSource {
  private bundleRepository: BundleRepository;
  protected log = createLogger({ 
    component: 'CatalogueDataSource',
    operationType: 'catalog-operations'
  });

  constructor(config?: any) {
    super(config);
    // BundleRepository extends BaseSupabaseRepository and uses supabaseAdmin internally
    this.bundleRepository = new BundleRepository('catalog_bundles');
  }

  /**
   * Check if catalog database is empty
   */
  private async isCatalogEmpty(): Promise<boolean> {
    try {
      const result = await this.bundleRepository.searchBundles({
        limit: 1,
        offset: 0
      });
      
      const isEmpty = result.totalCount === 0;
      
      this.log.debug('Catalog empty check', {
        isEmpty,
        totalCount: result.totalCount,
        operationType: 'catalog-health-check'
      });
      
      return isEmpty;
    } catch (error) {
      this.log.error('Failed to check if catalog is empty', error as Error);
      // Assume not empty to avoid blocking operations
      return false;
    }
  }

  /**
   * Search plans by criteria - uses database first, handles empty catalog properly
   */
  async searchPlans(criteria: {
    country?: string;
    region?: string;
    duration?: number;
    minDuration?: number;
    maxDuration?: number;
    unlimited?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ bundles: CatalogBundle[], totalCount: number }> {
    return withPerformanceLogging(
      this.log,
      'search-plans',
      async () => {
        // Convert criteria to repository format
        const searchCriteria: SearchCatalogCriteria = {
          countries: criteria.country ? [criteria.country] : undefined,
          minDuration: criteria.minDuration || criteria.duration,
          maxDuration: criteria.maxDuration || criteria.duration,
          unlimited: criteria.unlimited,
          limit: criteria.limit || 50,
          offset: criteria.offset || 0
        };

        // First check if catalog has any data at all
        const isEmpty = await this.isCatalogEmpty();
        
        if (isEmpty) {
          this.log.error('📊 Catalog database is empty - sync required', { 
            criteria,
            operationType: 'catalog-empty'
          });

          throw new Error(
            'Catalog data is not available. Please run catalog sync to populate the database with eSIM bundles.'
          );
        }

        // Search in database
        const dbResult = await this.bundleRepository.searchBundles(searchCriteria);
        
        if (dbResult.bundles.length > 0) {
          // Return database bundles directly
          const bundles = dbResult.bundles;
          
          this.log.info('✅ Found bundles in database', {
            count: bundles.length,
            totalCount: dbResult.totalCount,
            criteria: searchCriteria,
            operationType: 'database-search'
          });

          return {
            bundles,
            totalCount: dbResult.totalCount
          };
        }

        // No results for specific criteria but catalog has data
        this.log.warn('📊 No bundles match search criteria', { 
          criteria,
          operationType: 'no-matches'
        });

        return {
          bundles: [],
          totalCount: 0
        };
      },
      { criteria }
    );
  }

  /**
   * Get bundles by country - primary method used by pricing system
   */
  async getPlansByCountry(country: string): Promise<CatalogBundle[]> {
    return withPerformanceLogging(
      this.log,
      'get-plans-by-country',
      async () => {
        // Check if catalog is empty first
        const isEmpty = await this.isCatalogEmpty();
        
        if (isEmpty) {
          this.log.error('📊 Cannot get country bundles - catalog is empty', { 
            country,
            operationType: 'catalog-empty'
          });
          
          throw new Error(
            'Catalog data is not available. Please run catalog sync to populate the database with eSIM bundles.'
          );
        }
        
        const result = await this.searchPlans({ 
          country,
          limit: 1000 // Get all bundles for the country
        });
        
        return result.bundles;
      },
      { country }
    );
  }

  /**
   * Get bundles for a specific country
   */
  async getBundlesByCountry(countryId: string): Promise<CatalogBundle[]> {
    return withPerformanceLogging(
      this.log,
      'get-bundles-by-country',
      async () => {
        // Check if catalog is empty first
        const isEmpty = await this.isCatalogEmpty();
        
        if (isEmpty) {
          this.log.error('📊 Cannot get bundles by country - catalog is empty', { 
            countryId,
            operationType: 'catalog-empty'
          });
          
          throw new Error(
            'Catalog data is not available. Please run catalog sync to populate the database with eSIM bundles.'
          );
        }
        
        return await this.bundleRepository.getBundlesByCountry(countryId);
      }
    );
  }

  /**
   * Get bundles grouped by country with counts - efficient aggregation
   */
  async getBundlesByCountryAggregation(): Promise<Array<{
    countryId: string;
    countryName: string;
    bundleCount: number;
  }>> {
    return withPerformanceLogging(
      this.log,
      'get-bundles-by-country-aggregation',
      async () => {
        // Check if catalog is empty first
        const isEmpty = await this.isCatalogEmpty();
        
        if (isEmpty) {
          this.log.error('📊 Cannot get country aggregation - catalog is empty', { 
            operationType: 'catalog-empty'
          });
          
          throw new Error(
            'Catalog data is not available. Please run catalog sync to populate the database with eSIM bundles.'
          );
        }
        
        return await this.bundleRepository.getBundlesByCountryAggregation();
      }
    );
  }

  /**
   * Get bundles grouped by region with counts - efficient aggregation
   */
  async getBundlesByRegionAggregation(): Promise<Array<{
    regionName: string;
    bundleCount: number;
    countryCount: number;
  }>> {
    return withPerformanceLogging(
      this.log,
      'get-bundles-by-region-aggregation',
      async () => {
        // Check if catalog is empty first
        const isEmpty = await this.isCatalogEmpty();
        
        if (isEmpty) {
          this.log.error('📊 Cannot get region aggregation - catalog is empty', { 
            operationType: 'catalog-empty'
          });
          
          throw new Error(
            'Catalog data is not available. Please run catalog sync to populate the database with eSIM bundles.'
          );
        }
        
        return await this.bundleRepository.getBundlesByRegionAggregation();
      }
    );
  }

  /**
   * Get bundles for a specific region
   */
  async getBundlesByRegion(regionName: string): Promise<CatalogBundle[]> {
    return withPerformanceLogging(
      this.log,
      'get-bundles-by-region',
      async () => {
        // Check if catalog is empty first
        const isEmpty = await this.isCatalogEmpty();
        
        if (isEmpty) {
          this.log.error('📊 Cannot get region bundles - catalog is empty', { 
            regionName,
            operationType: 'catalog-empty'
          });
          
          throw new Error(
            'Catalog data is not available. Please run catalog sync to populate the database with eSIM bundles.'
          );
        }
        
        return await this.bundleRepository.getBundlesByRegion(regionName);
      }
    );
  }

  /**
   * Get all available bundle groups from database
   */
  async getOrganizationGroups(): Promise<string[]> {
    return withPerformanceLogging(
      this.log,
      'get-organization-groups',
      async () => {
        try {
          const groups = await this.bundleRepository.getAvailableBundleGroups();
          
          this.log.info('✅ Retrieved bundle groups from database', {
            count: groups.length,
            groups,
            operationType: 'database-groups'
          });

          return groups;
        } catch (error) {
          this.log.error('Failed to get bundle groups from database', error as Error, {
            operationType: 'database-groups-error'
          });

          // Return fallback groups instead of API call
          const fallbackGroups = ['Standard Fixed', 'Standard - Unlimited Lite', 'Standard - Unlimited Essential'];
          this.log.info('Using fallback bundle groups', {
            groups: fallbackGroups,
            operationType: 'fallback-groups'
          });
          
          return fallbackGroups;
        }
      }
    );
  }

  /**
   * Get all available data plans - simplified version
   */
  async getAllBundels(): Promise<CatalogBundle[]> {
    return withPerformanceLogging(
      this.log,
      'get-all-bundles',
      async () => {
        const result = await this.bundleRepository.searchBundles({
          limit: 10000 // Large limit to get most bundles
        });

        const bundles = result.bundles;
        
        this.log.info('✅ Retrieved all bundles from database', {
          count: bundles.length,
          operationType: 'database-all-bundles'
        });

        return bundles;
      }
    );
  }

  /**
   * Get plans by region
   */
  async getPlansByRegion(region: string): Promise<CatalogBundle[]> {
    return withPerformanceLogging(
      this.log,
      'get-plans-by-region',
      async () => {
        const result = await this.searchPlans({ 
          region,
          limit: 1000
        });
        
        return result.bundles;
      },
      { region }
    );
  }

  /**
   * Get plans by duration
   */
  async getPlansByDuration(days: number): Promise<CatalogBundle[]> {
    return withPerformanceLogging(
      this.log,
      'get-plans-by-duration', 
      async () => {
        const result = await this.searchPlans({ 
          duration: days,
          limit: 1000
        });
        
        return result.bundles;
      },
      { days }
    );
  }

  /**
   * Get plan by name/ID
   */
  async getPlanByName(name: string): Promise<CatalogBundle | null> {
    const bundle = await this.bundleRepository.getByBundleId(name);
    
    if (bundle) {
      return bundle;
    }

    // No fallback for now - would need catalog sync
    return null;
  }

  /**
   * Get featured plans - simplified to just return popular short-duration plans
   */
  async getFeaturedPlans(): Promise<CatalogBundle[]> {
    return withPerformanceLogging(
      this.log,
      'get-featured-plans',
      async () => {
        const result = await this.searchPlans({
          minDuration: 1,
          maxDuration: 14, // Short duration plans are usually more popular
          limit: 20
        });
        
        return result.bundles;
      }
    );
  }


  /**
   * Get bundle data aggregation for filters
   */
  async getBundleDataAggregation(): Promise<{
    total: number;
    unlimited: number;
    byDuration: Array<{ duration: number; count: number }>;
    byBundleGroup: Array<{ bundleGroup: string; count: number }>;
    lastUpdated: string;
  }> {
    return withPerformanceLogging(
      this.log,
      'get-bundle-data-aggregation',
      async () => {
        // First check if catalog is empty
        const isEmpty = await this.isCatalogEmpty();
        
        if (isEmpty) {
          this.log.warn('📊 Cannot get aggregation - catalog is empty', {
            operationType: 'catalog-empty'
          });
          
          return {
            total: 0,
            unlimited: 0,
            byDuration: [],
            byBundleGroup: [],
            lastUpdated: new Date().toISOString()
          };
        }

        // Get all bundles for aggregation
        const allBundles = await this.bundleRepository.searchBundles({
          limit: 10000 // Large limit to get all bundles
        });

        const bundles = allBundles.bundles;
        
        // Calculate aggregations
        const unlimited = bundles.filter(b => b.is_unlimited).length;
        
        // Group by duration
        const durationMap = new Map<number, number>();
        bundles.forEach(bundle => {
          const duration = bundle.duration || 0;
          durationMap.set(duration, (durationMap.get(duration) || 0) + 1);
        });
        
        // Group by bundle group
        const bundleGroupMap = new Map<string, number>();
        bundles.forEach(bundle => {
          const group = bundle.bundle_group || 'Unknown';
          bundleGroupMap.set(group, (bundleGroupMap.get(group) || 0) + 1);
        });

        const aggregation = {
          total: bundles.length,
          unlimited,
          byDuration: Array.from(durationMap.entries()).map(([duration, count]) => ({
            duration,
            count
          })).sort((a, b) => a.duration - b.duration),
          byBundleGroup: Array.from(bundleGroupMap.entries()).map(([bundleGroup, count]) => ({
            bundleGroup,
            count
          })).sort((a, b) => a.bundleGroup.localeCompare(b.bundleGroup)),
          lastUpdated: new Date().toISOString()
        };

        this.log.info('✅ Bundle data aggregation calculated', {
          total: aggregation.total,
          unlimited: aggregation.unlimited,
          durationGroups: aggregation.byDuration.length,
          bundleGroups: aggregation.byBundleGroup.length,
          operationType: 'bundle-aggregation'
        });

        return aggregation;
      }
    );
  }

  /**
   * Cleanup method - simplified since we're not using caching
   */
  async cleanup(): Promise<void> {
    this.log.info('🧹 CatalogueDataSource cleanup completed');
  }

  /**
   * Health status - simplified
   */
  getCacheHealthStatus(): string {
    return 'Database-only mode: ✅ Healthy';
  }

  /**
   * Reset method - no-op since we're not using cache
   */
  resetCacheHealth(): void {
    this.log.info('🔄 No cache to reset - using database directly');
  }
}