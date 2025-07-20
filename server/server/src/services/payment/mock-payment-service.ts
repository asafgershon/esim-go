import type { PaymentService } from './payment-service.interface';
import type {
  PaymentIntent,
  CreatePaymentIntentRequest,
  PaymentWebhookEvent,
  PaymentResult,
} from './payment-types';
import { createLogger } from '../../lib/logger';

/**
 * Mock payment service for development and testing
 * Simulates payment processing without real payment providers
 */
export class MockPaymentService implements PaymentService {
  private initialized = false;
  private config: any = {};
  private logger = createLogger({ component: 'MockPaymentService' });

  async initialize(config: any): Promise<void> {
    this.config = config;
    this.initialized = true;
    this.logger.info('MockPaymentService initialized', { operationType: 'service-init' });
  }

  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentResult> {
    if (!this.initialized) {
      throw new Error('PaymentService not initialized');
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create mock payment intent
    const paymentIntent: PaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      status: 'processing',
      amount: request.amount,
      currency: request.currency.toLowerCase(),
      payment_method: request.payment_method_id,
      client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.logger.info('Mock payment intent created', { 
      paymentIntentId: paymentIntent.id,
      amount: request.amount,
      currency: request.currency,
      operationType: 'payment-creation'
    });

    return {
      success: true,
      payment_intent: paymentIntent,
    };
  }

  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
    if (!this.initialized) {
      throw new Error('PaymentService not initialized');
    }

    // Simulate database lookup
    if (paymentIntentId.startsWith('pi_mock_')) {
      return {
        id: paymentIntentId,
        status: 'processing',
        amount: 1000, // Mock amount
        currency: 'usd',
        payment_method: 'pm_mock_card',
      };
    }

    return null;
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<PaymentResult> {
    if (!this.initialized) {
      throw new Error('PaymentService not initialized');
    }

    // Simulate cancellation
    const paymentIntent: PaymentIntent = {
      id: paymentIntentId,
      status: 'canceled',
      amount: 1000,
      currency: 'usd',
    };

    return {
      success: true,
      payment_intent: paymentIntent,
    };
  }

  async processWebhookEvent(event: PaymentWebhookEvent): Promise<{
    success: boolean;
    payment_intent?: PaymentIntent;
    error?: string;
  }> {
    if (!this.initialized) {
      throw new Error('PaymentService not initialized');
    }

    this.logger.info('Processing mock webhook event', { 
      eventType: event.type,
      operationType: 'webhook-processing'
    });

    // Simulate webhook processing
    return {
      success: true,
      payment_intent: event.data.object,
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Mock verification always succeeds
    return true;
  }

  getSupportedPaymentMethods(): string[] {
    return ['card', 'paypal', 'apple_pay', 'google_pay'];
  }

  getProviderName(): string {
    return 'Mock Payment Service';
  }

  /**
   * Mock-specific method to simulate payment success/failure
   */
  async simulatePaymentCompletion(
    paymentIntentId: string,
    success: boolean = true
  ): Promise<PaymentIntent> {
    const paymentIntent: PaymentIntent = {
      id: paymentIntentId,
      status: success ? 'succeeded' : 'failed',
      amount: 1000,
      currency: 'usd',
      payment_method: 'pm_mock_card',
    };

    if (!success) {
      paymentIntent.error = 'Mock payment failure';
    }

    return paymentIntent;
  }
}