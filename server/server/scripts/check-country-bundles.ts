import { cleanEnv, str } from 'envalid';

const env = cleanEnv(process.env, {
  ESIM_GO_API_KEY: str({ desc: "The API key for the eSIM Go API" }),
});

async function checkCountryBundles(countryCode: string = 'AX') { // AX is Aland Islands
  console.log(`🔍 Checking bundles for country: ${countryCode}\n`);
  
  const bundleGroups = [
    'Standard Unlimited Lite',
    'Standard Unlimited Essential',
    'Standard Unlimited Plus',
    'Standard Fixed',
    'Standard Long Duration'
  ];
  
  let totalBundles = 0;
  const bundlesByGroup: Record<string, number> = {};
  
  for (const group of bundleGroups) {
    try {
      console.log(`📦 Fetching ${group}...`);
      
      const response = await fetch(`https://api.esim-go.com/v2.5/catalogue?country=${countryCode}&group=${encodeURIComponent(group)}&perPage=50`, {
        headers: {
          'accept': 'application/json',
          'x-api-key': env.ESIM_GO_API_KEY
        }
      });
      
      if (!response.ok) {
        console.log(`   ❌ Error: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      const bundleCount = data.bundles?.length || 0;
      bundlesByGroup[group] = bundleCount;
      totalBundles += bundleCount;
      
      console.log(`   ✅ Found ${bundleCount} bundles`);
      
      // Show sample bundles
      if (bundleCount > 0 && data.bundles) {
        console.log('   Sample bundles:');
        data.bundles.slice(0, 3).forEach((bundle: any) => {
          console.log(`     - ${bundle.name} (${bundle.duration} days, ${bundle.dataAmount === -1 ? 'Unlimited' : bundle.dataAmount + 'MB'})`);
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Error fetching ${group}:`, error);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`Total bundles across all groups: ${totalBundles}`);
  console.log('\nBundles per group:');
  Object.entries(bundlesByGroup).forEach(([group, count]) => {
    console.log(`  - ${group}: ${count}`);
  });
  
  // Also check without group filter
  console.log('\n🔍 Checking total bundles without group filter...');
  try {
    const response = await fetch(`https://api.esim-go.com/v2.5/catalogue?country=${countryCode}&perPage=50`, {
      headers: {
        'accept': 'application/json',
        'x-api-key': env.ESIM_GO_API_KEY
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Total bundles (no filter): ${data.totalCount || data.bundles?.length || 0}`);
    }
  } catch (error) {
    console.error('Error checking total:', error);
  }
}

// Run with Aland Islands
checkCountryBundles('AX').catch(console.error);