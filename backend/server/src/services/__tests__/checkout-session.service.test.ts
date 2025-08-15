import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GraphQLError } from 'graphql';
import { createCheckoutSessionService, CheckoutState } from '../checkout-session.service';
import { PaymentMethod } from '../../types';

// Mock dependencies
const mockContext = {
  services: {
    redis: {
      set: vi.fn(),
      eval: vi.fn(),
    },
    easycardPayment: {
      createPaymentIntent: vi.fn(),
      executePayment: vi.fn(),
      simulatePaymentCompletion: vi.fn(),
    },
  },
  repositories: {
    bundles: {
      search: vi.fn(),
    },
    checkoutSessions: {
      create: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
      updateTokenHash: vi.fn(),
      markCompleted: vi.fn(),
      findByPaymentIntent: vi.fn(),
      findExpired: vi.fn(),
    },
    orders: {
      createOrderWithPricing: vi.fn(),
    },
    users: {
      getById: vi.fn(),
    },
  },
  dataSources: {
    esims: {
      getESIMInstallDetails: vi.fn(),
    },
  },
} as any;

// Mock pricing calculation
vi.mock('@hiilo/rules-engine-2', () => ({
  calculatePricing: vi.fn().mockResolvedValue({
    pricing: {
      cost: 10,
      finalPrice: 15,
      markup: 5,
      discountRate: 0,
      processingCost: 0.5,
      netProfit: 4.5,
    },
    selectedBundle: {
      esim_go_name: 'test-bundle',
      validity_in_days: 7,
      countries: ['US'],
      data_amount_mb: 1000,
      is_unlimited: false,
    },
    appliedRules: [],
  }),
  PaymentMethod: {
    IsraeliCard: 'ISRAELI_CARD',
  },
}));

// Mock pubsub
vi.mock('../../context/pubsub', () => ({
  getPubSub: vi.fn().mockResolvedValue({
    publish: vi.fn(),
  }),
  PubSubEvents: {
    CHECKOUT_SESSION_UPDATED: 'CHECKOUT_SESSION_UPDATED',
  },
}));

// Mock esim purchase
vi.mock('../esim-purchase', () => ({
  purchaseAndDeliverESIM: vi.fn().mockResolvedValue(true),
}));

