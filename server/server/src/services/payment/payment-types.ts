export interface PaymentIntent {
  id: string;
  status: 'processing' | 'succeeded' | 'failed' | 'canceled';
  amount: number;
  currency: string;
  payment_method?: string;
  client_secret?: string;
  error?: string;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  payment_method_id: string;
  customer_id?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentWebhookEvent {
  id: string;
  type: string;
  data: {
    object: PaymentIntent;
  };
  created: number;
}

export interface PaymentServiceConfig {
  apiKey: string;
  webhookSecret?: string;
  environment?: 'sandbox' | 'production';
}

export interface PaymentError {
  code: string;
  message: string;
  type: 'card_error' | 'validation_error' | 'api_error' | 'authentication_error';
}

export interface PaymentResult {
  success: boolean;
  payment_intent?: PaymentIntent;
  error?: PaymentError;
}