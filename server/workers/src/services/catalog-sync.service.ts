import { ESimGoClient } from '@esim-go/client';
import { createLogger, withPerformanceLogging } from '@esim-go/utils';
import { config } from '../config/index.js';
import { 
  bundleRepository, 
  syncJobRepository, 
  catalogMetadataRepository 
} from './supabase.service.js';
import type { CatalogueResponseInner } from '@esim-go/client';

const logger = createLogger({ 
  component: 'CatalogSyncService',
  operationType: 'catalog-sync' 
});

export class CatalogSyncService {
  private client: ESimGoClient;
  
  // Bundle groups as per eSIM Go recommendations
  private readonly BUNDLE_GROUPS = [
    'Standard Fixed',
    'Standard - Unlimited Lite',
    'Standard - Unlimited Essential',
    'Standard - Unlimited Plus',
    'Regional Bundles'
  ];

  constructor() {
    this.client = new ESimGoClient({
      apiKey: config.esimGo.apiKey,
      baseUrl: config.esimGo.baseUrl,
      retryAttempts: config.esimGo.retryAttempts,
      logger,
    });
  }

  /**
   * Perform a full catalog sync using bundle group strategy
   */
  async performFullSync(jobId: string): Promise<void> {
    return withPerformanceLogging(
      logger,
      'full-catalog-sync',
      async () => {
        logger.info('Starting full catalog sync', {
          jobId,
          bundleGroups: this.BUNDLE_GROUPS,
          strategy: 'bundle-groups'
        });

        const results = {
          totalBundles: 0,
          bundlesAdded: 0,
          bundlesUpdated: 0,
          errors: [] as string[],
          bundleGroups: [] as string[],
        };

        // Update job status to running
        await syncJobRepository.startJob(jobId);

        try {
          // Sync each bundle group
          for (const group of this.BUNDLE_GROUPS) {
            try {
              const groupResults = await this.syncBundleGroup(group, jobId);
              
              results.totalBundles += groupResults.processed;
              results.bundlesAdded += groupResults.added;
              results.bundlesUpdated += groupResults.updated;
              results.bundleGroups.push(group);
              
              if (groupResults.errors.length > 0) {
                results.errors.push(...groupResults.errors);
              }

              // Update job progress
              await syncJobRepository.updateJobProgress(jobId, {
                bundlesProcessed: results.totalBundles,
                bundlesAdded: results.bundlesAdded,
                bundlesUpdated: results.bundlesUpdated,
                metadata: {
                  progress: `Completed ${results.bundleGroups.length}/${this.BUNDLE_GROUPS.length} groups`,
                  currentGroup: group,
                },
              });
            } catch (error) {
              const errorMsg = `Failed to sync bundle group ${group}: ${(error as Error).message}`;
              logger.error('Bundle group sync failed', error as Error, { 
                group, 
                jobId 
              });
              results.errors.push(errorMsg);
            }
          }

          // Record successful sync in metadata
          await catalogMetadataRepository.recordFullSync({
            totalBundles: results.totalBundles,
            bundleGroups: results.bundleGroups,
            metadata: {
              syncedAt: new Date().toISOString(),
              errors: results.errors,
            },
          });

          // Complete the job
          await syncJobRepository.completeJob(jobId, {
            bundlesProcessed: results.totalBundles,
            bundlesAdded: results.bundlesAdded,
            bundlesUpdated: results.bundlesUpdated,
            metadata: {
              bundleGroups: results.bundleGroups,
              errors: results.errors,
              completedAt: new Date().toISOString(),
            },
          });

          logger.info('Full catalog sync completed', {
            jobId,
            totalBundles: results.totalBundles,
            bundlesAdded: results.bundlesAdded,
            bundlesUpdated: results.bundlesUpdated,
            bundleGroups: results.bundleGroups,
            errors: results.errors.length,
          });
        } catch (error) {
          // Fail the job
          await syncJobRepository.failJob(jobId, error as Error);
          throw error;
        }
      },
      { jobId }
    );
  }

