#!/usr/bin/env bun
import 'dotenv/config';
import { ESimGoClient } from '@hiilo/client';
import { createLogger } from '@hiilo/utils';
import { config } from '../src/config/index.js';

const logger = createLogger({ component: 'test-worker-api' });

async function testWorkerApi() {
  logger.info('Testing worker API configuration...');
  logger.info(`Base URL: ${config.esimGo.baseUrl}`);
  logger.info(`API Key: ${config.esimGo.apiKey ? '[Present]' : '[Missing]'}`);
  
  const client = new ESimGoClient({
    apiKey: config.esimGo.apiKey,
    baseUrl: config.esimGo.baseUrl,
    retryAttempts: 1
  }, logger);

  try {
    // Test the API with a small request
    const response = await client.getCatalogueWithRetry({
      perPage: 3,
      page: 1
    });
    
    logger.info('✅ Worker API test successful!', {
      bundleCount: response.data.length,
      sampleBundle: response.data[0]?.name
    });

    return true;
  } catch (error) {
    logger.error('❌ Worker API test failed:', error as Error);
    return false;
  }
}

testWorkerApi().then((success) => {
  process.exit(success ? 0 : 1);
});