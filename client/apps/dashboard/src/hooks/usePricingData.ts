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
import { GET_BUNDLES_BY_COUNTRY, GET_COUNTRIES, GET_DATA_PLANS, GET_TRIPS } from '../lib/graphql/queries';
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
    const filter: any = {
      country: countryId,
      limit: 1000
    };
    
    if (bundleGroup) {
      filter.bundleGroup = bundleGroup;
    }
    
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
    const country = countriesData?.countries?.find((c: Country) => c.iso === countryId);
    if (!country) return;

    try {
      // Fetch all bundles for the country and filter for unlimited ones
      console.log(`🔍 Fetching all bundles for country: ${countryId}`);
      const allBundlesResult = await fetchCountryDataPlans(countryId);
      
      const allPlans: any[] = [];
      
      if (allBundlesResult.data?.dataPlans?.items) {
        // Filter for unlimited bundles (dataAmount === -1 or isUnlimited === true)
        const unlimitedBundles = allBundlesResult.data.dataPlans.items.filter(
          (plan: any) => plan.dataAmount === -1 || plan.isUnlimited === true
        );
        
        console.log(`✅ Found ${unlimitedBundles.length} unlimited bundles out of ${allBundlesResult.data.dataPlans.items.length} total`);
        
        // Group by bundle group for logging
        const bundleGroups = unlimitedBundles.reduce((groups: any, bundle: any) => {
          const group = bundle.bundleGroup || 'Unknown';
          groups[group] = (groups[group] || 0) + 1;
          return groups;
        }, {});
        
        console.log('📊 Unlimited bundles by group:', bundleGroups);
        
        allPlans.push(...unlimitedBundles);
      } else {
        console.log('⚠️ No bundles found for country');
      }

      if (allPlans.length > 0) {
        // FIXED: Instead of extracting only unique durations, get all durations from all plans
        const allDurations = allPlans.map(plan => plan.duration);
        const durations = new Set(allDurations); // Still need to deduplicate for batch API call

        // DEBUG: Log the expansion details to help diagnose unlimited bundles
        console.log(`🔍 Country expansion debug for ${countryId}:`, {
          fetchedPlans: allPlans.length,
          allDurations: allDurations.sort((a, b) => a - b),
          uniqueDurations: Array.from(durations).sort((a, b) => a - b),
          bundleGroups: [...new Set(allPlans.map(p => p.bundleGroup))],
          samplePlans: allPlans.slice(0, 10).map(p => ({
            name: p.name,
            duration: p.duration,
            bundleGroup: p.bundleGroup,
            dataAmount: p.dataAmount, // Now human-readable from resolver
            isUnlimited: p.isUnlimited
          }))
        });

        // Calculate pricing for this country using rule-based engine
        const pricingResults = await calculateCountryPricing(countryId, country.region, durations);

        if (pricingResults && pricingResults.length > 0) {
          // Create a map of duration -> pricing data for quick lookup
          const pricingByDuration = new Map<number, any>();
          
          // Each result contains detailed rule information
          pricingResults.forEach(result => {
            // Extract duration from the result or input
            const durationArray = Array.from(durations);
            const resultIndex = pricingResults.indexOf(result);
            const duration = durationArray[resultIndex] || durationArray[0];
            
            // Transform rule-based result to bundle format
            const transformedResult = {
              bundleName: `Bundle ${duration}d`,
              countryName: country.name,
              duration: duration,
              cost: result.pricing?.baseCost || 0,
              costPlus: result.pricing?.markup || 0,
              totalCost: result.pricing?.subtotal || 0,
              discountValue: result.pricing?.totalDiscount || 0,
              priceAfterDiscount: result.pricing?.priceAfterDiscount || 0,
              processingRate: result.pricing?.processingRate || 0,
              processingCost: result.pricing?.processingFee || 0,
              finalRevenue: result.pricing?.finalRevenue || 0,
              currency: 'USD',
              // Rule information
              appliedRules: result.appliedRules || [],
              ruleCount: result.appliedRules?.length || 0,
              ruleImpact: result.ruleBreakdown?.totalImpact || 0,
            };
            
            pricingByDuration.set(duration, transformedResult);
          });
          
          // Generate bundles for ALL plans (not just unique durations)
          const allBundles: CountryBundleWithRules[] = allPlans.map(plan => {
            const basePricing = pricingByDuration.get(plan.duration);
            if (!basePricing) {
              console.warn(`No pricing found for plan ${plan.name} with duration ${plan.duration}`);
              return null;
            }
            
            // Create a bundle entry for this specific plan
            return {
              ...basePricing,
              bundleName: plan.name, // Use the actual plan name
              duration: plan.duration,
              dataAmount: plan.dataAmount, // Store the formatted data amount for badge display
            };
          }).filter(Boolean) as CountryBundleWithRules[];
          
          // Calculate rules summary for the country
          const rulesSummary = calculateRulesSummary(allBundles);
          
          // DEBUG: Log the resulting bundles
          console.log(`✅ Rule-based pricing calculation result for ${countryId}:`, {
            originalPricingResults: pricingResults.length,
            finalBundleCount: allBundles.length,
            rulesSummary,
            sampleBundles: allBundles.slice(0, 3).map(b => ({
              bundleName: b.bundleName,
              duration: b.duration,
              ruleCount: b.ruleCount
            }))
          });
          
          updateCountryGroupWithBundles(countryId, allBundles, rulesSummary);
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