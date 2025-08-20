import * as runtime from "./generated/src/runtime";
import {
  BillingApi,
  CardTokenApi,
  InvoicingApi,
  PaymentIntentApi,
  PaymentRequestsApi,
  TransactionsApiApi,
  WebhooksApi,
} from "./generated/src/apis";
import { env } from "./config";
import { createLogger } from "@hiilo/utils";

const logger = createLogger({
  component: "EasyCardClient",
  operationType: "easycard-client",
});

export interface EasyCardClientConfig {
  apiKey?: string;
  basePath?: string;
  headers?: Record<string, string>;
}

interface TokenResponse {
  access_token: string;
  expires_in?: number;
  token_type: string;
}

export class EasyCardClient {
  private configuration: runtime.Configuration;
  private accessToken?: string;
  private tokenExpiresAt?: number;
  private tokenRequestPromise?: Promise<string>;
  private initialized = false;
  private _billing?: BillingApi;
  private _cardToken?: CardTokenApi;
  private _invoicing?: InvoicingApi;
  private _paymentIntent?: PaymentIntentApi;
  private _paymentRequests?: PaymentRequestsApi;
  private _transactions?: TransactionsApiApi;
  private _webhooks?: WebhooksApi;

  // Public getters that ensure initialization
  get billing(): BillingApi {
    if (!this._billing) {
      this._billing = new BillingApi(this.configuration);
    }
    return this._billing;
  }

  get cardToken(): CardTokenApi {
    if (!this._cardToken) {
      this._cardToken = new CardTokenApi(this.configuration);
    }
    return this._cardToken;
  }

  get invoicing(): InvoicingApi {
    if (!this._invoicing) {
      this._invoicing = new InvoicingApi(this.configuration);
    }
    return this._invoicing;
  }

  get paymentIntent(): PaymentIntentApi {
    if (!this._paymentIntent) {
      this._paymentIntent = new PaymentIntentApi(this.configuration);
    }
    return this._paymentIntent;
  }

  get paymentRequests(): PaymentRequestsApi {
    if (!this._paymentRequests) {
      this._paymentRequests = new PaymentRequestsApi(this.configuration);
    }
    return this._paymentRequests;
  }

  get transactions(): TransactionsApiApi {
    if (!this._transactions) {
      this._transactions = new TransactionsApiApi(this.configuration);
    }
    return this._transactions;
  }

  get webhooks(): WebhooksApi {
    if (!this._webhooks) {
      this._webhooks = new WebhooksApi(this.configuration);
    }
    return this._webhooks;
  }

  constructor(config: EasyCardClientConfig = {}) {
    this.configuration = new runtime.Configuration({
      basePath:
        config.basePath || env.EASYCARD_API_URL || "https://ecng-transactions.azurewebsites.net",
      headers: {
        ...config.headers,
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
    });
    // APIs are now lazily initialized via getters
  }

  /**
   * Create a client instance using environment variables
   * Validates EASYCARD_API_KEY and EASYCARD_API_URL env vars
   */
  static fromEnv(): EasyCardClient {
    logger.info("Creating EasyCardClient from env", {
      operationType: "easycard-client-from-env",
      apiKey:
        env.EASY_CARD_PRIVATE_API_KEY?.substring(0, 4) +
        "..." +
        env.EASY_CARD_PRIVATE_API_KEY?.substring(env.EASY_CARD_PRIVATE_API_KEY.length - 4),
      apiUrl: env.EASYCARD_API_URL,
    });
    return new EasyCardClient({
      basePath: env.EASYCARD_API_URL,
    });
  }

  /**
   * Initialize the client with authentication
   * Sets up access token for API calls
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // For test environment, use mock token
    if (env.EASYCARD_MODE === 'development') {
      logger.info("Using mock EasyCard token for test environment", {
        operationType: "easycard-init-test",
      });
      this.accessToken = "mock.jwt.token.for.testing";
      this.initialized = true;
      this.updateAuthHeader(this.accessToken);
      return;
    }

    logger.info("Initializing EasyCard client with authentication", {
      operationType: "easycard-init",
      environment: env.EASYCARD_MODE,
    });

    try {
      const token = await this.getAccessToken();
      this.updateAuthHeader(token);
      this.initialized = true;
      
      logger.info("EasyCard client initialized successfully", {
        operationType: "easycard-init-success",
      });
    } catch (error) {
      logger.error("Failed to initialize EasyCard client", error as Error, {
        operationType: "easycard-init-error",
      });
      throw error;
    }
  }

  get headers(): Record<string, string> {
    return this.configuration.headers || {};
  }

  /**
   * Get or refresh access token
   * Implements OAuth2 client credentials flow with EasyCard Identity server
   */
  private async getAccessToken(): Promise<string> {
    // For test environment, return mock token
    if (env.EASYCARD_MODE === 'development') {
      return "mock.jwt.token.for.testing";
    }

    // Check if we have a valid cached token
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      logger.debug("Using cached EasyCard access token", {
        operationType: "token-cache-hit",
        expiresIn: Math.floor((this.tokenExpiresAt - Date.now()) / 1000),
      });
      return this.accessToken;
    }

    // If a token request is already in progress, wait for it
    if (this.tokenRequestPromise) {
      logger.debug("Waiting for in-progress token request", {
        operationType: "token-request-wait",
      });
      return this.tokenRequestPromise;
    }

    // Request new token
    logger.info("Requesting new EasyCard access token", {
      operationType: "token-request",
    });

    this.tokenRequestPromise = this.requestNewToken();
    
    try {
      const token = await this.tokenRequestPromise;
      return token;
    } finally {
      this.tokenRequestPromise = undefined;
    }
  }

