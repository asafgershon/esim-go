import * as runtime from './generated/src/runtime';
import {
  BillingApi,
  CardTokenApi,
  InvoicingApi,
  PaymentIntentApi,
  PaymentRequestsApi,
  TransactionsApiApi,
  WebhooksApi,
} from './generated/src/apis';
import { env } from './config';

export interface EasyCardClientConfig {
  apiKey?: string;
  basePath?: string;
  headers?: Record<string, string>;
}

export class EasyCardClient {
  private configuration: runtime.Configuration;
  
  public billing: BillingApi;
  public cardToken: CardTokenApi;
  public invoicing: InvoicingApi;
  public paymentIntent: PaymentIntentApi;
  public paymentRequests: PaymentRequestsApi;
  public transactions: TransactionsApiApi;
  public webhooks: WebhooksApi;

  constructor(config: EasyCardClientConfig = {}) {
    this.configuration = new runtime.Configuration({
      basePath: config.basePath || 'https://ecng-transactions.azurewebsites.net',
      headers: {
        ...config.headers,
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
      },
    });

    // Initialize all API endpoints
    this.billing = new BillingApi(this.configuration);
    this.cardToken = new CardTokenApi(this.configuration);
    this.invoicing = new InvoicingApi(this.configuration);
    this.paymentIntent = new PaymentIntentApi(this.configuration);
    this.paymentRequests = new PaymentRequestsApi(this.configuration);
    this.transactions = new TransactionsApiApi(this.configuration);
    this.webhooks = new WebhooksApi(this.configuration);
  }

  /**
   * Create a client instance using environment variables
   * Validates EASYCARD_API_KEY and EASYCARD_API_URL env vars
   */
  static fromEnv(): EasyCardClient {
    return new EasyCardClient({
      apiKey: env.EASYCARD_API_KEY,
      basePath: env.EASYCARD_API_URL,
    });
  }

  /**
   * Update the API configuration
   */
  updateConfig(config: Partial<EasyCardClientConfig>): void {
    if (config.basePath !== undefined || config.headers !== undefined || config.apiKey !== undefined) {
      this.configuration = new runtime.Configuration({
        basePath: config.basePath || this.configuration.basePath,
        headers: {
          ...this.configuration.headers,
          ...config.headers,
          ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
        },
      });

      // Re-initialize all API endpoints with new configuration
      this.billing = new BillingApi(this.configuration);
      this.cardToken = new CardTokenApi(this.configuration);
      this.invoicing = new InvoicingApi(this.configuration);
      this.paymentIntent = new PaymentIntentApi(this.configuration);
      this.paymentRequests = new PaymentRequestsApi(this.configuration);
      this.transactions = new TransactionsApiApi(this.configuration);
      this.webhooks = new WebhooksApi(this.configuration);
    }
  }
}