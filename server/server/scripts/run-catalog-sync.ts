#!/usr/bin/env bun
import 'dotenv/config';
import { CatalogSyncServiceV2 } from '../src/services/catalog-sync-v2.service';
import { createLogger } from '../src/lib/logger';
import { supabaseAdmin } from '../src/context/supabase-auth';

const logger = createLogger({ component: 'run-catalog-sync' });

async function runCatalogSync() {
  const syncService = new CatalogSyncServiceV2(
    process.env.ESIM_GO_API_KEY!,
    process.env.ESIM_GO_API_URL
  );

  try {
    logger.info('🧹 Cleaning up pending jobs...');
    
    // Clean up any pending jobs
    const { data: pendingJobs } = await supabaseAdmin
      .from('catalog_sync_jobs')
      .update({ 
        status: 'cancelled',
        error_message: 'Cancelled for new sync',
        completed_at: new Date().toISOString()
      })
      .in('status', ['pending', 'running'])
      .select();
    
    if (pendingJobs?.length) {
      logger.info(`Cancelled ${pendingJobs.length} pending/running jobs`);
    }

    logger.info('📊 Checking sync status...');
    const status = await syncService.getSyncStatus();
    console.log('Sync Status:', JSON.stringify(status, null, 2));

    logger.info('🔄 Running full catalog sync...');
    
    // Process the sync synchronously
    const { jobId } = await syncService.triggerFullSync('test-script');
    logger.info(`Sync job created: ${jobId}`);
    
    // Now actually run the sync
    const syncJobRepo = new (await import('../src/repositories/catalog/sync-job.repository')).SyncJobRepository(supabaseAdmin);
    await syncJobRepo.updateJobProgress(jobId, {
      status: 'running',
      started_at: new Date().toISOString()
    });

    // Perform the actual sync
    const startTime = Date.now();
    const client = new (await import('@esim-go/client')).ESimGoClient({
      apiKey: process.env.ESIM_GO_API_KEY!,
      baseUrl: process.env.ESIM_GO_API_URL,
      retryAttempts: 3
    });

    const bundleRepo = new (await import('../src/repositories/catalog/bundle.repository')).BundleRepository(supabaseAdmin);
    const metadataRepo = new (await import('../src/repositories/catalog/catalog-metadata.repository')).CatalogMetadataRepository(supabaseAdmin);
    
    const bundleGroups = [
      'Standard Fixed',
      'Standard - Unlimited Lite',
      'Standard - Unlimited Essential',
      'Standard - Unlimited Plus',
      'Regional Bundles'
    ];

    let totalBundles = 0;
    let totalAdded = 0;
    let totalUpdated = 0;
    const errors: string[] = [];

    for (const group of bundleGroups) {
      try {
        logger.info(`Syncing bundle group: ${group}`);
        
        const response = await client.getCatalogueWithRetry({
          group,
          perPage: 50 // Max per page to avoid 401 errors
        });

        if (response.data.length > 0) {
          const results = await bundleRepo.bulkUpsert(response.data);
          totalBundles += response.data.length;
          totalAdded += results.added;
          totalUpdated += results.updated;
          
          logger.info(`Synced ${response.data.length} bundles from ${group}`, {
            added: results.added,
            updated: results.updated
          });
        }
      } catch (error) {
        logger.error(`Failed to sync group ${group}`, error as Error);
        errors.push(`${group}: ${(error as Error).message}`);
      }
    }

    // Update job and metadata
    await syncJobRepo.completeJob(jobId, {
      bundles_processed: totalBundles,
      bundles_added: totalAdded,
      bundles_updated: totalUpdated,
      metadata: {
        duration: Date.now() - startTime,
        bundleGroups,
        errors
      }
    });

    await metadataRepo.recordFullSync({
      totalBundles,
      bundleGroups,
      metadata: {
        syncDuration: Date.now() - startTime,
        errors
      }
    });

    logger.info('✅ Catalog sync completed!', {
      totalBundles,
      totalAdded,
      totalUpdated,
      duration: Date.now() - startTime,
      errors: errors.length
    });

    // Check final status
    const finalStatus = await syncService.getSyncStatus();
    console.log('\nFinal Status:', JSON.stringify(finalStatus, null, 2));

    // Get some sample bundles
    logger.info('\n🌍 Getting available countries...');
    const countries = await syncService.getAvailableCountries();
    console.log(`Found ${countries.length} countries:`, countries.slice(0, 10), '...');

    // Search for some bundles
    if (countries.length > 0) {
      logger.info('\n🔍 Searching for bundles...');
      const searchResults = await syncService.search({
        countries: [countries[0]],
        limit: 5
      });
      console.log(`Found ${searchResults.count} bundles for ${countries[0]}`);
      searchResults.data.forEach(bundle => {
        console.log(`- ${bundle.name}: ${bundle.validity_in_days} days, ${bundle.data_amount_mb}MB, $${bundle.price}`);
      });
    }

  } catch (error) {
    logger.error('❌ Sync failed:', error as Error);
    throw error;
  }
}

runCatalogSync().catch(console.error);