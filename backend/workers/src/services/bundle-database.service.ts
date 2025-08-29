import { createClient } from '@supabase/supabase-js';
import { createLogger, withPerformanceLogging } from '@hiilo/utils';
import { config } from '../config/index.js';
import type { Database } from '@hiilo/supabase';

const logger = createLogger({ 
  component: 'BundleDatabaseService',
  operationType: 'bundle-persistence' 
});

type DBBundle = Database['public']['Tables']['catalog_bundles']['Row'];
type DBBundleInsert = Database['public']['Tables']['catalog_bundles']['Insert'];

export class BundleDatabaseService {
  private supabase;

  constructor() {
    this.supabase = createClient<Database>(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }

  /**
   * Bulk upsert transformed bundles to database
   * This method expects pre-transformed bundles from the transformer
   */
  async bulkUpsert(transformedBundles: DBBundleInsert[]): Promise<{
    added: number;
    updated: number;
    errors: string[];
  }> {
    return withPerformanceLogging(
      logger,
      'bulk-upsert-bundles',
      async () => {
        const results = {
          added: 0,
          updated: 0,
          errors: [] as string[],
        };

        if (transformedBundles.length === 0) {
          logger.warn('No bundles to upsert');
          return results;
        }

        // Process bundles in batches to avoid overwhelming the database
        const batchSize = 100;
        for (let i = 0; i < transformedBundles.length; i += batchSize) {
          const batch = transformedBundles.slice(i, i + batchSize);

          try {

            const { data, error } = await this.supabase
              .from('catalog_bundles')
              .upsert(batch, {
                onConflict: 'esim_go_name',
                ignoreDuplicates: false,
              })
              .select();

            if (error) {
              logger.error('Batch upsert failed', error, {
                batchIndex: i / batchSize,
                batchSize: batch.length,
              });
              results.errors.push(`Batch ${i / batchSize}: ${error.message}`);
            } else if (data) {
              // Count new vs updated based on created_at timestamps
              const now = new Date();
              data.forEach((bundle) => {
                const createdAt = new Date(bundle.created_at || '');
                const timeDiff = now.getTime() - createdAt.getTime();
                // If created within last 10 seconds, consider it new
                if (timeDiff < 10000) {
                  results.added++;
                } else {
                  results.updated++;
                }
              });

              logger.debug('Batch upsert successful', {
                batchIndex: i / batchSize,
                insertedCount: data.length,
                operationType: 'batch-upsert',
              });
            }
          } catch (error) {
            logger.error('Batch processing error', error as Error, {
              batchIndex: i / batchSize,
            });
            results.errors.push(
              `Batch ${i / batchSize}: ${(error as Error).message}`
            );
          }
        }

        logger.info('Bulk upsert completed', {
          totalBundles: transformedBundles.length,
          added: results.added,
          updated: results.updated,
          errors: results.errors.length,
          operationType: 'bulk-upsert-summary',
        });

        return results;
      },
      { bundleCount: transformedBundles.length }
    );
  }

  /**
   * Get existing bundle names for comparison
   * Useful for determining which bundles are new vs updated
   */
  async getExistingBundleNames(): Promise<Set<string>> {
    return withPerformanceLogging(
      logger,
      'get-existing-bundle-names',
      async () => {
        const bundleNames = new Set<string>();
        let hasMore = true;
        let offset = 0;
        const pageSize = 1000;

        while (hasMore) {
          const { data, error } = await this.supabase
            .from('catalog_bundles')
            .select('esim_go_name')
            .range(offset, offset + pageSize - 1);

          if (error) {
            logger.error('Failed to fetch existing bundle names', error);
            throw error;
          }

          if (data && data.length > 0) {
            data.forEach(bundle => bundleNames.add(bundle.esim_go_name));
            offset += pageSize;
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        logger.info('Fetched existing bundle names', {
          count: bundleNames.size,
          operationType: 'get-existing-bundles'
        });

        return bundleNames;
      }
    );
  }

  /**
   * Delete bundles not seen in recent syncs
   */
  async deleteOrphanedBundles(daysOld: number = 60): Promise<number> {
    return withPerformanceLogging(
      logger,
      'delete-orphaned-bundles',
      async () => {
        const orphanDate = new Date();
        orphanDate.setDate(orphanDate.getDate() - daysOld);

        const { data, error } = await this.supabase
          .from('catalog_bundles')
          .delete()
          .lt('synced_at', orphanDate.toISOString())
          .select('id');

        if (error) {
          logger.error('Failed to delete orphaned bundles', error, {
            daysOld,
          });
          throw error;
        }

        const deletedCount = data?.length || 0;

        if (deletedCount > 0) {
          logger.info('Deleted orphaned bundles', {
            deletedCount,
            daysOld,
            operationType: 'cleanup',
          });
        }

        return deletedCount;
      }
    );
  }

  /**
   * Get total bundle count
   */
  async getTotalBundleCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('catalog_bundles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      logger.error('Failed to get bundle count', error);
      throw error;
    }

    return count || 0;
  }

  /**
   * Get bundles by group (for validation/testing)
   */
  async getBundlesByGroup(bundleGroup: string): Promise<DBBundle[]> {
    const { data, error } = await this.supabase
      .from('catalog_bundles')
      .select('*')
      .contains('groups', [bundleGroup])
      .order('duration', { ascending: true });

    if (error) {
      logger.error('Failed to get bundles by group', error, {
        bundleGroup,
      });
      throw error;
    }

    return data || [];
  }
}