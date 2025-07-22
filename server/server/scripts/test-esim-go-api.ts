#!/usr/bin/env bun
import 'dotenv/config';
import { ESimGoClient } from '@esim-go/client';
import { createLogger } from '../src/lib/logger';

const logger = createLogger({ component: 'test-esim-go-api' });

async function testApi() {
  const baseUrl = process.env.ESIM_GO_API_URL || 'https://api.esim-go.com';
  
  logger.info('Testing eSIM Go API...');
  logger.info(`Base URL: ${baseUrl}`);
  logger.info(`API Key: ${process.env.ESIM_GO_API_KEY ? '[Present]' : '[Missing]'}`);
  
  const client = new ESimGoClient({
    apiKey: process.env.ESIM_GO_API_KEY!,
    baseUrl: baseUrl,
    retryAttempts: 1
  }, logger);

  try {
    // Test 1: Get catalog without any filters
    logger.info('\n1. Testing catalog endpoint without filters...');
    const catalogResponse = await client.getCatalogueWithRetry({
      perPage: 10,
      page: 1
    });
    logger.info('Catalog response:', {
      dataType: typeof catalogResponse.data,
      isArray: Array.isArray(catalogResponse.data),
      dataLength: catalogResponse.data?.length,
      sampleData: JSON.stringify(catalogResponse.data).slice(0, 200)
    });
    logger.info(`Got ${catalogResponse.data?.length || 0} bundles`);
    if (catalogResponse.data && catalogResponse.data.length > 0) {
      const sample = catalogResponse.data[0];
      logger.info('Sample bundle:', {
        name: sample.name,
        bundleGroup: sample.bundleGroup,
        countries: sample.countries?.slice(0, 3)
      });
    }

    // Test 2: Get unique bundle groups
    logger.info('\n2. Getting unique bundle groups from first 100 bundles...');
    const allBundles = await client.getCatalogueWithRetry({
      perPage: 50, // Max per page to avoid 401 errors
      page: 1
    });
    const bundleGroups = allBundles.data && Array.isArray(allBundles.data) 
      ? [...new Set(allBundles.data.map(b => b.bundleGroup).filter(Boolean))]
      : [];
    logger.info('Found bundle groups:', bundleGroups);

    // Test 3: Try with a specific bundle group
    if (bundleGroups.length > 0) {
      logger.info(`\n3. Testing with bundle group: ${bundleGroups[0]}`);
      try {
        const groupResponse = await client.getCatalogueWithRetry({
          group: bundleGroups[0],
          perPage: 10
        });
        logger.info(`Got ${groupResponse.data.length} bundles for group ${bundleGroups[0]}`);
      } catch (error) {
        logger.error('Failed with group filter:', error as Error);
      }
    }

    // Test 4: Test with country filter
    logger.info('\n4. Testing with country filter (US)...');
    try {
      const countryResponse = await client.getCatalogueWithRetry({
        countries: 'US',
        perPage: 10
      });
      logger.info(`Got ${countryResponse.data.length} bundles for US`);
    } catch (error) {
      logger.error('Failed with country filter:', error as Error);
    }

  } catch (error) {
    logger.error('API test failed:', error as Error);
    throw error;
  }
}

testApi().catch(console.error);