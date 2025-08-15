import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBatchPricingStream } from '../useBatchPricingStream';

// Simple test to verify the hook exists and basic functionality
describe('useBatchPricingStream - Basic Tests', () => {
  it('should exist and be callable', () => {
    expect(useBatchPricingStream).toBeDefined();
    expect(typeof useBatchPricingStream).toBe('function');
  });

  it('should return expected interface with empty params', () => {
    const { result } = renderHook(() => useBatchPricingStream({}));

    // Check that all expected properties exist
    expect(result.current).toHaveProperty('getPricing');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('isNewCountryLoading');
    expect(result.current).toHaveProperty('isStreamingData');
    expect(result.current).toHaveProperty('hasDataForDay');
    expect(result.current).toHaveProperty('loadingProgress');
    expect(result.current).toHaveProperty('totalDays');
    expect(result.current).toHaveProperty('loadedDays');

    // Check default states
    expect(result.current.loading).toBe(false);
    expect(result.current.isNewCountryLoading).toBe(false);
    expect(result.current.isStreamingData).toBe(false);
    expect(result.current.loadingProgress).toBe(0);
    expect(result.current.loadedDays).toBe(0);
    expect(result.current.totalDays).toBe(30); // Default maxDays
  });

  it('should handle different parameters correctly', () => {
    const { result } = renderHook(() => 
      useBatchPricingStream({
        countryId: 'US',
        requestedDays: 7,
        maxDays: 14,
        paymentMethod: 'ISRAELI_CARD',
      })
    );

    expect(result.current.totalDays).toBe(14);
    // When countryId is provided but no Apollo client, loading should be false
    expect(result.current.loading).toBe(false);
  });

  it('should have working helper functions', () => {
    const { result } = renderHook(() => 
      useBatchPricingStream({
        countryId: 'US',
        requestedDays: 7,
      })
    );

    // Test getPricing function
    expect(typeof result.current.getPricing).toBe('function');
    expect(result.current.getPricing(7)).toBe(null); // No data initially

    // Test hasDataForDay function  
    expect(typeof result.current.hasDataForDay).toBe('function');
    expect(result.current.hasDataForDay(7)).toBe(false); // No data initially
  });

  it('should handle country changes correctly in state tracking', () => {
    const { result, rerender } = renderHook(
      (props: { countryId?: string }) => useBatchPricingStream(props),
      { initialProps: { countryId: 'US' } }
    );

    // Change country
    rerender({ countryId: 'GB' });

    // State should reset appropriately
    expect(result.current.loadedDays).toBe(0);
    expect(result.current.loadingProgress).toBe(0);
  });
});