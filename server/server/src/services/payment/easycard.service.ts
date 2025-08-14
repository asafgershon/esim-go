import { EasyCardClient, env } from "@hiilo/easycard-client";
import type { KeyvAdapter } from "@apollo/utils.keyvadapter";
import jwt from "jsonwebtoken";
import { logger } from "../../lib/logger";
import { getRedis } from "../redis";
import type {
  CreatePaymentIntentRequest,
  PaymentIntent,
  PaymentResult,
  PaymentWebhookEvent,
} from "./types";

// Import payment operations
import {
  createPaymentIntent as createIntent,
  getPaymentIntent as getIntent,
  cancelPaymentIntent as cancelIntent,
  refundPaymentIntent,
} from "./intent";
import {
  processWebhookEvent as processWebhook,
  verifyWebhookSignature as verifySignature,
  handleWebhook as handleWebhookEvent,
} from "./webhook";

// Singleton client instance
let client: EasyCardClient | null = null;
let redis: KeyvAdapter | null = null;
let initializationPromise: Promise<EasyCardClient> | null = null;

// Token management constants
export const TOKEN_CACHE_KEY = "easycard:access_token" as const;
export const TOKEN_TTL = 3600 as const; // 1 hour in seconds

/**
 * Initialize the EasyCard client
 * Creates a singleton instance using environment variables
 */
