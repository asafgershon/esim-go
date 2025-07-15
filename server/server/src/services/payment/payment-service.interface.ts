import type {
  PaymentIntent,
  CreatePaymentIntentRequest,
  PaymentWebhookEvent,
  PaymentResult,
} from './payment-types';

export interface PaymentService {
  /**
   * Initialize the payment service with configuration
   */
  initialize(config: any): Promise<void>;

  /**
   * Create a payment intent for processing
   */
  createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentResult>;

  /**
   * Retrieve a payment intent by ID
   */
  getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null>;

  /**
   * Cancel a payment intent
   */
  cancelPaymentIntent(paymentIntentId: string): Promise<PaymentResult>;

  /**
   * Process webhook events from payment provider
   */
  processWebhookEvent(event: PaymentWebhookEvent): Promise<{
    success: boolean;
    payment_intent?: PaymentIntent;
    error?: string;
  }>;

  /**
   * Verify webhook signature (for security)
   */
  verifyWebhookSignature(payload: string, signature: string): boolean;

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods(): string[];

  /**
   * Get service provider name
   */
  getProviderName(): string;
}