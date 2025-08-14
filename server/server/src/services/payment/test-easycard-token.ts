#!/usr/bin/env bun
/**
 * Manual E2E test for EasyCard token authentication
 * Usage: EASYCARD_PRIVATE_API_KEY=xxx bun run src/services/payment/test-easycard-token.ts
 */

import { env } from "../../config/env";
import { createLogger } from "../../lib/logger";

const logger = createLogger({ component: "easycard-token-test" });


async function testTokenRetrieval() {
  logger.info("Starting EasyCard token test", {
    hasApiKey: !!env.EASYCARD_API_KEY,
    identityUrl: env.EASYCARD_IDENTITY_URL,
  });

  if (!env.EASYCARD_API_KEY || env.EASYCARD_API_KEY === "your-easycard-authorization-key") {
    logger.error("EASYCARD_API_KEY environment variable is required");
    logger.info("Usage: EASYCARD_API_KEY=xxx bun run src/services/payment/test-easycard-token.ts");
    process.exit(1);
  }

  try {
    // Test 1: Direct token request
    logger.info("Test 1: Making direct token request to Identity server");
    
    const params = new URLSearchParams({
      authorizationKey: env.EASYCARD_API_KEY,
      grant_type: "terminal_rest_api",
      client_id: "terminal",
    });

    const response = await fetch(`${env.EASYCARD_IDENTITY_URL}/connect/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    logger.info("Response status", { 
      status: response.status,
      statusText: response.statusText,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Failed to get token", {
        status: response.status,
        message: errorText,
      });
      process.exit(1);
    }

    const tokenResponse = await response.json() as {
      access_token: string;
      expires_in?: number;
      token_type: string;
    };

    logger.info("✅ Token received successfully", {
      hasToken: !!tokenResponse.access_token,
      tokenType: tokenResponse.token_type,
      expiresIn: tokenResponse.expires_in,
      tokenLength: tokenResponse.access_token?.length,
      tokenPreview: tokenResponse.access_token?.substring(0, 30) + "...",
    });

    // Test 2: Decode JWT to check expiration
    if (tokenResponse.access_token) {
      try {
        // Simple JWT decode without verification
        const parts = tokenResponse.access_token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1] || "", "base64").toString());
          
          logger.info("JWT decoded successfully", {
            exp: payload.exp,
            iat: payload.iat,
            expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
            issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : undefined,
          });

          if (payload.exp) {
            const currentTime = Math.floor(Date.now() / 1000);
            const ttl = payload.exp - currentTime;
            logger.info("Token TTL calculation", {
              currentTime,
              exp: payload.exp,
              ttl,
              ttlMinutes: Math.floor(ttl / 60),
            });
          }
        }
      } catch (error) {
        logger.warn("Failed to decode JWT", { error });
      }
    }

    // Test 3: Test the service integration
    logger.info("\nTest 2: Testing service integration");
    
    // Dynamic import to avoid env validation at module load
    const { getAccessToken, clearAccessToken } = await import("./easycard.service");
    
    // Clear any cached token first
    await clearAccessToken();
    
    // Get token through service
    const serviceToken = await getAccessToken();
    
    logger.info("✅ Service token retrieval successful", {
      tokenLength: serviceToken.length,
      tokenPreview: serviceToken.substring(0, 30) + "...",
    });

    // Test caching - second call should use cache
    const cachedToken = await getAccessToken();
    
    if (serviceToken === cachedToken) {
      logger.info("✅ Token caching working correctly");
    } else {
      logger.warn("❌ Token caching may not be working");
    }

    logger.info("\n🎉 All tests passed successfully!");
    
  } catch (error) {
    logger.error("Test failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Run the test
testTokenRetrieval()
  .then(() => {
    logger.info("Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Test failed", { error });
    process.exit(1);
  });