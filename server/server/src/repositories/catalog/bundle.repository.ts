import { BaseSupabaseRepository } from '../base-supabase.repository';
import { type Database } from '../../database.types';
import { createLogger, withPerformanceLogging } from '../../lib/logger';
import type { CatalogueResponseInner } from '@esim-go/client';

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
          .eq('bundle_id', bundleId)
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

        // Process in batches to avoid overwhelming the database
        const batchSize = 100;
        for (let i = 0; i < bundles.length; i += batchSize) {
          const batch = bundles.slice(i, i + batchSize);
          
          try {
            // Transform eSIM Go bundles to our database format
            const bundlesToUpsert: CatalogBundleInsert[] = batch.map(bundle => ({
              bundle_id: bundle.name!,  // Using name as bundle_id
              name: bundle.name!,
              bundle_group: bundle.bundleGroup || null,
              description: bundle.description || null,
              duration: bundle.duration || 0,
              data_amount: this.normalizeDataAmount(bundle.dataAmount),
              unlimited: bundle.unlimited || false,
              price: bundle.price || 0,
              countries: bundle.countries || [],
              metadata: {
                originalBundle: bundle,
                lastSyncedAt: new Date().toISOString()
              }
            }));

            const { data, error } = await this.supabase
              .from('catalog_bundles')
              .upsert(bundlesToUpsert, {
                onConflict: 'bundle_id',
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
                const createdAt = new Date(bundle.created_at);
                const timeDiff = now.getTime() - createdAt.getTime();
                // If created within last 5 seconds, consider it new
                if (timeDiff < 5000) {
                  results.added++;
                } else {
                  results.updated++;
                }
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
          // Use PostgreSQL's ?| operator for "contains any"
          query = query.contains('countries', criteria.countries);
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
   * Update bundle pricing
   */
  async updatePricing(bundleId: string, price: number): Promise<CatalogBundle | null> {
    const { data, error } = await this.supabase
      .from('catalog_bundles')
      .update({ 
        price: price,
        updated_at: new Date().toISOString()
      })
      .eq('bundle_id', bundleId)
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

  /**
   * Normalize data amount to MB (-1 for unlimited)
   */
  private normalizeDataAmount(dataAmount?: number | null): number {
    if (!dataAmount || dataAmount === 0) {
      return -1; // Unlimited
    }
    // Return data in MB as provided by API
    return dataAmount;
  }
}