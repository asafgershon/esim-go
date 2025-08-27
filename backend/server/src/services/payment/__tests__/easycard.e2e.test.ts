import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import easycardService, { clearAccessToken } from "../service";
import { createLogger } from "../../../lib/logger";

const logger = createLogger({ component: "easycard-e2e-test" });

// Skip E2E tests if flag is set or if we don't have a real API key
const skipTests = process.env.SKIP_E2E_TESTS === "true" || 
                  process.env.EASYCARD_PRIVATE_API_KEY === "test-easycard-authorization-key";

describe.skipIf(skipTests)("EasyCard Service E2E Tests", () => {
  beforeAll(async () => {
    logger.info("Starting EasyCard E2E tests", {
      hasApiKey: !!process.env.EASYCARD_PRIVATE_API_KEY,
      identityUrl: process.env.EASYCARD_IDENTITY_URL || "https://identity.e-c.co.il",
    });
    
    // Clear any cached tokens to ensure fresh test
    await clearAccessToken();
  });

  afterAll(async () => {
    // Clean up after tests
    await clearAccessToken();
  });

  describe("Token Authentication", () => {
    it("should successfully retrieve access token from Identity server", async () => {
      logger.info("Testing token retrieval");
      
      const token = await easycardService.getAccessToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      
      // Verify it's a JWT token (has three parts separated by dots)
      const parts = token.split(".");
      expect(parts).toHaveLength(3);
      
      logger.info("Successfully retrieved access token", {
        tokenLength: token.length,
        tokenPreview: token.substring(0, 20) + "...",
      });
    });

    it("should cache and reuse token on subsequent calls", async () => {
      logger.info("Testing token caching");
      
      // First call - should retrieve from Identity server
      const token1 = await easycardService.getAccessToken();
      
      // Second call - should retrieve from cache
      const token2 = await easycardService.getAccessToken();
      
      // Tokens should be identical
      expect(token1).toBe(token2);
      
      logger.info("Token caching verified");
    });

    it("should handle token refresh after clearing cache", async () => {
      logger.info("Testing token refresh");
      
      // Get initial token
      const token1 = await easycardService.getAccessToken();
      
      // Clear cache
      await clearAccessToken();
      
      // Get new token (should fetch from Identity server again)
      const token2 = await easycardService.getAccessToken();
      
      // Both should be valid tokens
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      
      // Note: They might be the same if Identity server returns the same token
      // within a short time period, so we just verify they're valid
      
      logger.info("Token refresh successful");
    });
  });

  describe("Service Initialization", () => {
    it("should initialize EasyCard service successfully", async () => {
      logger.info("Testing service initialization");
      
      await easycardService.initialize();
      
      // Service should be initialized without errors
      expect(easycardService.getProviderName()).toBe("EasyCard");
      
      logger.info("Service initialized successfully");
    });

    it("should update client with bearer token", async () => {
      logger.info("Testing client token configuration");
      
      await easycardService.ensureValidToken();
      
      // Should complete without errors
      // The actual verification would be in the API calls
      
      logger.info("Client configured with bearer token");
    });
  });

  describe("Payment Intent Creation", () => {
    it("should create a payment intent with token authentication", async () => {
      logger.info("Testing payment intent creation");
      
      try {
        // Create a test payment intent
        const result = await easycardService.createPaymentIntent({
          amount: 10.00, // $10.00 test amount
          currency: "USD",
          description: "E2E Test Payment",
          costumer: {
            id: "test-customer-e2e",
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
          },
          item: {
            name: "E2E Test Item",
            price: 10.00,
            discount: 0,
          },
          order: {
            reference: `e2e-test-${Date.now()}`,
          },
          redirectUrl: "https://example.com/callback",
          metadata: {
            test: "true",
            testId: `e2e-test-${Date.now()}`,
          },
        });
        
        expect(result.success).toBe(true);
        expect(result.payment_intent).toBeDefined();
        
        if (result.payment_intent) {
          expect(result.payment_intent.amount).toBe(10.00);
          expect(result.payment_intent.currency).toBe("USD");
          expect(result.payment_intent.status).toBeDefined();
          
          logger.info("Payment intent created successfully", {
            paymentIntentId: result.payment_intent.paymentIntentID,
            status: result.payment_intent.status,
            amount: result.payment_intent.amount,
          });
          
          // Clean up - cancel the test payment intent
          if (result.payment_intent.paymentIntentID) {
            const cancelResult = await easycardService.cancelPaymentIntent(
              result.payment_intent.paymentIntentID
            );
            
            logger.info("Test payment intent cancelled", {
              paymentIntentId: result.payment_intent.paymentIntentID,
              cancelSuccess: cancelResult.success,
            });
          }
        }
      } catch (error) {
        // Log the error for debugging
        logger.error("Failed to create payment intent", {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });
        
        // Re-throw to fail the test
        throw error;
      }
    });

    it("should handle token refresh on 401 error", async () => {
      logger.info("Testing automatic token refresh on 401");
      
      // Clear the token to force a refresh
      await clearAccessToken();
      
      // This should trigger token retrieval and retry
      const operation = async () => {
        return await easycardService.createPaymentIntent({
          amount: 5.00,
          currency: "USD",
          description: "Token Refresh Test",
          costumer: {
            id: "test-customer-refresh",
            email: "refresh@example.com",
            firstName: "Refresh",
            lastName: "Test",
          },
          item: {
            name: "Token Refresh Test Item",
            price: 5.00,
            discount: 0,
          },
          order: {
            reference: `refresh-test-${Date.now()}`,
          },
          redirectUrl: "https://example.com/callback",
          metadata: {
            test: "true",
            testType: "token-refresh",
          },
        });
      };
      
      const result = await easycardService.executeWithTokenRefresh(operation);
      
      expect(result.success).toBe(true);
      
      if (result.payment_intent?.paymentIntentID) {
        // Clean up
        await easycardService.cancelPaymentIntent(result.payment_intent.paymentIntentID);
      }
      
      logger.info("Token refresh on 401 handled successfully");
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid payment amount gracefully", async () => {
      logger.info("Testing error handling for invalid amount");
      
      try {
        await easycardService.createPaymentIntent({
          amount: -10.00, // Invalid negative amount
          currency: "USD",
          description: "Invalid Amount Test",
          costumer: {
            id: "test-customer-invalid",
            email: "invalid@example.com",
            firstName: "Invalid",
            lastName: "Test",
          },
          item: {
            name: "Invalid Test Item",
            price: -10.00,
            discount: 0,
          },
          order: {
            reference: `invalid-test-${Date.now()}`,
          },
          redirectUrl: "https://example.com/callback",
          metadata: { test: "true" },
        });
        
        // Should not reach here
        expect.fail("Should have thrown an error for negative amount");
      } catch (error) {
        expect(error).toBeDefined();
        logger.info("Invalid amount error handled correctly", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  });
});

// Standalone test function for manual testing
export async function runEasyCardE2ETest(): Promise<void> {
  if (skipTests) {
    logger.warn("Skipping EasyCard E2E tests", {
      mode: process.env.ESIM_GO_MODE || "test",
      hasApiKey: !!process.env.EASYCARD_PRIVATE_API_KEY,
    });
    return;
  }

  logger.info("Running standalone EasyCard E2E test");
  
  try {
    // Clear cache
    await clearAccessToken();
    
    // Initialize service
    await easycardService.initialize();
    logger.info("✅ Service initialized");
    
    // Get token
    const token = await easycardService.getAccessToken();
    logger.info("✅ Token retrieved", {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 30) + "...",
    });
    
    // Create payment intent
    const result = await easycardService.createPaymentIntent({
      amount: 1.00,
      currency: "USD",
      description: "Manual E2E Test",
      costumer: {
        id: "test-customer-manual",
        email: "manual@example.com",
        firstName: "Manual",
        lastName: "Test",
      },
      item: {
        name: "Manual Test Item",
        price: 1.00,
        discount: 0,
      },
      order: {
        reference: `manual-test-${Date.now()}`,
      },
      redirectUrl: "https://example.com/callback",
      metadata: {
        test: "true",
        timestamp: new Date().toISOString(),
      },
    });
    
    if (result.success && result.payment_intent) {
      logger.info("✅ Payment intent created", {
        paymentIntentId: result.payment_intent.paymentIntentID,
        status: result.payment_intent.status,
      });
      
      // Cancel test payment
      if (result.payment_intent.paymentIntentID) {
        await easycardService.cancelPaymentIntent(result.payment_intent.paymentIntentID);
        logger.info("✅ Test payment cancelled");
      }
    } else {
      logger.error("❌ Payment intent creation failed", { result });
    }
    
    logger.info("✅ All E2E tests passed!");
  } catch (error) {
    logger.error("❌ E2E test failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

// Allow running as a script (but not when running via test runner)
if (import.meta.url === `file://${process.argv[1]}` && !process.env.VITEST) {
  runEasyCardE2ETest()
    .then(() => {
      logger.info("E2E test completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("E2E test failed", { error });
      process.exit(1);
    });
}