// Main client export
export { EasyCardClient, type EasyCardClientConfig } from './client';

// Environment configuration
export { env } from './config';

// Testing utilities
export { createPrismClient } from './testing/mock-config';

// Export all generated APIs
export * from './generated/src/apis';

// Export all models
export * from './generated/src/models';

// Export runtime utilities if needed
export * as runtime from './generated/src/runtime';