  /**
   * Request a new access token from the identity server
   */
  private async requestNewToken(): Promise<string> {
    try {
      // Prepare form-urlencoded body
      const params = new URLSearchParams({
        authorizationKey: env.EASY_CARD_PRIVATE_API_KEY,
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

      const tokenResponse = await response.json() as TokenResponse;

      if (!tokenResponse.access_token) {
        throw new Error("No access token in response");
      }

      // Cache the token with expiry
      this.accessToken = tokenResponse.access_token;
      // Set expiry to 5 minutes before actual expiry (or 50 minutes if not provided)
      const expiresIn = tokenResponse.expires_in || 3600;
      this.tokenExpiresAt = Date.now() + (expiresIn - 300) * 1000;

      logger.info("Successfully obtained new EasyCard access token", {
        operationType: "token-request-success",
        expiresIn,
      });

      return tokenResponse.access_token;
    } catch (error) {
      logger.error("Failed to get EasyCard access token", error as Error, {
        operationType: "token-request-error",
      });
      throw new Error(
        `Failed to get EasyCard access token: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Update authorization header with new token
   */
  private updateAuthHeader(token: string): void {
    this.configuration = new runtime.Configuration({
      basePath: this.configuration.basePath,
      headers: {
        ...this.configuration.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    // Clear cached API instances so they get recreated with new configuration
    this._billing = undefined;
    this._cardToken = undefined;
    this._invoicing = undefined;
    this._paymentIntent = undefined;
    this._paymentRequests = undefined;
    this._transactions = undefined;
    this._webhooks = undefined;
  }

  /**
   * Execute an API call with automatic token refresh on 401
   */
  async executeWithTokenRefresh<T>(
    operation: () => Promise<T>,
    retries: number = 1
  ): Promise<T> {
    // Ensure client is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    // For test environment, just execute the operation
    if (env.EASYCARD_MODE === 'development') {
      return await operation();
    }

    try {
      // Ensure we have a valid token
      const token = await this.getAccessToken();
      this.updateAuthHeader(token);
      
      // Execute the operation
      return await operation();
    } catch (error: any) {
      // Check if error is 401 Unauthorized and we have retries left
      if (retries > 0 && (error.status === 401 || error.response?.status === 401)) {
        logger.info("Received 401, refreshing token and retrying", {
          operationType: "token-refresh-retry",
          retriesLeft: retries - 1,
        });
        
        // Force token refresh
        this.accessToken = undefined;
        this.tokenExpiresAt = undefined;
        
        // Retry the operation
        return this.executeWithTokenRefresh(operation, retries - 1);
      }
      
      throw error;
    }
  }

}

// Singleton instance management
let clientInstance: EasyCardClient | null = null;
let initializationPromise: Promise<EasyCardClient> | null = null;

/**
 * Get or create the singleton EasyCard client instance
 * Ensures the client is initialized with proper authentication
 */
export async function getEasyCardClient(): Promise<EasyCardClient> {
  // If already initialized, return existing client
  if (clientInstance) {
    return clientInstance;
  }
  
  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Start initialization
  initializationPromise = (async () => {
    logger.info("Creating singleton EasyCard client instance", {
      operationType: "easycard-singleton-init",
      mode: env.EASYCARD_MODE,
    });
    
    const client = EasyCardClient.fromEnv();
    await client.initialize();
    
    clientInstance = client;
    return client;
  })();
  
  return initializationPromise;
}

/**
 * Reset the singleton client instance (useful for testing)
 */
export function resetEasyCardClient(): void {
  clientInstance = null;
  initializationPromise = null;
}