  /**
   * Sync a specific bundle group
   */
  async syncBundleGroup(
    bundleGroup: string, 
    jobId?: string
  ): Promise<{
    processed: number;
    added: number;
    updated: number;
    errors: string[];
  }> {
    return withPerformanceLogging(
      logger,
      'sync-bundle-group',
      async () => {
        logger.info('Syncing bundle group', { bundleGroup, jobId });

        const bundles: CatalogueResponseInner[] = [];
        const errors: string[] = [];

        try {
          // Fetch ALL bundles for this group using pagination
          let page = 1;
          let hasMore = true;
          const perPage = 50; // Max per page to avoid 401 errors

          while (hasMore) {
            logger.debug('Fetching page for bundle group', { 
              bundleGroup, 
              page, 
              perPage 
            });

            const response = await this.client.getCatalogueWithRetry({
              group: bundleGroup,
              perPage: perPage,
              page: page
            });

            if (response.data && response.data.length > 0) {
              bundles.push(...response.data);
              
              // If we got fewer bundles than perPage, we've reached the end
              if (response.data.length < perPage) {
                hasMore = false;
              } else {
                page++;
              }
            } else {
              // No more data
              hasMore = false;
            }

            logger.debug('Page fetched', {
              bundleGroup,
              page: page - (hasMore ? 0 : 1),
              bundlesThisPage: response.data?.length || 0,
              totalBundlesSoFar: bundles.length,
              hasMore
            });
          }

          logger.info('All pages fetched for bundle group', {
            bundleGroup,
            totalPages: page - (hasMore ? 1 : 0),
            totalBundles: bundles.length
          });

          // Bulk upsert bundles
          if (bundles.length > 0) {
            const upsertResult = await bundleRepository.bulkUpsert(bundles);
            
            logger.info('Bundle group sync completed', {
              bundleGroup,
              processed: bundles.length,
              added: upsertResult.added,
              updated: upsertResult.updated,
              errors: upsertResult.errors.length,
            });

            return {
              processed: bundles.length,
              added: upsertResult.added,
              updated: upsertResult.updated,
              errors: upsertResult.errors,
            };
          }

          return {
            processed: 0,
            added: 0,
            updated: 0,
            errors: [],
          };
        } catch (error) {
          const errorMsg = `Failed to sync bundle group ${bundleGroup}: ${(error as Error).message}`;
          errors.push(errorMsg);
          logger.error('Bundle group sync error', error as Error, { bundleGroup });
          
          return {
            processed: 0,
            added: 0,
            updated: 0,
            errors,
          };
        }
      },
      { bundleGroup }
    );
  }

  /**
   * Sync bundles for a specific country
   */
  async syncCountryBundles(
    countryId: string,
    jobId: string
  ): Promise<void> {
    return withPerformanceLogging(
      logger,
      'sync-country-bundles',
      async () => {
        logger.info('Starting country bundle sync', { countryId, jobId });

        await syncJobRepository.startJob(jobId);

        try {
          const bundles: CatalogueResponseInner[] = [];
          
          // Fetch bundles for the specific country
          const response = await this.client.getCatalogueWithRetry({
            countries: countryId,
            perPage: 50, // Max per page to avoid 401 errors
          });

          if (response.data) {
            bundles.push(...response.data);
          }

          // Upsert bundles
          const upsertResult = await bundleRepository.bulkUpsert(bundles);

          await syncJobRepository.completeJob(jobId, {
            bundlesProcessed: bundles.length,
            bundlesAdded: upsertResult.added,
            bundlesUpdated: upsertResult.updated,
            metadata: {
              countryId,
              errors: upsertResult.errors,
            },
          });

          logger.info('Country bundle sync completed', {
            countryId,
            jobId,
            processed: bundles.length,
            added: upsertResult.added,
            updated: upsertResult.updated,
          });
        } catch (error) {
          await syncJobRepository.failJob(jobId, error as Error);
          throw error;
        }
      },
      { countryId, jobId }
    );
  }

  /**
   * Check API health
   */
  async checkApiHealth(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Try to fetch a small set of bundles
      const response = await this.client.getCatalogueWithRetry({
        perPage: 1,
      });

      const responseTime = Date.now() - startTime;

      if (response.data) {
        await catalogMetadataRepository.updateApiHealth('healthy', {
          responseTime,
          checkedAt: new Date().toISOString(),
        });
      } else {
        await catalogMetadataRepository.updateApiHealth('degraded', {
          responseTime,
          checkedAt: new Date().toISOString(),
          reason: 'Empty response',
        });
      }
    } catch (error) {
      await catalogMetadataRepository.updateApiHealth('down', {
        error: (error as Error).message,
        checkedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle stuck jobs
   */
  async handleStuckJobs(): Promise<void> {
    const cancelledCount = await syncJobRepository.cancelStuckJobs(
      config.worker.stuckJobThreshold
    );

    if (cancelledCount > 0) {
      logger.warn('Cancelled stuck jobs', {
        count: cancelledCount,
        threshold: config.worker.stuckJobThreshold,
      });
    }
  }

  /**
   * Clean up old jobs
   */
  async cleanupOldJobs(): Promise<void> {
    const deletedCount = await syncJobRepository.cleanupOldJobs(
      config.worker.cleanupOldJobsDays
    );

    if (deletedCount > 0) {
      logger.info('Cleaned up old jobs', {
        count: deletedCount,
        daysToKeep: config.worker.cleanupOldJobsDays,
      });
    }
  }
}