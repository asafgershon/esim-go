// Export the main client
export { ESimGoClient } from './client';

// Export types
export * from './types';

// Re-export generated types and APIs for advanced usage
export * from './generated';

// Export commonly used types directly
export type {
  CatalogueResponseInner as Bundle,
  CatalogueResponseInnerCountriesInner as Country,
  BundleGroup,
  ESIMs,
  ESIMApplyResponse,
  ESIMDetailsResponse,
  OrganisationResponse,
} from './generated';