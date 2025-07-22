#!/usr/bin/env bun
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function verifyTables() {
  console.log('Verifying catalog tables with service role key...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Test each table
  const tables = ['catalog_bundles', 'catalog_sync_jobs', 'catalog_metadata'];
  
  for (const table of tables) {
    console.log(`\nTesting ${table}:`);
    
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`  ❌ Error: ${error.message}`);
      } else {
        console.log(`  ✅ Table exists, row count: ${count || 0}`);
      }
    } catch (e) {
      console.error(`  ❌ Exception:`, e);
    }
  }

  // Try to insert a test record
  console.log('\n\nTrying to insert test metadata...');
  try {
    const { data, error } = await supabase
      .from('catalog_metadata')
      .insert({
        sync_version: '2025.01',
        bundle_groups: [],
        total_bundles: 0,
        sync_strategy: 'bundle-groups',
        api_health_status: 'healthy',
        metadata: {}
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
    } else {
      console.log('✅ Successfully inserted:', data);
      
      // Clean up
      await supabase.from('catalog_metadata').delete().eq('id', data.id);
      console.log('✅ Cleaned up test record');
    }
  } catch (e) {
    console.error('Insert exception:', e);
  }
}

verifyTables().catch(console.error);