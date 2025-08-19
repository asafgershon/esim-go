import { describe, it, expect } from 'vitest';
import { CheckoutState, mapStateToSteps } from '../checkout-session.service';

describe('mapStateToSteps', () => {
  it('should return proper steps for INITIALIZED state', () => {
    const steps = mapStateToSteps({
      state: CheckoutState.INITIALIZED,
      metadata: {}
    });

    expect(steps).toBeDefined();
    expect(steps.authentication).toBeDefined();
    expect(steps.authentication.completed).toBe(false);
    expect(steps.delivery.completed).toBe(false);
    expect(steps.payment.completed).toBe(false);
  });

  it('should return proper steps for AUTHENTICATED state', () => {
    const steps = mapStateToSteps({
      state: CheckoutState.AUTHENTICATED,
      userId: 'user-123',
      metadata: {
        authCompletedAt: '2024-01-01T00:00:00Z'
      }
    });

    expect(steps).toBeDefined();
    expect(steps.authentication.completed).toBe(true);
    expect(steps.authentication.userId).toBe('user-123');
    expect(steps.authentication.completedAt).toBe('2024-01-01T00:00:00Z');
    expect(steps.delivery.completed).toBe(false);
    expect(steps.payment.completed).toBe(false);
  });

  it('should return proper steps for DELIVERY_SET state', () => {
    const steps = mapStateToSteps({
      state: CheckoutState.DELIVERY_SET,
      userId: 'user-123',
      metadata: {
        authCompletedAt: '2024-01-01T00:00:00Z',
        deliveryCompletedAt: '2024-01-01T00:01:00Z',
        delivery: {
          method: 'EMAIL',
          email: 'test@example.com'
        }
      }
    });

    expect(steps).toBeDefined();
    expect(steps.authentication.completed).toBe(true);
    expect(steps.delivery.completed).toBe(true);
    expect(steps.delivery.method).toBe('EMAIL');
    expect(steps.delivery.email).toBe('test@example.com');
    expect(steps.payment.completed).toBe(false);
  });

  it('should return proper steps for PAYMENT_READY state', () => {
    const steps = mapStateToSteps({
      state: CheckoutState.PAYMENT_READY,
      userId: 'user-123',
      metadata: {
        authCompletedAt: '2024-01-01T00:00:00Z',
        deliveryCompletedAt: '2024-01-01T00:01:00Z',
        delivery: {
          method: 'EMAIL',
          email: 'test@example.com'
        }
      }
    });

    expect(steps).toBeDefined();
    expect(steps.authentication.completed).toBe(true);
    expect(steps.delivery.completed).toBe(true);
    expect(steps.payment.readyForPayment).toBe(true);
    expect(steps.payment.completed).toBe(false);
  });

  it('should return proper steps for PAYMENT_PROCESSING state', () => {
    const steps = mapStateToSteps({
      state: CheckoutState.PAYMENT_PROCESSING,
      userId: 'user-123',
      paymentIntentId: 'pi_123',
      metadata: {
        authCompletedAt: '2024-01-01T00:00:00Z',
        deliveryCompletedAt: '2024-01-01T00:01:00Z',
        delivery: {
          method: 'EMAIL',
          email: 'test@example.com'
        }
      }
    });

    expect(steps).toBeDefined();
    expect(steps.authentication.completed).toBe(true);
    expect(steps.delivery.completed).toBe(true);
    expect(steps.payment.processing).toBe(true);
    expect(steps.payment.paymentIntentId).toBe('pi_123');
    expect(steps.payment.completed).toBe(false);
  });

  it('should return proper steps for PAYMENT_COMPLETED state', () => {
    const steps = mapStateToSteps({
      state: CheckoutState.PAYMENT_COMPLETED,
      userId: 'user-123',
      paymentIntentId: 'pi_123',
      metadata: {
        authCompletedAt: '2024-01-01T00:00:00Z',
        deliveryCompletedAt: '2024-01-01T00:01:00Z',
        paymentCompletedAt: '2024-01-01T00:02:00Z',
        delivery: {
          method: 'EMAIL',
          email: 'test@example.com'
        }
      }
    });

    expect(steps).toBeDefined();
    expect(steps.authentication.completed).toBe(true);
    expect(steps.delivery.completed).toBe(true);
    expect(steps.payment.completed).toBe(true);
    expect(steps.payment.completedAt).toBe('2024-01-01T00:02:00Z');
    expect(steps.payment.paymentIntentId).toBe('pi_123');
  });
});