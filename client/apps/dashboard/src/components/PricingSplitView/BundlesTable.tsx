import React, { useState, useMemo } from "react";
import { ScrollArea, InputWithAdornment } from "@workspace/ui";
import { Package, Search } from "lucide-react";
import Fuse from "fuse.js";
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
  const [searchQuery, setSearchQuery] = useState("");
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

  // Configure Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    if (!country.bundles) return null;
    
    const fuseOptions = {
      keys: [
        'bundleName',
        'duration',
        'dataAmount',
        'countryName'
      ],
      threshold: 0.3, // Adjust for sensitivity (0 = exact match, 1 = match anything)
      includeScore: true
    };
    
    return new Fuse(country.bundles, fuseOptions);
  }, [country.bundles]);

  // Filter bundles based on search query
  const filteredBundles = useMemo(() => {
    if (!country.bundles) return [];
    
    const sorted = [...country.bundles].sort((a, b) => (a.duration || 0) - (b.duration || 0));
    
    if (!searchQuery.trim() || !fuse) {
      return sorted;
    }
    
    const results = fuse.search(searchQuery);
    return results.map(result => result.item);
  }, [country.bundles, searchQuery, fuse]);

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-2 border-b">
        <InputWithAdornment
          type="text"
          placeholder="Search bundles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftAdornment={<Search className="h-4 w-4 text-gray-400" />}
          className="w-full"
        />
      </div>
      
      <ScrollArea className="flex-1" showOnHover={true}>
        <div className="space-y-1 p-2">
          {filteredBundles.length === 0 && searchQuery ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm">No bundles found matching "{searchQuery}"</p>
            </div>
          ) : (
            filteredBundles.map((bundle, index) => (
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
          ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};