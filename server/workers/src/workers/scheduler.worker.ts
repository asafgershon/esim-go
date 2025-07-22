import { Worker } from 'bullmq';
import { createLogger } from '@esim-go/utils';
import { config } from '../config/index.js';
import { catalogSyncQueueManager } from '../queues/catalog-sync.queue.js';
import { CatalogSyncService } from '../services/catalog-sync.service.js';
import { catalogMetadataRepository } from '../services/supabase.service.js';
import IORedis from 'ioredis';

const logger = createLogger({ 
  component: 'SchedulerWorker',
  operationType: 'scheduler' 
});

// Create catalog sync service
const catalogSyncService = new CatalogSyncService();

// Scheduler tasks
const schedulerTasks = {
  /**
   * Check if a full sync is due and schedule it
   */
  async checkAndScheduleSync(): Promise<void> {
    try {
      const isDue = await catalogMetadataRepository.isSyncDue();
      
      if (isDue) {
        logger.info('Full sync is due, scheduling job');
        await catalogSyncQueueManager.addFullSyncJob('scheduled');
      } else {
        const stats = await catalogMetadataRepository.getSyncStats();
        logger.info('Full sync not due', {
          lastSyncedAt: stats.lastSyncedAt,
          nextSyncAt: stats.nextSyncAt,
          daysSinceSync: stats.daysSinceSync,
          daysUntilSync: stats.daysUntilSync,
        });
      }
    } catch (error) {
      logger.error('Failed to check sync schedule', error as Error);
    }
  },

  /**
   * Check API health
   */
  async checkApiHealth(): Promise<void> {
    try {
      await catalogSyncService.checkApiHealth();
    } catch (error) {
      logger.error('API health check failed', error as Error);
    }
  },

  /**
   * Handle stuck jobs
   */
  async handleStuckJobs(): Promise<void> {
    try {
      await catalogSyncService.handleStuckJobs();
    } catch (error) {
      logger.error('Failed to handle stuck jobs', error as Error);
    }
  },

  /**
   * Clean up old jobs
   */
  async cleanupOldJobs(): Promise<void> {
    try {
      await catalogSyncService.cleanupOldJobs();
      await catalogSyncQueueManager.cleanOldJobs();
    } catch (error) {
      logger.error('Failed to cleanup old jobs', error as Error);
    }
  },

  /**
   * Log queue statistics
   */
  async logQueueStats(): Promise<void> {
    try {
      const stats = await catalogSyncQueueManager.getQueueStats();
      logger.info('Queue statistics', {
        ...stats,
        operationType: 'queue-stats',
      });
    } catch (error) {
      logger.error('Failed to get queue stats', error as Error);
    }
  },
};

// Run scheduler tasks based on interval
let checkSyncInterval: NodeJS.Timeout;
let healthCheckInterval: NodeJS.Timeout;
let stuckJobsInterval: NodeJS.Timeout;
let cleanupInterval: NodeJS.Timeout;
let statsInterval: NodeJS.Timeout;

export function startScheduler() {
  logger.info('Starting scheduler worker');

  // Check for due syncs every hour
  checkSyncInterval = setInterval(
    () => schedulerTasks.checkAndScheduleSync(),
    60 * 60 * 1000 // 1 hour
  );

  // Check API health every 5 minutes
  healthCheckInterval = setInterval(
    () => schedulerTasks.checkApiHealth(),
    5 * 60 * 1000 // 5 minutes
  );

  // Check for stuck jobs every 10 minutes
  stuckJobsInterval = setInterval(
    () => schedulerTasks.handleStuckJobs(),
    10 * 60 * 1000 // 10 minutes
  );

  // Clean up old jobs daily
  cleanupInterval = setInterval(
    () => schedulerTasks.cleanupOldJobs(),
    24 * 60 * 60 * 1000 // 24 hours
  );

  // Log queue stats every 30 minutes
  statsInterval = setInterval(
    () => schedulerTasks.logQueueStats(),
    30 * 60 * 1000 // 30 minutes
  );

  // Run initial tasks
  schedulerTasks.checkAndScheduleSync();
  schedulerTasks.checkApiHealth();
  schedulerTasks.logQueueStats();

  logger.info('Scheduler worker started successfully');
}

export function stopScheduler() {
  logger.info('Stopping scheduler worker');
  
  clearInterval(checkSyncInterval);
  clearInterval(healthCheckInterval);
  clearInterval(stuckJobsInterval);
  clearInterval(cleanupInterval);
  clearInterval(statsInterval);
  
  logger.info('Scheduler worker stopped');
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, stopping scheduler');
  stopScheduler();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, stopping scheduler');
  stopScheduler();
});