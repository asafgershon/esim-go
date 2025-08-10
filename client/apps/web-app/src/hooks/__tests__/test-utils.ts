import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { MockSubscriptionLink } from '@apollo/client/testing';
import { CALCULATE_PRICES_BATCH_STREAM } from '@/lib/graphql/subscriptions/batch-pricing';

/**
 * Creates mock pricing data for a specific duration
 */
export const createMockPricingData = (duration: number, countryId = 'US') => ({
  finalPrice: 20 + duration * 0.5, // Dynamic pricing based on duration
  currency: 'USD',
  totalCost: 25 + duration * 0.5,
  discountValue: duration > 7 ? 5.0 : 2.5, // More discount for longer durations
  duration,
  bundle: {
    id: `${countryId.toLowerCase()}-${duration}-day`,
    name: `${countryId} ${duration}-Day Unlimited`,
    duration,
    isUnlimited: true,
    data: null,
    group: 'Standard Unlimited Essential',
    country: {
      iso: countryId,
      name: getCountryName(countryId),
    },
  },
  country: {
    iso: countryId,
    name: getCountryName(countryId),
    nameHebrew: getCountryNameHebrew(countryId),
    region: getCountryRegion(countryId),
    flag: getCountryFlag(countryId),
  },
  savingsAmount: duration > 7 ? 5.0 : 2.5,
  savingsPercentage: duration > 7 ? 16.7 : 10.0,
  customerDiscounts: [],
});

/**
 * Helper function to get country name by ISO code
 */
function getCountryName(iso: string): string {
  const countries: Record<string, string> = {
    US: 'United States',
    GB: 'United Kingdom',
    FR: 'France',
    DE: 'Germany',
    ES: 'Spain',
    IL: 'Israel',
  };
  return countries[iso] || iso;
}

/**
 * Helper function to get Hebrew country name
 */
function getCountryNameHebrew(iso: string): string {
  const hebrewNames: Record<string, string> = {
    US: 'ארצות הברית',
    GB: 'בריטניה',
    FR: 'צרפת',
    DE: 'גרמניה',
    ES: 'ספרד',
    IL: 'ישראל',
  };
  return hebrewNames[iso] || iso;
}

/**
 * Helper function to get country region
 */
function getCountryRegion(iso: string): string {
  const regions: Record<string, string> = {
    US: 'North America',
    GB: 'Europe',
    FR: 'Europe',
    DE: 'Europe',
    ES: 'Europe',
    IL: 'Middle East',
  };
  return regions[iso] || 'Unknown';
}

/**
 * Helper function to get country flag
 */
function getCountryFlag(iso: string): string {
  const flags: Record<string, string> = {
    US: '🇺🇸',
    GB: '🇬🇧',
    FR: '🇫🇷',
    DE: '🇩🇪',
    ES: '🇪🇸',
    IL: '🇮🇱',
  };
  return flags[iso] || '🌍';
}

/**
 * Creates a MockSubscriptionLink with streaming behavior
 * Simulates progressive loading of multiple days
 */
export const createStreamingMockLink = (
  countryId = 'US',
  maxDays = 7,
  requestedDays = 7,
  delay = 100
) => {
  const mocks = Array.from({ length: maxDays }, (_, index) => {
    const duration = index + 1;
    const isRequestedDay = duration === requestedDays;
    const dayDelay = isRequestedDay ? delay : delay * (1 + Math.abs(duration - requestedDays) * 0.2);

    return {
      request: {
        query: CALCULATE_PRICES_BATCH_STREAM,
        variables: {
          inputs: expect.arrayContaining([
            expect.objectContaining({
              numOfDays: duration,
              countryId: countryId.toUpperCase(),
            })
          ]),
          requestedDays,
        },
      },
      result: {
        data: {
          calculatePricesBatchStream: createMockPricingData(duration, countryId),
        },
      },
      delay: Math.floor(dayDelay),
    };
  });

  return new MockSubscriptionLink(mocks);
};

/**
 * Creates a mock link that simulates network errors
 */
export const createErrorMockLink = (errorMessage = 'Network error') => {
  return new MockSubscriptionLink([
    {
      request: {
        query: CALCULATE_PRICES_BATCH_STREAM,
        variables: expect.any(Object),
      },
      error: new Error(errorMessage),
      delay: 100,
    },
  ]);
};

/**
 * Creates a mock link that returns malformed data
 */
export const createMalformedDataMockLink = () => {
  return new MockSubscriptionLink([
    {
      request: {
        query: CALCULATE_PRICES_BATCH_STREAM,
        variables: expect.any(Object),
      },
      result: {
        data: {
          calculatePricesBatchStream: null,
        },
      },
      delay: 100,
    },
  ]);
};

/**
 * Creates a test Apollo Client with the provided link
 */
export const createTestApolloClient = (link: MockSubscriptionLink) => {
  return new ApolloClient({
    link: from([link]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { errorPolicy: 'all' },
      query: { errorPolicy: 'all' },
    },
  });
};

/**
 * Creates priority-based mock responses (requested day loads first)
 */
export const createPriorityMockLink = (
  countryId = 'US',
  requestedDays = 7,
  totalDays = [5, 7, 10, 14, 21, 30]
) => {
  const mocks = totalDays.map(duration => {
    const isRequested = duration === requestedDays;
    const isNearby = Math.abs(duration - requestedDays) <= 3;
    
    // Priority: Requested (50ms) -> Nearby (100ms) -> Rest (200ms)
    const delay = isRequested ? 50 : isNearby ? 100 : 200;

    return {
      request: {
        query: CALCULATE_PRICES_BATCH_STREAM,
        variables: {
          inputs: expect.arrayContaining([
            expect.objectContaining({
              numOfDays: duration,
              countryId: countryId.toUpperCase(),
            })
          ]),
          requestedDays,
        },
      },
      result: {
        data: {
          calculatePricesBatchStream: createMockPricingData(duration, countryId),
        },
      },
      delay,
    };
  });

  return new MockSubscriptionLink(mocks);
};

/**
 * Helper to wait for multiple conditions with timeout
 */
export const waitForConditions = async (
  conditions: Array<() => boolean>,
  timeout = 5000,
  interval = 50
): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (conditions.every(condition => condition())) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout waiting for conditions after ${timeout}ms`);
};

/**
 * Simulates realistic subscription timing
 */
export const simulateRealisticTiming = (vi: typeof import('vitest')['vi']) => {
  // Fast requested day
  vi.advanceTimersByTime(60);
  
  // Medium nearby days  
  vi.advanceTimersByTime(50);
  
  // Slower distant days
  vi.advanceTimersByTime(150);
};