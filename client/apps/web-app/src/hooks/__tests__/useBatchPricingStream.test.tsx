import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ApolloClient, InMemoryCache, ApolloProvider, from } from '@apollo/client';
import { MockSubscriptionLink } from '@apollo/client/testing';
import React from 'react';
import { useBatchPricingStream } from '../useBatchPricingStream';
import { CALCULATE_PRICES_BATCH_STREAM } from '@/lib/graphql/subscriptions/batch-pricing';

// Mock data for testing
const mockPricingData = {
  finalPrice: 25.99,
  currency: 'USD',
  totalCost: 30.00,
  discountValue: 4.01,
  duration: 7,
  bundle: {
    id: 'us-7-day',
    name: 'US 7-Day Unlimited',
    duration: 7,
    isUnlimited: true,
    data: null,
    group: 'Standard Unlimited Essential',
    country: {
      iso: 'US',
      name: 'United States',
    },
  },
  country: {
    iso: 'US',
    name: 'United States',
    nameHebrew: 'ארצות הברית',
    region: 'North America',
    flag: '🇺🇸',
  },
  savingsAmount: 4.01,
  savingsPercentage: 13.4,
  customerDiscounts: [],
};

const createMockSubscriptionLink = (delay = 100) => {
  const mocks = [
    {
      request: {
        query: CALCULATE_PRICES_BATCH_STREAM,
        variables: {
          inputs: expect.any(Array),
          requestedDays: expect.any(Number),
        },
      },
      result: {
        data: {
          calculatePricesBatchStream: mockPricingData,
        },
      },
      delay,
    },
  ];

  return new MockSubscriptionLink(mocks);
};

const createTestClient = (link: MockSubscriptionLink) => {
  return new ApolloClient({
    link: from([link]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { errorPolicy: 'all' },
      query: { errorPolicy: 'all' },
    },
  });
};

const createWrapper = (client: ApolloClient<unknown>) => {
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <ApolloProvider client={client}>{children}</ApolloProvider>
  );
};

