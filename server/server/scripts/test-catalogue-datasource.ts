#!/usr/bin/env bun
import { CatalogueDataSource } from '../src/datasources/esim-go/catalogue-datasource.js';
import { config } from 'dotenv';

config();

async function testCatalogueDataSource() {
  try {
    console.log('Testing CatalogueDataSource...');

    // Create datasource instance
    const catalogueDS = new CatalogueDataSource();

    console.log('Testing searchPlans with no criteria...');
    
    // Test search with no criteria (should return some bundles)
    const result1 = await catalogueDS.searchPlans({});
    console.log('Result 1 (no criteria):', {
      bundleCount: result1.bundles.length,
      totalCount: result1.totalCount,
      sampleBundles: result1.bundles.slice(0, 3).map(b => ({
        id: b.id,
        esim_go_name: b.esim_go_name,
        bundle_group: b.bundle_group,
        price_cents: b.price_cents
      }))
    });

    console.log('\nTesting searchPlans with US country...');
    
    // Test search for specific country
    const result2 = await catalogueDS.searchPlans({ country: 'US' });
    console.log('Result 2 (US country):', {
      bundleCount: result2.bundles.length,
      totalCount: result2.totalCount,
      sampleBundles: result2.bundles.slice(0, 2).map(b => ({
        esim_go_name: b.esim_go_name,
        countries: b.countries
      }))
    });

    console.log('\nTesting searchPlans with 7 days duration...');
    
    // Test search for specific duration
    const result3 = await catalogueDS.searchPlans({ duration: 7 });
    console.log('Result 3 (7 days):', {
      bundleCount: result3.bundles.length,
      totalCount: result3.totalCount,
      sampleBundles: result3.bundles.slice(0, 2).map(b => ({
        esim_go_name: b.esim_go_name,
        duration: b.duration
      }))
    });

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCatalogueDataSource();