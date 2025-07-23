import { BaseSupabaseRepository } from '../base-supabase.repository';
import { type Database } from '../../database.types';
import { createLogger, withPerformanceLogging } from '../../lib/logger';
import { z } from 'zod';

type CatalogSyncJob = Database['public']['Tables']['catalog_sync_jobs']['Row'];
type CatalogSyncJobInsert = Database['public']['Tables']['catalog_sync_jobs']['Insert'];
type CatalogSyncJobUpdate = Database['public']['Tables']['catalog_sync_jobs']['Update'];

export type JobType = 'full-sync' | 'country-sync' | 'group-sync' | 'bundle-sync';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type JobPriority = 'high' | 'normal' | 'low';

// Zod schemas for validation and type safety
const JobTypeSchema = z.enum(['full-sync', 'country-sync', 'group-sync', 'bundle-sync']);
const JobStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']);
const JobPrioritySchema = z.enum(['high', 'normal', 'low']);

const CreateSyncJobParamsSchema = z.object({
  jobType: JobTypeSchema,
  priority: JobPrioritySchema.optional(),
  bundleGroup: z.string().optional(),
  countryId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const UpdateSyncJobParamsSchema = z.object({
  status: JobStatusSchema.optional(),
  errorMessage: z.string().optional(),
  bundlesProcessed: z.number().int().min(0).optional(),
  bundlesAdded: z.number().int().min(0).optional(),
  bundlesUpdated: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export interface CreateSyncJobParams {
  jobType: JobType;
  priority?: JobPriority;
  bundleGroup?: string;
  countryId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateSyncJobParams {
  status?: JobStatus;
  errorMessage?: string;
  bundlesProcessed?: number;
  bundlesAdded?: number;
  bundlesUpdated?: number;
  metadata?: Record<string, any>;
}

// Helper function to map camelCase params to snake_case database fields
function mapUpdateParamsToDbFields(params: UpdateSyncJobParams): CatalogSyncJobUpdate {
  const updateData: CatalogSyncJobUpdate = {
    updated_at: new Date().toISOString()
  };

  // Validate input
  const validatedParams = UpdateSyncJobParamsSchema.parse(params);

  // Map camelCase to snake_case with validation
  if (validatedParams.status !== undefined) {
    updateData.status = validatedParams.status;
  }
  if (validatedParams.errorMessage !== undefined) {
    updateData.error_message = validatedParams.errorMessage;
  }
  if (validatedParams.bundlesProcessed !== undefined) {
    updateData.bundles_processed = validatedParams.bundlesProcessed;
  }
  if (validatedParams.bundlesAdded !== undefined) {
    updateData.bundles_added = validatedParams.bundlesAdded;
  }
  if (validatedParams.bundlesUpdated !== undefined) {
    updateData.bundles_updated = validatedParams.bundlesUpdated;
  }
  if (validatedParams.metadata !== undefined) {
    updateData.metadata = validatedParams.metadata;
  }

  return updateData;
}

export class SyncJobRepository extends BaseSupabaseRepository {
  private logger = createLogger({ 
    component: 'SyncJobRepository',
    operationType: 'sync-job-management'
  });

  /**
   * Create a new sync job
   */
  async createJob(params: CreateSyncJobParams): Promise<CatalogSyncJob> {
    return withPerformanceLogging(
      this.logger,
      'create-sync-job',
      async () => {
        // Validate input with Zod
        const validatedParams = CreateSyncJobParamsSchema.parse(params);

        const jobData: CatalogSyncJobInsert = {
          job_type: validatedParams.jobType,
          status: 'pending',
          priority: validatedParams.priority || 'normal',
          bundle_group: validatedParams.bundleGroup || null,
          country_id: validatedParams.countryId || null,
          metadata: validatedParams.metadata || {},
          created_at: new Date().toISOString()
        };

        const { data, error } = await this.supabase
          .from('catalog_sync_jobs')
          .insert(jobData)
          .select()
          .single();

        if (error) {
          this.logger.error('Failed to create sync job', error, { params });
          throw error;
        }

        this.logger.info('Sync job created', {
          jobId: data.id,
          jobType: data.job_type,
          priority: data.priority,
          operationType: 'job-created'
        });

        return data;
      },
      { jobType: params.jobType }
    );
  }

  /**
   * Get next pending job based on priority
   */
  async getNextPendingJob(): Promise<CatalogSyncJob | null> {
    return withPerformanceLogging(
      this.logger,
      'get-next-pending-job',
      async () => {
        // Use the active_sync_jobs view for better query
        const { data, error } = await this.supabase
          .from('catalog_sync_jobs')
          .select('*')
          .eq('status', 'pending')
          .order('priority', { ascending: true })
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return null; // No pending jobs
          }
          this.logger.error('Failed to get pending job', error);
          throw error;
        }

        return data;
      }
    );
  }

  /**
   * Start a job (mark as running)
   */
  async startJob(jobId: string): Promise<CatalogSyncJob> {
    const { data, error } = await this.supabase
      .from('catalog_sync_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .eq('status', 'pending') // Only start if still pending
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to start job', error, { jobId });
      throw error;
    }

    if (!data) {
      throw new Error('Job not found or already started');
    }

    this.logger.info('Sync job started', {
      jobId: data.id,
      jobType: data.job_type,
      operationType: 'job-started'
    });

    return data;
  }

  /**
   * Update job progress
   */
  async updateJobProgress(
    jobId: string, 
    params: UpdateSyncJobParams
  ): Promise<CatalogSyncJob> {
    try {
      // Use Zod validation and field mapping
      const updateData = mapUpdateParamsToDbFields(params);

      // If completing or failing, set completed_at
      if (params.status === 'completed' || params.status === 'failed') {
        updateData.completed_at = new Date().toISOString();
      }

      this.logger.debug('Updating job progress with validated data', {
        jobId,
        updateData,
        operationType: 'job-progress-update'
      });

      const { data, error } = await this.supabase
        .from('catalog_sync_jobs')
        .update(updateData)
        .eq('id', jobId)
        .select()
        .single();

      if (error) {
        this.logger.error('Failed to update job progress', error, { jobId, params, updateData });
        throw error;
      }

      this.logger.info('Job progress updated successfully', {
        jobId: data.id,
        status: data.status,
        bundlesProcessed: data.bundles_processed,
        operationType: 'job-progress-updated'
      });

      return data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Validation error in updateJobProgress', undefined, {
          jobId,
          params,
          validationErrors: error.errors,
          operationType: 'job-progress-validation-error'
        });
        throw new Error(`Invalid job progress parameters: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Complete a job successfully
   */
  async completeJob(
    jobId: string,
    results: {
      bundlesProcessed: number;
      bundlesAdded: number;
      bundlesUpdated: number;
      metadata?: Record<string, any>;
    }
  ): Promise<CatalogSyncJob> {
    return this.updateJobProgress(jobId, {
      status: 'completed',
      bundlesProcessed: results.bundlesProcessed,
      bundlesAdded: results.bundlesAdded,
      bundlesUpdated: results.bundlesUpdated,
      metadata: results.metadata
    });
  }

  /**
   * Fail a job with error
   */
  async failJob(jobId: string, error: Error): Promise<CatalogSyncJob> {
    return this.updateJobProgress(jobId, {
      status: 'failed',
      errorMessage: error.message,
      metadata: {
        errorStack: error.stack,
        errorName: error.name
      }
    });
  }

  /**
   * Get active jobs (pending or running)
   */
  async getActiveJobs(): Promise<CatalogSyncJob[]> {
    const { data, error } = await this.supabase
      .from('catalog_sync_jobs')
      .select('*')
      .in('status', ['pending', 'running'])
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('Failed to get active jobs', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get stuck jobs (running for more than specified minutes)
   */
  async getStuckJobs(minutesThreshold: number = 60): Promise<CatalogSyncJob[]> {
    const thresholdTime = new Date();
    thresholdTime.setMinutes(thresholdTime.getMinutes() - minutesThreshold);

    const { data, error } = await this.supabase
      .from('catalog_sync_jobs')
      .select('*')
      .eq('status', 'running')
      .lt('started_at', thresholdTime.toISOString());

    if (error) {
      this.logger.error('Failed to get stuck jobs', error);
      throw error;
    }

    if (data && data.length > 0) {
      this.logger.warn('Found stuck jobs', {
        count: data.length,
        minutesThreshold,
        operationType: 'stuck-jobs-detected'
      });
    }

    return data || [];
  }

  /**
   * Cancel stuck jobs
   */
  async cancelStuckJobs(minutesThreshold: number = 60): Promise<number> {
    const stuckJobs = await this.getStuckJobs(minutesThreshold);
    let cancelledCount = 0;

    for (const job of stuckJobs) {
      try {
        await this.updateJobProgress(job.id, {
          status: 'cancelled',
          errorMessage: `Job cancelled after running for more than ${minutesThreshold} minutes`
        });
        cancelledCount++;
      } catch (error) {
        this.logger.error('Failed to cancel stuck job', error as Error, { jobId: job.id });
      }
    }

    if (cancelledCount > 0) {
      this.logger.info('Cancelled stuck jobs', {
        cancelledCount,
        minutesThreshold,
        operationType: 'stuck-jobs-cancelled'
      });
    }

    return cancelledCount;
  }

  /**
   * Get job history with pagination
   */
  async getJobHistory(params: {
    status?: JobStatus;
    jobType?: JobType;
    limit?: number;
    offset?: number;
  }): Promise<{
    jobs: CatalogSyncJob[];
    totalCount: number;
  }> {
    let query = this.supabase
      .from('catalog_sync_jobs')
      .select('*', { count: 'exact' });

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.jobType) {
      query = query.eq('job_type', params.jobType);
    }

    const limit = params.limit || 50;
    const offset = params.offset || 0;

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Failed to get job history', error, { params });
      throw error;
    }

    return {
      jobs: data || [],
      totalCount: count || 0
    };
  }

  /**
   * Check if a similar job is already pending or running
   */
  async hasActiveJob(params: {
    jobType: JobType;
    bundleGroup?: string;
    countryId?: string;
  }): Promise<boolean> {
    let query = this.supabase
      .from('catalog_sync_jobs')
      .select('id')
      .in('status', ['pending', 'running'])
      .eq('job_type', params.jobType);

    if (params.bundleGroup) {
      query = query.eq('bundle_group', params.bundleGroup);
    }

    if (params.countryId) {
      query = query.eq('country_id', params.countryId);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      this.logger.error('Failed to check for active job', error, { params });
      throw error;
    }

    return (data?.length || 0) > 0;
  }

  /**
   * Cancel pending jobs that match the criteria
   */
  async cancelPendingJobs(params: {
    jobType: JobType;
    bundleGroup?: string;
    countryId?: string;
  }): Promise<number> {
    return withPerformanceLogging(
      this.logger,
      'cancel-pending-jobs',
      async () => {
        let query = this.supabase
          .from('catalog_sync_jobs')
          .update({
            status: 'cancelled',
            error_message: 'Cancelled to allow new sync job',
            updated_at: new Date().toISOString(),
            completed_at: new Date().toISOString()
          })
          .eq('status', 'pending')
          .eq('job_type', params.jobType);

        if (params.bundleGroup) {
          query = query.eq('bundle_group', params.bundleGroup);
        }

        if (params.countryId) {
          query = query.eq('country_id', params.countryId);
        }

        const { data, error } = await query.select('id');

        if (error) {
          this.logger.error('Failed to cancel pending jobs', error, { params });
          throw error;
        }

        const cancelledCount = data?.length || 0;

        if (cancelledCount > 0) {
          this.logger.info('Cancelled pending sync jobs', {
            cancelledCount,
            jobType: params.jobType,
            bundleGroup: params.bundleGroup,
            countryId: params.countryId,
            operationType: 'pending-jobs-cancelled'
          });
        }

        return cancelledCount;
      },
      { jobType: params.jobType }
    );
  }

  /**
   * Get active job details for conflict checking
   */
  async getActiveJobDetails(params: {
    jobType: JobType;
    bundleGroup?: string;
    countryId?: string;
  }): Promise<CatalogSyncJob | null> {
    return withPerformanceLogging(
      this.logger,
      'get-active-job-details',
      async () => {
        let query = this.supabase
          .from('catalog_sync_jobs')
          .select('*')
          .in('status', ['pending', 'running'])
          .eq('job_type', params.jobType);

        if (params.bundleGroup) {
          query = query.eq('bundle_group', params.bundleGroup);
        }

        if (params.countryId) {
          query = query.eq('country_id', params.countryId);
        }

        const { data, error } = await query
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return null; // No active jobs
          }
          this.logger.error('Failed to get active job details', error, { params });
          throw error;
        }

        return data;
      },
      { jobType: params.jobType }
    );
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await this.supabase
      .from('catalog_sync_jobs')
      .delete()
      .in('status', ['completed', 'failed', 'cancelled'])
      .lt('completed_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      this.logger.error('Failed to cleanup old jobs', error, { daysToKeep });
      throw error;
    }

    const deletedCount = data?.length || 0;

    if (deletedCount > 0) {
      this.logger.info('Cleaned up old sync jobs', {
        deletedCount,
        daysToKeep,
        operationType: 'job-cleanup'
      });
    }

    return deletedCount;
  }
}