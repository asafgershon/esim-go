#!/usr/bin/env bun
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

async function checkBundlesDirect() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking catalog_bundles directly...');

    // Try to get actual rows
    const { data: bundles, error: bundlesError, count } = await supabase
      .from('catalog_bundles')
      .select('*', { count: 'exact' })
      .limit(5);

    if (bundlesError) {
      console.error('Error querying catalog_bundles:', bundlesError);
    } else {
      console.log(`Found ${count} total bundles`);
      console.log('First 5 bundles:', bundles?.map(b => ({ 
        id: b.id, 
        name: b.esim_go_name, 
        group: b.bundle_group,
        price_cents: b.price_cents,
        countries: b.countries 
      })));
    }

    // Also check sync jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('catalog_sync_jobs')
      .select('id, status, type, bundles_processed, bundles_added, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    if (jobsError) {
      console.error('Error querying jobs:', jobsError);
    } else {
      console.log('Recent sync jobs:', jobs);
    }

  } catch (error) {
    console.error('Direct check failed:', error);
  }
}

checkBundlesDirect();