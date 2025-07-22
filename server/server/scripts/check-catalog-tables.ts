#!/usr/bin/env bun
import { supabaseAdmin } from '../src/context/supabase-auth';
import dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function checkTables() {
  console.log('🔍 Checking catalog tables in Supabase...\n');
  
  const tables = [
    { name: 'catalog_bundles', description: 'Stores eSIM bundle data' },
    { name: 'catalog_sync_jobs', description: 'Tracks sync job status' },
    { name: 'catalog_metadata', description: 'Stores sync metadata' }
  ];
  
  for (const table of tables) {
    console.log(`📊 Checking table: ${table.name}`);
    console.log(`   Description: ${table.description}`);
    
    try {
      // Try to query the table
      const { data, error, count } = await supabaseAdmin
        .from(table.name)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ Status: NOT FOUND`);
        console.log(`   Error: ${error.message}`);
      } else {
        console.log(`   ✅ Status: EXISTS`);
        console.log(`   Row count: ${count || 0}`);
      }
    } catch (err) {
      console.log(`   ❌ Status: ERROR`);
      console.log(`   Error: ${err}`);
    }
    console.log('');
  }
  
  console.log('\n📝 Next steps:');
  console.log('1. If tables are missing, go to Supabase SQL Editor:');
  console.log('   https://app.supabase.com/project/dgkyjkzkwzmjjurzvcxy/editor');
  console.log('2. Open server/db/migrations/005_create_catalog_tables.sql');
  console.log('3. Copy and paste the entire content into the SQL editor');
  console.log('4. Click "Run" to execute the migration');
}

checkTables();