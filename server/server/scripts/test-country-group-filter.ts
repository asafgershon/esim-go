import { cleanEnv, str } from 'envalid';

const env = cleanEnv(process.env, {
  ESIM_GO_API_KEY: str({ desc: "The API key for the eSIM Go API" }),
});

async function testCountryGroupFilter() {
  const countryCode = 'AX'; // Aland
  const group = 'Standard Unlimited Lite';
  
  console.log(`🔍 Testing filtering by both country AND group...\n`);
  
  // Test 1: Country + Group
  console.log(`1️⃣ Testing: country=${countryCode} AND group=${group}`);
  try {
    const url = `https://api.esim-go.com/v2.5/catalogue?countries=${countryCode}&group=${encodeURIComponent(group)}&perPage=50`;
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'x-api-key': env.ESIM_GO_API_KEY
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success! Found ${data.bundles?.length || 0} bundles`);
      console.log(`   Total count: ${data.totalCount || 'not provided'}`);
      
      if (data.bundles?.length > 0) {
        console.log('   Sample bundles:');
        data.bundles.slice(0, 5).forEach((bundle: any) => {
          console.log(`     - ${bundle.name} (${bundle.duration}d, ${bundle.countries?.map((c: any) => c.iso).join(', ')})`);
        });
      }
    } else {
      console.log(`   ❌ Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('   ❌ Error:', error);
  }
  
  // Test 2: Just country
  console.log(`\n2️⃣ Testing: just country=${countryCode}`);
  try {
    const response = await fetch(`https://api.esim-go.com/v2.5/catalogue?countries=${countryCode}&perPage=50`, {
      headers: {
        'accept': 'application/json',
        'x-api-key': env.ESIM_GO_API_KEY
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Found ${data.bundles?.length || 0} bundles total for ${countryCode}`);
      
      // Count by bundle group
      const groupCounts: Record<string, number> = {};
      data.bundles?.forEach((bundle: any) => {
        const group = bundle.bundleGroup || 'Unknown';
        groupCounts[group] = (groupCounts[group] || 0) + 1;
      });
      
      console.log('   Bundles by group:');
      Object.entries(groupCounts).forEach(([group, count]) => {
        console.log(`     - ${group}: ${count}`);
      });
    }
  } catch (error) {
    console.error('   ❌ Error:', error);
  }
}

testCountryGroupFilter().catch(console.error);