import { useQuery, useLazyQuery } from '@apollo/client';
import React, { useEffect, useState, useMemo } from 'react';
import { GET_COUNTRIES, GET_DATA_PLANS, CALCULATE_BATCH_PRICING, GET_PRICING_CONFIGURATIONS } from '../lib/graphql/queries';
import { GroupedDataTable } from '../components/grouped-data-table';
import { ColumnDef, Row } from '@tanstack/react-table';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { ArrowUpDown } from 'lucide-react';
import { PricingConfigDrawer } from '../components/pricing-config-drawer';

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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatPercentage = (rate: number) => {
  return (rate * 100).toFixed(2) + '%';
};

// Helper function to check if a row uses a custom configuration
const isUsingCustomConfig = (pricingData: PricingData, configs: any[]) => {
  if (!configs) return false;
  
  // Check if there's a specific configuration for this country/duration combination
  return configs.some(config => 
    config.isActive && 
    config.countryId === (pricingData.countryName === 'Austria' ? 'AT' : null) &&
    config.duration === pricingData.duration &&
    config.priority > 1 // Higher than default priority
  );
};

const createColumns = (
  pricingConfigs: any[],
  onRowClick: (row: PricingData) => void
): ColumnDef<PricingData>[] => [
  {
    accessorKey: 'bundleName',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Bundle
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const hasCustomConfig = isUsingCustomConfig(row.original, pricingConfigs);
      return (
        <div 
          className={`cursor-pointer ${hasCustomConfig ? 'border-l-4 border-red-500 pl-2' : ''}`}
          onClick={() => onRowClick(row.original)}
        >
          <div className="font-medium">{row.original.bundleName}</div>
          <div className="text-sm text-gray-500">{row.original.duration} days</div>
        </div>
      );
    },
    enableGrouping: true,
  },
  {
    accessorKey: 'countryName',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Country
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    enableGrouping: true,
  },
  {
    accessorKey: 'cost',
    header: 'Cost',
    cell: ({ row }) => formatCurrency(row.original.cost),
  },
  {
    accessorKey: 'costPlus',
    header: 'Cost Plus',
    cell: ({ row }) => formatCurrency(row.original.costPlus),
  },
  {
    accessorKey: 'totalCost',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Total Cost
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{formatCurrency(row.original.totalCost)}</div>
    ),
  },
  {
    accessorKey: 'discountRate',
    header: 'Discount',
    cell: ({ row }) => (
      <Badge variant="secondary">
        {formatPercentage(row.original.discountRate)}
      </Badge>
    ),
  },
  {
    accessorKey: 'discountValue',
    header: 'Discount Value',
    cell: ({ row }) => (
      <span className="text-green-600">
        -{formatCurrency(row.original.discountValue)}
      </span>
    ),
  },
  {
    accessorKey: 'priceAfterDiscount',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Price After Discount
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium text-blue-600">
        {formatCurrency(row.original.priceAfterDiscount)}
      </div>
    ),
  },
  {
    accessorKey: 'processingRate',
    header: 'Processing',
    cell: ({ row }) => (
      <Badge variant="outline">
        {formatPercentage(row.original.processingRate)}
      </Badge>
    ),
  },
  {
    accessorKey: 'processingCost',
    header: 'Processing Cost',
    cell: ({ row }) => (
      <span className="text-yellow-600">
        -{formatCurrency(row.original.processingCost)}
      </span>
    ),
  },
  {
    accessorKey: 'revenueAfterProcessing',
    header: 'Revenue After Processing',
    cell: ({ row }) => formatCurrency(row.original.revenueAfterProcessing),
  },
  {
    accessorKey: 'finalRevenue',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Final Revenue
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium text-green-600">
        {formatCurrency(row.original.finalRevenue)}
      </div>
    ),
  },
  {
    accessorKey: 'duration',
    header: 'Duration',
    cell: ({ row }) => `${row.original.duration} days`,
    enableGrouping: true,
  },
];

