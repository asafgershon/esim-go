import { ESimGoClient } from '@esim-go/client';
import { createLogger, withPerformanceLogging } from '../lib/logger';
import { 
  BundleRepository,
  SyncJobRepository,
  CatalogMetadataRepository,
  type SearchCatalogCriteria 
} from '../repositories/catalog';
import type { CatalogueResponseInner } from '@esim-go/client';
import { supabaseAdmin } from '../context/supabase-auth';

/**
 * CatalogSyncService V2 - Uses shared client and worker system
 * 
 * This is a facade that delegates heavy sync operations to the worker system
 * while providing direct access to cached catalog data
 */
export class CatalogSyncServiceV2 {
  private client: ESimGoClient;
  private bundleRepository: BundleRepository;
  private syncJobRepository: SyncJobRepository;
  private catalogMetadataRepository: CatalogMetadataRepository;
  private logger = createLogger({ 
    component: 'CatalogSyncServiceV2',
    operationType: 'catalog-sync' 
  });

  constructor(apiKey: string, baseUrl?: string) {
    this.client = new ESimGoClient({
      apiKey,
      baseUrl: baseUrl || 'https://api.esim-go.com/v2.5',
      retryAttempts: 3,
      logger: this.logger,
    });
    
    // Initialize repositories
    this.bundleRepository = new BundleRepository(supabaseAdmin);
    this.syncJobRepository = new SyncJobRepository(supabaseAdmin);
    this.catalogMetadataRepository = new CatalogMetadataRepository(supabaseAdmin);
  }

  /**
   * Trigger a full catalog sync
   * Note: In production, this should be called via the worker system
   */
  async triggerFullSync(userId?: string): Promise<{
    jobId: string;
    status: string;
    priority: string;
  }> {
    return withPerformanceLogging(
      this.logger,
      'trigger-full-sync',
      async () => {
        this.logger.info('Creating full catalog sync job', { userId });
        
        try {
          // Check if there's already an active full sync
          const hasActive = await this.syncJobRepository.hasActiveJob({
            jobType: 'full-sync',
          });

          if (hasActive) {
            throw new Error('A full sync is already in progress');
          }

          // Create a sync job in the database
          const job = await this.syncJobRepository.createJob({
            jobType: 'full-sync',
            priority: 'high',
            metadata: {
              triggeredBy: userId || 'manual',
              timestamp: new Date().toISOString(),
            },
          });
          
          this.logger.info('Full sync job created', {
            jobId: job.id,
            status: job.status,
            priority: job.priority,
          });
          
          return {
            jobId: job.id,
            status: job.status,
            priority: job.priority,
          };
        } catch (error) {
          this.logger.error('Failed to create full sync job', error as Error);
          throw error;
        }
      }
    );
  }

  /**
   * Trigger sync for a specific bundle group
   */
  async triggerGroupSync(bundleGroup: string, userId?: string): Promise<{
    jobId: string;
    bundleGroup: string;
    status: string;
    priority: string;
  }> {
    return withPerformanceLogging(
      this.logger,
      'trigger-group-sync',
      async () => {
        this.logger.info('Creating bundle group sync job', { bundleGroup, userId });
        
        try {
          // Check if there's already an active sync for this group
          const hasActive = await this.syncJobRepository.hasActiveJob({
            jobType: 'group-sync',
            bundleGroup,
          });

          if (hasActive) {
            throw new Error(`A sync for bundle group ${bundleGroup} is already in progress`);
          }

          const job = await syncJobRepository.createJob({
            jobType: 'group-sync',
            priority: 'normal',
            bundleGroup,
            metadata: {
              triggeredBy: userId || 'manual',
              timestamp: new Date().toISOString(),
            },
          });
          
          this.logger.info('Group sync job created', {
            jobId: job.id,
            bundleGroup,
            status: job.status,
            priority: job.priority,
          });
          
          return {
            jobId: job.id,
            bundleGroup,
            status: job.status,
            priority: job.priority,
          };
        } catch (error) {
          this.logger.error('Failed to create group sync job', error as Error, { bundleGroup });
          throw error;
        }
      },
      { bundleGroup }
    );
  }

  /**
   * Trigger sync for a specific country
   */
  async triggerCountrySync(countryId: string, userId?: string): Promise<{
    jobId: string;
    countryId: string;
    status: string;
    priority: string;
  }> {
    return withPerformanceLogging(
      this.logger,
      'trigger-country-sync',
      async () => {
        this.logger.info('Creating country sync job', { countryId, userId });
        
        try {
          // Check if there's already an active sync for this country
          const hasActive = await this.syncJobRepository.hasActiveJob({
            jobType: 'country-sync',
            countryId,
          });

          if (hasActive) {
            throw new Error(`A sync for country ${countryId} is already in progress`);
          }

          const job = await syncJobRepository.createJob({
            jobType: 'country-sync',
            priority: 'normal',
            countryId,
            metadata: {
              triggeredBy: userId || 'manual',
              timestamp: new Date().toISOString(),
            },
          });
          
          this.logger.info('Country sync job created', {
            jobId: job.id,
            countryId,
            status: job.status,
            priority: job.priority,
          });
          
          return {
            jobId: job.id,
            countryId,
            status: job.status,
            priority: job.priority,
          };
        } catch (error) {
          this.logger.error('Failed to create country sync job', error as Error, { countryId });
          throw error;
        }
      },
      { countryId }
    );
  }

