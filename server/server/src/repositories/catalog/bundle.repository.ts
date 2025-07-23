import { BaseSupabaseRepository } from '../base-supabase.repository';
import { type Database } from '../../database.types';
import { createLogger, withPerformanceLogging } from '../../lib/logger';
import type { CatalogueResponseInner } from '@esim-go/client';
import { transformBundlesToDatabase, convertCentsToDollars, convertBytesToMB } from './bundle-transform.schema';

type CatalogBundle = Database['public']['Tables']['catalog_bundles']['Row'];
type CatalogBundleInsert = Database['public']['Tables']['catalog_bundles']['Insert'];
type CatalogBundleUpdate = Database['public']['Tables']['catalog_bundles']['Update'];

export interface SearchCatalogCriteria {
  countries?: string[];
  bundleGroups?: string[];
  minDuration?: number;
  maxDuration?: number;
  unlimited?: boolean;
  limit?: number;
  offset?: number;
}

export class BundleRepository extends BaseSupabaseRepository {
  private logger = createLogger({ 
    component: 'BundleRepository',
    operationType: 'catalog-persistence'
  });

  /**
   * Get bundle by bundle ID
   */
  async getByBundleId(bundleId: string): Promise<CatalogBundle | null> {
    return withPerformanceLogging(
      this.logger,
      'get-bundle-by-id',
      async () => {
        const { data, error } = await this.supabase
          .from('catalog_bundles')
          .select('*')
          .eq('esim_go_name', bundleId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return null; // Not found
          }
          this.logger.error('Failed to get bundle by id', error, { bundleId });
          throw error;
        }

        return data;
      },
      { bundleId }
    );
  }

  /**
   * Bulk upsert bundles from eSIM Go API
   */
  async bulkUpsert(bundles: CatalogueResponseInner[]): Promise<{
    added: number;
    updated: number;
    errors: string[];
  }> {
    return withPerformanceLogging(
      this.logger,
      'bulk-upsert-bundles',
      async () => {
        const results = {
          added: 0,
          updated: 0,
          errors: [] as string[]
        };

        // Transform all bundles with Zod validation
        const { validBundles, errors: transformErrors } = transformBundlesToDatabase(bundles);
        
        // Log transformation errors
        if (transformErrors.length > 0) {
          transformErrors.forEach(({ error, index }) => {
            this.logger.warn('Bundle transformation failed', undefined, {
              bundleIndex: index,
              error,
              operationType: 'bundle-transformation'
            });
            results.errors.push(`Transformation error at index ${index}: ${error}`);
          });
        }

        this.logger.info('Bundle transformation completed', {
          totalBundles: bundles.length,
          validBundles: validBundles.length,
          transformationErrors: transformErrors.length,
          operationType: 'bundle-transformation-summary'
        });

        if (validBundles.length === 0) {
          this.logger.warn('No valid bundles after transformation');
          return results;
        }

        // Process valid bundles in batches to avoid overwhelming the database
        const batchSize = 100;
        for (let i = 0; i < validBundles.length; i += batchSize) {
          const batch = validBundles.slice(i, i + batchSize);
          
          try {
            const { data, error } = await this.supabase
              .from('catalog_bundles')
              .upsert(batch, {
                onConflict: 'esim_go_name',
                ignoreDuplicates: false
              })
              .select();

            if (error) {
              this.logger.error('Batch upsert failed', error, { 
                batchIndex: i / batchSize,
                batchSize: batch.length 
              });
              results.errors.push(`Batch ${i / batchSize}: ${error.message}`);
            } else if (data) {
              // Count new vs updated based on created_at timestamps
              const now = new Date();
              data.forEach(bundle => {
                const createdAt = new Date(bundle.created_at || '');
                const timeDiff = now.getTime() - createdAt.getTime();
                // If created within last 10 seconds, consider it new
                if (timeDiff < 10000) {
                  results.added++;
                } else {
                  results.updated++;
                }
              });

              this.logger.debug('Batch upsert successful', {
                batchIndex: i / batchSize,
                insertedCount: data.length,
                operationType: 'batch-upsert'
              });
            }
          } catch (error) {
            this.logger.error('Batch processing error', error as Error, { 
              batchIndex: i / batchSize 
            });
            results.errors.push(`Batch ${i / batchSize}: ${(error as Error).message}`);
          }
        }

        this.logger.info('Bulk upsert completed', {
          totalBundles: bundles.length,
          added: results.added,
          updated: results.updated,
          errors: results.errors.length,
          operationType: 'bulk-upsert-summary'
        });

        return results;
      },
      { bundleCount: bundles.length }
    );
  }

  /**
   * Search bundles with filtering
   */
  async searchBundles(criteria: SearchCatalogCriteria): Promise<{
    bundles: CatalogBundle[];
    totalCount: number;
  }> {
    return withPerformanceLogging(
      this.logger,
      'search-bundles',
      async () => {
        let query = this.supabase
          .from('catalog_bundles')
          .select('*', { count: 'exact' });

        // Apply filters  
        if (criteria.countries?.length) {
          // TODO: Fix JSONB country filtering - temporarily disabled
          // The country filtering has syntax issues with JSONB queries
          // For now, skip country filtering to prevent errors
          this.logger.warn('Country filtering temporarily disabled due to JSONB query issues', {
            requestedCountries: criteria.countries,
            operationType: 'country-filter-disabled'
          });
        }

        if (criteria.bundleGroups?.length) {
          query = query.in('bundle_group', criteria.bundleGroups);
        }

        if (criteria.minDuration !== undefined) {
          query = query.gte('duration', criteria.minDuration);
        }

        if (criteria.maxDuration !== undefined) {
          query = query.lte('duration', criteria.maxDuration);
        }

        if (criteria.unlimited !== undefined) {
          query = query.eq('unlimited', criteria.unlimited);
        }

        // Apply pagination
        const limit = criteria.limit || 50;
        const offset = criteria.offset || 0;
        query = query
          .order('duration', { ascending: true })
          .order('data_amount', { ascending: true })
          .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
          this.logger.error('Search bundles failed', error, { criteria });
          throw error;
        }

        return {
          bundles: data || [],
          totalCount: count || 0
        };
      },
      { criteria }
    );
  }

  /**
   * Get bundles by group
   */
  async getBundlesByGroup(bundleGroup: string): Promise<CatalogBundle[]> {
    const { data, error } = await this.supabase
      .from('catalog_bundles')
      .select('*')
      .eq('bundle_group', bundleGroup)
      .order('duration', { ascending: true });

    if (error) {
      this.logger.error('Failed to get bundles by group', error, { bundleGroup });
      throw error;
    }

    return data || [];
  }

  /**
   * Get all unique bundle groups
   */
  async getAvailableBundleGroups(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('catalog_bundles')
      .select('bundle_group')
      .not('bundle_group', 'is', null)
      .order('bundle_group');

    if (error) {
      this.logger.error('Failed to get bundle groups', error);
      throw error;
    }

    // Extract unique groups
    const uniqueGroups = [...new Set(data?.map(row => row.bundle_group) || [])];
    return uniqueGroups.filter(Boolean) as string[];
  }

  /**
   * Get all unique countries from bundles
   */
  async getUniqueCountries(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('catalog_bundles')
      .select('countries');

    if (error) {
      this.logger.error('Failed to get unique countries', error);
      throw error;
    }

    const allCountries = new Set<string>();
    
    for (const bundle of data || []) {
      if (bundle.countries && Array.isArray(bundle.countries)) {
        for (const country of bundle.countries) {
          if (typeof country === 'string') {
            allCountries.add(country);
          }
        }
      }
    }

    const uniqueCountries = Array.from(allCountries).sort();
    
    this.logger.info('Retrieved unique countries', {
      countryCount: uniqueCountries.length,
      operationType: 'get-unique-countries'
    });

    return uniqueCountries;
  }

  /**
   * Get bundles for a specific country
   */
  async getBundlesByCountry(countryId: string): Promise<CatalogBundle[]> {
    return withPerformanceLogging(
      this.logger,
      'get-bundles-by-country',
      async () => {
        // First try with contains operator
        let { data, error } = await this.supabase
          .from('catalog_bundles')
          .select('*')
          .contains('countries', [countryId]);
        
        // If contains fails, fallback to fetching all and filtering
        if (error) {
          this.logger.warn('Contains query failed, using fallback filtering', {
            countryId,
            error: error.message
          });
          
          const { data: allBundles, error: fallbackError } = await this.supabase
            .from('catalog_bundles')
            .select('*');
            
          if (fallbackError) {
            throw fallbackError;
          }
          
          data = (allBundles || []).filter(bundle => 
            bundle.countries && 
            Array.isArray(bundle.countries) && 
            bundle.countries.includes(countryId)
          );
        }
        
        this.logger.info('Retrieved bundles for country', {
          countryId,
          bundleCount: data?.length || 0,
          operationType: 'get-bundles-by-country'
        });
        
        return data || [];
      },
      { countryId }
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
      this.logger,
      'get-bundles-by-country-aggregation',
      async () => {
        const { data, error } = await this.supabase
          .from('catalog_bundles')
          .select('countries');

        if (error) {
          this.logger.error('Failed to get country aggregation', error);
          throw error;
        }

        // Aggregate countries and count bundles
        const countryBundleCount = new Map<string, number>();
        
        this.logger.debug('Raw bundle data sample', {
          totalBundles: data?.length || 0,
          sampleBundles: (data || []).slice(0, 3).map(bundle => ({
            id: bundle.id,
            countries: bundle.countries,
            countryType: typeof bundle.countries,
            isArray: Array.isArray(bundle.countries)
          })),
          operationType: 'country-aggregation-debug'
        });
        
        for (const bundle of data || []) {
          if (bundle.countries && Array.isArray(bundle.countries)) {
            for (const country of bundle.countries) {
              if (typeof country === 'string') {
                countryBundleCount.set(country, (countryBundleCount.get(country) || 0) + 1);
              } else {
                this.logger.debug('Non-string country found', {
                  country,
                  type: typeof country,
                  bundleId: bundle.id
                });
              }
            }
          } else {
            this.logger.debug('Bundle without valid countries array', {
              bundleId: bundle.id,
              countries: bundle.countries,
              type: typeof bundle.countries
            });
          }
        }

        // Convert to array and sort by country name
        // Note: countryId here is actually the ISO code from the database
        const result = Array.from(countryBundleCount.entries())
          .map(([countryIso, bundleCount]) => ({
            countryId: countryIso, // Using ISO code as the ID
            countryName: countryIso, // For now, use ISO code as name - frontend will map to full names
            bundleCount
          }))
          .sort((a, b) => a.countryName.localeCompare(b.countryName));

        this.logger.info('Country aggregation completed', {
          countryCount: result.length,
          totalBundles: data?.length || 0,
          uniqueCountries: Array.from(countryBundleCount.keys()),
          countryBundleCounts: Array.from(countryBundleCount.entries()),
          operationType: 'country-aggregation'
        });

        return result;
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
      this.logger,
      'get-bundles-by-region-aggregation',
      async () => {
        const { data, error } = await this.supabase
          .from('catalog_bundles')
          .select('regions, countries');

        if (error) {
          this.logger.error('Failed to get region aggregation', error);
          throw error;
        }

        // Aggregate regions and count bundles + countries
        const regionStats = new Map<string, { bundleCount: number; countries: Set<string> }>();
        
        this.logger.debug('Raw bundle data for regions', {
          totalBundles: data?.length || 0,
          sampleBundles: (data || []).slice(0, 3).map(bundle => ({
            id: bundle.id,
            regions: bundle.regions,
            countries: bundle.countries,
            regionType: typeof bundle.regions,
            isRegionArray: Array.isArray(bundle.regions)
          })),
          operationType: 'region-aggregation-debug'
        });
        
        for (const bundle of data || []) {
          if (bundle.regions && Array.isArray(bundle.regions)) {
            for (const region of bundle.regions) {
              if (typeof region === 'string' && region.trim()) {
                if (!regionStats.has(region)) {
                  regionStats.set(region, { bundleCount: 0, countries: new Set() });
                }
                
                const stats = regionStats.get(region)!;
                stats.bundleCount += 1;
                
                // Add countries from this bundle to the region's country set
                if (bundle.countries && Array.isArray(bundle.countries)) {
                  for (const country of bundle.countries) {
                    if (typeof country === 'string') {
                      stats.countries.add(country);
                    }
                  }
                }
              }
            }
          }
        }

        // Convert to array and sort by region name
        const result = Array.from(regionStats.entries())
          .map(([regionName, stats]) => ({
            regionName,
            bundleCount: stats.bundleCount,
            countryCount: stats.countries.size
          }))
          .sort((a, b) => a.regionName.localeCompare(b.regionName));

        this.logger.info('Region aggregation completed', {
          regionCount: result.length,
          totalBundles: data?.length || 0,
          regions: result.map(r => ({ name: r.regionName, bundles: r.bundleCount, countries: r.countryCount })),
          operationType: 'region-aggregation'
        });

        return result;
      }
    );
  }

  /**
   * Get bundles for a specific region
   */
  async getBundlesByRegion(regionName: string): Promise<CatalogBundle[]> {
    return withPerformanceLogging(
      this.logger,
      'get-bundles-by-region',
      async () => {
        // Query bundles that have this region in their regions array
        const { data, error } = await this.supabase
          .from('catalog_bundles')
          .select('*')
          .contains('regions', [regionName]);

        if (error) {
          this.logger.error('Failed to get bundles by region', error, {
            regionName,
            operationType: 'get-bundles-by-region'
          });
          throw error;
        }

        this.logger.info('Retrieved bundles for region', {
          regionName,
          bundleCount: data?.length || 0,
          operationType: 'get-bundles-by-region'
        });

        return data || [];
      }
    );
  }

  /**
   * Update bundle pricing
   */
  async updatePricing(bundleId: string, price: number): Promise<CatalogBundle | null> {
    const { data, error } = await this.supabase
      .from('catalog_bundles')
      .update({ 
        price_cents: Math.round(price * 100), // Convert to cents
        updated_at: new Date().toISOString()
      })
      .eq('esim_go_name', bundleId)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update bundle pricing', error, { bundleId, price });
      throw error;
    }

    return data;
  }

  /**
   * Get stale bundles that need refresh
   */
  async getStaleBundles(daysOld: number = 30): Promise<CatalogBundle[]> {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - daysOld);

    const { data, error } = await this.supabase
      .from('catalog_bundles')
      .select('*')
      .lt('updated_at', staleDate.toISOString())
      .order('updated_at', { ascending: true })
      .limit(100);

    if (error) {
      this.logger.error('Failed to get stale bundles', error, { daysOld });
      throw error;
    }

    return data || [];
  }

  /**
   * Delete bundles not seen in recent syncs
   */
  async deleteOrphanedBundles(daysOld: number = 60): Promise<number> {
    const orphanDate = new Date();
    orphanDate.setDate(orphanDate.getDate() - daysOld);

    const { data, error } = await this.supabase
      .from('catalog_bundles')
      .delete()
      .lt('updated_at', orphanDate.toISOString())
      .select('id');

    if (error) {
      this.logger.error('Failed to delete orphaned bundles', error, { daysOld });
      throw error;
    }

    const deletedCount = data?.length || 0;
    
    if (deletedCount > 0) {
      this.logger.info('Deleted orphaned bundles', {
        deletedCount,
        daysOld,
        operationType: 'cleanup'
      });
    }

    return deletedCount;
  }

}