import { getPubSub, publishEvent, PubSubEvents } from '../context/pubsub';
import { createLogger } from '../lib/logger';

const logger = createLogger({ component: 'PubSubTest' });

/**
 * Example function to test catalog sync progress publishing
 * This demonstrates how to publish WebSocket events
 */
export async function publishTestSyncProgress() {
  try {
    const pubsub = await getPubSub();
    
    // Example sync progress event
    const progressUpdate = {
      jobId: 'test-job-123',
      jobType: 'FULL_SYNC' as const,
      status: 'PROCESSING' as const,
      bundleGroup: null,
      countryId: null,
      bundlesProcessed: 150,
      bundlesAdded: 120,
      bundlesUpdated: 30,
      totalBundles: 500,
      progress: 30, // 30% complete
      message: 'Processing Standard Fixed bundles...',
      errorMessage: null,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Publish the event
    await publishEvent(pubsub, PubSubEvents.CATALOG_SYNC_PROGRESS, progressUpdate);
    
    logger.info('Test sync progress event published successfully', {
      jobId: progressUpdate.jobId,
      progress: progressUpdate.progress,
      operationType: 'test-pubsub-publish'
    });

    return { success: true, message: 'Test event published' };
  } catch (error) {
    logger.error('Failed to publish test sync progress', error as Error, {
      operationType: 'test-pubsub-publish'
    });
    throw error;
  }
}

/**
 * Example function showing how to publish from a sync service
 * This would be called from your actual sync service
 */
export async function publishSyncProgressFromService(
  jobId: string,
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
  bundlesProcessed: number,
  totalBundles: number,
  bundleGroup?: string,
  errorMessage?: string
) {
  try {
    const pubsub = await getPubSub();
    
    const progressUpdate = {
      jobId,
      jobType: bundleGroup ? 'GROUP_SYNC' as const : 'FULL_SYNC' as const,
      status,
      bundleGroup: bundleGroup || null,
      countryId: null,
      bundlesProcessed,
      bundlesAdded: bundlesProcessed, // Simplified for example
      bundlesUpdated: 0,
      totalBundles,
      progress: totalBundles > 0 ? Math.round((bundlesProcessed / totalBundles) * 100) : 0,
      message: bundleGroup ? `Processing ${bundleGroup}...` : 'Full catalog sync in progress...',
      errorMessage: errorMessage || null,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await publishEvent(pubsub, PubSubEvents.CATALOG_SYNC_PROGRESS, progressUpdate);
    
    logger.info('Sync progress published', {
      jobId,
      status,
      progress: progressUpdate.progress,
      operationType: 'sync-progress-publish'
    });
  } catch (error) {
    logger.error('Failed to publish sync progress', error as Error, {
      jobId,
      operationType: 'sync-progress-publish'
    });
  }
}