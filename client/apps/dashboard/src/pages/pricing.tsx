import { Country, PricingConfiguration } from '@/__generated__/graphql';
import { useLazyQuery, useQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Calculator } from 'lucide-react';
import { CountryPricingTableGrouped } from '../components/country-pricing-table-grouped';
import { PricingConfigDrawer } from '../components/pricing-config-drawer';
import { PricingSimulatorDrawer } from '../components/pricing-simulator-drawer';
import { CALCULATE_BATCH_PRICING, GET_COUNTRIES, GET_DATA_PLANS, GET_PRICING_CONFIGURATIONS } from '../lib/graphql/queries';

interface PricingData {
  bundleName: string;
  countryName: string;
  duration: number;
  cost: number;
  costPlus: number;
  totalCost: number;
  discountRate: number;
  discountValue: number;
  priceAfterDiscount: number;
  processingRate: number;
  processingCost: number;
  revenueAfterProcessing: number;
  finalRevenue: number;
  currency: string;
}

interface CountryGroupData {
  countryName: string;
  countryId: string;
  totalBundles: number;
  avgPricePerDay: number;
  hasCustomDiscount: boolean;
  discountRate?: number;
  bundles?: PricingData[]; // Lazy loaded
  lastFetched?: string; // ISO date string
}


const PricingPage: React.FC = () => {
  const [countryGroups, setCountryGroups] = useState<CountryGroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<PricingData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Fetch countries, data plans, and pricing configurations
  const { data: countriesData } = useQuery(GET_COUNTRIES);
  const { data: dataPlansData } = useQuery(GET_DATA_PLANS, {
    variables: {
      filter: {
        limit: 1000 // Fetch more bundles to show all durations
      }
    },
    onCompleted: (data) => {
      console.log('GET_DATA_PLANS response:', data);
      console.log('Total bundles received:', data?.dataPlans?.items?.length);
      console.log('Bundle durations:', data?.dataPlans?.items?.map(plan => plan.duration));
      console.log('Unique durations:', [...new Set(data?.dataPlans?.items?.map(plan => plan.duration))]);
    }
  });
  const { data: pricingConfigsData, refetch: refetchPricingConfigs } = useQuery(GET_PRICING_CONFIGURATIONS);
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
          avgPricePerDay: 0, // Will be calculated when bundles are loaded
          hasCustomDiscount,
          discountRate: customConfig?.discountRate,
          bundles: undefined, // Lazy loaded
          lastFetched: dataPlansData?.dataPlans?.lastFetched, // Show global cache time initially
        });
      }

      setCountryGroups(groups);
      setLoading(false);
    };

    fetchCountryGroups();
  }, [countriesData, dataPlansData, pricingConfigsData]);

  // Lazy load bundles for a country when expanded
  const handleExpandCountry = async (countryId: string) => {
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
        const batchInputs: Array<{numOfDays: number; regionId: string; countryId: string}> = [];
        for (const duration of durations) {
          batchInputs.push({
            numOfDays: duration,
            regionId: country.region,
            countryId: countryId,
          });
        }

        const pricingResult = await calculateBatchPricing({
          variables: {
            inputs: batchInputs,
          },
        });

        if (pricingResult.data?.calculatePrices) {
          const bundles: PricingData[] = pricingResult.data.calculatePrices;
          
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
                  lastFetched: countryDataPlans.dataPlans.lastFetched
                }
              : group
          ));
        }
      }
    } catch (error) {
      console.error('Error fetching bundles for country:', countryId, error);
    }
  };

  // Handle country click to open drawer
  const handleCountryClick = (country: CountryGroupData) => {
    // Use first bundle if available, or create a dummy one
    const firstBundle = country.bundles?.[0];
    if (firstBundle) {
      setSelectedRow(firstBundle);
    } else {
      // Create a dummy bundle for country configuration
      const dummyBundle: PricingData = {
        bundleName: `${country.countryName} Configuration`,
        countryName: country.countryName,
        duration: 7,
        cost: 0,
        costPlus: 0,
        totalCost: 0,
        discountRate: country.discountRate || 0.3,
        discountValue: 0,
        priceAfterDiscount: 0,
        processingRate: 0.045,
        processingCost: 0,
        revenueAfterProcessing: 0,
        finalRevenue: 0,
        currency: 'USD',
      };
      setSelectedRow(dummyBundle);
    }
    setIsDrawerOpen(true);
  };

  // Handle bundle click to open drawer
  const handleBundleClick = (bundle: PricingData) => {
    console.log('handleBundleClick called with:', bundle);
    setSelectedRow(bundle);
    setIsDrawerOpen(true);
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedRow(null);
  };

  // Handle configuration saved
  const handleConfigurationSaved = () => {
    refetchPricingConfigs();
    // Optionally refresh pricing data to see changes
    setCountryGroups([]); // Clear current data
    setLoading(true);
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading pricing data from eSIM Go API...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsSimulatorOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Pricing Simulator
          </Button>
          <div className="text-sm text-gray-500">
            {countryGroups.length} countries
          </div>
        </div>
      </div>

      <CountryPricingTableGrouped 
        countries={countryGroups}
        onCountryClick={handleCountryClick}
        onBundleClick={handleBundleClick}
        onExpandCountry={handleExpandCountry}
      />

      {/* Drawer for pricing configuration */}
      <PricingConfigDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        pricingData={selectedRow}
        onConfigurationSaved={handleConfigurationSaved}
      />

      {/* Pricing Simulator Drawer */}
      <PricingSimulatorDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        countries={countriesData?.countries || []}
      />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Enhanced Pricing Management with Native Grouping</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Pricing Simulator:</strong> Use the "Pricing Simulator" button to test pricing for any country/duration combination</p>
          <p><strong>Native Grouping:</strong> Use "Group by" button to organize data by country, duration, or other fields</p>
          <p><strong>Advanced Filtering:</strong> Filter by country, price range, duration, or custom criteria</p>
          <p><strong>Expand/Collapse:</strong> Expand all or collapse all grouped sections</p>
          <p><strong>Interactive Rows:</strong> Click any row to configure pricing for that bundle</p>
          <p><strong>Real-time Data:</strong> All pricing calculated from live eSIM Go API data</p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;