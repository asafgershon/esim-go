#!/usr/bin/env bun

import { supabaseAdmin } from '../src/context/supabase-auth.js';

async function checkBundleData() {
  console.log('Checking catalog bundle data...\n');

  // Check total bundle count
  const { data: bundleData, error: countError, count } = await supabaseAdmin
    .from('catalog_bundles')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting bundles:', countError);
    return;
  }

  console.log(`Total bundles in database: ${count || 0}\n`);

  // Check recent bundles - first let's see what columns exist
  const { data: recentBundles, error: recentError } = await supabaseAdmin
    .from('catalog_bundles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (recentError) {
    console.error('Error fetching recent bundles:', recentError);
    return;
  }

  console.log('Recent bundles:');
  recentBundles?.forEach((bundle, i) => {
    console.log(`${i + 1}. ${bundle.esim_go_name} - ${bundle.duration}d - $${((bundle.price_cents || 0) / 100).toFixed(2)} - Countries:`, JSON.stringify(bundle.countries));
  });

  // Check countries with bundles - disable for now due to column issue
  // const { data: countries, error: countriesError } = await supabaseAdmin
  //   .from('catalog_bundles')
  //   .select('country_iso')
  //   .not('country_iso', 'is', null);

  // if (countriesError) {
  //   console.error('Error fetching countries:', countriesError);
  //   return;
  // }

  // const uniqueCountries = [...new Set(countries?.map(c => c.country_iso))];
  // console.log(`\nCountries with bundles: ${uniqueCountries.length}`);
  // console.log('Sample countries:', uniqueCountries.slice(0, 10).join(', '));

  // Check sync job status
  const { data: syncJobs, error: syncError } = await supabaseAdmin
    .from('catalog_sync_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (syncError) {
    console.error('Error fetching sync jobs:', syncError);
    return;
  }

  console.log('\nRecent sync jobs:');
  syncJobs?.forEach((job, i) => {
    console.log(`${i + 1}. ${job.status} - ${job.bundles_processed} bundles - ${job.type} - ${new Date(job.created_at).toLocaleString()}`);
  });
}

checkBundleData().catch(console.error);