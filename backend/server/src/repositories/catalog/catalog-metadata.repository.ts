import { BaseSupabaseRepository } from '../base-supabase.repository';
import { type Database } from '../../database.types';
import { createLogger } from '../../lib/logger';

type CatalogMetadata = Database['public']['Tables']['catalog_metadata']['Row'];
type CatalogMetadataInsert = Database['public']['Tables']['catalog_metadata']['Insert'];
type CatalogMetadataUpdate = Database['public']['Tables']['catalog_metadata']['Update'];

export type SyncStrategy = 'bundle-groups' | 'pagination';
export type ApiHealthStatus = 'healthy' | 'degraded' | 'down';

export interface UpdateMetadataParams {
  syncVersion?: string;
  lastFullSync?: string;
  nextScheduledSync?: string;
  bundleGroups?: string[];
  totalBundles?: number;
  syncStrategy?: SyncStrategy;
  apiHealthStatus?: ApiHealthStatus;
  metadata?: Record<string, any>;
}

export class CatalogMetadataRepository extends BaseSupabaseRepository<CatalogMetadata, CatalogMetadataInsert, CatalogMetadataUpdate> {
  private logger = createLogger({ 
    component: 'CatalogMetadataRepository',
    operationType: 'catalog-metadata'
  });

  constructor() {
    super('catalog_metadata');
  }

  /**
   * Get or create the singleton metadata record
   */
  async getMetadata(): Promise<CatalogMetadata> {
    // First try to get existing metadata
    const { data: existing, error: getError } = await this.supabase
      .from('catalog_metadata')
      .select('*')
      .limit(1)
      .single();

    if (existing) {
      return existing;
    }

    // If not found, create initial metadata
    if (getError?.code === 'PGRST116') {
      const initialData: CatalogMetadataInsert = {
        sync_version: this.getCurrentSyncVersion(),
        bundle_groups: [],
        total_bundles: 0,
        sync_strategy: 'bundle-groups',
        api_health_status: 'healthy',
        metadata: {},
        created_at: new Date().toISOString()
      };

      const { data: created, error: createError } = await this.supabase
        .from('catalog_metadata')
        .insert(initialData)
        .select()
        .single();

      if (createError) {
        this.logger.error('Failed to create metadata', createError);
        throw createError;
      }

      this.logger.info('Created initial catalog metadata', {
        syncVersion: initialData.sync_version,
        operationType: 'metadata-init'
      });

      return created;
    }

    // Other errors
    this.logger.error('Failed to get metadata', getError);
    throw getError;
  }

  /**
   * Update metadata
   */
  async updateMetadata(params: UpdateMetadataParams): Promise<CatalogMetadata> {
    const metadata = await this.getMetadata();
    
    const updateData: CatalogMetadataUpdate = {
      sync_version: params.syncVersion,
      last_full_sync: params.lastFullSync,
      next_scheduled_sync: params.nextScheduledSync,
      bundle_groups: params.bundleGroups,
      total_bundles: params.totalBundles,
      sync_strategy: params.syncStrategy,
      api_health_status: params.apiHealthStatus,
      metadata: params.metadata,
      last_health_check: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('catalog_metadata')
      .update(updateData)
      .eq('id', metadata.id)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update metadata', error, { params });
      throw error;
    }

    this.logger.info('Catalog metadata updated', {
      syncVersion: data.sync_version,
      totalBundles: data.total_bundles,
      apiHealthStatus: data.api_health_status,
      operationType: 'metadata-update'
    });

    return data;
  }

  /**
   * Record successful full sync
   */
  async recordFullSync(results: {
    totalBundles: number;
    bundleGroups: string[];
    metadata?: Record<string, any>;
  }): Promise<CatalogMetadata> {
    const nextSync = new Date();
    nextSync.setDate(nextSync.getDate() + 30); // Schedule next sync in 30 days

    return this.updateMetadata({
      syncVersion: this.getCurrentSyncVersion(),
      lastFullSync: new Date().toISOString(),
      nextScheduledSync: nextSync.toISOString(),
      bundleGroups: results.bundleGroups,
      totalBundles: results.totalBundles,
      metadata: {
        ...results.metadata,
        lastSyncResults: {
          completedAt: new Date().toISOString(),
          bundleGroups: results.bundleGroups,
          totalBundles: results.totalBundles,
          syncStatus: 'complete'
        }
      }
    });
  }

