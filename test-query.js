const fetch = require('node-fetch');

async function testQuery() {
  try {
    const response = await fetch('http://localhost:5001/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You'll need to get a real token from logging in
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
      },
      body: JSON.stringify({
        query: `
          query {
            getAllESIMs {
              id
              iccid
              status
              user {
                id
                email
                firstName
                lastName
              }
              order {
                id
                reference
                bundleName
              }
            }
          }
        `
      })
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testQuery();