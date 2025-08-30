import {
  CatalogBundle,
  GetCountryBundlesQuery,
  GetCountryBundlesQueryVariables,
  GetRegionBundlesQuery,
  GetRegionBundlesQueryVariables,
  Provider,
} from "@/__generated__/graphql";
import EsimGoLogo from "@/assets/esimgo.jpeg?url";
import MayaLogo from "@/assets/maya.png?url";
import { GET_COUNTRY_BUNDLES, GET_REGION_BUNDLES } from "@/lib/graphql/queries";
import { useLazyQuery } from "@apollo/client";
import { Badge, BaseFilterState } from "@workspace/ui";
import { Clock, Package, Wifi, WifiOff } from "lucide-react";
import React, { useEffect } from "react";

// Catalog-specific filter state (matching the one in CatalogSplitView)
interface CatalogFilterState extends BaseFilterState {
  bundleGroups: Set<string>;
  durations: Set<string>;
  dataTypes: Set<string>;
  regions?: Set<string>;
}

interface CatalogBundlesTableProps {
  countryId?: string | null;
  regionName?: string | null;
  selectedBundle: CatalogBundle | null;
  onBundleSelect: (bundle: CatalogBundle) => void;
  bundleGroupFilter?: string;
  filterState?: CatalogFilterState;
}

export const CatalogBundlesTable: React.FC<CatalogBundlesTableProps> = ({
  countryId,
  regionName,
  selectedBundle,
  onBundleSelect,
  bundleGroupFilter = "all",
  filterState,
}) => {
  // Lazy queries for loading bundles
  const [getCountryBundles, { data: countryData, loading: countryLoading }] =
    useLazyQuery<GetCountryBundlesQuery, GetCountryBundlesQueryVariables>(
      GET_COUNTRY_BUNDLES
    );

  const [getRegionBundles, { data: regionData, loading: regionLoading }] =
    useLazyQuery<GetRegionBundlesQuery, GetRegionBundlesQueryVariables>(
      GET_REGION_BUNDLES
    );

  // Load bundles when country/region changes
  useEffect(() => {
    if (countryId) {
      getCountryBundles({ variables: { countryId } });
    } else if (regionName) {
      getRegionBundles({ variables: { region: regionName } });
    }
  }, [countryId, regionName, getCountryBundles, getRegionBundles]);

  // Determine which bundles to show
  const bundles = React.useMemo(() => {
    let allBundles: CatalogBundle[] = [];

    if (countryData?.bundlesForCountry?.bundles) {
      allBundles = countryData.bundlesForCountry.bundles as CatalogBundle[];
    } else if (regionData?.bundlesForRegion?.bundles) {
      allBundles = regionData.bundlesForRegion.bundles as CatalogBundle[];
    }

    // Apply filters if filterState is provided
    if (filterState) {
      // Apply bundle group filter
      if (filterState.bundleGroups.size > 0) {
        allBundles = allBundles.filter((bundle) =>
          bundle.groups?.some((g) => filterState.bundleGroups.has(g))
        );
      }

      // Apply duration filter
      if (filterState.durations.size > 0) {
        allBundles = allBundles.filter((bundle) => {
          const duration = bundle.validityInDays;
          return Array.from(filterState.durations).some((filterValue) => {
            switch (filterValue) {
              case "short":
                return duration >= 1 && duration <= 7;
              case "medium":
                return duration >= 8 && duration <= 30;
              case "long":
                return duration >= 31;
              default:
                return false;
            }
          });
        });
      }

      // Apply data type filter
      if (filterState.dataTypes.size > 0) {
        allBundles = allBundles.filter((bundle) => {
          const isUnlimited = bundle.isUnlimited;
          return Array.from(filterState.dataTypes).some((filterValue) => {
            switch (filterValue) {
              case "unlimited":
                return isUnlimited;
              case "limited":
                return !isUnlimited;
              default:
                return false;
            }
          });
        });
      }
    } else if (bundleGroupFilter !== "all") {
      // Fallback to old bundle group filter
      allBundles = allBundles.filter((bundle) =>
        bundle.groups.includes(bundleGroupFilter)
      );
    }

    return allBundles;
  }, [countryData, regionData, bundleGroupFilter, filterState]);

  const isLoading = countryLoading || regionLoading;

  if (!countryId && !regionName) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading bundles...</span>
      </div>
    );
  }

  if (!bundles || bundles.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-gray-500">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-lg">No bundles available</p>
          <p className="text-sm">
            {bundleGroupFilter !== "all"
              ? `No bundles found for group: ${bundleGroupFilter}`
              : "This location has no catalog data available"}
          </p>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  return (
    <div className="flex flex-col h-full overflow-scroll">
      <div className="space-y-1 p-2">
        {bundles.map((bundle, index) => (
          <div
            key={bundle.name || `${bundle.name}-${index}`}
            className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
              selectedBundle?.name === bundle.name
                ? "ring-2 ring-blue-500 bg-blue-50"
                : ""
            }`}
            onClick={() => onBundleSelect(bundle)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-medium">
                      {bundle.name || "Unknown Bundle"}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {bundle.validityInDays || 0} day
                      {(bundle.validityInDays || 0) !== 1 ? "s" : ""} •
                      {bundle.dataAmountReadable}
                      {bundle.groups && bundle.groups.length > 0 && (
                        <span className="inline-flex items-center ml-2">
                          <Badge variant="outline" className="text-xs">
                            {bundle.groups[0]}
                          </Badge>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-semibold">
                  {formatPrice(bundle.basePrice || 0, bundle.currency || "USD")}
                </div>
                <div className="text-sm text-gray-500">
                  {formatPrice(
                    (bundle.basePrice || 0) / (bundle.validityInDays || 1),
                    bundle.currency || "USD"
                  )}
                  /day
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{bundle.validityInDays} days</span>
              </div>

              <div className="flex items-center gap-1">
                {bundle.isUnlimited ? (
                  <Wifi className="h-3 w-3" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
                <span>{bundle.dataAmountReadable}</span>
                {bundle.provider === Provider.EsimGo && (
                  <img
                    src={EsimGoLogo}
                    alt="EsimGo"
                    className="h-4 w-4 rounded-xl"
                  />
                )}
                {bundle.provider === Provider.Maya && (
                  <img
                    src={MayaLogo}
                    alt="Maya"
                    className="h-4 w-4 rounded-xl"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