const PricingPage: React.FC = () => {
  const [pricingData, setPricingData] = useState<PricingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grouping, setGrouping] = useState<string>('none'); // 'none', 'country', 'duration'
  const [selectedRow, setSelectedRow] = useState<PricingData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch countries, data plans, and pricing configurations
  const { data: countriesData } = useQuery(GET_COUNTRIES);
  const { data: dataPlansData } = useQuery(GET_DATA_PLANS);
  const { data: pricingConfigsData, refetch: refetchPricingConfigs } = useQuery(GET_PRICING_CONFIGURATIONS);
  const [calculateBatchPricing] = useLazyQuery(CALCULATE_BATCH_PRICING);

  // Generate pricing configurations from actual data
  useEffect(() => {
    const fetchAllPricing = async () => {
      if (!countriesData?.countries || !dataPlansData?.dataPlans?.items) {
        return;
      }

      setLoading(true);
      setError(null);
      const allPricing: PricingData[] = [];

      // Group data plans by country and duration
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

      // Build batch input for all country-duration combinations
      const batchInputs: Array<{numOfDays: number; regionId: string; countryId: string}> = [];
      
      for (const [countryId, durations] of plansByCountry) {
        const country = countriesData.countries.find((c: any) => c.iso === countryId);
        if (!country) continue;

        for (const duration of durations) {
          batchInputs.push({
            numOfDays: duration,
            regionId: country.region,
            countryId: countryId,
          });
        }
      }

      // Make single batch query instead of multiple individual queries
      try {
        const result = await calculateBatchPricing({
          variables: {
            inputs: batchInputs,
          },
        });

        if (result.data?.calculatePrices) {
          allPricing.push(...result.data.calculatePrices);
        }
      } catch (error) {
        console.error('Error fetching batch pricing:', error);
        setError('Failed to fetch pricing configurations');
      }

      setPricingData(allPricing);
      setLoading(false);
    };

    fetchAllPricing();
  }, [countriesData, dataPlansData, calculateBatchPricing]);

  // Handle row click to open drawer
  const handleRowClick = (row: PricingData) => {
    console.log('Row clicked:', row);
    setSelectedRow(row);
    setIsDrawerOpen(true);
    console.log('Drawer should be open now:', true);
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
    setPricingData([]); // Clear current data
    setLoading(true);
  };

  // Create columns with current pricing configs
  const columns = useMemo(() => {
    return createColumns(
      pricingConfigsData?.pricingConfigurations || [],
      handleRowClick
    );
  }, [pricingConfigsData]);

  // Configure table grouping
  const tableOptions = useMemo(() => {
    const options: any = {};
    
    switch (grouping) {
      case 'country':
        options.grouping = ['countryName'];
        break;
      case 'duration':
        options.grouping = ['duration'];
        break;
      default:
        options.grouping = [];
    }
    
    return options;
  }, [grouping]);

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
        <div className="text-sm text-gray-500">
          {pricingData.length} pricing configurations
        </div>
      </div>

      {/* Grouping Controls */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Group by:</span>
        <Select value={grouping} onValueChange={setGrouping}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select grouping" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No grouping</SelectItem>
            <SelectItem value="country">Country</SelectItem>
            <SelectItem value="duration">Duration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <GroupedDataTable 
        columns={columns} 
        data={pricingData}
        grouping={tableOptions.grouping}
      />

<div>

      {/* Drawer for pricing configuration */}
      <PricingConfigDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        pricingData={selectedRow}
        onConfigurationSaved={handleConfigurationSaved}
        />
        </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Pricing Breakdown Information</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Cost:</strong> Base cost from supplier</p>
          <p><strong>Cost Plus:</strong> Additional markup cost</p>
          <p><strong>Total Cost:</strong> Cost + Cost Plus</p>
          <p><strong>Discount:</strong> Percentage discount applied to total cost</p>
          <p><strong>Processing:</strong> Payment processing fee percentage</p>
          <p><strong>Final Revenue:</strong> Revenue after all costs and fees</p>
          <p><strong>Red Border:</strong> Indicates custom pricing configuration is active</p>
          <p><strong>Click Row:</strong> Edit pricing configuration for specific bundle</p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;