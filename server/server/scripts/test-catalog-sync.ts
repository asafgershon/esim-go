#!/usr/bin/env bun
import { CatalogSyncServiceV2 } from '../src/services/catalog-sync-v2.service';
import dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from server's .env file
dotenv.config({ path: join(__dirname, '../.env') });

async function testCatalogSync() {
  console.log('🚀 Testing Catalog Sync Service V2...');
  
  const apiKey = process.env.ESIM_GO_API_KEY;
  if (!apiKey) {
    console.error('❌ ESIM_GO_API_KEY not found in environment');
    process.exit(1);
  }

  try {
    const syncService = new CatalogSyncServiceV2(apiKey);
    
    // Test 1: Check sync status
    console.log('\n📊 Checking sync status...');
    const status = await syncService.getSyncStatus();
    console.log('Sync Status:', JSON.stringify(status, null, 2));
    
    // Test 2: Check if sync is needed
    console.log('\n🔍 Checking if sync is needed...');
    const syncNeeded = await syncService.checkIfSyncNeeded();
    console.log('Sync needed:', syncNeeded);
    
    // Test 3: Trigger a full sync
    console.log('\n🔄 Triggering full catalog sync...');
    const syncJob = await syncService.triggerFullSync('test-script');
    console.log('Sync job created:', syncJob);
    
    // Test 4: Get available countries
    console.log('\n🌍 Getting available countries...');
    const countries = await syncService.getAvailableCountries();
    console.log(`Found ${countries.length} countries`);
    console.log('Sample countries:', countries.slice(0, 5));
    
    // Test 5: Search bundles
    console.log('\n🔎 Searching for bundles...');
    const searchResult = await syncService.searchBundles({
      limit: 10,
    });
    console.log(`Found ${searchResult.totalCount} total bundles`);
    console.log(`Returned ${searchResult.bundles.length} bundles`);
    
    // Test 6: Get organization bundle groups
    console.log('\n📦 Getting organization bundle groups...');
    const bundleGroups = await syncService.getOrganizationBundleGroups();
    console.log('Bundle groups:', bundleGroups);
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCatalogSync();