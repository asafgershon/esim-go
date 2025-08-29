import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { createLogger } from '@hiilo/utils';
import type { Database } from '@hiilo/supabase';

const logger = createLogger({ component: 'SupabaseService' });

// Create Supabase client with service role key for admin operations
export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Create simple repository implementations for worker usage
// These are lightweight versions focused on worker needs

// Sync Job Repository
export const syncJobRepository = {
  async createJob(data: Database['public']['Tables']['catalog_sync_jobs']['Insert']) {
    const { data: job, error } = await supabase
      .from('catalog_sync_jobs')
      .insert({
        ...data,
        priority: data.priority || 'normal',
        status: 'pending' as const,
      })
      .select()
      .single();

    if (error) throw error;
    return job;
  },

  async startJob(jobId: string) {
    const { error } = await supabase
      .from('catalog_sync_jobs')
      .update({
        status: 'running' as const,
        started_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) throw error;
  },

  async updateJobProgress(jobId: string, data: any) {
    const { error } = await supabase
      .from('catalog_sync_jobs')
      .update({
        bundles_processed: data.bundlesProcessed,
        bundles_added: data.bundlesAdded,
        bundles_updated: data.bundlesUpdated,
        metadata: data.metadata,
      })
      .eq('id', jobId);

    if (error) throw error;
  },

  async completeJob(jobId: string, data: any) {
    const { error } = await supabase
      .from('catalog_sync_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        bundles_processed: data.bundlesProcessed,
        bundles_added: data.bundlesAdded,
        bundles_updated: data.bundlesUpdated,
        metadata: data.metadata,
      })
      .eq('id', jobId);

    if (error) throw error;
  },

  async failJob(jobId: string, error: Error) {
    const { error: updateError } = await supabase
      .from('catalog_sync_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message,
      })
      .eq('id', jobId);

    if (updateError) throw updateError;
  },

  async cancelStuckJobs(minutes: number) {
    const threshold = new Date();
    threshold.setMinutes(threshold.getMinutes() - minutes);

    const { data, error } = await supabase
      .from('catalog_sync_jobs')
      .update({
        status: 'cancelled',
        error_message: 'Job was stuck and cancelled',
      })
      .eq('status', 'running')
      .lt('started_at', threshold.toISOString())
      .select();

    if (error) throw error;
    return data?.length || 0;
  },

  async cleanupOldJobs(days: number) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);

    const { data, error } = await supabase
      .from('catalog_sync_jobs')
      .delete()
      .in('status', ['completed', 'failed', 'cancelled'])
      .lt('created_at', threshold.toISOString())
      .select();

    if (error) throw error;
    return data?.length || 0;
  },

  async hasActiveJob(jobType: string) {
    const { data, error } = await supabase
      .from('catalog_sync_jobs')
      .select('id')
      .eq('job_type', jobType)
      .in('status', ['pending', 'running'])
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  },

  async getActiveJobs() {
    const { data, error } = await supabase
      .from('catalog_sync_jobs')
      .select('*')
      .in('status', ['pending', 'running'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getJobHistory(limit = 50) {
    const { data, error } = await supabase
      .from('catalog_sync_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};

// Catalog Metadata Repository
export const catalogMetadataRepository = {
  async recordFullSync(data: any) {
    const { error } = await supabase
      .from('catalog_metadata')
      .upsert({
        id: 'singleton',
        last_full_sync: new Date().toISOString(),
        total_bundles: data.totalBundles,
        bundle_groups: data.bundleGroups,
        metadata: data.metadata,
        sync_strategy: 'bundle-groups',
      });

    if (error) throw error;
  },

  async recordPartialSync(data: any) {
    const { error } = await supabase
      .from('catalog_metadata')
      .update({
        total_bundles: data.totalBundles,
        bundle_groups: data.bundleGroups,
        metadata: data.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'singleton');

    if (error) throw error;
  },

  async updateApiHealth(status: string, metadata: any) {
    const { error } = await supabase
      .from('catalog_metadata')
      .upsert({
        id: 'singleton',
        api_health_status: status,
        last_health_check: new Date().toISOString(),
        metadata,
      });

    if (error) throw error;
  },

  async getSyncStats() {
    const { data, error } = await supabase
      .from('catalog_metadata')
      .select('*')
      .eq('id', 'singleton')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    return data || {
      last_full_sync: null,
      total_bundles: 0,
      bundle_groups: [],
      api_health_status: 'unknown',
      last_health_check: null,
    };
  },

  async isSyncDue(intervalHours: number) {
    const stats = await this.getSyncStats();
    if (!stats.last_full_sync) return true;

    const lastSync = new Date(stats.last_full_sync);
    const now = new Date();
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceSync >= intervalHours;
  },
};

// Health check function
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('catalog_metadata')
      .select('id')
      .limit(1);

    if (error) {
      logger.error('Supabase health check failed', error);
      return false;
    }

    logger.info('Supabase connection healthy');
    return true;
  } catch (error) {
    logger.error('Supabase health check error', error as Error);
    return false;
  }
}