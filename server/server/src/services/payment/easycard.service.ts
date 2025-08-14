import { EasyCardClient, env, createPrismClient } from "@hiilo/easycard-client";
import { logger } from "../../lib/logger";
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
let initializationPromise: Promise<EasyCardClient> | null = null;

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
      environment: process.env.EASYCARD_ENVIRONMENT,
    });
    
    // Use Prism mock client for test environment
    if (process.env.EASYCARD_ENVIRONMENT === 'test') {
      logger.info("Using EasyCard test client (Prism mock server)", {
        operationType: "easycard-test-init",
      });
      
      client = createPrismClient({
        basePath: process.env.EASYCARD_MOCK_BASE_URL || 'http://localhost:4012'
      });
    } else {
      // Use real client for production
      logger.info("Using EasyCard production client", {
        operationType: "easycard-production-init",
      });
      
      client = EasyCardClient.fromEnv();
      
      // Only set up token management for production
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
      }
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
 * Only used for production environment - test doesn't need real tokens
 */
export async function getAccessToken(): Promise<string> {
  // For test environment, return a mock token immediately
  if (process.env.EASYCARD_ENVIRONMENT === 'test') {
    logger.debug("Using mock EasyCard access token", {
      operationType: "token-mock-hit",
    });
    return "mock.jwt.token.for.testing";
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

      return tokenResponse.access_token;
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
 * Ensure the client has a valid access token (production only)
 */
export async function ensureValidToken(): Promise<void> {
  // Test environment doesn't need real token management
  if (process.env.EASYCARD_ENVIRONMENT === 'test') {
    return;
  }

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
 * Execute an API call with automatic token refresh on 401 (production only)
 */
export async function executeWithTokenRefresh<T>(
  operation: () => Promise<T>,
  retries: number = 1
): Promise<T> {
  // Test environment doesn't need token refresh logic
  if (process.env.EASYCARD_ENVIRONMENT === 'test') {
    return await operation();
  }

  try {
    await ensureValidToken();
    return await operation();
  } catch (error: any) {
    // Check if error is 401 Unauthorized and we have retries left
    if (retries > 0 && (error.status === 401 || error.response?.status === 401)) {
      logger.info("Received 401, refreshing token and retrying", {
        operationType: "token-refresh-retry",
        retriesLeft: retries - 1,
      });
      
      // Force token refresh by clearing the current promise
      tokenRequestPromise = null;
      
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