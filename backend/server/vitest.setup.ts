import { config } from 'dotenv';
import { vi } from 'vitest';
import { PrismManager } from './src/test-utils/prism-manager';

// Load test environment variables
config({ path: '.env.test' });

// Mock logger to reduce noise in tests
vi.mock('./src/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Set test environment
process.env.NODE_ENV = 'test';

// Start Prism server if enabled
if (process.env.USE_PRISM_MOCK === 'true') {
  beforeAll(async () => {
    console.log('Starting Prism mock server for integration tests...');
    await PrismManager.getInstance();
  });

  afterAll(async () => {
    console.log('Stopping Prism mock server...');
    await PrismManager.cleanup();
  });
}

// Global test utilities
global.testUtils = {
  generateTestId: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  mockApiKey: 'test-api-key-123',
  prismUrl: process.env.USE_PRISM_MOCK === 'true' ? 'http://localhost:4010/v2.4' : undefined,
};