#!/usr/bin/env bun
import { supabaseAdmin } from '../src/context/supabase-auth';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function applyMigration() {
  console.log('🚀 Applying catalog tables migration...');
  
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../../db/migrations/005_create_catalog_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration file loaded');
    
    // Split the migration into individual statements
    // Remove comments and empty lines
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
        console.log(`   ${statement.substring(0, 50)}...`);
        
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: statement + ';'
        }).single();
        
        if (error) {
          // Try direct execution if RPC doesn't work
          console.log('   Trying alternative method...');
          // For Supabase, we might need to use the SQL editor directly
          console.error(`   ❌ Error: ${error.message}`);
          console.log('\n⚠️  You may need to run this migration directly in Supabase SQL editor');
          console.log('   Go to: https://app.supabase.com/project/dgkyjkzkwzmjjurzvcxy/editor');
          console.log('   And paste the migration from: server/db/migrations/005_create_catalog_tables.sql');
          break;
        } else {
          console.log('   ✅ Success');
        }
      }
    }
    
    // Test if tables were created
    console.log('\n🔍 Verifying tables...');
    
    const tables = ['catalog_bundles', 'catalog_sync_jobs', 'catalog_metadata'];
    for (const table of tables) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ Table ${table}: NOT FOUND`);
      } else {
        console.log(`   ✅ Table ${table}: EXISTS`);
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();