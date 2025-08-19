import { describe, it, expect, beforeAll } from 'vitest';
import { createPrismClient } from '../testing/mock-config';
import { PrismScenarios } from '../testing/prism-scenarios';
import { ESimGoApiError, ESimGoRateLimitError, ESimGoAuthError } from '../types';

describe('ESimGoClient with Prism Mock', () => {
  let client: ReturnType<typeof createPrismClient>;

  beforeAll(() => {
    client = createPrismClient();
  });

  describe('Catalogue API', () => {
    it('should fetch catalogue successfully', async () => {
      const result = await client.getCatalogueWithRetry({
        countries: 'US',
        perPage: 10,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.metadata).toHaveProperty('requestId');
      expect(result.metadata).toHaveProperty('timestamp');
    });

    it('should handle pagination parameters', async () => {
      const result = await client.getCatalogueWithRetry({
        page: 2,
        perPage: 5,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it('should filter by bundle group', async () => {
      const result = await client.getCatalogueWithRetry({
        group: 'data-only',
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe('Organization API', () => {
    it('should fetch organization groups', async () => {
      const result = await client.getOrganizationGroups();

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('eSIMs API', () => {
    it('should fetch eSIMs list', async () => {
      const result = await client.getEsims({
        perPage: 10,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it('should apply bundle to eSIM', async () => {
      const result = await client.applyBundleToEsim({
        iccid: '89000000000000000001',
        bundles: ['TEST_BUNDLE_1GB_7D_US'],
        customerReference: 'test-ref-123',
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe('Search Catalog', () => {
    it('should search catalog with criteria', async () => {
      const result = await client.searchCatalog({
        countries: ['US', 'CA'],
        minDuration: 7,
        maxDuration: 30,
        unlimited: false,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should search by bundle groups', async () => {
      const result = await client.searchCatalog({
        bundleGroups: ['data-only', 'voice-data'],
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      const isHealthy = await client.healthCheck();
      expect(typeof isHealthy).toBe('boolean');
    });
  });
});

describe('ESimGoClient Error Handling with Prism', () => {
  it('should handle rate limiting', async () => {
    const client = createPrismClient({
      defaultHeaders: PrismScenarios.getHeaders('rate-limit'),
    });

    await expect(client.getCatalogueWithRetry({})).rejects.toThrow(ESimGoRateLimitError);
  });

  it('should handle authentication errors', async () => {
    const client = createPrismClient({
      defaultHeaders: PrismScenarios.getHeaders('auth-error'),
    });

    await expect(client.getCatalogueWithRetry({})).rejects.toThrow(ESimGoAuthError);
  });

  it('should handle server errors', async () => {
    const client = createPrismClient({
      defaultHeaders: PrismScenarios.getHeaders('server-error'),
    });

    await expect(client.getCatalogueWithRetry({})).rejects.toThrow(ESimGoApiError);
  });
});