describe('CheckoutSessionService', () => {
  let service: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createCheckoutSessionService(mockContext);
  });

  describe('createSession', () => {
    it('should create a new checkout session with valid input', async () => {
      // Setup mocks
      mockContext.repositories.bundles.search.mockResolvedValue({
        data: [
          {
            esim_go_name: 'test-bundle',
            validity_in_days: 7,
            countries: ['US'],
            price: 15,
          },
        ],
        count: 1,
      });

      mockContext.repositories.checkoutSessions.create.mockResolvedValue({
        id: 'session-123',
        state: CheckoutState.INITIALIZED,
        plan_id: 'test-bundle',
        plan_snapshot: JSON.stringify({
          id: 'test-bundle',
          name: 'test-bundle',
          duration: 7,
          price: 15,
          currency: 'USD',
          countries: ['US'],
        }),
        pricing: {},
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          state: CheckoutState.INITIALIZED,
        },
      });

      // Execute
      const session = await service.createSession({
        countryId: 'US',
        numOfDays: 7,
        group: 'test-group',
      });

      // Assert
      expect(session).toBeDefined();
      expect(session.id).toBe('session-123');
      expect(session.state).toBe(CheckoutState.INITIALIZED);
      expect(session.bundleId).toBe('test-bundle');
      expect(mockContext.repositories.bundles.search).toHaveBeenCalled();
      expect(mockContext.repositories.checkoutSessions.create).toHaveBeenCalled();
    });

    it('should throw error when no bundles are available', async () => {
      // Setup mocks
      mockContext.repositories.bundles.search.mockResolvedValue({
        data: [],
        count: 0,
      });

      // Execute & Assert
      await expect(
        service.createSession({
          countryId: 'XX',
          numOfDays: 7,
        })
      ).rejects.toThrow(GraphQLError);
    });

    it('should validate input and throw on invalid duration', async () => {
      // Execute & Assert
      await expect(
        service.createSession({
          countryId: 'US',
          numOfDays: -1,
        })
      ).rejects.toThrow('Invalid requested duration');
    });

    it('should require either countryId or regionId', async () => {
      // Execute & Assert
      await expect(
        service.createSession({
          numOfDays: 7,
        })
      ).rejects.toThrow('Either countryId or regionId is required');
    });
  });

  describe('authenticateSession', () => {
    it('should authenticate session and create payment intent', async () => {
      // Setup mocks
      mockContext.services.redis.set.mockResolvedValue('OK'); // Lock acquired
      mockContext.services.redis.eval.mockResolvedValue(1); // Lock released

      mockContext.repositories.checkoutSessions.getById.mockResolvedValue({
        id: 'session-123',
        plan_id: 'test-bundle',
        plan_snapshot: JSON.stringify({
          id: 'test-bundle',
          name: 'test-bundle',
          duration: 7,
          price: 15,
          currency: 'USD',
          countries: ['US'],
        }),
        metadata: {
          state: CheckoutState.INITIALIZED,
        },
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });

      mockContext.repositories.users.getById.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      });

      mockContext.services.easycardPayment.createPaymentIntent.mockResolvedValue({
        success: true,
        payment_intent: {
          entityUID: 'payment-intent-123',
          additionalData: {
            url: 'https://payment.url',
            applePayJavaScriptUrl: 'https://applepay.url',
          },
        },
      });

      mockContext.repositories.checkoutSessions.update.mockResolvedValue({
        id: 'session-123',
        user_id: 'user-123',
        payment_intent_id: 'payment-intent-123',
        metadata: {
          state: CheckoutState.AUTHENTICATED,
        },
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });

      // Execute
      const session = await service.authenticateSession('session-123', 'user-123');

      // Assert
      expect(session.state).toBe(CheckoutState.AUTHENTICATED);
      expect(session.userId).toBe('user-123');
      expect(mockContext.services.easycardPayment.createPaymentIntent).toHaveBeenCalled();
      expect(mockContext.repositories.checkoutSessions.update).toHaveBeenCalled();
    });

    it('should throw error if session not found', async () => {
      // Setup mocks
      mockContext.services.redis.set.mockResolvedValue('OK');
      mockContext.repositories.checkoutSessions.getById.mockResolvedValue(null);

      // Execute & Assert
      await expect(
        service.authenticateSession('invalid-session', 'user-123')
      ).rejects.toThrow('Session not found');
    });

    it('should validate state transition', async () => {
      // Setup mocks
      mockContext.services.redis.set.mockResolvedValue('OK');
      mockContext.repositories.checkoutSessions.getById.mockResolvedValue({
        id: 'session-123',
        metadata: {
          state: CheckoutState.PAYMENT_COMPLETED,
        },
      });

      // Execute & Assert
      await expect(
        service.authenticateSession('session-123', 'user-123')
      ).rejects.toThrow('Cannot authenticate session in state: PAYMENT_COMPLETED');
    });
  });

  describe('setDeliveryMethod', () => {
    it('should set delivery method with email', async () => {
      // Setup mocks
      mockContext.services.redis.set.mockResolvedValue('OK');
      mockContext.services.redis.eval.mockResolvedValue(1);

      mockContext.repositories.checkoutSessions.getById.mockResolvedValue({
        id: 'session-123',
        user_id: 'user-123',
        metadata: {
          state: CheckoutState.AUTHENTICATED,
        },
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });

      mockContext.repositories.checkoutSessions.update.mockResolvedValue({
        id: 'session-123',
        metadata: {
          state: CheckoutState.DELIVERY_SET,
          delivery: {
            method: 'EMAIL',
            email: 'test@example.com',
          },
        },
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });

      // Execute
      const session = await service.setDeliveryMethod('session-123', {
        method: 'EMAIL',
        email: 'test@example.com',
      });

      // Assert
      expect(session.state).toBe(CheckoutState.DELIVERY_SET);
      expect(session.metadata.delivery.method).toBe('EMAIL');
      expect(session.metadata.delivery.email).toBe('test@example.com');
    });

    it('should validate email is provided for email delivery', async () => {
      // Setup mocks
      mockContext.services.redis.set.mockResolvedValue('OK');
      mockContext.repositories.checkoutSessions.getById.mockResolvedValue({
        id: 'session-123',
        metadata: {
          state: CheckoutState.AUTHENTICATED,
        },
      });

      // Execute & Assert
      await expect(
        service.setDeliveryMethod('session-123', {
          method: 'EMAIL',
        })
      ).rejects.toThrow('Email required for email delivery');
    });
  });

  describe('processPayment', () => {
    it('should initiate payment processing', async () => {
      // Setup mocks
      mockContext.services.redis.set.mockResolvedValue('OK');
      mockContext.services.redis.eval.mockResolvedValue(1);

      mockContext.repositories.checkoutSessions.getById.mockResolvedValue({
        id: 'session-123',
        payment_intent_id: 'payment-intent-123',
        metadata: {
          state: CheckoutState.PAYMENT_READY,
        },
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });

      mockContext.repositories.checkoutSessions.update.mockResolvedValue({
        id: 'session-123',
        payment_status: 'PROCESSING',
        metadata: {
          state: CheckoutState.PAYMENT_PROCESSING,
        },
      });

      // Execute
      const result = await service.processPayment('session-123');

      // Assert
      expect(result.success).toBe(true);
      expect(mockContext.repositories.checkoutSessions.update).toHaveBeenCalledWith(
        'session-123',
        expect.objectContaining({
          payment_status: 'PROCESSING',
        })
      );
    });

    it('should return success if already completed', async () => {
      // Setup mocks
      mockContext.services.redis.set.mockResolvedValue('OK');
      mockContext.repositories.checkoutSessions.getById.mockResolvedValue({
        id: 'session-123',
        order_id: 'order-123',
        metadata: {
          state: CheckoutState.PAYMENT_COMPLETED,
        },
      });

      // Execute
      const result = await service.processPayment('session-123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.orderId).toBe('order-123');
    });
  });

  describe('handlePaymentWebhook', () => {
    it('should handle successful payment webhook', async () => {
      // Setup mocks
      mockContext.repositories.checkoutSessions.findByPaymentIntent.mockResolvedValue({
        id: 'session-123',
        user_id: 'user-123',
        plan_snapshot: JSON.stringify({
          name: 'test-bundle',
          price: 15,
        }),
        pricing: {
          pricing: {
            finalPrice: 15,
            cost: 10,
            netProfit: 4.5,
            markup: 5,
            discountRate: 0,
            processingCost: 0.5,
          },
        },
        metadata: {
          state: CheckoutState.PAYMENT_PROCESSING,
          delivery: {
            email: 'test@example.com',
          },
        },
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });

      mockContext.services.redis.set.mockResolvedValue('OK');
      mockContext.services.redis.eval.mockResolvedValue(1);

      mockContext.repositories.orders.createOrderWithPricing.mockResolvedValue({
        id: 'order-123',
      });

      mockContext.repositories.checkoutSessions.markCompleted.mockResolvedValue({
        id: 'session-123',
        order_id: 'order-123',
      });

      mockContext.repositories.checkoutSessions.update.mockResolvedValue({
        id: 'session-123',
        metadata: {
          state: CheckoutState.PAYMENT_COMPLETED,
        },
      });

      // Execute
      await service.handlePaymentWebhook('payment-intent-123', 'succeeded', {});

      // Assert
      expect(mockContext.repositories.orders.createOrderWithPricing).toHaveBeenCalled();
      expect(mockContext.repositories.checkoutSessions.markCompleted).toHaveBeenCalled();
    });

    it('should handle failed payment webhook', async () => {
      // Setup mocks
      mockContext.repositories.checkoutSessions.findByPaymentIntent.mockResolvedValue({
        id: 'session-123',
        metadata: {
          state: CheckoutState.PAYMENT_PROCESSING,
        },
      });

      mockContext.services.redis.set.mockResolvedValue('OK');
      mockContext.services.redis.eval.mockResolvedValue(1);

      mockContext.repositories.checkoutSessions.update.mockResolvedValue({
        id: 'session-123',
        payment_status: 'FAILED',
      });

      // Execute
      await service.handlePaymentWebhook('payment-intent-123', 'failed', {
        error: 'Card declined',
      });

      // Assert
      expect(mockContext.repositories.checkoutSessions.update).toHaveBeenCalledWith(
        'session-123',
        expect.objectContaining({
          payment_status: 'FAILED',
        })
      );
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions', async () => {
      // Setup mocks
      mockContext.repositories.checkoutSessions.findExpired.mockResolvedValue([
        {
          id: 'session-1',
          metadata: { state: CheckoutState.INITIALIZED },
        },
        {
          id: 'session-2',
          metadata: { state: CheckoutState.AUTHENTICATED },
        },
        {
          id: 'session-3',
          metadata: { state: CheckoutState.PAYMENT_COMPLETED },
        },
      ]);

      mockContext.repositories.checkoutSessions.update.mockResolvedValue({});

      // Execute
      const count = await service.cleanupExpiredSessions();

      // Assert
      expect(count).toBe(2); // Only non-completed sessions
      expect(mockContext.repositories.checkoutSessions.update).toHaveBeenCalledTimes(2);
    });
  });
});