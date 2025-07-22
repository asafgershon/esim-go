#!/usr/bin/env bun

import { supabaseAdmin } from '../src/context/supabase-auth.js';
import { transformBundleToDatabase } from '../src/repositories/catalog/bundle-transform.schema.js';

// Test direct bundle insertion to database
const testBundle = {
  name: 'esim_test_1GB_7D_US_V2',
  bundleGroup: 'Standard Fixed',
  description: 'Test USA 1GB 7 Days Bundle',
  duration: 7,
  dataAmount: 1024, // 1GB in MB
  unlimited: false,
  price: 5.99,
  countries: ['US'],
  regions: ['North America']
};

console.log('Testing direct bundle insertion to database...\n');

try {
  // Transform the bundle
  const transformed = transformBundleToDatabase(testBundle);
  console.log('✅ Bundle transformation successful');
  console.log('Transformed bundle:', JSON.stringify(transformed, null, 2));

  // Try to insert directly into database
  console.log('\n📝 Attempting database insertion...');
  
  const { data, error } = await supabaseAdmin
    .from('catalog_bundles')
    .insert([transformed])
    .select();

  if (error) {
    console.error('❌ Database insertion failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
  } else {
    console.log('✅ Database insertion successful!');
    console.log('Inserted data:', data);
    
    // Check if it's actually in the database
    const { data: checkData, error: checkError } = await supabaseAdmin
      .from('catalog_bundles')
      .select('*')
      .eq('esim_go_name', transformed.esim_go_name)
      .single();
      
    if (checkError) {
      console.error('❌ Failed to verify insertion:', checkError);
    } else {
      console.log('✅ Verification successful - bundle found in database:', checkData.esim_go_name);
    }
  }
} catch (error) {
  console.error('❌ Test failed:', error);
}

// Also check current bundle count
try {
  const { data, error, count } = await supabaseAdmin
    .from('catalog_bundles')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Failed to count bundles:', error);
  } else {
    console.log(`\n📊 Current total bundles in database: ${count || 0}`);
  }
} catch (error) {
  console.error('❌ Failed to count bundles:', error);
}