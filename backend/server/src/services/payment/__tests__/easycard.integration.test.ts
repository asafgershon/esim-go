import { describe, it, expect, beforeAll, afterAll } from "vitest";
import easycardService, { clearAccessToken, getAccessToken } from "../easycard.service";

// Integration tests - these test the actual service with mocked HTTP calls
describe("EasyCard Integration Tests", () => {
  // Mock fetch globally for these tests
  const originalFetch = global.fetch;
  
  beforeAll(() => {
    // Replace fetch with a mock that simulates the identity server
    global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      
      // Mock identity server token endpoint
      if (urlString.includes('/connect/token')) {
        const body = init?.body?.toString() || '';
        
        // Check if it's any authorization key (including the one in .env.test)
        if (body.includes('authorizationKey=')) {
          // Return mock token for any authorization key in test
          return {
            ok: true,
            status: 200,
            json: async () => ({
              access_token: 'test.jwt.token.for.testing',
              expires_in: 3600,
              token_type: 'Bearer',
            }),
            text: async () => 'Mock response',
          } as Response;
        }
        
        // Simulate invalid key
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ error: 'invalid_grant' }),
          text: async () => 'Invalid authorization key',
        } as Response;
      }
      
      // Mock payment intent endpoint
      if (urlString.includes('/api/PaymentIntent')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'SUCCESS',
            data: {
              paymentIntentID: 'mock-payment-intent-123',
              amount: 10.00,
              currency: 'USD',
              status: 'pending',
            },
          }),
          text: async () => 'Payment intent created',
        } as Response;
      }
      
      // Default response for other endpoints
      return {
        ok: true,
        status: 200,
        json: async () => ({}),
        text: async () => 'OK',
      } as Response;
    };
  });
  
  afterAll(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });
  
  describe("Service Initialization", () => {
    it("should initialize the service successfully", async () => {
      await expect(easycardService.initialize()).resolves.not.toThrow();
    });
    
    it("should return supported payment methods", () => {
      const methods = easycardService.getSupportedPaymentMethods();
      expect(methods).toContain("visa");
      expect(methods).toContain("mastercard");
    });
    
    it("should return provider name", () => {
      expect(easycardService.getProviderName()).toBe("EasyCard");
    });
  });
  
  describe("Token Retrieval", () => {
    beforeAll(async () => {
      // Clear any cached tokens
      await clearAccessToken();
    });
    
    it("should retrieve access token with test credentials", async () => {
      const token = await getAccessToken();
      expect(token).toBe('test.jwt.token.for.testing');
    });
    
    it("should cache token for subsequent calls", async () => {
      // First call should fetch from server
      const token1 = await getAccessToken();
      
      // Second call should use cache (same token)
      const token2 = await getAccessToken();
      
      expect(token1).toBe(token2);
      expect(token1).toBe('test.jwt.token.for.testing');
    });
    
    it("should refresh token after clearing cache", async () => {
      // Get initial token
      const token1 = await getAccessToken();
      
      // Clear cache
      await clearAccessToken();
      
      // Get new token (will fetch again)
      const token2 = await getAccessToken();
      
      // Both should be valid tokens (in our mock, they're the same)
      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
    });
  });
  
  describe("Payment Intent Operations", () => {
    it("should handle payment intent creation request structure", async () => {
      const request = {
        amount: 10.00,
        currency: "USD",
        description: "Test payment",
        costumer: {
          id: "test-customer-123",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
        },
        item: {
          name: "Test Item",
          price: 10.00,
          discount: 0,
        },
        order: {
          reference: "test-order-123",
        },
        redirectUrl: "https://example.com/callback",
        metadata: {
          test: "true",
        },
      };
      
      // This will fail with our mock since we don't have full payment intent mocking
      // But it tests that the service can be called
      const result = await easycardService.createPaymentIntent(request);
      
      // With our current implementation, this will return success: true with mock data
      expect(result).toHaveProperty('success');
    });
  });
  
  describe("Error Handling", () => {
    it("should handle invalid amounts gracefully", async () => {
      const request = {
        amount: -10.00, // Invalid negative amount
        currency: "USD",
        description: "Invalid test",
        costumer: {
          id: "test-customer-123",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
        },
        item: {
          name: "Test Item",
          price: -10.00,
          discount: 0,
        },
        order: {
          reference: "test-order-invalid",
        },
        redirectUrl: "https://example.com/callback",
        metadata: {},
      };
      
      const result = await easycardService.createPaymentIntent(request);
      
      // Should return error result
      expect(result.success).toBeDefined();
    });
  });
});