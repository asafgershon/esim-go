import { createClient } from 'redis';
import { cleanEnv, str } from 'envalid';

// Load environment variables
const env = cleanEnv(process.env, {
  REDIS_URL: str({ 
    desc: 'Redis connection URL',
    default: 'redis://localhost:6379'
  }),
  REDIS_PASSWORD: str({
    desc: 'Redis password',
    default: ''
  })
});

async function clearOrgGroupsCache() {
  console.log('🧹 Clearing organization groups cache...');
  
  // Build Redis URL with auth if password is provided
  let redisUrl = env.REDIS_URL;
  if (env.REDIS_PASSWORD) {
    const url = new URL(env.REDIS_URL);
    url.password = env.REDIS_PASSWORD;
    redisUrl = url.toString();
  }
  
  const client = createClient({
    url: redisUrl
  });

  await client.connect();

  try {
    // Clear organization groups cache
    const keys = [
      'esim-go:organization:groups',
      'catalog-sync' // Also clear the sync lock
    ];
    
    for (const key of keys) {
      const deleted = await client.del(key);
      console.log(`${deleted ? '✅' : '❌'} ${key}: ${deleted ? 'DELETED' : 'NOT FOUND'}`);
    }
    
    console.log('\n✨ Cache cleared! The server will fetch fresh organization groups on next request.');
    console.log('🔄 Restart your server to trigger a fresh catalog sync with all bundle groups.');

  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  } finally {
    await client.quit();
  }
}

// Run the function
clearOrgGroupsCache().catch(console.error);