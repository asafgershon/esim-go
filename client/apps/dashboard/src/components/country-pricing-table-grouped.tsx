import React, { useState, useMemo, useCallback, useRef } from "react";
import { AdvancedDataTable } from "@workspace/ui/components/advanced-data-table";
import { createTableBuilder } from "@workspace/ui/components/table-builder";
import { toast } from "sonner";
import { BundlesByCountry, CountryBundle } from "../__generated__/graphql";
import { createCountryPricingColumns } from "./country-pricing-table-columns";

// Extended types for additional display fields
export interface CountryBundleWithDisplay extends CountryBundle {
  pricePerDay: number;
  hasCustomDiscount: boolean;
  configurationLevel?: string; // ConfigurationLevel enum: GLOBAL | REGION | COUNTRY | BUNDLE
}

export interface BundlesByCountryWithBundles extends BundlesByCountry {
  bundles?: CountryBundleWithDisplay[];
  configurationLevel?: string; // ConfigurationLevel enum: GLOBAL | REGION | COUNTRY | BUNDLE
}

interface CountryPricingTableGroupedProps {
  bundlesByCountry: BundlesByCountryWithBundles[];
  onBundleClick?: (bundle: CountryBundleWithDisplay) => void;
  onExpandCountry: (countryId: string) => Promise<void>;
}

// Transform data for table consumption - show both country summaries and expanded bundles
const transformDataForTable = (
  bundlesByCountry: BundlesByCountryWithBundles[],
  expandedCountries: Set<string>
) => {
  const flatData: CountryBundleWithDisplay[] = [];

  // Safety check for undefined data
  if (!bundlesByCountry || !Array.isArray(bundlesByCountry)) {
    return flatData;
  }

  bundlesByCountry.forEach((country) => {
    // Always add summary row first using aggregated data
    flatData.push({
      bundleName: `${country.countryName} Summary`,
      countryName: country.countryName,
      countryId: country.countryId,
      duration: 0, // Special indicator for summary row
      cost: country.avgCost,
      costPlus: country.avgCostPlus,
      totalCost: country.avgTotalCost,
      discountRate: country.avgDiscountRate,
      discountValue: country.totalDiscountValue,
      priceAfterDiscount: country.avgFinalRevenue, // Using final revenue as the price after all adjustments
      processingRate: country.avgProcessingRate,
      processingCost: country.avgProcessingCost,
      finalRevenue: country.avgFinalRevenue,
      netProfit: country.avgNetProfit,
      currency: "USD",
      pricePerDay: country.avgPricePerDay,
      hasCustomDiscount: country.hasCustomDiscount,
      configurationLevel: country.configurationLevel,
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
          // pricePerDay and hasCustomDiscount now come from the backend
          hasCustomDiscount: country.hasCustomDiscount,
        });
      });
    }
  });

  return flatData;
};

