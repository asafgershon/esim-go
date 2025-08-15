import { gql } from '@apollo/client';

export const GET_BUNDLE_STATS = gql`
  query GetBundleStats {
    bundleStats {
      totalBundles
      totalCountries
      totalRegions
      totalGroups
    }
  }
`;