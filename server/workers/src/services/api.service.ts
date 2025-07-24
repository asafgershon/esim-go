import { catalogSyncQueueManager } from '../queues/catalog-sync.queue.js';
import { syncJobRepository, catalogMetadataRepository } from './supabase.service.js';
import { createLogger } from '@esim-go/utils';

const logger = createLogger({ 
  component: 'WorkerApiService',
  operationType: 'api' 
});

/**
 * API service for managing catalog sync operations
 * This can be called from the main GraphQL server
 */
export const workerApiService = {
  /**
   * Trigger a full catalog sync
   */
  async triggerFullSync(userId?: string) {
    logger.info('Triggering full catalog sync', { userId });
    
    // Check if there's already an active full sync
    const hasActive = await syncJobRepository.hasActiveJob('full-sync');

    if (hasActive) {
      throw new Error('A full sync is already in progress');
    }

    const job = await catalogSyncQueueManager.addFullSyncJob('manual');
    
    return {
      jobId: job.id,
      status: 'queued',
      priority: job.opts.priority,
    };
  },

  /**
   * Trigger sync for a specific bundle group
   */
  async triggerGroupSync(bundleGroup: string, userId?: string) {
    logger.info('Triggering bundle group sync', { bundleGroup, userId });
    
    // Check if there's already an active sync for this group
    const hasActive = await syncJobRepository.hasActiveJob('group-sync');

    if (hasActive) {
      throw new Error(`A sync for bundle group ${bundleGroup} is already in progress`);
    }

    const job = await catalogSyncQueueManager.addGroupSyncJob(bundleGroup);
    
    return {
      jobId: job.id,
      bundleGroup,
      status: 'queued',
      priority: job.opts.priority,
    };
  },

  /**
   * Trigger sync for a specific country
   */
  async triggerCountrySync(countryId: string, userId?: string) {
    logger.info('Triggering country sync', { countryId, userId });
    
    // Check if there's already an active sync for this country
    const hasActive = await syncJobRepository.hasActiveJob('country-sync');

    if (hasActive) {
      throw new Error(`A sync for country ${countryId} is already in progress`);
    }

    const job = await catalogSyncQueueManager.addCountrySyncJob(countryId);
    
    return {
      jobId: job.id,
      countryId,
      status: 'queued',
      priority: job.opts.priority,
    };
  },

  /**
   * Get sync status and statistics
   */
  async getSyncStatus() {
    const [queueStats, syncStats, activeJobs] = await Promise.all([
      catalogSyncQueueManager.getQueueStats(),
      catalogMetadataRepository.getSyncStats(),
      syncJobRepository.getActiveJobs(),
    ]);

    return {
      queue: queueStats,
      sync: syncStats,
      activeJobs: activeJobs.map((job: any) => ({
        id: job.id,
        type: job.job_type,
        status: job.status,
        startedAt: job.started_at,
        bundlesProcessed: job.bundles_processed,
      })),
    };
  },

  /**
   * Get sync job history
   */
  async getSyncHistory(params: {
    status?: string;
    jobType?: string;
    limit?: number;
    offset?: number;
  }) {
    return syncJobRepository.getJobHistory(params.limit);
  },

  /**
   * Pause/resume sync operations
   */
  async pauseSyncOperations() {
    await catalogSyncQueueManager.pause();
    logger.info('Sync operations paused');
    return { status: 'paused' };
  },

  async resumeSyncOperations() {
    await catalogSyncQueueManager.resume();
    logger.info('Sync operations resumed');
    return { status: 'resumed' };
  },

  /**
   * Force cleanup of stuck jobs
   */
  async forceCleanupStuckJobs() {
    const cancelledCount = await syncJobRepository.cancelStuckJobs(30); // 30 minutes
    
    logger.info('Force cleanup completed', { cancelledCount });
    
    return {
      cancelledCount,
      message: `Cancelled ${cancelledCount} stuck jobs`,
    };
  },
};