describe('useBatchPricingStream Integration Tests', () => {
  let mockClient: ApolloClient<unknown>;
  let mockLink: MockSubscriptionLink;

  beforeEach(() => {
    mockLink = createMockSubscriptionLink();
    mockClient = createTestClient(mockLink);
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Basic Subscription Functionality', () => {
    it('should initialize with correct default states', () => {
      const { result } = renderHook(
        () => useBatchPricingStream({
          countryId: 'US',
          requestedDays: 7,
        }),
        { wrapper: createWrapper(mockClient) }
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.isNewCountryLoading).toBe(true);
      expect(result.current.isStreamingData).toBe(false);
      expect(result.current.getPricing(7)).toBe(null);
      expect(result.current.hasDataForDay(7)).toBe(false);
    });

    it('should handle empty inputs gracefully', () => {
      const { result } = renderHook(
        () => useBatchPricingStream({}),
        { wrapper: createWrapper(mockClient) }
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.isNewCountryLoading).toBe(false);
      expect(result.current.getPricing(7)).toBe(null);
    });

    it('should receive and process subscription data', async () => {
      const { result } = renderHook(
        () => useBatchPricingStream({
          countryId: 'US',
          requestedDays: 7,
        }),
        { wrapper: createWrapper(mockClient) }
      );

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.isNewCountryLoading).toBe(true);

      // Fast-forward time to receive data
      act(() => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Check received data
      const pricingData = result.current.getPricing(7);
      expect(pricingData).toBeTruthy();
      expect(pricingData?.totalPrice).toBe(25.99);
      expect(pricingData?.hasDiscount).toBe(true);
      expect(pricingData?.discountAmount).toBe(4.01);

      // Check state updates
      expect(result.current.isNewCountryLoading).toBe(false);
      expect(result.current.hasDataForDay(7)).toBe(true);
    });
  });

  describe('Priority Loading Logic', () => {
    it('should handle requested days priority correctly', async () => {
      // Create multiple mock responses for different days
      const multiDayMocks = [5, 7, 10, 14].map(days => ({
        request: {
          query: CALCULATE_PRICES_BATCH_STREAM,
          variables: {
            inputs: expect.arrayContaining([
              expect.objectContaining({ numOfDays: days })
            ]),
            requestedDays: 7,
          },
        },
        result: {
          data: {
            calculatePricesBatchStream: {
              ...mockPricingData,
              duration: days,
              finalPrice: 20 + days, // Different price for each day
            },
          },
        },
        delay: days === 7 ? 50 : 150, // Requested day loads faster
      }));

      mockLink = new MockSubscriptionLink(multiDayMocks);
      mockClient = createTestClient(mockLink);

      const { result } = renderHook(
        () => useBatchPricingStream({
          countryId: 'US',
          requestedDays: 7,
          maxDays: 14,
        }),
        { wrapper: createWrapper(mockClient) }
      );

      // Fast-forward to get the priority day first
      act(() => {
        vi.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.hasDataForDay(7)).toBe(true);
      });

      // Check that requested day loaded first
      expect(result.current.getPricing(7)?.totalPrice).toBe(27); // 20 + 7
      expect(result.current.isNewCountryLoading).toBe(false);

      // Other days should still be loading
      expect(result.current.hasDataForDay(10)).toBe(false);
      expect(result.current.isStreamingData).toBe(true);
    });

    it('should generate correct input array for subscription', () => {
      const { result } = renderHook(
        () => useBatchPricingStream({
          countryId: 'US',
          maxDays: 5,
          paymentMethod: 'ISRAELI_CARD',
        }),
        { wrapper: createWrapper(mockClient) }
      );

      // The hook should generate inputs for days 1-5
      // We can't directly test the internal inputs, but we can verify the behavior
      expect(result.current.totalDays).toBe(5);
    });
  });

  describe('Caching and State Management', () => {
    it('should maintain cache across re-renders', async () => {
      const { result, rerender } = renderHook(
        (props: { countryId?: string; requestedDays?: number }) =>
          useBatchPricingStream(props),
        {
          wrapper: createWrapper(mockClient),
          initialProps: { countryId: 'US', requestedDays: 7 },
        }
      );

      // Wait for initial data
      act(() => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(result.current.hasDataForDay(7)).toBe(true);
      });

      const initialPrice = result.current.getPricing(7)?.totalPrice;

      // Re-render with different requested days (same country)
      rerender({ countryId: 'US', requestedDays: 10 });

      // Should still have cached data for day 7
      expect(result.current.getPricing(7)?.totalPrice).toBe(initialPrice);
      expect(result.current.hasDataForDay(7)).toBe(true);
    });

    it('should reset cache when country changes', async () => {
      const { result, rerender } = renderHook(
        (props: { countryId?: string; requestedDays?: number }) =>
          useBatchPricingStream(props),
        {
          wrapper: createWrapper(mockClient),
          initialProps: { countryId: 'US', requestedDays: 7 },
        }
      );

      // Wait for initial data
      act(() => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(result.current.hasDataForDay(7)).toBe(true);
      });

      // Change country
      rerender({ countryId: 'GB', requestedDays: 7 });

      // Cache should be reset
      expect(result.current.hasDataForDay(7)).toBe(false);
      expect(result.current.isNewCountryLoading).toBe(true);
      expect(result.current.getPricing(7)).toBe(null);
    });

    it('should track loading progress correctly', async () => {
      const { result } = renderHook(
        () => useBatchPricingStream({
          countryId: 'US',
          maxDays: 10,
        }),
        { wrapper: createWrapper(mockClient) }
      );

      expect(result.current.loadingProgress).toBe(0);
      expect(result.current.loadedDays).toBe(0);

      // Simulate receiving data
      act(() => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(result.current.loadedDays).toBeGreaterThan(0);
      });

      expect(result.current.loadingProgress).toBeGreaterThan(0);
      expect(result.current.loadingProgress).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle subscription errors gracefully', async () => {
      const errorLink = new MockSubscriptionLink([
        {
          request: {
            query: CALCULATE_PRICES_BATCH_STREAM,
            variables: expect.any(Object),
          },
          error: new Error('Subscription failed'),
        },
      ]);

      const errorClient = createTestClient(errorLink);

      const { result } = renderHook(
        () => useBatchPricingStream({
          countryId: 'US',
          requestedDays: 7,
        }),
        { wrapper: createWrapper(errorClient) }
      );

      act(() => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.isNewCountryLoading).toBe(false);
      expect(result.current.getPricing(7)).toBe(null);
    });

    it('should handle malformed subscription data', async () => {
      const malformedDataLink = new MockSubscriptionLink([
        {
          request: {
            query: CALCULATE_PRICES_BATCH_STREAM,
            variables: expect.any(Object),
          },
          result: {
            data: {
              calculatePricesBatchStream: null, // Malformed data
            },
          },
        },
      ]);

      const malformedClient = createTestClient(malformedDataLink);

      const { result } = renderHook(
        () => useBatchPricingStream({
          countryId: 'US',
          requestedDays: 7,
        }),
        { wrapper: createWrapper(malformedClient) }
      );

      act(() => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should handle null data gracefully
      expect(result.current.getPricing(7)).toBe(null);
      expect(result.current.hasDataForDay(7)).toBe(false);
    });
  });

  describe('Performance and Optimization', () => {
    it('should not trigger unnecessary re-subscriptions', () => {
      const subscriptionSpy = vi.fn();
      
      // Mock the subscription call
      const spyLink = new MockSubscriptionLink([]);
      spyLink.request = subscriptionSpy.mockReturnValue({
        subscribe: () => ({ unsubscribe: vi.fn() })
      });

      const spyClient = createTestClient(spyLink);

      const { rerender } = renderHook(
        (props: { countryId?: string; requestedDays?: number }) =>
          useBatchPricingStream(props),
        {
          wrapper: createWrapper(spyClient),
          initialProps: { countryId: 'US', requestedDays: 7 },
        }
      );

      // Initial subscription should be called
      expect(subscriptionSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender({ countryId: 'US', requestedDays: 7 });

      // Should not trigger new subscription
      expect(subscriptionSpy).toHaveBeenCalledTimes(1);

      // Re-render with different requested days (same country)
      rerender({ countryId: 'US', requestedDays: 10 });

      // Should not trigger new subscription (same inputs array)
      expect(subscriptionSpy).toHaveBeenCalledTimes(1);

      // Re-render with different country
      rerender({ countryId: 'GB', requestedDays: 7 });

      // Should trigger new subscription
      expect(subscriptionSpy).toHaveBeenCalledTimes(2);
    });

    it('should cleanup subscriptions properly', () => {
      const unsubscribeSpy = vi.fn();
      
      const cleanupLink = new MockSubscriptionLink([]);
      cleanupLink.request = vi.fn().mockReturnValue({
        subscribe: () => ({ unsubscribe: unsubscribeSpy })
      });

      const cleanupClient = createTestClient(cleanupLink);

      const { unmount } = renderHook(
        () => useBatchPricingStream({
          countryId: 'US',
          requestedDays: 7,
        }),
        { wrapper: createWrapper(cleanupClient) }
      );

      // Unmount should trigger cleanup
      unmount();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('Real-world Usage Patterns', () => {
    it('should handle rapid country changes correctly', async () => {
      const { result, rerender } = renderHook(
        (props: { countryId?: string; requestedDays?: number }) =>
          useBatchPricingStream(props),
        {
          wrapper: createWrapper(mockClient),
          initialProps: { countryId: 'US', requestedDays: 7 },
        }
      );

      // Rapid country changes
      const countries = ['US', 'GB', 'FR', 'DE', 'ES'];
      
      for (const country of countries) {
        rerender({ countryId: country, requestedDays: 7 });
        
        // Each change should reset the loading state
        expect(result.current.isNewCountryLoading).toBe(true);
        
        act(() => {
          vi.advanceTimersByTime(50);
        });
      }

      // Final state should be for the last country
      expect(result.current.isNewCountryLoading).toBe(true);
    });

    it('should handle slider movements efficiently', async () => {
      const { result, rerender } = renderHook(
        (props: { countryId?: string; requestedDays?: number }) =>
          useBatchPricingStream(props),
        {
          wrapper: createWrapper(mockClient),
          initialProps: { countryId: 'US', requestedDays: 7 },
        }
      );

      // Load initial data
      act(() => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(result.current.hasDataForDay(7)).toBe(true);
      });

      const initialLoadingState = result.current.isNewCountryLoading;

      // Simulate slider movements (same country, different days)
      for (let days = 5; days <= 14; days += 2) {
        rerender({ countryId: 'US', requestedDays: days });
        
        // Should not trigger new country loading for slider movements
        expect(result.current.isNewCountryLoading).toBe(initialLoadingState);
      }
    });
  });
});