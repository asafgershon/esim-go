import { useQuery } from '@apollo/client';
import { GET_BUNDLE_STATS } from '@/lib/graphql/queries/bundle-stats';
import type { GetBundleStatsQuery } from '@/__generated__/types';

export function useBundleStats() {
  const { data, loading, error } = useQuery<GetBundleStatsQuery>(GET_BUNDLE_STATS, {
    // Cache for 5 minutes since this data doesn't change often
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return {
    totalBundles: data?.bundleStats?.totalBundles || 0,
    totalCountries: data?.bundleStats?.totalCountries || 0,
    totalRegions: data?.bundleStats?.totalRegions || 0,
    totalGroups: data?.bundleStats?.totalGroups || 0,
    loading,
    error,
  };
}