export function CountryPricingTableGrouped({
  bundlesByCountry = [],
  onBundleClick,
  onExpandCountry,
}: CountryPricingTableGroupedProps) {
  const [loadingCountries, setLoadingCountries] = useState<Set<string>>(
    new Set()
  );
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set()
  );

  // Handle expand/collapse country - completely synchronous to avoid setState during render
  const handleToggleCountry = useCallback(
    (countryId: string) => {
      const country = bundlesByCountry?.find((c) => c.countryId === countryId);

      // If country is already expanded, collapse it
      setExpandedCountries((prevExpanded) => {
        if (prevExpanded.has(countryId)) {
          const next = new Set(prevExpanded);
          next.delete(countryId);
          return next;
        }
        
        // If country has bundles, just expand it
        if (country?.bundles) {
          return new Set(prevExpanded).add(countryId);
        }
        
        // If country doesn't have bundles, schedule loading asynchronously
        if (country && !country.bundles) {
          setLoadingCountries((prev) => new Set(prev).add(countryId));
          
          // Schedule async operation for next tick
          setTimeout(() => {
            onExpandCountry(countryId)
              .then(() => {
                setExpandedCountries((prev) => new Set(prev).add(countryId));
              })
              .catch((error) => {
                console.error("Error loading bundles for country:", countryId, error);
                toast.error(
                  `Failed to load bundles for ${country.countryName}. Please try again.`
                );
              })
              .finally(() => {
                setLoadingCountries((prev) => {
                  const next = new Set(prev);
                  next.delete(countryId);
                  return next;
                });
              });
          }, 0);
        }
        
        return prevExpanded;
      });
    },
    [bundlesByCountry, onExpandCountry] // Proper dependencies
  );


  // Transform data for table - stable memoization
  const tableData = useMemo(
    () => transformDataForTable(bundlesByCountry, expandedCountries),
    [bundlesByCountry, expandedCountries]
  );


  // Prevent double-clicking with a ref
  const isHandlingClick = useRef(false);

  // Handle row click with useCallback for stability
  const handleRowClick = useCallback((row: any) => {
    // Prevent double-clicks that could cause issues
    if (isHandlingClick.current) {
      console.log("Ignoring duplicate click");
      return;
    }
    
    try {
      const data = row?.original;
      if (data && data.duration !== 0) {
        isHandlingClick.current = true;
        console.log("Row clicked, opening drawer for:", data);
        
        // Create a stable, serializable version of the data to prevent drawer infinite loops
        const stableData = {
          bundleName: data.bundleName,
          countryName: data.countryName,
          countryId: data.countryId,
          duration: data.duration,
          cost: data.cost,
          costPlus: data.costPlus,
          totalCost: data.totalCost,
          discountRate: data.discountRate,
          discountValue: data.discountValue,
          priceAfterDiscount: data.priceAfterDiscount,
          processingRate: data.processingRate,
          processingCost: data.processingCost,
          finalRevenue: data.finalRevenue,
          netProfit: data.netProfit,
          currency: data.currency,
          pricePerDay: data.pricePerDay,
          hasCustomDiscount: data.hasCustomDiscount,
          configurationLevel: data.configurationLevel,
        };
        
        console.log("Passing stable data to drawer:", stableData);
        
        // Call the drawer with stable data - parent handles state management
        console.log("Table: calling onBundleClick with stable data");
        onBundleClick?.(stableData);
        
        // Reset the click guard
        setTimeout(() => {
          isHandlingClick.current = false;
        }, 100);
      }
    } catch (error) {
      console.error("Row click error:", error);
      isHandlingClick.current = false;
    }
  }, [onBundleClick]);

  // Create table configuration - static with inline columns to avoid dependency cycles
  const { columns: enhancedColumns, plugins } = useMemo(
    () =>
      createTableBuilder(createCountryPricingColumns())
        .addColumnPinning({
          initialPinnedColumns: {
            left: ["expand", "country"],
          },
          enablePinningUI: false,
          pinnedColumnStyles: {
            backgroundColor: "rgb(249 250 251)",
            borderColor: "rgb(229 231 235)",
            zIndex: 2,
          },
        })
        // Remove grouping plugin since we have custom summary rows
        .addFiltering({
          globalSearch: true,
          globalSearchPlaceholder: "Search countries and bundles...",
          columnFilters: {},
          enableQuickFilters: false,
          quickFilters: [],
        })
        .build(),
    [] // No dependencies - completely static
  );

  return (
    <div className="space-y-4">
      <AdvancedDataTable
        columns={enhancedColumns}
        data={tableData}
        plugins={plugins}
        // No grouping prop - we use custom summary rows instead
        enablePagination={true}
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50, 100, 200]}
        onRowClick={handleRowClick}
        emptyMessage="No pricing data available"
        className="country-pricing-table-grouped"
        // Pass only dynamic data through meta - memoized to prevent recreation
        meta={useMemo(() => ({
          expandedCountries,
          loadingCountries,
          bundlesByCountry,
          handleToggleCountry,
          onBundleClick,
        }), [expandedCountries, loadingCountries, bundlesByCountry, handleToggleCountry, onBundleClick])}
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