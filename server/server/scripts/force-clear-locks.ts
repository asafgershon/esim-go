import { createClient } from 'redis';
import { cleanEnv, str } from 'envalid';

// Load environment variables
const env = cleanEnv(process.env, {
  REDIS_URL: str({ 
    desc: 'Redis connection URL',
    default: 'redis://localhost:6379'
  }),
});

async function forceClearLocks() {
  console.log('🔓 Force clearing all locks and cache...');
  
  const client = createClient({
    url: env.REDIS_URL
  });

  await client.connect();

  try {
    // Clear the distributed lock
    const lockDeleted = await client.del('catalog-sync');
    console.log(`✅ Catalog sync lock cleared: ${lockDeleted ? 'YES' : 'NO'}`);

    // Clear organization groups cache to force fresh fetch
    const orgGroupsDeleted = await client.del('esim-go:organization:groups');
    console.log(`✅ Organization groups cache cleared: ${orgGroupsDeleted ? 'YES' : 'NO'}`);

    // Clear all catalog-related locks (pattern matching)
    const lockKeys = await client.keys('*lock*');
    if (lockKeys.length > 0) {
      console.log(`🔍 Found ${lockKeys.length} lock keys:`);
      for (const key of lockKeys) {
        const deleted = await client.del(key);
        console.log(`  - ${key}: ${deleted ? 'DELETED' : 'NOT FOUND'}`);
      }
    }

    console.log('\n✨ All locks cleared successfully!');
    console.log('🔄 Now restart your server to trigger a fresh catalog sync');

  } catch (error) {
    console.error('❌ Error clearing locks:', error);
  } finally {
    await client.quit();
  }
}

// Run the function
forceClearLocks().catch(console.error);