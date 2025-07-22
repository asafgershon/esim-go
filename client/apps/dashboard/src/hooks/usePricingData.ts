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

        // Calculate pricing for this country - this will get pricing for all unique durations
        const pricingResult = await calculateCountryPricing(countryId, country.region, durations);

        if (pricingResult.data?.calculatePrices) {
          // The pricing calculation returns one bundle per unique duration
          // But we want to show ALL plans, even if they have the same duration
          const pricingData: CountryBundle[] = pricingResult.data.calculatePrices;
          
          // Create a map of duration -> pricing data for quick lookup
          const pricingByDuration = new Map<number, CountryBundle>();
          pricingData.forEach(bundle => {
            pricingByDuration.set(bundle.duration, bundle);
          });
          
          // Generate bundles for ALL plans (not just unique durations)
          const allBundles: CountryBundle[] = allPlans.map(plan => {
            const basePricing = pricingByDuration.get(plan.duration);
            if (!basePricing) {
              console.warn(`No pricing found for plan ${plan.name} with duration ${plan.duration}`);
              return null;
            }
            
            // Create a bundle entry for this specific plan
            return {
              ...basePricing,
              bundleName: plan.name, // Use the actual plan name (no tag added)
              duration: plan.duration,
              // Keep the pricing from the calculation but use the specific plan info
              dataAmount: plan.dataAmount, // Store the formatted data amount for badge display
            };
          }).filter(Boolean) as CountryBundle[];
          
          // DEBUG: Log the resulting bundles
          console.log(`✅ Pricing calculation result for ${countryId}:`, {
            originalPricingResults: pricingData.length,
            finalBundleCount: allBundles.length,
            bundleDurations: allBundles.map(b => b.duration).sort((a, b) => a - b),
            uniqueBundleNames: [...new Set(allBundles.map(b => b.bundleName))],
            sampleBundles: allBundles.slice(0, 10).map(b => ({
              bundleName: b.bundleName,
              duration: b.duration,
              totalCost: b.totalCost
            }))
          });
          
          updateCountryGroupWithBundles(countryId, allBundles);
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