import React, { useState, useMemo } from "react";
import { Column, ColumnDef, Row } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { AdvancedDataTable } from "@workspace/ui/components/advanced-data-table";
import {
  createGroupingPlugin,
  createFilteringPlugin,
  createColumnPinningPlugin,
  filterConfigs,
  enableColumnGrouping,
} from "@workspace/ui/components/table-plugins";
import {
  DollarSign,
  TrendingUp,
  Clock,
  Percent,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface PricingData {
  bundleName: string;
  countryName: string;
  countryId: string;
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
  // Additional fields for display
  pricePerDay: number;
  hasCustomDiscount: boolean;
  lastFetched?: string;
}

interface CountryGroupData {
  countryName: string;
  countryId: string;
  totalBundles: number;
  avgPricePerDay: number;
  hasCustomDiscount: boolean;
  discountRate?: number;
  bundles?: PricingData[];
  lastFetched?: string;
}

interface CountryPricingTableGroupedProps {
  countries: CountryGroupData[];
  onCountryClick: (country: CountryGroupData) => void;
  onBundleClick?: (bundle: PricingData) => void;
  onExpandCountry: (countryId: string) => Promise<void>;
}

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const formatPercentage = (rate: number) => {
  return (rate * 100).toFixed(1) + "%";
};

// Sortable header component
const SortableHeader = ({
  column,
  children,
}: {
  column: Column<PricingData, unknown>;
  children: React.ReactNode;
}) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="h-8 px-2 text-left justify-start font-medium"
    >
      {children}
      {column.getIsSorted() === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
};

// Transform data for table consumption - show both country summaries and expanded bundles
const transformDataForTable = (
  countries: CountryGroupData[],
  expandedCountries: Set<string>
) => {
  const flatData: PricingData[] = [];

  countries.forEach((country) => {
    // Always add summary row first
    flatData.push({
      bundleName: `${country.countryName} Summary`,
      countryName: country.countryName,
      countryId: country.countryId,
      duration: 0, // Special indicator for summary row
      cost: 0,
      costPlus: 0,
      totalCost: 0,
      discountRate: country.discountRate || 0.3,
      discountValue: 0,
      priceAfterDiscount: 0,
      processingRate: 0,
      processingCost: 0,
      revenueAfterProcessing: 0,
      finalRevenue: 0,
      currency: "USD",
      pricePerDay: country.avgPricePerDay,
      hasCustomDiscount: country.hasCustomDiscount,
      lastFetched: country.lastFetched,
    });

    // Only add bundles if country is expanded and has bundles
    if (
      expandedCountries.has(country.countryId) &&
      country.bundles &&
      country.bundles.length > 0
    ) {
      // Sort bundles by duration before adding them
      const sortedBundles = [...country.bundles].sort(
        (a, b) => a.duration - b.duration
      );

      // Add sorted bundles
      sortedBundles.forEach((bundle) => {
        flatData.push({
          ...bundle,
          countryId: country.countryId,
          pricePerDay: bundle.priceAfterDiscount / bundle.duration,
          hasCustomDiscount: country.hasCustomDiscount,
          lastFetched: country.lastFetched,
        });
      });
    }
  });

  return flatData;
};

export function CountryPricingTableGrouped({
  countries,
  onCountryClick,
  onBundleClick,
  onExpandCountry,
}: CountryPricingTableGroupedProps) {
  const [loadingCountries, setLoadingCountries] = useState<Set<string>>(
    new Set()
  );
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set()
  );

  // Transform data for table
  const tableData = useMemo(
    () => transformDataForTable(countries, expandedCountries),
    [countries, expandedCountries]
  );

  // Handle expand/collapse country with loading state
  const handleToggleCountry = async (countryId: string) => {
    const country = countries.find((c) => c.countryId === countryId);

    // If country is already expanded, collapse it
    if (expandedCountries.has(countryId)) {
      setExpandedCountries((prev) => {
        const next = new Set(prev);
        next.delete(countryId);
        return next;
      });
      return;
    }

    // If country has bundles, just expand it
    if (country?.bundles) {
      setExpandedCountries((prev) => new Set(prev).add(countryId));
      return;
    }

    // If country doesn't have bundles, load them first
    if (country && !country.bundles) {
      setLoadingCountries((prev) => new Set(prev).add(countryId));
      try {
        await onExpandCountry(countryId);
        setExpandedCountries((prev) => new Set(prev).add(countryId));
      } finally {
        setLoadingCountries((prev) => {
          const next = new Set(prev);
          next.delete(countryId);
          return next;
        });
      }
    }
  };

  // Column definitions with grouping enabled
  const columns: ColumnDef<PricingData>[] = useMemo(
    () =>
      enableColumnGrouping(
        [
          {
            id: "expand",
            header: "",
            cell: ({ row }: { row: Row<PricingData> }) => {
              const data = row.original;
              const isSummaryRow = data.duration === 0;
              const isExpanded = expandedCountries.has(data.countryId);
              const isLoading = loadingCountries.has(data.countryId);

              if (isSummaryRow) {
                return (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleToggleCountry(data.countryId);
                    }}
                    disabled={isLoading}
                    className="p-1 h-6 w-6"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                    ) : isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                );
              }

              return <div className="w-6"></div>;
            },
            enableSorting: false,
            size: 40,
          },
          {
            id: "country",
            accessorKey: "countryName",
            header: ({ column }: { column: Column<PricingData, unknown> }) => (
              <SortableHeader column={column}>Country</SortableHeader>
            ),
            cell: ({ row }: { row: Row<PricingData> }) => {
              const data = row.original;
              return (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{data.countryName}</span>
                  <Badge variant="outline" className="text-xs">
                    {data.countryId}
                  </Badge>
                </div>
              );
            },
            enableGrouping: true,
          },
          {
            id: "bundleName",
            accessorKey: "bundleName",
            header: ({ column }) => (
              <SortableHeader column={column}>Bundle</SortableHeader>
            ),
            sortingFn: (rowA: Row<PricingData>, rowB: Row<PricingData>) => {
              // Custom sorting: for summary rows, sort by number of bundles; for bundle rows, sort by name
              const a = rowA.original;
              const b = rowB.original;

              // Both are summary rows - sort by number of bundles
              if (a.duration === 0 && b.duration === 0) {
                const countryA = countries.find(
                  (c) => c.countryId === a.countryId
                );
                const countryB = countries.find(
                  (c) => c.countryId === b.countryId
                );
                return (
                  (countryA?.totalBundles || 0) - (countryB?.totalBundles || 0)
                );
              }

              // Default string sorting for bundle names
              return a.bundleName.localeCompare(b.bundleName);
            },
            cell: ({ row }: { row: Row<PricingData> }) => {
              const data = row.original;
              const isSummaryRow = data.duration === 0;
              const country = countries.find(
                (c) => c.countryId === data.countryId
              );

              return (
                <div className="flex items-center gap-2">
                  {isSummaryRow ? (
                    <Badge variant="secondary" className="text-xs">
                      {country?.totalBundles || 0} bundles
                    </Badge>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span>{data.bundleName}</span>
                    </>
                  )}
                </div>
              );
            },
          },
          {
            id: "duration",
            accessorKey: "duration",
            header: "Duration",
            cell: ({ row }: { row: Row<PricingData> }) => {
              const data = row.original;
              const isSummaryRow = data.duration === 0;

              return (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  {isSummaryRow ? (
                    <Badge variant="secondary">Summary</Badge>
                  ) : (
                    <Badge variant="outline">{data.duration} days</Badge>
                  )}
                </div>
              );
            },
          },
          {
            id: "pricing",
            accessorKey: "pricePerDay",
            header: "Price / Day",
            cell: ({ row }: { row: Row<PricingData> }) => {
              const data = row.original;
              return (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">
                      {formatCurrency(data.pricePerDay)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Total: {formatCurrency(data.priceAfterDiscount)}
                  </div>
                </div>
              );
            },
          },
          {
            id: "discount",
            accessorKey: "discountRate",
            header: "Discount",
            cell: ({ row }: { row: Row<PricingData> }) => {
              const data = row.original;
              return (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Percent className="h-4 w-4 text-purple-600" />
                    <Badge
                      variant={data.hasCustomDiscount ? "default" : "outline"}
                    >
                      {formatPercentage(data.discountRate)}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    Value: {formatCurrency(data.discountValue)}
                  </div>
                </div>
              );
            },
          },
          {
            id: "costs",
            accessorKey: "totalCost",
            header: "Costs",
            cell: ({ row }) => {
              const data = row.original;
              return (
                <div className="space-y-1 text-sm">
                  <div>Base: {formatCurrency(data.cost)}</div>
                  <div>Plus: {formatCurrency(data.costPlus)}</div>
                  <div className="font-medium">
                    Total: {formatCurrency(data.totalCost)}
                  </div>
                </div>
              );
            },
          },
          {
            id: "processing",
            accessorKey: "processingCost",
            header: "Processing",
            cell: ({ row }) => {
              const data = row.original;
              return (
                <div className="space-y-1 text-sm">
                  <div>Rate: {formatPercentage(data.processingRate)}</div>
                  <div className="text-red-600">
                    Cost: {formatCurrency(data.processingCost)}
                  </div>
                </div>
              );
            },
          },
          {
            id: "revenue",
            accessorKey: "finalRevenue",
            header: "Final Revenue",
            cell: ({ row }) => {
              const data = row.original;
              const profitMargin =
                ((data.finalRevenue - data.totalCost) / data.totalCost) * 100;
              return (
                <div className="space-y-1">
                  <div className="text-green-600 font-medium">
                    {formatCurrency(data.finalRevenue)}
                  </div>
                  <div className="text-sm">
                    <span
                      className={
                        profitMargin > 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {profitMargin > 0 ? "+" : ""}
                      {profitMargin.toFixed(1)}% margin
                    </span>
                  </div>
                </div>
              );
            },
          },
          {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
              const data = row.original;
              const country = countries.find(
                (c) => c.countryId === data.countryId
              );

              return (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onBundleClick?.(data)}
                  >
                    Details
                  </Button>
                  {country && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCountryClick(country);
                      }}
                    >
                      Configure
                    </Button>
                  )}
                </div>
              );
            },
          },
        ],
        ["countryName"]
      ),
    [
      countries,
      onCountryClick,
      onBundleClick,
      expandedCountries,
      loadingCountries,
    ]
  );

  // Create plugins
  const plugins = useMemo(
    () => [
      createColumnPinningPlugin({
        initialPinnedColumns: {
          left: ["expand", "country"], // Pin the expand button and country column to the left
        },
        enablePinningUI: true,
        pinnedColumnStyles: {
          backgroundColor: "rgb(249 250 251)", // gray-50
          borderColor: "rgb(229 231 235)", // gray-200
          zIndex: 2, // Higher z-index for better layering
        },
      }),
      createGroupingPlugin({
        groupableColumns: ["countryName"],
        groupingLabels: {
          countryName: "Country",
        },
        onGroupClick: async (groupValue, groupData) => {
          console.log("Group clicked:", groupValue, groupData);
        },
      }),
      createFilteringPlugin({
        globalSearch: true,
        globalSearchPlaceholder: "Search countries and bundles...",
        columnFilters: {
          countryName: filterConfigs.text("Filter by country"),
          duration: filterConfigs.select([
            { label: "1-7 days", value: "1-7" },
            { label: "8-15 days", value: "8-15" },
            { label: "16-30 days", value: "16-30" },
            { label: "30+ days", value: "30+" },
          ]),
          hasCustomDiscount: filterConfigs.select([
            { label: "Custom Discount", value: "true" },
            { label: "Default Discount", value: "false" },
          ]),
        },
        enableQuickFilters: true,
        quickFilters: [
          {
            label: "High Revenue (>$10)",
            value: "high-revenue",
            filter: (row) => row.finalRevenue > 10,
          },
          {
            label: "Custom Discounts",
            value: "custom-discounts",
            filter: (row) => row.hasCustomDiscount,
          },
          {
            label: "Long Duration (30+ days)",
            value: "long-duration",
            filter: (row) => row.duration >= 30,
          },
          {
            label: "High Margin (>50%)",
            value: "high-margin",
            filter: (row) =>
              (row.finalRevenue - row.totalCost) / row.totalCost > 0.5,
          },
        ],
      }),
    ],
    []
  );

  // Get summary statistics
  const stats = useMemo(() => {
    const totalBundles = tableData.length;
    const totalRevenue = tableData.reduce(
      (sum, bundle) => sum + bundle.finalRevenue,
      0
    );
    const avgRevenue = totalRevenue / totalBundles;
    const countriesWithBundles = countries.filter(
      (c) => c.bundles && c.bundles.length > 0
    );

    return {
      totalBundles,
      totalRevenue,
      avgRevenue,
      countriesCount: countriesWithBundles.length,
    };
  }, [tableData, countries]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Country Pricing Analysis</h3>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{stats.countriesCount} countries</span>
          <span>•</span>
          <span>{stats.totalBundles} bundles</span>
          <span>•</span>
          <span>Avg: {formatCurrency(stats.avgRevenue)}</span>
          <span>•</span>
          <span className="text-green-600 font-medium">
            Total: {formatCurrency(stats.totalRevenue)}
          </span>
        </div>
      </div>

      <AdvancedDataTable
        columns={columns}
        data={tableData}
        plugins={plugins}
        grouping={["countryName"]} // Start with country grouping
        enablePagination={true}
        initialPageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        onRowClick={(row) => {
          const data = row.original;
          // Only open drawer for actual bundles, not summary rows
          if (data.duration !== 0) {
            onBundleClick?.(data);
          }
        }}
        emptyMessage="No pricing data available"
        className="country-pricing-table-grouped"
      />

      {loadingCountries.size > 0 && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-700">
            Loading bundles for {loadingCountries.size} countries...
          </span>
        </div>
      )}
    </div>
  );
}
