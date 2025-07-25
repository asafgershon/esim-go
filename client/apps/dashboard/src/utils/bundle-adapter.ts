import { Country } from '@/__generated__/graphql';

/**
 * Transform CatalogBundle to CountryBundle format for UI compatibility
 * This is a temporary adapter until the UI components are updated to work with the new Bundle interface
 */
export function adaptCatalogBundleToCountryBundle(
  catalogBundle: any, // Using any for now since CatalogBundle type might vary
  country: Country
) {
  return {
    __typename: 'CountryBundle' as const,
    id: catalogBundle.esimGoName || catalogBundle.name,
    name: catalogBundle.name,
    country,
    duration: catalogBundle.validityInDays,
    price: catalogBundle.basePrice,
    currency: catalogBundle.currency,
    isUnlimited: catalogBundle.isUnlimited,
    data: catalogBundle.dataAmountMB || 0,
    group: catalogBundle.groups?.[0] || 'Standard Fixed',
    pricingBreakdown: null, // Will be fetched separately when needed
    appliedRules: null
  };
}