export async function initializeClient(): Promise<EasyCardClient> {
  // If already initialized, return existing client
  if (client) {
    return client;
  }
  
  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Start initialization
  initializationPromise = (async () => {
    logger.info("Initializing EasyCard client", {
      operationType: "easycard-init",
    });
    
    client = EasyCardClient.fromEnv();
    
    // Initialize Redis for token caching
    try {
      if (!redis) {
        redis = await getRedis();
        logger.info("Redis connected for EasyCard token caching", {
          operationType: "easycard-redis-init",
        });
      }
    } catch (error) {
      logger.warn("Redis not available for EasyCard token caching", {
        error: error instanceof Error ? error.message : "Unknown error",
        operationType: "easycard-redis-init-error",
      });
    }

    // Get initial access token and configure client
    try {
      const accessToken = await getAccessToken();
      client.updateConfig({
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      logger.info("EasyCard client configured with access token", {
        operationType: "easycard-token-init",
      });
    } catch (error) {
      logger.error("Failed to get initial access token", {
        error: error instanceof Error ? error.message : "Unknown error",
        operationType: "easycard-token-init-error",
      });
      // Don't throw here - let individual API calls handle token retrieval
    }
    
    return client;
  })();
  
  return initializationPromise;
}

/**
 * Get the current EasyCard client instance
 * Throws if client is not initialized
 */
export function getClient(): EasyCardClient {
  if (!client) {
    throw new Error("EasyCard client not initialized. Call initializeClient() first.");
  }
  return client;
}

/**
 * Get the Redis instance for token caching
 */
export function getRedisInstance(): KeyvAdapter | null {
  return redis;
}

/**
 * Update client configuration
 */
export function updateClientConfig(config: {
  apiKey?: string;
  basePath?: string;
  headers?: Record<string, string>;
}): void {
  const easycardClient = getClient();
  easycardClient.updateConfig(config);
  
  logger.info("EasyCard client configuration updated", {
    operationType: "easycard-config-update",
    hasApiKey: !!config.apiKey,
    basePath: config.basePath,
  });
}

// Token request promise to prevent concurrent requests
let tokenRequestPromise: Promise<string> | null = null;

/**
 * Get access token with caching support
 * This is a shared utility for all EasyCard operations
 */
export async function getAccessToken(): Promise<string> {
  const redisInstance = getRedisInstance();
  
  // Check cache first if Redis is available
  if (redisInstance) {
    try {
      const cachedToken = await redisInstance.get(TOKEN_CACHE_KEY);
      if (cachedToken) {
        logger.debug("Using cached EasyCard access token", {
          operationType: "token-cache-hit",
        });
        return cachedToken;
      }
    } catch (error) {
      logger.warn("Failed to retrieve cached token", {
        error: error instanceof Error ? error.message : "Unknown error",
        operationType: "token-cache-error",
      });
    }
  }
  
  // If a token request is already in progress, wait for it
  if (tokenRequestPromise) {
    logger.debug("Waiting for in-progress token request", {
      operationType: "token-request-wait",
    });
    return tokenRequestPromise;
  }

  // Request new token from EasyCard Identity server
  logger.info("Requesting new EasyCard access token", {
    operationType: "token-request",
  });

  // Create token request promise
  tokenRequestPromise = (async () => {
    try {
      // Prepare form-urlencoded body
      const params = new URLSearchParams({
        authorizationKey: env.EASYCARD_API_KEY,
        grant_type: "terminal_rest_api",
        client_id: "terminal",
      });

      // Debug logging
      logger.debug("Token request details", {
        url: `${env.EASYCARD_IDENTITY_URL}/connect/token`,
        body: params.toString(),
        keyLength: env.EASYCARD_API_KEY?.length,
        keyPreview: env.EASYCARD_API_KEY?.substring(0, 20) + "...",
      });

      // Make request to identity server
      const response = await fetch(`${env.EASYCARD_IDENTITY_URL}/connect/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token request failed: ${response.status} - ${errorText}`);
      }

      const tokenResponse = await response.json() as {
        access_token: string;
        expires_in?: number;
        token_type: string;
      };

      if (!tokenResponse.access_token) {
        throw new Error("No access token in response");
      }

      const accessToken = tokenResponse.access_token;

      // Decode JWT to get expiration time
      const decoded = jwt.decode(accessToken) as { exp?: number } | null;
      
      let ttl: number;
      if (decoded?.exp) {
        // Calculate TTL from JWT exp claim with 60-second buffer
        const currentTime = Math.floor(Date.now() / 1000);
        ttl = Math.max(decoded.exp - currentTime - 60, 60); // Minimum 60 seconds
        
        logger.debug("Token expiration calculated from JWT", {
          exp: decoded.exp,
          currentTime,
          ttl,
          operationType: "token-ttl-calculation",
        });
      } else if (tokenResponse.expires_in) {
        // Fallback to expires_in from response with buffer
        ttl = Math.max(tokenResponse.expires_in - 60, 60);
        
        logger.debug("Token expiration from expires_in", {
          expires_in: tokenResponse.expires_in,
          ttl,
          operationType: "token-ttl-fallback",
        });
      } else {
        // Default TTL if no expiration info available
        ttl = 3600; // 1 hour
        
        logger.warn("No expiration info available, using default TTL", {
          ttl,
          operationType: "token-ttl-default",
        });
      }

      // Cache the token with calculated TTL
      if (redisInstance) {
        try {
          await redisInstance.set(TOKEN_CACHE_KEY, accessToken, {
            ttl: ttl * 1000, // KeyvAdapter expects milliseconds
          });
          logger.info("Cached EasyCard access token", {
            operationType: "token-cache-set",
            ttl,
          });
        } catch (error) {
          logger.warn("Failed to cache access token", {
            error: error instanceof Error ? error.message : "Unknown error",
            operationType: "token-cache-set-error",
          });
        }
      }

      return accessToken;
    } catch (error) {
      logger.error("Failed to get EasyCard access token", {
        message: error instanceof Error ? error.message : "Unknown error",
        operationType: "token-request-error",
      });
      throw new Error(
        `Failed to get EasyCard access token: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      // Clear the promise so next request can start fresh
      tokenRequestPromise = null;
    }
  })();
  
  return tokenRequestPromise;
}

/**
 * Cache an access token
 */
export async function cacheAccessToken(token: string): Promise<void> {
  const redisInstance = getRedisInstance();
  
  if (redisInstance) {
    try {
      await redisInstance.set(TOKEN_CACHE_KEY, token, {
        ttl: TOKEN_TTL * 1000, // KeyvAdapter expects milliseconds
      });
      logger.debug("Cached EasyCard access token", {
        operationType: "token-cache-set",
        ttl: TOKEN_TTL,
      });
    } catch (error) {
      logger.warn("Failed to cache access token", {
        error: error instanceof Error ? error.message : "Unknown error",
        operationType: "token-cache-set-error",
      });
    }
  }
}

/**
 * Clear cached access token
 */
export async function clearAccessToken(): Promise<void> {
  const redisInstance = getRedisInstance();
  
  if (redisInstance) {
    try {
      await redisInstance.delete(TOKEN_CACHE_KEY);
      logger.debug("Cleared cached EasyCard access token", {
        operationType: "token-cache-clear",
      });
    } catch (error) {
      logger.warn("Failed to clear cached token", {
        error: error instanceof Error ? error.message : "Unknown error",
        operationType: "token-cache-clear-error",
      });
    }
  }
}

/**
 * Ensure the client has a valid access token
 * Refreshes the token if needed
 */
export async function ensureValidToken(): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    const easycardClient = getClient();
    
    easycardClient.updateConfig({
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    logger.debug("Updated client with access token", {
      operationType: "token-update",
    });
  } catch (error) {
    logger.error("Failed to ensure valid token", {
      message: error instanceof Error ? error.message : "Unknown error",
      operationType: "token-ensure-error",
    });
    throw error;
  }
}

/**
 * Execute an API call with automatic token refresh on 401
 * @param operation The async operation to execute
 * @param retries Number of retries on 401 errors
 */
export async function executeWithTokenRefresh<T>(
  operation: () => Promise<T>,
  retries: number = 1
): Promise<T> {
  try {
    // Ensure we have a valid token before the operation
    await ensureValidToken();
    return await operation();
  } catch (error: any) {
    // Check if error is 401 Unauthorized
    if (retries > 0 && (error.status === 401 || error.response?.status === 401)) {
      logger.info("Received 401, refreshing token and retrying", {
        operationType: "token-refresh-retry",
        retriesLeft: retries - 1,
      });
      
      // Clear the cached token to force refresh
      await clearAccessToken();
      
      // Retry the operation
      return executeWithTokenRefresh(operation, retries - 1);
    }
    
    throw error;
  }
}

/**
 * Initialize the EasyCard payment service
 * This sets up the singleton client instance
 */
export async function initialize(): Promise<void> {
  await initializeClient();
  
  logger.info("EasyCard payment service initialized", {
    operationType: "payment-service-init",
  });
}

/**
 * Create a payment intent for processing
 */
export async function createPaymentIntent(
  request: CreatePaymentIntentRequest
): Promise<PaymentResult> {
  return createIntent(request);
}

/**
 * Retrieve a payment intent by ID
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<PaymentIntent | null> {
  return getIntent(paymentIntentId);
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<PaymentResult> {
  return cancelIntent(paymentIntentId);
}

/**
 * Process webhook events from payment provider
 */
export async function processWebhookEvent(event: PaymentWebhookEvent): Promise<{
  success: boolean;
  payment_intent?: PaymentIntent;
  error?: string;
}> {
  return processWebhook(event);
}

/**
 * Verify webhook signature for security
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  return verifySignature(payload, signature);
}

/**
 * Get supported payment methods
 */
export function getSupportedPaymentMethods(): string[] {
  // EasyCard typically supports various card types and potentially digital wallets
  return [
    "visa",
    "mastercard",
    "amex",
    "diners",
    "discover",
    "isracard",
    "apple_pay",
    "google_pay",
  ];
}

/**
 * Get service provider name
 */
export function getProviderName(): string {
  return "EasyCard";
}

/**
 * Handle webhook events - convenience method for GraphQL resolver
 */
export async function handleWebhook(payload: any): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  return handleWebhookEvent(payload);
}

/**
 * Refund a payment
 */
export async function refundPayment(
  paymentIntentId: string,
  amount?: number
): Promise<PaymentResult> {
  return refundPaymentIntent(paymentIntentId, amount);
}


// Export singleton functions as default
export default {
  initialize,
  createPaymentIntent,
  getPaymentIntent,
  cancelPaymentIntent,
  processWebhookEvent,
  verifyWebhookSignature,
  getSupportedPaymentMethods,
  getProviderName,
  getAccessToken,
  ensureValidToken,
  executeWithTokenRefresh,
};

// Re-export types for convenience
export type { EasyCardClient } from "@hiilo/easycard-client";