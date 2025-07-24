import { CountryBundle } from "@/__generated__/graphql";
import { ScrollArea } from "@workspace/ui";
import { Package } from "lucide-react";
import React from "react";
import { BundlesByCountryWithBundles } from "./types";

interface BundlesTableProps {
  country: BundlesByCountryWithBundles;
  loadingCountries: Set<string>;
  selectedBundle: CountryBundle | null;
  onBundleSelect: (bundle: CountryBundle) => void;
}

export const BundlesTable: React.FC<BundlesTableProps> = ({
  country,
  loadingCountries,
  selectedBundle,
  onBundleSelect,
}) => {
  const isCountryLoading = loadingCountries.has(country.country.iso);

  if (isCountryLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading bundles...</span>
      </div>
    );
  }

  if (!country.bundles || country.bundles.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-gray-500">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-lg">No bundles available</p>
          <p className="text-sm">This country has no pricing data available</p>
        </div>
      </div>
    );
  }

  const sortedBundles = [...country.bundles].sort(
    (a, b) => (a.duration || 0) - (b.duration || 0)
  );

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1" showOnHover={true}>
        <div className="space-y-1 p-2">
          {sortedBundles.map((bundle, index) => (
            <div
              key={
                bundle.name
                  ? `${bundle.name}-${bundle.duration}`
                  : `bundle-${index}`
              }
              className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedBundle === bundle
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
                        {bundle.duration || 0} day
                        {(bundle.duration || 0) !== 1 ? "s" : ""} •
                        {bundle.data && ` ${bundle.data} • `}
                        {bundle.group && (
                          <span className="inline-flex items-center">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full mr-2">
                              {bundle.group}
                            </span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          Cost: $
                          {(bundle.pricingBreakdown?.cost || 0).toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold text-blue-600">
                    ${(bundle.pricingBreakdown?.cost || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
