import React from "react";
import { ScrollArea } from "@workspace/ui";
import { Package } from "lucide-react";
import { ConfigurationLevelIndicator } from "../configuration-level-indicator";
import { BundlesByCountryWithBundles, CountryBundleWithDisplay } from "./types";

interface BundlesTableProps {
  country: BundlesByCountryWithBundles;
  showHeader?: boolean;
  loadingCountries: Set<string>;
  selectedBundle: CountryBundleWithDisplay | null;
  onBundleSelect: (bundle: CountryBundleWithDisplay) => void;
}

export const BundlesTable: React.FC<BundlesTableProps> = ({ 
  country, 
  showHeader = true, 
  loadingCountries,
  selectedBundle,
  onBundleSelect
}) => {
  const isCountryLoading = loadingCountries.has(country.countryId);
  
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

  const sortedBundles = [...country.bundles].sort((a, b) => (a.duration || 0) - (b.duration || 0));

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1" showOnHover={true}>
        <div className="space-y-1 p-2">
          {sortedBundles.map((bundle, index) => (
            <div
              key={bundle.bundleName ? `${bundle.bundleName}-${bundle.duration}` : `bundle-${index}`}
              className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedBundle === bundle ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => onBundleSelect(bundle)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-medium">{bundle.bundleName || 'Unknown Bundle'}</h4>
                      <p className="text-sm text-gray-500">
                        {bundle.duration || 0} day{(bundle.duration || 0) !== 1 ? 's' : ''} • 
                        {bundle.dataAmount && ` ${bundle.dataAmount} • `}
                        <span className="inline-flex items-center gap-1">
                          Cost: ${(bundle.cost || 0).toFixed(2)}
                          <ConfigurationLevelIndicator 
                            level={bundle.configurationLevel} 
                            size="xs" 
                            showTooltip 
                          />
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold text-blue-600">
                    ${(bundle.priceAfterDiscount || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    ${(bundle.pricePerDay || 0).toFixed(2)}/day
                  </div>
                </div>
              </div>
              
              {bundle.hasCustomDiscount && (
                <div className="mt-2 pt-2 border-t">
                  <div className="text-xs text-orange-600">
                    Custom pricing configuration applied
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};