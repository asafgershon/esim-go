// Polyfill for crypto.hash function which is not available in Node.js 23.x
// This needs to be applied before Vite loads

const crypto = require('node:crypto');

if (!crypto.hash) {
  crypto.hash = function(algorithm, data, outputEncoding) {
    return crypto.createHash(algorithm).update(data).digest(outputEncoding);
  };
  console.log('Applied crypto.hash polyfill for Node.js 23.x compatibility');
} 