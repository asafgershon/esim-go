import { CountryBundle } from '@/__generated__/graphql';

/**
 * Calculate average price per day for a collection of bundles
 */
export const calculateAveragePricePerDay = (bundles: CountryBundle[]): number => {
  if (bundles.length === 0) return 0;
  
  const totalPricePerDay = bundles.reduce((sum, bundle) => 
    sum + (bundle.pricePerDay || 0), 0
  );
  
  return totalPricePerDay / bundles.length;
};

/**
 * Build batch pricing input for a country and its durations
 */
export const buildBatchPricingInput = (
  countryId: string,
  regionId: string,
  durations: Set<number>,
  paymentMethod = 'ISRAELI_CARD'
): Array<{numOfDays: number; regionId: string; countryId: string; paymentMethod: string}> => {
  return Array.from(durations).map(duration => ({
    numOfDays: duration,
    regionId,
    countryId,
    paymentMethod,
  }));
};

/**
 * Extract unique durations from data plans
 */
export const extractDurationsFromPlans = (plans: any[]): Set<number> => {
  const durations = new Set<number>();
  for (const plan of plans) {
    durations.add(plan.duration);
  }
  return durations;
};