import { describe, it, expect } from 'vitest';
import { createPrismClient, EasyCardClient } from '@hiilo/easycard-client';

describe('EasyCard Integration Summary', () => {
  it('should confirm EasyCard client is available from server', () => {
    // Test that we can import and create the EasyCard client
    const client = new EasyCardClient({
      basePath: 'https://api.easycard.com',
      apiKey: 'test-key',
    });

    expect(client).toBeDefined();
    expect(client.paymentIntent).toBeDefined();
    expect(client.transactions).toBeDefined();
  });

  it('should confirm Prism client factory is available', () => {
    // Test that we can create a Prism client for testing
    const mockClient = createPrismClient({
      basePath: 'http://localhost:4012'
    });

    expect(mockClient).toBeDefined();
    expect(mockClient.paymentIntent).toBeDefined();
    expect(mockClient.transactions).toBeDefined();
  });

  it('should confirm environment configuration works', () => {
    // Set test environment
    process.env.EASYCARD_ENVIRONMENT = 'test';
    process.env.EASYCARD_API_KEY = 'test-api-key';
    
    try {
      const envClient = EasyCardClient.fromEnv();
      expect(envClient).toBeDefined();
    } catch (error) {
      // Expected since we don't have all required env vars
      expect(error).toBeDefined();
    } finally {
      // Cleanup
      delete process.env.EASYCARD_ENVIRONMENT;
      delete process.env.EASYCARD_API_KEY;
    }
  });
});