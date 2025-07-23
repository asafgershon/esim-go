import { useState, useEffect } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { 
  BundlesByCountry, 
  Country, 
  CountryBundle, 
  GetCountriesQuery, 
  GetDataPlansQuery, 
  GetBundlesByCountryQuery,
  GetTripsQuery,
  Trip
} from '@/__generated__/graphql';
import { GET_BUNDLES_BY_COUNTRY, GET_COUNTRIES, GET_DATA_PLANS, GET_TRIPS, GET_COUNTRY_BUNDLES } from '../lib/graphql/queries';
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
  const { data: bundlesByCountryData, loading: bundlesLoading, error: bundlesError, refetch: refetchBundlesByCountry } = useQuery<GetBundlesByCountryQuery>(GET_BUNDLES_BY_COUNTRY);
  const { data: tripsQueryData, loading: tripsLoading, error: tripsError } = useQuery<GetTripsQuery>(GET_TRIPS);
  const { data: dataPlansData } = useQuery<GetDataPlansQuery>(GET_DATA_PLANS, {
    variables: {
      filter: {
        limit: 1000
      }
    }
  });
  const [getCountryDataPlans] = useLazyQuery(GET_DATA_PLANS);
  const [getCountryBundles] = useLazyQuery(GET_COUNTRY_BUNDLES);
  const { calculateBatchPrices } = usePricingWithRules();

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

  // Fetch country data plans
  const fetchCountryDataPlans = async (countryId: string, bundleGroup?: string) => {
    // TODO: Re-enable country filtering when backend JSONB queries are fixed
    // For now, fetch all bundles and filter on frontend
    const filter: any = {
      // country: countryId,  // Temporarily disabled due to backend JSONB query issues
      limit: 1000
    };
    
    if (bundleGroup) {
      filter.bundleGroup = bundleGroup;
    }
    
    console.log(`⚠️ Country filtering temporarily disabled. Fetching all bundles and filtering for ${countryId} on frontend.`);
    
    return await getCountryDataPlans({
      variables: {
        filter
      }
    });
  };

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
        
        // Transform the bundles to include additional display fields
        const transformedBundles = bundles.map(bundle => ({
          ...bundle,
          pricePerDay: bundle.duration > 0 && bundle.priceAfterDiscount ? bundle.priceAfterDiscount / bundle.duration : 0,
          hasCustomDiscount: bundle.hasCustomDiscount || false,
          configurationLevel: bundle.configurationLevel || 'GLOBAL',
          discountPerDay: bundle.discountPerDay || 0.10,
          // These are already in the response but ensure they exist
          dataAmount: bundle.dataAmount || 'Unknown',
          isUnlimited: bundle.isUnlimited || false,
          bundleGroup: bundle.bundleGroup || 'Standard Fixed'
        }));
        
        // Calculate average price per day for the country summary
        const avgPricePerDay = calculateAveragePricePerDay(transformedBundles);
        
        // Update the country group with the fetched bundles
        setCountryGroups(prev => prev.map(group => 
          group.countryId === countryId 
            ? { 
                ...group, 
                bundles: transformedBundles,
                avgPricePerDay
              }
            : group
        ));
        
        console.log(`📊 Updated country group for ${countryId} with ${transformedBundles.length} bundles`);
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
    await refetchBundlesByCountry();
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