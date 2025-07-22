#!/usr/bin/env bun

import { transformBundleToDatabase, transformBundlesToDatabase } from '../src/repositories/catalog/bundle-transform.schema.js';

// Test bundle transformation
const testBundle = {
  name: 'esim_1GB_7D_US_V2',
  bundleGroup: 'Standard Fixed',
  description: 'USA 1GB 7 Days Bundle',
  duration: 7,
  dataAmount: 1024, // 1GB in MB
  unlimited: false,
  price: 5.99,
  countries: ['US'],
  regions: ['North America']
};

console.log('Testing bundle transformation...\n');

try {
  const transformed = transformBundleToDatabase(testBundle);
  console.log('✅ Single bundle transformation successful:');
  console.log(JSON.stringify(transformed, null, 2));
  console.log('\nKey transformations:');
  console.log(`- name → esim_go_name: "${testBundle.name}" → "${transformed.esim_go_name}"`);
  console.log(`- price → price_cents: $${testBundle.price} → ${transformed.price_cents} cents`);
  console.log(`- dataAmount → data_amount: ${testBundle.dataAmount} MB → ${transformed.data_amount} bytes`);
} catch (error) {
  console.error('❌ Single bundle transformation failed:', error);
}

console.log('\n' + '='.repeat(60) + '\n');

// Test batch transformation
const testBundles = [
  testBundle,
  {
    name: 'esim_UL_30D_EU_V2',
    bundleGroup: 'Standard - Unlimited Lite',
    description: 'Europe Unlimited 30 Days',
    duration: 30,
    dataAmount: null, // Unlimited
    unlimited: true,
    price: 29.99,
    countries: ['FR', 'DE', 'IT'],
    regions: ['Europe']
  },
  {
    // Invalid bundle - missing name
    bundleGroup: 'Standard Fixed',
    description: 'Invalid bundle without name',
    duration: 1,
    price: 1.99,
  }
];

try {
  const batchResult = transformBundlesToDatabase(testBundles as any);
  console.log('✅ Batch transformation results:');
  console.log(`- Valid bundles: ${batchResult.validBundles.length}`);
  console.log(`- Transformation errors: ${batchResult.errors.length}`);
  
  if (batchResult.errors.length > 0) {
    console.log('\nTransformation errors:');
    batchResult.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. Index ${error.index}: ${error.error}`);
    });
  }
  
  console.log('\nFirst valid bundle:');
  console.log(JSON.stringify(batchResult.validBundles[0], null, 2));
  
} catch (error) {
  console.error('❌ Batch transformation failed:', error);
}