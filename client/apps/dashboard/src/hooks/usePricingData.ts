import { useState, useEffect } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { 
  BundlesByCountry, 
  Country, 
  CountryBundle, 
  GetCountriesQuery, 
  GetDataPlansQuery, 
  GetPricingConfigurationsQuery, 
  PricingConfiguration,
  GetBundlesByCountryQuery
} from '@/__generated__/graphql';
import { CALCULATE_BATCH_PRICING, GET_BUNDLES_BY_COUNTRY, GET_COUNTRIES, GET_DATA_PLANS, GET_PRICING_CONFIGURATIONS } from '../lib/graphql/queries';
import { 
  calculateAveragePricePerDay, 
  buildBatchPricingInput, 
  extractDurationsFromPlans 
} from '../utils/pricing-calculations';

export interface CountryGroupData extends BundlesByCountry {
  bundles?: CountryBundle[];
}

export const usePricingData = () => {
  const [countryGroups, setCountryGroups] = useState<CountryGroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GraphQL queries
  const { data: countriesData } = useQuery<GetCountriesQuery>(GET_COUNTRIES);
  const { data: bundlesByCountryData, loading: bundlesLoading, error: bundlesError, refetch: refetchBundlesByCountry } = useQuery<GetBundlesByCountryQuery>(GET_BUNDLES_BY_COUNTRY);
  const { data: dataPlansData } = useQuery<GetDataPlansQuery>(GET_DATA_PLANS, {
    variables: {
      filter: {
        limit: 1000
      }
    }
  });
  const { data: pricingConfigsData, refetch: refetchPricingConfigs } = useQuery<GetPricingConfigurationsQuery>(GET_PRICING_CONFIGURATIONS);
  const [calculateBatchPricing] = useLazyQuery(CALCULATE_BATCH_PRICING);
  const [getCountryDataPlans] = useLazyQuery(GET_DATA_PLANS);

  // Generate country groups from actual data
  useEffect(() => {
    // If bundlesByCountry data is available, use it
    if (bundlesByCountryData?.bundlesByCountry) {
      setLoading(false);
      setError(null);
      
      // Convert the bundlesByCountry data to CountryGroupData format
      const groups: CountryGroupData[] = bundlesByCountryData.bundlesByCountry.map((country: BundlesByCountry) => ({
        ...country,
        bundles: undefined, // Bundles will be loaded on expand
      }));
      
      setCountryGroups(groups);
    } else if (bundlesError) {
      setError('Failed to load pricing summary data');
      setLoading(false);
    }
  }, [bundlesByCountryData, bundlesError]);

  // Update loading state based on query loading
  useEffect(() => {
    setLoading(bundlesLoading);
  }, [bundlesLoading]);

  // Fetch country data plans
  const fetchCountryDataPlans = async (countryId: string) => {
    return await getCountryDataPlans({
      variables: {
        filter: {
          country: countryId,
          limit: 1000
        }
      }
    });
  };

  // Calculate pricing for country bundles
  const calculateCountryPricing = async (countryId: string, regionId: string, durations: Set<number>) => {
    const batchInputs = buildBatchPricingInput(countryId, regionId, durations);
    
    return await calculateBatchPricing({
      variables: {
        inputs: batchInputs,
      },
    });
  };

  // Update country group state with loaded bundles
  const updateCountryGroupWithBundles = (countryId: string, bundles: CountryBundle[]) => {
    const avgPricePerDay = calculateAveragePricePerDay(bundles);
    
    setCountryGroups(prev => prev.map(group => 
      group.countryId === countryId 
        ? { 
            ...group, 
            bundles, 
            avgPricePerDay,
          }
        : group
    ));
  };

  // Lazy load bundles for a country when expanded
  const expandCountry = async (countryId: string) => {
    const country = countriesData?.countries?.find((c: Country) => c.iso === countryId);
    if (!country) return;

    try {
      // Fetch country data plans
      const countryDataResult = await fetchCountryDataPlans(countryId);

      if (countryDataResult.data?.dataPlans?.items) {
        // Extract durations from the fetched data
        const durations = extractDurationsFromPlans(countryDataResult.data.dataPlans.items);

        // Calculate pricing for this country
        const pricingResult = await calculateCountryPricing(countryId, country.region, durations);

        if (pricingResult.data?.calculatePrices) {
          const bundles: CountryBundle[] = pricingResult.data.calculatePrices;
          updateCountryGroupWithBundles(countryId, bundles);
        }
      }
    } catch (error) {
      console.error('Error fetching bundles for country:', countryId, error);
      setError(`Failed to load bundles for ${countryId}`);
    }
  };

  const refreshConfigurations = async () => {
    setLoading(true);
    setCountryGroups([]);
    
    // Refetch both pricing configs and bundles summary data
    await Promise.all([
      refetchPricingConfigs(),
      refetchBundlesByCountry()
    ]);
  };

  return {
    countryGroups,
    loading,
    error,
    expandCountry,
    refreshConfigurations,
    countriesData
  };
};