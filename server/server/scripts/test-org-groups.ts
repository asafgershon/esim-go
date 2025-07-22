import { cleanEnv, str } from 'envalid';

// Load environment variables
const env = cleanEnv(process.env, {
  ESIM_GO_API_KEY: str({ desc: "The API key for the eSIM Go API" }),
});

async function testOrganizationGroups() {
  console.log('🔍 Testing eSIM Go Organization Groups API...\n');
  
  try {
    const response = await fetch('https://api.esim-go.com/v2.5/organisation/groups', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-api-key': env.ESIM_GO_API_KEY
      }
    });

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }

    const data = await response.json();
    
    console.log('✅ Raw API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check if it's the new format (object with groups array)
    if (data.groups && Array.isArray(data.groups)) {
      console.log(`\n📊 Found ${data.groups.length} bundle groups:`);
      data.groups.forEach((group: any, index: number) => {
        console.log(`\n${index + 1}. ${group.name}`);
        if (group.description) console.log(`   Description: ${group.description}`);
        if (group.priceListUrl) console.log(`   Price List: ${group.priceListUrl}`);
        if (group.icon) console.log(`   Icon: ${group.icon}`);
      });
      
      // Check for unlimited groups
      const unlimitedGroups = data.groups.filter((g: any) => 
        g.name.toLowerCase().includes('unlimited')
      );
      console.log(`\n🔥 Found ${unlimitedGroups.length} unlimited bundle groups:`);
      unlimitedGroups.forEach((g: any) => console.log(`   - ${g.name}`));
      
    } else {
      console.log('\n⚠️  Response is not in expected format (no groups array)');
    }
    
  } catch (error) {
    console.error('❌ Error testing organization groups:', error);
  }
}

// Run the test
testOrganizationGroups().catch(console.error);