  /**
   * Record partial sync (incomplete due to errors or interruption)
   */
  async recordPartialSync(results: {
    totalBundles: number;
    bundleGroups: string[];
    metadata?: Record<string, any>;
  }): Promise<CatalogMetadata> {
    // Don't update lastFullSync or schedule next sync for partial syncs
    // This ensures the scheduler knows a full sync is still needed
    
    return this.updateMetadata({
      syncVersion: this.getCurrentSyncVersion(),
      bundleGroups: results.bundleGroups,
      totalBundles: results.totalBundles,
      metadata: {
        ...results.metadata,
        lastSyncResults: {
          completedAt: new Date().toISOString(),
          bundleGroups: results.bundleGroups,
          totalBundles: results.totalBundles,
          syncStatus: 'partial'
        },
        partialSyncInfo: {
          lastPartialSync: new Date().toISOString(),
          completedGroups: results.bundleGroups,
          totalBundles: results.totalBundles,
          note: 'Partial sync - full sync still needed'
        }
      }
    });
  }

  /**
   * Update API health status
   */
  async updateApiHealth(status: ApiHealthStatus, metadata?: Record<string, any>): Promise<void> {
    await this.updateMetadata({
      apiHealthStatus: status,
      metadata: {
        apiHealth: {
          status,
          checkedAt: new Date().toISOString(),
          ...metadata
        }
      }
    });

    if (status !== 'healthy') {
      this.logger.warn('API health status changed', {
        status,
        metadata,
        operationType: 'health-status-change'
      });
    }
  }

  /**
   * Check if sync is due
   */
  async isSyncDue(): Promise<boolean> {
    const metadata = await this.getMetadata();

    // If never synced, it's due
    if (!metadata.last_full_sync) {
      return true;
    }

    // Check if scheduled sync has passed
    if (metadata.next_scheduled_sync) {
      const nextSync = new Date(metadata.next_scheduled_sync);
      if (new Date() >= nextSync) {
        return true;
      }
    }

    // Also check if it's been more than 30 days since last sync
    const lastSync = new Date(metadata.last_full_sync);
    const daysSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSinceSync >= 30;
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    lastSyncedAt: Date | null;
    nextSyncAt: Date | null;
    daysSinceSync: number | null;
    daysUntilSync: number | null;
    totalBundles: number;
    bundleGroups: string[];
    apiHealthStatus: ApiHealthStatus;
  }> {
    const metadata = await this.getMetadata();

    const lastSyncedAt = metadata.last_full_sync ? new Date(metadata.last_full_sync) : null;
    const nextSyncAt = metadata.next_scheduled_sync ? new Date(metadata.next_scheduled_sync) : null;

    let daysSinceSync = null;
    let daysUntilSync = null;

    if (lastSyncedAt) {
      daysSinceSync = Math.floor((Date.now() - lastSyncedAt.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (nextSyncAt) {
      daysUntilSync = Math.ceil((nextSyncAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    }

    return {
      lastSyncedAt,
      nextSyncAt,
      daysSinceSync,
      daysUntilSync,
      totalBundles: metadata.total_bundles || 0,
      bundleGroups: metadata.bundle_groups || [],
      apiHealthStatus: metadata.api_health_status as ApiHealthStatus
    };
  }

  /**
   * Update sync strategy
   */
  async updateSyncStrategy(strategy: SyncStrategy): Promise<void> {
    await this.updateMetadata({
      syncStrategy: strategy,
      metadata: {
        strategyChange: {
          changedTo: strategy,
          changedAt: new Date().toISOString()
        }
      }
    });

    this.logger.info('Sync strategy updated', {
      strategy,
      operationType: 'strategy-change'
    });
  }

  /**
   * Get current sync version (YYYY.MM format)
   */
  private getCurrentSyncVersion(): string {
    const now = new Date();
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}