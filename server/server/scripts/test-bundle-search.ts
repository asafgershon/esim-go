#!/usr/bin/env bun
import 'dotenv/config';
import { CatalogSyncServiceV2 } from '../src/services/catalog-sync-v2.service';
import { BundleRepository } from '../src/repositories/catalog/bundle.repository';
import { supabaseAdmin } from '../src/context/supabase-auth';
import { createLogger } from '../src/lib/logger';

const logger = createLogger({ component: 'test-bundle-search' });

async function testBundleSearch() {
  const syncService = new CatalogSyncServiceV2(
    process.env.ESIM_GO_API_KEY!,
    process.env.ESIM_GO_API_URL
  );
  
  const bundleRepo = new BundleRepository(supabaseAdmin);

  try {
    logger.info('🔍 Testing bundle search from persistent storage...\n');

    // Test 1: Get all available bundle groups
    logger.info('1. Getting available bundle groups...');
    const bundleGroups = await bundleRepo.getAvailableBundleGroups();
    console.log(`Found ${bundleGroups.length} bundle groups:`, bundleGroups);

    // Test 2: Get unique countries
    logger.info('\n2. Getting unique countries...');
    const countries = await bundleRepo.getUniqueCountries();
    console.log(`Found ${countries.length} countries:`, countries.slice(0, 10), '...');

    // Test 3: Search bundles by criteria
    logger.info('\n3. Searching bundles...');
    
    // Search for 7-day bundles
    const sevenDayBundles = await bundleRepo.searchBundles({
      minDuration: 7,
      maxDuration: 7,
      limit: 5
    });
    console.log(`\nFound ${sevenDayBundles.totalCount} 7-day bundles (showing first 5):`);
    sevenDayBundles.bundles.forEach(bundle => {
      console.log(`- ${bundle.name}: ${bundle.duration} days, ${bundle.data_amount || 'unlimited'}MB, $${bundle.price}`);
    });

    // Search for unlimited bundles
    const unlimitedBundles = await bundleRepo.searchBundles({
      unlimited: true,
      limit: 5
    });
    console.log(`\nFound ${unlimitedBundles.totalCount} unlimited bundles (showing first 5):`);
    unlimitedBundles.bundles.forEach(bundle => {
      console.log(`- ${bundle.name}: ${bundle.duration} days, unlimited data, $${bundle.price}`);
    });

    // Search by bundle group
    if (bundleGroups.length > 0) {
      const groupBundles = await bundleRepo.searchBundles({
        bundleGroups: [bundleGroups[0]],
        limit: 3
      });
      console.log(`\nFound ${groupBundles.totalCount} bundles in group "${bundleGroups[0]}" (showing first 3):`);
      groupBundles.bundles.forEach(bundle => {
        console.log(`- ${bundle.name}: ${bundle.duration} days, ${bundle.data_amount || 'unlimited'}MB, $${bundle.price}`);
      });
    }

    // Test 4: Get bundles by specific group
    if (bundleGroups.length > 0) {
      logger.info(`\n4. Getting all bundles from group "${bundleGroups[0]}"...`);
      const groupAllBundles = await bundleRepo.getBundlesByGroup(bundleGroups[0]);
      console.log(`Found ${groupAllBundles.length} bundles in this group`);
    }

    // Test 5: Test with sync service methods
    logger.info('\n5. Testing sync service search methods...');
    const syncBundles = await syncService.searchBundles({
      limit: 3,
      offset: 0
    });
    console.log(`\nSync service found ${syncBundles.totalCount} total bundles (showing first 3):`);
    syncBundles.bundles.forEach(bundle => {
      console.log(`- ${bundle.name}: ${bundle.duration} days, ${bundle.data_amount || 'unlimited'}MB, $${bundle.price}`);
    });

    // Test 6: Get stale bundles (should be empty for fresh sync)
    logger.info('\n6. Checking for stale bundles...');
    const staleBundles = await bundleRepo.getStaleBundles(1); // 1 day old
    console.log(`Found ${staleBundles.length} stale bundles (older than 1 day)`);

    logger.info('\n✅ Bundle search tests completed successfully!');

  } catch (error) {
    logger.error('❌ Bundle search test failed:', error as Error);
    throw error;
  }
}

testBundleSearch().catch(console.error);