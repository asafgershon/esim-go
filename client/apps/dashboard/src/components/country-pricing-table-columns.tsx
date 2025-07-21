import React from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const formatPercentage = (rate: number) => {
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
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleToggleCountry?.(data.countryId);
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
    header: () => <SimpleHeader>Country</SimpleHeader>,
    cell: ({ row }: { row: Row<CountryBundleWithDisplay> }) => {
      const data = row.original;
      const isSummaryRow = data.duration === 0;
      
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{data.countryName}</span>
          <Badge variant="outline" className="text-xs">
            {data.countryId}
          </Badge>
          {isSummaryRow && data.configurationLevel && data.configurationLevel !== 'GLOBAL' && (
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
              {data.configurationLevel}
            </Badge>
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
            <Badge variant="secondary" className="text-xs">
              {loadedBundles > 0
                ? `${loadedBundles}/${totalBundles} bundles`
                : `${totalBundles} bundles`}
            </Badge>
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
    id: "duration",
    accessorKey: "duration",
    header: () => <SimpleHeader>Duration</SimpleHeader>,
    cell: ({ row }: { row: Row<CountryBundleWithDisplay> }) => {
      const data = row.original;
      const isSummaryRow = data.duration === 0;

      return (
        <div className="flex items-center gap-2">
          {isSummaryRow ? (
            <Clock className="h-4 w-4 text-blue-600 mx-auto" />
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
    header: () => <SimpleHeader>Price / Day</SimpleHeader>,
    cell: ({ row }: { row: Row<CountryBundleWithDisplay> }) => {
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
    header: () => <SimpleHeader>Discount</SimpleHeader>,
    cell: ({ row }: { row: Row<CountryBundleWithDisplay> }) => {
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
    header: () => <SimpleHeader>Costs</SimpleHeader>,
    cell: ({ row }: { row: Row<CountryBundleWithDisplay> }) => {
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
    header: () => <SimpleHeader>Processing</SimpleHeader>,
    cell: ({ row }: { row: Row<CountryBundleWithDisplay> }) => {
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
    header: () => <SimpleHeader>Final Revenue</SimpleHeader>,
    cell: ({ row }: { row: Row<CountryBundleWithDisplay> }) => {
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
];