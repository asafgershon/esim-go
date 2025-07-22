import { createClient } from 'redis';
import { cleanEnv, str } from 'envalid';

// Load environment variables
const env = cleanEnv(process.env, {
  REDIS_URL: str({ 
    desc: 'Redis connection URL',
    default: 'redis://localhost:6379'
  }),
});

async function clearCatalogCache() {
  console.log('🧹 Clearing eSIM Go catalog cache...');
  
  const client = createClient({
    url: env.REDIS_URL
  });

  await client.connect();

  try {
    // Get all catalog-related keys
    const catalogKeys = await client.keys('esim-go:catalog:*');
    console.log(`📦 Found ${catalogKeys.length} catalog cache keys`);

    // Delete catalog keys
    if (catalogKeys.length > 0) {
      const deleted = await client.del(catalogKeys);
      console.log(`✅ Deleted ${deleted} catalog cache keys`);
    }

    // Get country-specific cache keys
    const countryKeys = await client.keys('esim-go:country-catalog:*');
    console.log(`🌍 Found ${countryKeys.length} country-specific cache keys`);
    
    if (countryKeys.length > 0) {
      const deleted = await client.del(countryKeys);
      console.log(`✅ Deleted ${deleted} country cache keys`);
    }

    // Clear full catalog cache
    const fullCatalogDeleted = await client.del('esim-go:full-catalog');
    if (fullCatalogDeleted) {
      console.log('✅ Deleted full catalog cache');
    }

    // Clear the distributed lock
    const lockDeleted = await client.del('catalog-sync');
    if (lockDeleted) {
      console.log('✅ Cleared catalog sync lock');
    }

    console.log('\n✨ Cache cleared successfully!');
    console.log('🔄 Now restart your server to trigger a fresh catalog sync');
    console.log('   cd server/server && bun run dev');

  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  } finally {
    await client.quit();
  }
}

// Run the function
clearCatalogCache().catch(console.error);