import { Bundle, BundlesByCountry, GetBundlesByCountryQuery, GetCountryBundlesQuery, GetTripsQuery } from '@/__generated__/graphql';
import { useLazyQuery, useQuery } from '@apollo/client';
import React, { useState, useCallback } from 'react';
import { BundlesByCountryWithBundles, CountryPricingSplitView } from '../../components/PricingSplitView';
import { GET_BUNDLES_BY_COUNTRY, GET_COUNTRY_BUNDLES, GET_TRIPS } from '../../lib/graphql/queries';
import { useSearchParams } from 'react-router-dom';

export const PricingSummaryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showTrips, setShowTrips] = useState(false);
  const [countryGroups, setCountryGroups] = useState<BundlesByCountryWithBundles[]>([]);
  
  // Fetch countries with bundle aggregations
  const { loading: bundlesLoading, error: bundlesError } = useQuery<GetBundlesByCountryQuery>(
    GET_BUNDLES_BY_COUNTRY,
    {
      onCompleted: (data) => {
        if (data?.bundlesByCountry) {
          // Convert to the expected format with countryId for compatibility
          const groups: BundlesByCountryWithBundles[] = data.bundlesByCountry.map((country: BundlesByCountry) => ({
            ...country,
            countryId: country.country.iso, // Add for compatibility
            bundles: undefined, // Will be loaded on expand
          }));
          setCountryGroups(groups);
        }
      }
    }
  );

  // Fetch trips data
  const { data: tripsData } = useQuery<GetTripsQuery>(GET_TRIPS);
  
  // Lazy query for fetching country bundles on demand
  const [getCountryBundles] = useLazyQuery<GetCountryBundlesQuery>(GET_COUNTRY_BUNDLES);

  // Handle expanding a country to load its bundles
  const expandCountry = useCallback(async (countryId: string) => {
    try {
      const result = await getCountryBundles({
        variables: { countryId }
      });
      
      if (result.data?.bundlesForCountry) {
        const bundlesData = result.data.bundlesForCountry;
        const catalogBundles = bundlesData.bundles;
        
        // Use bundles directly without transformation
        const bundles: Bundle[] = catalogBundles;
        
        // Update the country group with fetched bundles
        setCountryGroups(prev => prev.map(group => 
          group.country.iso === countryId 
            ? { ...group, bundles }
            : group
        ));
      }
    } catch (error) {
      console.error('Error fetching bundles for country:', countryId, error);
    }
  }, [getCountryBundles]);

  // Auto-load country from URL on mount
  React.useEffect(() => {
    const countryFromUrl = searchParams.get('country');
    if (countryFromUrl && countryGroups.length > 0) {
      const country = countryGroups.find(group => group.country.iso === countryFromUrl);
      // Only load if country exists and bundles haven't been loaded yet
      if (country && !country.bundles) {
        expandCountry(countryFromUrl);
      }
    }
  }, [searchParams, countryGroups, expandCountry]);

  if (bundlesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading pricing data...</span>
      </div>
    );
  }

  if (bundlesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load pricing data</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-red-600 hover:text-red-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <CountryPricingSplitView 
          bundlesByCountry={countryGroups}
          tripsData={tripsData?.trips || []}
          onExpandCountry={expandCountry}
          showTrips={showTrips}
          onToggleTrips={setShowTrips}
          selectedCountryId={searchParams.get('country') || undefined}
          onCountrySelect={(countryId) => {
            if (countryId) {
              setSearchParams({ country: countryId });
            } else {
              searchParams.delete('country');
              setSearchParams(searchParams);
            }
          }}
        />
      </div>
    </div>
  );
};