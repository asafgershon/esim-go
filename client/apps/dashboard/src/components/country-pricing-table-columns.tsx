import React from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import {
  DollarSign,
  TrendingUp,
  Clock,
  Percent,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

import { CountryBundleWithDisplay } from "./country-pricing-table-grouped";

// Simple header component without sorting
const SimpleHeader = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="h-8 px-2 text-left font-medium flex items-center">
      {children}
    </div>
  );
};

// Utility functions
const formatCurrency = (amount: number) => {
  // Safety check for NaN, null, undefined values
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "$0.00";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const formatPercentage = (rate: number) => {
  // Safety check for NaN, null, undefined values  
  if (isNaN(rate) || rate === null || rate === undefined) {
    return "0.0%";
  }
  return (rate * 100).toFixed(1) + "%";
};

// COMPLETELY STATIC COLUMNS - NO DYNAMIC DEPENDENCIES
export const createCountryPricingColumns = (): ColumnDef<CountryBundleWithDisplay>[] => [
  {
    id: "expand",
    header: "",
    cell: ({ row, table }: { row: Row<CountryBundleWithDisplay>; table: any }) => {
      const data = row.original;
      const isSummaryRow = data.duration === 0;
      
      // Get dynamic state from table meta
      const meta = table.options.meta || {};
      const isExpanded = meta.expandedCountries?.has(data.countryId) ?? false;
      const isLoading = meta.loadingCountries?.has(data.countryId) ?? false;
      const handleToggleCountry = meta.handleToggleCountry;

      if (isSummaryRow) {
        return (
          <div className="p-1 h-6 w-6 flex items-center justify-center">
            {isLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
            ) : isExpanded ? (
              <ChevronDown className="h-3 w-3 transition-all duration-200 hover:scale-110 animate-in spin-in-180" />
            ) : (
              <ChevronRight className="h-3 w-3 transition-all duration-200 hover:scale-110 animate-in spin-in-180" />
            )}
          </div>
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
    header: () => <SimpleHeader>Country</SimpleHeader>,
    cell: ({ row, table }: { row: Row<CountryBundleWithDisplay>; table: any }) => {
      const data = row.original;
      const isSummaryRow = data.duration === 0;
      
      // Get dynamic state from table meta
      const meta = table.options.meta || {};
      const isHighDemandCountry = meta.isHighDemandCountry?.(data.countryId) ?? false;
      const toggleCountryHighDemand = meta.toggleCountryHighDemand;
      const toggleLoading = meta.toggleLoading;
      
      return (
        <div className="flex items-center gap-2">
          {data.countryName ? (
            <span className="font-medium">{data.countryName}</span>
          ) : (
            <Badge variant="outline" className="text-xs font-medium">
              {data.countryId}
            </Badge>
          )}
          {!isSummaryRow && data.countryName && (
            <Badge variant="outline" className="text-xs">
              {data.countryId}
            </Badge>
          )}
          {isSummaryRow && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (!toggleLoading) {
                        toggleCountryHighDemand?.(data.countryId);
                      }
                    }}
                    disabled={toggleLoading}
                    className={`p-1 h-6 w-6 ${
                      isHighDemandCountry 
                        ? 'text-orange-600 hover:text-orange-700' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <TrendingUp className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isHighDemandCountry ? 'Unmark as high demand' : 'Mark as high demand'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
    enableGrouping: true,
  },
  {
    id: "bundleName",
    accessorKey: "bundleName",
    header: () => <SimpleHeader>Bundle</SimpleHeader>,
    sortingFn: (
      rowA: Row<CountryBundleWithDisplay>,
      rowB: Row<CountryBundleWithDisplay>
    ) => {
      // Custom sorting: for summary rows, sort by number of bundles; for bundle rows, sort by name
      const a = rowA.original;
      const b = rowB.original;

      // Both are summary rows - sort by number of loaded bundles
      if (a.duration === 0 && b.duration === 0) {
        // Access bundlesByCountry from table meta
        const tableData = (rowA as any).table?.options?.meta;
        const bundlesByCountry = tableData?.bundlesByCountry || [];
        const countryA = bundlesByCountry?.find(
          (c: any) => c.countryId === a.countryId
        );
        const countryB = bundlesByCountry?.find(
          (c: any) => c.countryId === b.countryId
        );
        const loadedBundlesA = countryA?.bundles?.length || 0;
        const loadedBundlesB = countryB?.bundles?.length || 0;
        return loadedBundlesA - loadedBundlesB;
      }

      // Default string sorting for bundle names
      return a.bundleName.localeCompare(b.bundleName);
    },
    cell: ({ row, table }: { row: Row<CountryBundleWithDisplay>; table: any }) => {
      const data = row.original;
      const isSummaryRow = data.duration === 0;
      
      // Access current bundlesByCountry from table meta
      const meta = table.options.meta || {};
      const bundlesByCountry = meta.bundlesByCountry || [];
      const country = bundlesByCountry?.find(
        (c: any) => c.countryId === data.countryId
      );

      // Calculate actual number of loaded bundles vs total available
      const loadedBundles = country?.bundles?.length || 0;
      const totalBundles = country?.totalBundles || 0;

      return (
        <div className="flex items-center gap-2">
          {isSummaryRow ? (
            null
          ) : (
            <>
              <DollarSign className="h-4 w-4 text-green-600" />
              <span>{data.bundleName}</span>
              {data.configurationLevel && data.configurationLevel !== 'GLOBAL' && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                  {data.configurationLevel}
                </Badge>
              )}
            </>
          )}
        </div>
      );
    },
  },
  {
    id: "revenue",
    accessorKey: "finalRevenue",
    header: () => <SimpleHeader>Final Revenue</SimpleHeader>,
    cell: ({ row }: { row: Row<CountryBundleWithDisplay> }) => {
      const data = row.original;
      const isSummaryRow = data.duration === 0;
      
      if (isSummaryRow) {
        return null;
      }
      
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
    id: "costs",
    accessorKey: "totalCost",
    header: () => <SimpleHeader>Cost</SimpleHeader>,
    cell: ({ row }: { row: Row<CountryBundleWithDisplay> }) => {
      const data = row.original;
      const isSummaryRow = data.duration === 0;
      
      if (isSummaryRow) {
        return null;
      }
      
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
    id: "discount",
    accessorKey: "discountRate",
    header: () => <SimpleHeader>Unused Days Discount</SimpleHeader>,
    cell: ({ row }: { row: Row<CountryBundleWithDisplay> }) => {
      const data = row.original;
      const isSummaryRow = data.duration === 0;
      
      if (isSummaryRow) {
        return null;
      }

      // Safely access discountPerDay with fallback
      const discountPerDay = (data as any).discountPerDay ?? 0.1;
      const isCustomDiscountPerDay = discountPerDay !== 0.1;
      const hasRegularDiscount = data.discountRate > 0;
      const hasUnusedDaysDiscount = data.discountValue > 0;
      
      return (
        <div className="space-y-2">
          {/* Regular Discount - only show if > 0 */}
          {hasRegularDiscount && (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-300">
                {formatPercentage(data.discountRate)}
              </Badge>
              <span className="text-sm text-gray-600">Config Discount</span>
            </div>
          )}
          
          {/* Unused Days Discount Rate */}
          <div className="flex items-center gap-2">
            <Badge
              variant={isCustomDiscountPerDay ? "default" : "outline"}
              className={isCustomDiscountPerDay ? "bg-orange-100 text-orange-800 border-orange-300 font-semibold" : "font-semibold"}
            >
              {formatPercentage(discountPerDay)}
            </Badge>
            <span className="text-sm text-gray-600 font-medium">per unused day</span>
          </div>

          {/* Applied Discount - only show if discount was actually applied */}
          {hasUnusedDaysDiscount && (
            <div className="text-sm text-green-600 font-medium pt-1 border-t">
              Applied: {formatCurrency(data.discountValue)}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "pricing",
    accessorKey: "pricePerDay",
    header: () => <SimpleHeader>Price Per Day</SimpleHeader>,
    cell: ({ row }: { row: Row<CountryBundleWithDisplay> }) => {
      const data = row.original;
      const isSummaryRow = data.duration === 0;
      
      if (isSummaryRow) {
        return null;
      }
      
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
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
    id: "processing",
    accessorKey: "processingCost",
    header: () => <SimpleHeader>Processing</SimpleHeader>,
    cell: ({ row }: { row: Row<CountryBundleWithDisplay> }) => {
      const data = row.original;
      const isSummaryRow = data.duration === 0;
      
      if (isSummaryRow) {
        return null;
      }
      
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
];