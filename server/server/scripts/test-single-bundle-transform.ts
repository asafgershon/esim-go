#!/usr/bin/env bun
import { ESimGoClient } from '@esim-go/client';
import { transformBundleToDatabase } from '../src/repositories/catalog/bundle-transform.schema.js';

async function testBundleTransform() {
  try {
    console.log('Testing single bundle transformation...');

    // Create API client 
    const client = new ESimGoClient({
      apiKey: process.env.ESIM_GO_API_KEY || '',
      baseUrl: 'https://api.esim-go.com/v2.5',
    });

    // Fetch a small sample of bundles
    console.log('Fetching bundles from API...');
    const response = await client.getCatalogueWithRetry({
      perPage: 5,
      page: 1
    });

    if (!response.data || response.data.length === 0) {
      console.log('No bundles returned from API');
      return;
    }

    console.log(`Got ${response.data.length} bundles from API`);

    // Test transformation for each bundle
    for (let i = 0; i < response.data.length; i++) {
      const bundle = response.data[i];
      console.log(`\n=== Bundle ${i + 1} ===`);
      console.log('Original bundle:', JSON.stringify(bundle, null, 2));

      try {
        const transformed = transformBundleToDatabase(bundle);
        console.log('✅ Transformation successful');
        console.log('Transformed bundle:', JSON.stringify(transformed, null, 2));
      } catch (error) {
        console.error('❌ Transformation failed:', error);
        console.log('Bundle that failed:', JSON.stringify(bundle, null, 2));
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testBundleTransform();