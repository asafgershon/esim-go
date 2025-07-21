import { useState, useEffect } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { 
  BundlesByCountry, 
  Country, 
  CountryBundle, 
  GetCountriesQuery, 
  GetDataPlansQuery, 
  GetPricingConfigurationsQuery, 
  PricingConfiguration 
} from '@/__generated__/graphql';
import { CALCULATE_BATCH_PRICING, GET_COUNTRIES, GET_DATA_PLANS, GET_PRICING_CONFIGURATIONS } from '../lib/graphql/queries';

export interface CountryGroupData extends BundlesByCountry {
  bundles?: CountryBundle[];
}

export const usePricingData = () => {
  const [countryGroups, setCountryGroups] = useState<CountryGroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GraphQL queries
  const { data: countriesData } = useQuery<GetCountriesQuery>(GET_COUNTRIES);
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
    const fetchCountryGroups = async () => {
      if (!countriesData?.countries || !dataPlansData?.dataPlans?.items) {
        return;
      }

      setLoading(true);
      setError(null);
      const groups: CountryGroupData[] = [];

      // Group data plans by country
      const plansByCountry = new Map<string, Set<number>>();
      
      for (const plan of dataPlansData.dataPlans.items) {
        if (plan.countries) {
          for (const country of plan.countries) {
            if (!plansByCountry.has(country.iso)) {
              plansByCountry.set(country.iso, new Set());
            }
            plansByCountry.get(country.iso)!.add(plan.duration);
          }
        }
      }

      // Create country groups with summary data
      for (const [countryId, durations] of plansByCountry) {
        const country = countriesData.countries.find((c: Country) => c.iso === countryId);
        if (!country) continue;

        // Calculate basic summary for now (will be enhanced)
        const totalBundles = durations.size;
        
        // Check if country has custom discount
        const hasCustomDiscount = pricingConfigsData?.pricingConfigurations?.some(
          (config: PricingConfiguration) => config.countryId === countryId && config.isActive
        ) || false;

        const customConfig = pricingConfigsData?.pricingConfigurations?.find(
          (config: PricingConfiguration) => config.countryId === countryId && config.isActive
        );

        groups.push({
          countryName: country.name,
          countryId: countryId,
          totalBundles,
          avgPricePerDay: 0,
          hasCustomDiscount,
          avgDiscountRate: customConfig?.discountRate || 0,
          avgCost: 0,
          avgCostPlus: 0,
          avgFinalRevenue: 0,
          avgNetProfit: 0,
          avgProcessingRate: 0,
          avgProcessingCost: 0,
          avgProfitMargin: 0,
          avgTotalCost: 0,
          totalDiscountValue: 0,
          totalRevenue: 0,
          bundles: undefined,
        });
      }

      setCountryGroups(groups);
      setLoading(false);
    };

    fetchCountryGroups();
  }, [countriesData, dataPlansData, pricingConfigsData]);

  // Lazy load bundles for a country when expanded
  const expandCountry = async (countryId: string) => {
    const country = countriesData?.countries?.find((c: Country) => c.iso === countryId);
    if (!country) return;

    try {
      // Fetch bundles for this specific country using the country filter
      const countryDataResult = await getCountryDataPlans({
        variables: {
          filter: {
            country: countryId,
            limit: 1000
          }
        }
      });

      if (countryDataResult.data?.dataPlans?.items) {
        const countryDataPlans = countryDataResult.data;
        // Get all durations for this country from the fetched data
        const durations = new Set<number>();
        for (const plan of countryDataPlans.dataPlans.items) {
          durations.add(plan.duration);
        }

        // Build batch input for this country
        const batchInputs: Array<{numOfDays: number; regionId: string; countryId: string; paymentMethod?: string}> = [];
        for (const duration of durations) {
          batchInputs.push({
            numOfDays: duration,
            regionId: country.region,
            countryId: countryId,
            paymentMethod: 'ISRAELI_CARD',
          });
        }

        const pricingResult = await calculateBatchPricing({
          variables: {
            inputs: batchInputs,
          },
        });

        if (pricingResult.data?.calculatePrices) {
          const bundles: CountryBundle[] = pricingResult.data.calculatePrices;
          
          // Calculate average price per day
          const avgPricePerDay = bundles.reduce((sum, bundle) => 
            sum + (bundle.priceAfterDiscount / bundle.duration), 0
          ) / bundles.length;

          // Update the country group with loaded bundles and last fetched info
          setCountryGroups(prev => prev.map(group => 
            group.countryId === countryId 
              ? { 
                  ...group, 
                  bundles, 
                  avgPricePerDay,
                }
              : group
          ));
        }
      }
    } catch (error) {
      console.error('Error fetching bundles for country:', countryId, error);
      setError(`Failed to load bundles for ${countryId}`);
    }
  };

  const refreshConfigurations = () => {
    refetchPricingConfigs();
    // Clear current data to trigger reload
    setCountryGroups([]);
    setLoading(true);
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