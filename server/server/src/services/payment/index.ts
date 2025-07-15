import { MockPaymentService } from './mock-payment-service';
import type { PaymentService } from './payment-service.interface';

export type { PaymentService } from './payment-service.interface';
export { MockPaymentService } from './mock-payment-service';
export type {
  PaymentIntent,
  CreatePaymentIntentRequest,
  PaymentWebhookEvent,
  PaymentResult,
  PaymentError,
  PaymentServiceConfig,
} from './payment-types';

// Payment service factory
export function createPaymentService(provider: 'mock' | 'stripe' = 'mock'): PaymentService {
  switch (provider) {
    case 'mock':
      return new MockPaymentService();
    case 'stripe':
      // TODO: Implement Stripe payment service when needed
      throw new Error('Stripe payment service not implemented yet');
    default:
      throw new Error(`Unknown payment provider: ${provider}`);
  }
}