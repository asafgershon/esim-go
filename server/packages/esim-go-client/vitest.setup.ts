import { vi } from 'vitest';
import { getGlobalPrismServer, stopGlobalPrismServer } from './src/testing/prism-helpers';

const usePrism = process.env.USE_PRISM === 'true' || process.env.NODE_ENV === 'test';

if (usePrism) {
  beforeAll(async () => {
    console.log('Starting Prism mock server...');
    try {
      await getGlobalPrismServer({
        port: 4010,
        specPath: './openapi-spec.yaml',
        dynamic: true,
        verbose: process.env.PRISM_VERBOSE === 'true',
      });
      console.log('Prism mock server started successfully');
    } catch (error) {
      console.error('Failed to start Prism server:', error);
      throw error;
    }
  });

  afterAll(async () => {
    console.log('Stopping Prism mock server...');
    await stopGlobalPrismServer();
  });
}

global.testConfig = {
  usePrism,
  prismUrl: 'http://localhost:4010/v2.4',
  mockApiKey: 'test-api-key',
};