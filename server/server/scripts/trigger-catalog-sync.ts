import { CatalogueDataSource } from '../src/datasources/esim-go/catalogue-datasource';
import { CatalogSyncService } from '../src/services/catalog-sync.service';
import { createClient } from 'redis';
import { cleanEnv, str } from 'envalid';
import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache';

// Load environment variables
const env = cleanEnv(process.env, {
  REDIS_URL: str({ 
    desc: 'Redis connection URL',
    default: 'redis://localhost:6379'
  }),
  ESIM_GO_API_KEY: str({ desc: "The API key for the eSIM Go API" }),
});

async function triggerCatalogSync() {
  console.log('🚀 Starting catalog sync process...');
  
  // Create Redis client
  const redisClient = createClient({
    url: env.REDIS_URL
  });

  await redisClient.connect();
  console.log('✅ Connected to Redis');

  try {
    // First, clear existing catalog cache
    console.log('\n🧹 Clearing existing catalog cache...');
    
    const catalogKeys = await redisClient.keys('esim-go:catalog:*');
    if (catalogKeys.length > 0) {
      await redisClient.del(catalogKeys);
      console.log(`✅ Cleared ${catalogKeys.length} catalog keys`);
    }

    const countryKeys = await redisClient.keys('esim-go:country-catalog:*');
    if (countryKeys.length > 0) {
      await redisClient.del(countryKeys);
      console.log(`✅ Cleared ${countryKeys.length} country keys`);
    }

    // Clear sync lock
    await redisClient.del('catalog-sync');
    console.log('✅ Cleared sync lock');

    // Create services
    const cache = new InMemoryLRUCache();
    const catalogueDataSource = new CatalogueDataSource({
      cache,
      token: env.ESIM_GO_API_KEY
    });
    
    const catalogSyncService = new CatalogSyncService(catalogueDataSource, redisClient as any);

    // Trigger the sync
    console.log('\n🔄 Starting catalog sync...');
    console.log('This will fetch all bundle groups including unlimited bundles');
    
    await catalogSyncService.syncFullCatalog();
    
    console.log('\n✨ Catalog sync completed successfully!');
    console.log('Unlimited bundles should now be available in the pricing view.');

  } catch (error) {
    console.error('❌ Error during catalog sync:', error);
  } finally {
    await redisClient.quit();
    console.log('\n👋 Disconnected from Redis');
  }
}

// Run the sync
triggerCatalogSync().catch(console.error);