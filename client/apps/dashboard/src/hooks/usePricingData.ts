import { useState, useEffect } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { 
  BundlesByCountry, 
  Country, 
  CountryBundle, 
  GetCountriesQuery, 
  GetBundlesByCountryQuery,
  GetTripsQuery,
  Trip,
  GetCountryBundlesQuery
} from '@/__generated__/graphql';
import { GET_BUNDLES_BY_COUNTRY, GET_COUNTRIES, GET_TRIPS, GET_COUNTRY_BUNDLES } from '../lib/graphql/queries';
import { 
  calculateAveragePricePerDay, 
  buildBatchPricingInput, 
  extractDurationsFromPlans 
} from '../utils/pricing-calculations';
import { usePricingWithRules, AppliedRule } from './usePricingWithRules';

export interface CountryBundleWithRules extends CountryBundle {
  appliedRules?: AppliedRule[];
  ruleCount?: number;
  ruleImpact?: number;
}

export interface CountryGroupData extends BundlesByCountry {
  bundles?: CountryBundleWithRules[];
  rulesSummary?: {
    totalRules: number;
    systemRules: number;
    businessRules: number;
    averageImpact: number;
    conflictCount?: number;
  };
}

export const usePricingData = () => {
  const [countryGroups, setCountryGroups] = useState<CountryGroupData[]>([]);
  const [tripsData, setTripsData] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GraphQL queries
  const { data: countriesData } = useQuery<GetCountriesQuery>(GET_COUNTRIES);
  const { data: bundlesCountriesData, loading: bundlesLoading, error: bundlesError, refetch: refetchBundlesCountries } = useQuery<GetBundlesByCountryQuery>(GET_BUNDLES_BY_COUNTRY);
  const { data: tripsQueryData, loading: tripsLoading, error: tripsError } = useQuery<GetTripsQuery>(GET_TRIPS);
  // Removed deprecated GET_DATA_PLANS query
  const [getCountryBundles] = useLazyQuery<GetCountryBundlesQuery>(GET_COUNTRY_BUNDLES);
  const { calculateBatchPrices } = usePricingWithRules();

  // Generate country groups from actual data
  useEffect(() => {
    // If bundlesCountries data is available, use it
    if (bundlesCountriesData?.bundlesCountries) {
      setLoading(false);
      setError(null);
      
      // Convert the bundlesCountries data to CountryGroupData format
      const groups: CountryGroupData[] = bundlesCountriesData.bundlesCountries.map((country: BundlesByCountry) => ({
        ...country,
        bundles: undefined, // Bundles will be loaded on expand
      }));
      
      setCountryGroups(groups);
    } else if (bundlesError) {
      setError('Failed to load pricing summary data');
      setLoading(false);
    }
  }, [bundlesCountriesData, bundlesError]);

  // Handle trips data
  useEffect(() => {
    if (tripsQueryData?.trips) {
      setTripsData(tripsQueryData.trips);
    } else if (tripsError) {
      console.warn('Failed to load trips data:', tripsError);
    }
  }, [tripsQueryData, tripsError]);

  // Update loading state based on query loading
  useEffect(() => {
    setLoading(bundlesLoading || tripsLoading);
  }, [bundlesLoading, tripsLoading]);

  // Note: Country data plans functionality moved to catalog bundles system

  // Calculate pricing for country bundles using rule-based engine
  const calculateCountryPricing = async (countryId: string, regionId: string, durations: Set<number>) => {
    const batchInputs = buildBatchPricingInput(countryId, regionId, durations);
    
    try {
      // Use rule-based pricing for enhanced calculations
      const results = await calculateBatchPrices(batchInputs);
      return results;
    } catch (error) {
      console.error('Rule-based pricing failed:', error);
      throw error;
    }
  };

  // Calculate rules summary for a set of bundles
  const calculateRulesSummary = (bundles: CountryBundleWithRules[]) => {
    const allRules = bundles.flatMap(b => b.appliedRules || []);
    const systemRules = allRules.filter(r => r.type === 'SYSTEM_MARKUP' || r.type === 'SYSTEM_PROCESSING');
    const businessRules = allRules.filter(r => r.type !== 'SYSTEM_MARKUP' && r.type !== 'SYSTEM_PROCESSING');
    const totalImpact = bundles.reduce((sum, b) => sum + (b.ruleImpact || 0), 0);
    
    return {
      totalRules: allRules.length,
      systemRules: systemRules.length,
      businessRules: businessRules.length,
      averageImpact: bundles.length > 0 ? totalImpact / bundles.length : 0,
      conflictCount: 0 // TODO: Implement conflict detection
    };
  };

  // Update country group state with loaded bundles and rules summary
  const updateCountryGroupWithBundles = (countryId: string, bundles: CountryBundleWithRules[], rulesSummary?: any) => {
    const avgPricePerDay = calculateAveragePricePerDay(bundles);
    
    setCountryGroups(prev => prev.map(group => 
      group.countryId === countryId 
        ? { 
            ...group, 
            bundles, 
            avgPricePerDay,
            rulesSummary,
          }
        : group
    ));
  };

  // Lazy load bundles for a country when expanded
  const expandCountry = async (countryId: string) => {
    try {
      // Use the dedicated countryBundles query which already returns filtered and calculated data
      console.log(`🔍 Fetching bundles for country: ${countryId}`);
      
      const countryBundlesResult = await getCountryBundles({
        variables: { countryId }
      });
      
      if (countryBundlesResult.data?.countryBundles) {
        const bundles = countryBundlesResult.data.countryBundles;
        
        console.log(`✅ Fetched ${bundles.length} bundles for ${countryId}`);
        
        // Calculate average price per day for the country summary
        const avgPricePerDay = calculateAveragePricePerDay(bundles);
        
        // Update the country group with the fetched bundles directly from backend
        setCountryGroups(prev => prev.map(group => 
          group.countryId === countryId 
            ? { 
                ...group, 
                bundles,
                avgPricePerDay
              }
            : group
        ));
        
        console.log(`📊 Updated country group for ${countryId} with ${bundles.length} bundles`);
      } else {
        console.warn(`⚠️ No bundles found for country ${countryId}`);
        // Still update the country group to show empty state
        setCountryGroups(prev => prev.map(group => 
          group.countryId === countryId 
            ? { 
                ...group, 
                bundles: [],
                avgPricePerDay: 0
              }
            : group
        ));
      }
    } catch (error) {
      console.error('Error fetching bundles for country:', countryId, error);
      setError(`Failed to load bundles for ${countryId}`);
      // Update the country group to show error state
      setCountryGroups(prev => prev.map(group => 
        group.countryId === countryId 
          ? { 
              ...group, 
              bundles: [],
              avgPricePerDay: 0
            }
          : group
      ));
    }
  };

  const refreshConfigurations = async () => {
    setLoading(true);
    setCountryGroups([]);
    
    // Refetch bundles summary data
    await refetchBundlesCountries();
  };

  return {
    countryGroups,
    tripsData,
    loading,
    error,
    expandCountry,
    refreshConfigurations,
    countriesData,
    // Rule-based pricing features
    calculateRulesSummary,
    // Feature flag for debugging
    isRuleBasedEnabled: true
  };
};