  /**
   * Get sync status and statistics
   */
  async getSyncStatus(): Promise<any> {
    return withPerformanceLogging(
      this.logger,
      'get-sync-status',
      async () => {
        try {
          const [syncStats, activeJobs] = await Promise.all([
            this.catalogMetadataRepository.getSyncStats(),
            this.syncJobRepository.getActiveJobs(),
          ]);
          
          const status = {
            sync: syncStats,
            activeJobs: activeJobs.map(job => ({
              id: job.id,
              type: job.job_type,
              status: job.status,
              startedAt: job.started_at,
              bundlesProcessed: job.bundles_processed,
            })),
          };
          
          this.logger.info('Retrieved sync status', {
            activeJobs: status.activeJobs.length,
            lastSyncedAt: status.sync.lastSyncedAt,
          });
          
          return status;
        } catch (error) {
          this.logger.error('Failed to get sync status', error as Error);
          throw error;
        }
      }
    );
  }

  /**
   * Search bundles from the persistent catalog
   */
  async searchBundles(criteria: SearchCatalogCriteria): Promise<{
    bundles: CatalogueResponseInner[];
    totalCount: number;
  }> {
    return withPerformanceLogging(
      this.logger,
      'search-bundles',
      async () => {
        this.logger.info('Searching bundles from persistent storage', {
          country: criteria.country,
          duration: criteria.duration,
          bundleGroup: criteria.bundleGroup,
          limit: criteria.limit,
        });
        
        try {
          const result = await this.bundleRepository.searchBundles(criteria);
          
          this.logger.info('Bundle search completed', {
            resultCount: result.bundles.length,
            totalCount: result.totalCount,
            country: criteria.country,
            duration: criteria.duration,
          });
          
          return result;
        } catch (error) {
          this.logger.error('Failed to search bundles', error as Error, { criteria });
          throw error;
        }
      },
      { 
        country: criteria.country,
        duration: criteria.duration,
      }
    );
  }

  /**
   * Get a specific bundle by ID
   */
  async getBundleById(bundleId: string): Promise<CatalogueResponseInner | null> {
    return withPerformanceLogging(
      this.logger,
      'get-bundle-by-id',
      async () => {
        this.logger.info('Fetching bundle by ID', { bundleId });
        
        try {
          const bundle = await this.bundleRepository.getByBundleId(bundleId);
          
          if (bundle) {
            this.logger.info('Bundle found', {
              bundleId,
              bundleName: bundle.name,
              dataAmount: bundle.dataAmount,
              price: bundle.price,
            });
          } else {
            this.logger.info('Bundle not found', { bundleId });
          }
          
          return bundle;
        } catch (error) {
          this.logger.error('Failed to get bundle', error as Error, { bundleId });
          throw error;
        }
      },
      { bundleId }
    );
  }

  /**
   * Get all unique countries from the catalog
   */
  async getAvailableCountries(): Promise<string[]> {
    return withPerformanceLogging(
      this.logger,
      'get-available-countries',
      async () => {
        this.logger.info('Fetching available countries');
        
        try {
          const countries = await this.bundleRepository.getUniqueCountries();
          
          this.logger.info('Retrieved available countries', {
            countryCount: countries.length,
          });
          
          return countries;
        } catch (error) {
          this.logger.error('Failed to get available countries', error as Error);
          throw error;
        }
      }
    );
  }

  /**
   * Get sync job history
   */
  async getSyncHistory(params: {
    status?: string;
    jobType?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    return withPerformanceLogging(
      this.logger,
      'get-sync-history',
      async () => {
        try {
          const history = await this.syncJobRepository.getJobHistory({
            status: params.status as any,
            jobType: params.jobType as any,
            limit: params.limit,
            offset: params.offset,
          });
          
          this.logger.info('Retrieved sync history', {
            jobCount: history.jobs.length,
            totalCount: history.totalCount,
            status: params.status,
            jobType: params.jobType,
          });
          
          return history;
        } catch (error) {
          this.logger.error('Failed to get sync history', error as Error, { params });
          throw error;
        }
      }
    );
  }

  /**
   * Check if catalog needs sync
   */
  async checkIfSyncNeeded(): Promise<{
    needsSync: boolean;
    reason?: string;
    lastSyncedAt?: Date;
    daysSinceSync?: number;
  }> {
    return withPerformanceLogging(
      this.logger,
      'check-sync-needed',
      async () => {
        try {
          const isDue = await this.catalogMetadataRepository.isSyncDue();
          const stats = await this.catalogMetadataRepository.getSyncStats();
          
          let reason: string | undefined;
          if (isDue) {
            if (!stats.lastSyncedAt) {
              reason = 'Never synced';
            } else if (stats.daysSinceSync && stats.daysSinceSync >= 30) {
              reason = `Last sync was ${stats.daysSinceSync} days ago`;
            }
          }
          
          const result = {
            needsSync: isDue,
            reason,
            lastSyncedAt: stats.lastSyncedAt || undefined,
            daysSinceSync: stats.daysSinceSync || undefined,
          };
          
          this.logger.info('Sync check completed', result);
          
          return result;
        } catch (error) {
          this.logger.error('Failed to check sync status', error as Error);
          throw error;
        }
      }
    );
  }

  /**
   * Direct API call to get organization bundle groups
   * Useful for UI to show available groups
   */
  async getOrganizationBundleGroups(): Promise<string[]> {
    return withPerformanceLogging(
      this.logger,
      'get-organization-groups',
      async () => {
        try {
          const response = await this.client.getOrganisationWithRetry();
          const groups = response.data.bundleGroups || [];
          
          this.logger.info('Retrieved organization bundle groups', {
            groupCount: groups.length,
            groups: groups.map(g => g.name),
          });
          
          return groups.map(g => g.name);
        } catch (error) {
          this.logger.error('Failed to get organization groups', error as Error);
          throw error;
        }
      }
    );
  }
}