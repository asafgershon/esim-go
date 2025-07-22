import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { createLogger } from '@esim-go/utils';

// Import repository types
import type { Database } from '../../../server/src/database.types.js';

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

// Re-export repositories with worker-specific initialization
export { 
  BundleRepository,
  SyncJobRepository,
  CatalogMetadataRepository 
} from '../../../server/src/repositories/catalog/index.js';

// Initialize repositories with worker's Supabase client
import { BundleRepository as BaseBundleRepository } from '../../../server/src/repositories/catalog/bundle.repository.js';
import { SyncJobRepository as BaseSyncJobRepository } from '../../../server/src/repositories/catalog/sync-job.repository.js';
import { CatalogMetadataRepository as BaseCatalogMetadataRepository } from '../../../server/src/repositories/catalog/catalog-metadata.repository.js';

// Create repository instances
export const bundleRepository = new BaseBundleRepository(supabase);
export const syncJobRepository = new BaseSyncJobRepository(supabase);
export const catalogMetadataRepository = new BaseCatalogMetadataRepository(supabase);

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