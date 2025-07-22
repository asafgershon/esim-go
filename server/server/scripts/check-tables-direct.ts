#!/usr/bin/env bun
import 'dotenv/config';
import { supabaseAdmin } from '../src/context/supabase-auth';

async function checkTables() {
  console.log('Checking catalog tables directly with SQL...\n');

  // Check if tables exist in public schema
  const { data: tables, error: tablesError } = await supabaseAdmin
    .rpc('get_table_names', { schema_name: 'public' });

  if (tablesError) {
    console.error('Error checking tables:', tablesError);
    return;
  }

  console.log('Tables in public schema:', tables);

  // Try a direct query
  const { data, error } = await supabaseAdmin
    .from('catalog_bundles')
    .select('count');

  if (error) {
    console.error('Error querying catalog_bundles:', error);
  } else {
    console.log('catalog_bundles count:', data);
  }

  // Check with raw SQL
  const { data: rawData, error: rawError } = await supabaseAdmin
    .rpc('run_sql', { query: 'SELECT COUNT(*) FROM catalog_bundles' });

  if (rawError) {
    console.error('Raw SQL error:', rawError);
  } else {
    console.log('Raw SQL result:', rawData);
  }
}

checkTables().catch(console.error);