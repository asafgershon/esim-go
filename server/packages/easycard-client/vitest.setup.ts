import { vi } from 'vitest';
import { getGlobalPrismServer, stopGlobalPrismServer } from './src/testing/prism-helpers';

const usePrism = process.env.USE_PRISM === 'true' || process.env.NODE_ENV === 'test';

if (usePrism) {
  beforeAll(async () => {
    console.log('Starting EasyCard Prism mock server...');
    try {
      await getGlobalPrismServer({
        port: 4012,
        specPath: './easycard-spec.yaml',
        dynamic: true,
        verbose: process.env.PRISM_VERBOSE === 'true',
      });
      console.log('EasyCard Prism mock server started successfully');
    } catch (error) {
      console.error('Failed to start EasyCard Prism server:', error);
      throw error;
    }
  });

  afterAll(async () => {
    console.log('Stopping EasyCard Prism mock server...');
    await stopGlobalPrismServer();
  });
}

global.testConfig = {
  usePrism,
  prismUrl: 'http://localhost:4012',
  mockApiKey: 'test-api-key',
};