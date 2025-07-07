const jwt = require('jsonwebtoken');

// Your Apple credentials
const TEAM_ID = '32RDAS7K4L';
const KEY_ID = '6Z2Z75H6FQ';
const CLIENT_ID = 'com.esimgo.auth';

// Your private key from Apple Developer Console
const privateKey = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg7brfwykzsp158jnb
movqFVHHGw/ARkJl249PNV1j0+igCgYIKoZIzj0DAQehRANCAARBbXMAUyWHkU1Z
b7CbW6ccVrvpYJ0jXA/k6BA6NAKpbXgcOe3OgpwVoRWesigbrRMbBwGdWMTo2Opc
0fkSAUp5
-----END PRIVATE KEY-----`;

// Generate JWT token
function generateAppleJWT() {
  const now = Math.floor(Date.now() / 1000);
  const sixMonthsFromNow = now + (6 * 30 * 24 * 60 * 60); // 6 months

  const payload = {
    iss: TEAM_ID,
    iat: now,
    exp: sixMonthsFromNow,
    aud: 'https://appleid.apple.com',
    sub: CLIENT_ID
  };

  const token = jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    header: {
      kid: KEY_ID
    }
  });

  return token;
}

try {
  const appleJWT = generateAppleJWT();
  console.log('✅ Apple JWT Token Generated Successfully!');
  console.log('\n📋 Copy this token to use as your GOTRUE_EXTERNAL_APPLE_SECRET:');
  console.log('\n' + appleJWT);
  console.log('\n⏰ Token expires in 6 months');
  console.log('📝 Add this to your GoTrue Auth service environment variables in Railway');
} catch (error) {
  console.error('❌ Error generating JWT:', error.message);
}
