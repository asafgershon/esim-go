import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ApolloProvider, ApolloClient } from '@apollo/client';
import React from 'react';
import { useBatchPricingStream } from '../useBatchPricingStream';
import {
  createStreamingMockLink,
  createPriorityMockLink,
  createErrorMockLink,
  createTestApolloClient,
  simulateRealisticTiming,
} from './test-utils';

const createWrapper = (client: ApolloClient<unknown>) => {
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <ApolloProvider client={client}>{children}</ApolloProvider>
  );
};

describe('useBatchPricingStream WebSocket Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('WebSocket Link Behavior', () => {
    it('should establish WebSocket connection and receive streaming data', async () => {
      const mockLink = createStreamingMockLink('US', 5, 3, 100);
      const client = createTestApolloClient(mockLink);

      const { result } = renderHook(
        () => useBatchPricingStream({
          countryId: 'US',
          requestedDays: 3,
          maxDays: 5,
        }),
        { wrapper: createWrapper(client) }
      );

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.isNewCountryLoading).toBe(true);
      expect(result.current.totalDays).toBe(5);

      // Simulate WebSocket messages arriving
      act(() => {
        simulateRealisticTiming(vi);
      });

      await waitFor(() => {
        expect(result.current.hasDataForDay(3)).toBe(true);
      }, { timeout: 3000 });

      // Check that requested day loaded first
      expect(result.current.isNewCountryLoading).toBe(false);
      expect(result.current.getPricing(3)?.totalPrice).toBe(21.5); // 20 + 3 * 0.5

      // Background streaming should continue
      expect(result.current.isStreamingData).toBe(true);
    });

    it('should handle priority loading correctly via WebSocket', async () => {
      const mockLink = createPriorityMockLink('US', 7, [1, 3, 5, 7, 10, 14, 21]);
      const client = createTestApolloClient(mockLink);

      const { result } = renderHook(
        () => useBatchPricingStream({
          countryId: 'US',
          requestedDays: 7,
          maxDays: 21,
        }),
        { wrapper: createWrapper(client) }
      );

      // Fast-forward for requested day (50ms delay)
      act(() => {
        vi.advanceTimersByTime(60);
      });

      await waitFor(() => {
        expect(result.current.hasDataForDay(7)).toBe(true);
      });

      // Requested day should load first
      expect(result.current.getPricing(7)?.duration).toBe(7);
      expect(result.current.isNewCountryLoading).toBe(false);

      // Nearby days should still be loading
      expect(result.current.hasDataForDay(10)).toBe(false);
      expect(result.current.isStreamingData).toBe(true);

      // Fast-forward for nearby days (100ms delay)
      act(() => {
        vi.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(result.current.hasDataForDay(5)).toBe(true);
      });

      // Check nearby day loaded
      expect(result.current.getPricing(5)?.duration).toBe(5);

      // Distant days should still be loading
      expect(result.current.hasDataForDay(21)).toBe(false);
    });

    it('should handle WebSocket connection failures gracefully', async () => {
      const errorLink = createErrorMockLink('WebSocket connection failed');
      const client = createTestApolloClient(errorLink);

      const { result } = renderHook(
        () => useBatchPricingStream({
          countryId: 'US',
          requestedDays: 7,
        }),
        { wrapper: createWrapper(client) }
      );

      act(() => {
        vi.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.message).toContain('WebSocket connection failed');
      expect(result.current.loading).toBe(false);
      expect(result.current.isNewCountryLoading).toBe(false);
    });
  });

  describe('Multi-Country Streaming', () => {
    it('should handle rapid country switching with WebSocket cleanup', async () => {
      let currentMockLink = createStreamingMockLink('US', 3, 7, 100);
      let client = createTestApolloClient(currentMockLink);

      const { result, rerender } = renderHook(
        (props: { countryId: string; requestedDays: number }) =>
          useBatchPricingStream(props),
        {
          wrapper: createWrapper(client),
          initialProps: { countryId: 'US', requestedDays: 7 },
        }
      );

      // Load some US data
      act(() => {
        vi.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(result.current.hasDataForDay(1)).toBe(true);
      });

      expect(result.current.getPricing(1)?.country.iso).toBe('US');

      // Switch to GB - this should reset cache and start new subscription
      currentMockLink = createStreamingMockLink('GB', 3, 7, 100);
      client = createTestApolloClient(currentMockLink);

      rerender({ countryId: 'GB', requestedDays: 7 });

      // Cache should be reset
      expect(result.current.hasDataForDay(1)).toBe(false);
      expect(result.current.isNewCountryLoading).toBe(true);

      // Load GB data
      act(() => {
        vi.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(result.current.hasDataForDay(1)).toBe(true);
      });

      expect(result.current.getPricing(1)?.country.iso).toBe('GB');
    });

    it('should maintain separate cache per country during rapid switching', async () => {
      // This test simulates user rapidly switching between countries
      const countries = ['US', 'GB', 'FR'];
      let mockLink = createStreamingMockLink(countries[0], 3, 7, 50);
      let client = createTestApolloClient(mockLink);

      const { result, rerender } = renderHook(
        (props: { countryId: string }) => useBatchPricingStream(props),
        {
          wrapper: createWrapper(client),
          initialProps: { countryId: countries[0] },
        }
      );

      for (let i = 0; i < countries.length; i++) {
        const country = countries[i];
        
        // Switch to new country
        mockLink = createStreamingMockLink(country, 3, 7, 50);
        client = createTestApolloClient(mockLink);
        rerender({ countryId: country });

        // Each country switch should reset state
        expect(result.current.isNewCountryLoading).toBe(true);
        expect(result.current.hasDataForDay(1)).toBe(false);

        // Wait for data to load
        act(() => {
          vi.advanceTimersByTime(100);
        });

        await waitFor(() => {
          expect(result.current.hasDataForDay(1)).toBe(true);
        });

        expect(result.current.getPricing(1)?.country.iso).toBe(country);
      }
    });
  });

  describe('Performance and Memory Management', () => {
    it('should not leak memory with multiple subscriptions', async () => {
      const mockLink = createStreamingMockLink('US', 10, 7, 50);
      const client = createTestApolloClient(mockLink);

      // Track subscription creation
      const originalSubscribe = mockLink.request;
      const subscriptionTracker = vi.fn().mockImplementation(originalSubscribe);
      mockLink.request = subscriptionTracker;

      const { result, rerender, unmount } = renderHook(
        (props: { countryId: string; requestedDays: number }) =>
          useBatchPricingStream(props),
        {
          wrapper: createWrapper(client),
          initialProps: { countryId: 'US', requestedDays: 7 },
        }
      );

      // Multiple re-renders with same country should not create new subscriptions
      rerender({ countryId: 'US', requestedDays: 10 });
      rerender({ countryId: 'US', requestedDays: 14 });
      rerender({ countryId: 'US', requestedDays: 7 });

      expect(subscriptionTracker).toHaveBeenCalledTimes(1);

      // Change country should create new subscription
      rerender({ countryId: 'GB', requestedDays: 7 });
      expect(subscriptionTracker).toHaveBeenCalledTimes(2);

      // Unmount should clean up
      unmount();
      
      // In a real scenario, we'd check that WebSocket connections are closed
      // Here we just verify the hook unmounts without errors
      expect(result.current.loading).toBeDefined();
    });

    it('should handle high-frequency updates efficiently', async () => {
      const rapidUpdatesLink = createStreamingMockLink('US', 30, 15, 10); // Very fast updates
      const client = createTestApolloClient(rapidUpdatesLink);

      const { result } = renderHook(
        () => useBatchPricingStream({
          countryId: 'US',
          requestedDays: 15,
          maxDays: 30,
        }),
        { wrapper: createWrapper(client) }
      );

      // Simulate rapid data arrival
      for (let i = 0; i < 30; i++) {
        act(() => {
          vi.advanceTimersByTime(15);
        });
      }

      await waitFor(() => {
        expect(result.current.loadedDays).toBeGreaterThan(10);
      }, { timeout: 2000 });

      // Should handle rapid updates without errors
      expect(result.current.error).toBeFalsy();
      expect(result.current.loadingProgress).toBeGreaterThan(30);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle subscription that never completes', async () => {
      // Create a mock that never resolves
      const mockLink = createStreamingMockLink('US', 1, 7, 10000); // Very long delay
      const client = createTestApolloClient(mockLink);

      const { result } = renderHook(
        () => useBatchPricingStream({
          countryId: 'US',
          requestedDays: 7,
        }),
        { wrapper: createWrapper(client) }
      );

      // Should remain in loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.isNewCountryLoading).toBe(true);

      // Fast forward reasonable time
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Should still be loading (subscription hasn't completed)
      expect(result.current.loading).toBe(true);
      expect(result.current.hasDataForDay(7)).toBe(false);
    });

    it('should handle partial data corruption during streaming', async () => {
      // Create a mock that returns some good data and some bad data
      const mixedDataLink = createStreamingMockLink('US', 3, 7, 100);
      
      // Override one of the responses to be malformed
      const originalMocks = (mixedDataLink as typeof mixedDataLink & { mockedSubscriptionsById?: Record<string, unknown[]> }).mockedSubscriptionsById;
      if (originalMocks) {
        const firstKey = Object.keys(originalMocks)[0];
        if (firstKey && originalMocks[firstKey]) {
          originalMocks[firstKey][1] = { // Second response
            ...originalMocks[firstKey][1],
            result: {
              data: {
                calculatePricesBatchStream: {
                  // Missing required fields
                  finalPrice: null,
                  currency: undefined,
                },
              },
            },
          };
        }
      }

      const client = createTestApolloClient(mixedDataLink);

      const { result } = renderHook(
        () => useBatchPricingStream({
          countryId: 'US',
          requestedDays: 7,
          maxDays: 3,
        }),
        { wrapper: createWrapper(client) }
      );

      act(() => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(result.current.loadedDays).toBeGreaterThan(0);
      });

      // Should handle malformed data gracefully
      expect(result.current.error).toBeFalsy();
      expect(result.current.loadedDays).toBeGreaterThan(0);
    });

    it('should recover from temporary network issues', async () => {
      // First, create a failing link
      const errorLink = createErrorMockLink('Temporary network error');
      let client = createTestApolloClient(errorLink);

      const { result, rerender } = renderHook(
        (props: { client: ApolloClient<unknown>; countryId: string }) =>
          useBatchPricingStream({ countryId: props.countryId }),
        {
          wrapper: ({ children, client: c }: { children: React.ReactNode; client: ApolloClient<unknown> }) => (
            <ApolloProvider client={c}>{children}</ApolloProvider>
          ),
          initialProps: { client, countryId: 'US' },
        }
      );

      act(() => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Now simulate network recovery with working link
      const workingLink = createStreamingMockLink('US', 3, 7, 100);
      client = createTestApolloClient(workingLink);

      rerender({ client, countryId: 'US' });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Should recover and work normally
      await waitFor(() => {
        expect(result.current.hasDataForDay(1)).toBe(true);
      });

      expect(result.current.error).toBeFalsy();
    });
  });
});