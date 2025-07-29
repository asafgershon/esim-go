// Test CORS configuration
const fetch = require('node-fetch');

async function testCORS() {
  console.log('Testing CORS configuration...\n');

  // Test 1: OPTIONS preflight request
  console.log('1. Testing OPTIONS preflight:');
  try {
    const response = await fetch('https://api.hiiilo.yarinsa.me/graphql', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://app.hiiilo.yarinsa.me',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Access-Control-Allow-Origin:', response.headers.get('access-control-allow-origin'));
    console.log('Access-Control-Allow-Credentials:', response.headers.get('access-control-allow-credentials'));
    console.log('Access-Control-Allow-Headers:', response.headers.get('access-control-allow-headers'));
    console.log('Access-Control-Allow-Methods:', response.headers.get('access-control-allow-methods'));
  } catch (error) {
    console.error('Preflight failed:', error.message);
  }

  console.log('\n2. Testing POST request:');
  try {
    const response = await fetch('https://api.hiiilo.yarinsa.me/graphql', {
      method: 'POST',
      headers: {
        'Origin': 'https://app.hiiilo.yarinsa.me',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ __typename }'
      })
    });
    
    console.log('Status:', response.status);
    console.log('Access-Control-Allow-Origin:', response.headers.get('access-control-allow-origin'));
    console.log('Access-Control-Allow-Credentials:', response.headers.get('access-control-allow-credentials'));
  } catch (error) {
    console.error('POST failed:', error.message);
  }
}

testCORS();