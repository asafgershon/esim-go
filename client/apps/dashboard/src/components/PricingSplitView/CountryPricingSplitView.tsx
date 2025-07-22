import React, { useState, useMemo, useCallback } from "react";
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  ScrollArea,
  InputWithAdornment,
  List,
} from "@workspace/ui";
import { TrendingUp, MapPin, Package, X } from "lucide-react";
import { toast } from "sonner";
import Fuse from "fuse.js";
import { Panel, PanelGroup } from "react-resizable-panels";
import { AnimatePresence, motion } from "framer-motion";
import { useHighDemandCountries } from "../../hooks/useHighDemandCountries";
import { ResizeHandle } from "../resize-handle";
import { PricingPreviewPanel } from "./PricingPreviewPanel";
import { BundlesTable } from "./BundlesTable";
import { CountryCard } from "./CountryCard";
import { CommandFilterPalette } from "./filters/CommandFilterPalette";
import { FilterState } from "./filters";
import { CountryPricingSplitViewProps, BundlesByCountryWithBundles, CountryBundleWithDisplay } from "./types";

export function CountryPricingSplitView({
  bundlesByCountry = [],
  onExpandCountry,
  loading = false,
}: CountryPricingSplitViewProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<CountryBundleWithDisplay | null>(null);
  const [loadingCountries, setLoadingCountries] = useState<Set<string>>(new Set());
  const [showHighDemandOnly, setShowHighDemandOnly] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [bundleFilters, setBundleFilters] = useState<FilterState>({
    bundleGroups: new Set(),
    durations: new Set(),
    dataTypes: new Set(),
  });

  // High demand countries functionality
  const {
    isHighDemandCountry,
    toggleCountryHighDemand,
    toggleLoading,
    loading: highDemandLoading,
  } = useHighDemandCountries();

  // Configure Fuse.js for country search
  const countryFuse = useMemo(() => {
    const fuseOptions = {
      keys: [
        'countryName',
        'countryId'
      ],
      threshold: 0.3,
      includeScore: true
    };
    
    return new Fuse(bundlesByCountry, fuseOptions);
  }, [bundlesByCountry]);

  // Filter countries by high demand status and search query
  const filteredBundlesByCountry = useMemo(() => {
    let filtered = bundlesByCountry;
    
    // Apply high demand filter
    if (showHighDemandOnly) {
      filtered = filtered.filter(country => 
        isHighDemandCountry(country.countryId)
      );
    }
    
    // Apply search filter
    if (countrySearchQuery.trim()) {
      const searchResults = countryFuse.search(countrySearchQuery);
      const searchedIds = new Set(searchResults.map(result => result.item.countryId));
      filtered = filtered.filter(country => searchedIds.has(country.countryId));
    }
    
    return filtered;
  }, [bundlesByCountry, showHighDemandOnly, isHighDemandCountry, countrySearchQuery, countryFuse]);

  // Helper function to filter bundles based on selected filters
  const filterBundles = useCallback((bundles: CountryBundleWithDisplay[]) => {
    let filtered = bundles;

    // Filter by bundle groups
    if (bundleFilters.bundleGroups.size > 0) {
      filtered = filtered.filter(bundle => 
        bundle.bundleGroup && bundleFilters.bundleGroups.has(bundle.bundleGroup)
      );
    }

    // Filter by durations
    if (bundleFilters.durations.size > 0) {
      filtered = filtered.filter(bundle => {
        const duration = bundle.duration;
        return Array.from(bundleFilters.durations).some(filterValue => {
          switch (filterValue) {
            case 'short':
              return duration >= 1 && duration <= 7;
            case 'medium':
              return duration >= 8 && duration <= 30;
            case 'long':
              return duration >= 31;
            default:
              return false;
          }
        });
      });
    }

    // Filter by data types
    if (bundleFilters.dataTypes.size > 0) {
      filtered = filtered.filter(bundle => {
        const isUnlimited = bundle.isUnlimited;
        return Array.from(bundleFilters.dataTypes).some(filterValue => {
          switch (filterValue) {
            case 'unlimited':
              return isUnlimited;
            case 'limited':
              return !isUnlimited;
            default:
              return false;
          }
        });
      });
    }

    return filtered;
  }, [bundleFilters]);

  // Get selected country data with filtered bundles
  const selectedCountryData = useMemo(() => {
    if (!selectedCountry) return null;
    const country = filteredBundlesByCountry.find(country => country.countryId === selectedCountry);
    if (!country || !country.bundles) return country;

    // Apply bundle filters
    const filteredBundles = filterBundles(country.bundles);
    
    return {
      ...country,
      bundles: filteredBundles,
      originalBundles: country.bundles, // Keep original bundles for count
    };
  }, [selectedCountry, filteredBundlesByCountry, filterBundles]);

  // Handle country selection
  const handleCountrySelect = useCallback(async (countryId: string) => {
    const country = filteredBundlesByCountry.find(c => c.countryId === countryId);
    if (!country) return;

    setSelectedCountry(countryId);
    setSelectedBundle(null); // Clear selected bundle when changing country
    
    // If country doesn't have bundles loaded, load them
    if (!country.bundles) {
      setLoadingCountries(prev => new Set(prev).add(countryId));
      
      try {
        await onExpandCountry(countryId);
      } catch (error) {
        console.error("Error loading bundles for country:", countryId, error);
        toast.error(`Failed to load bundles for ${country.countryName}. Please try again.`);
      } finally {
        setLoadingCountries(prev => {
          const next = new Set(prev);
          next.delete(countryId);
          return next;
        });
      }
    }

    // On mobile, open the bottom sheet
    if (window.innerWidth < 1024) {
      setShowMobileSheet(true);
    }
  }, [filteredBundlesByCountry, onExpandCountry]);

  // Get summary info for a country
  const getCountrySummary = (country: BundlesByCountryWithBundles) => {
    if (!country.bundles) {
      return {
        count: country.bundleCount || 0,
        range: "Not loaded",
        status: "pending" as const,
      };
    }

    const bundles = country.bundles;
    const count = bundles.length;
    const prices = bundles.map(bundle => bundle.priceAfterDiscount || 0).filter(price => price > 0);
    
    if (prices.length === 0) {
      return {
        count,
        range: "No pricing data",
        status: "loaded" as const,
      };
    }
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return {
      count,
      range: minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`,
      status: "loaded" as const,
    };
  };

  // Set default selected country (first country or null if none exist)
  React.useEffect(() => {
    if (!selectedCountry && filteredBundlesByCountry.length > 0) {
      setSelectedCountry(filteredBundlesByCountry[0].countryId);
    }
  }, [filteredBundlesByCountry, selectedCountry]);

  return (
    <div className="h-full flex flex-col">
      {/* Command Palette Filter Controls - Always show */}
      <div className="flex-shrink-0 mb-4">
        <CommandFilterPalette
          selectedFilters={bundleFilters}
          onFiltersChange={setBundleFilters}
          totalBundles={selectedCountryData?.originalBundles?.length || selectedCountryData?.bundles?.length || 0}
          filteredBundles={selectedCountryData?.bundles?.length || 0}
          showHighDemandOnly={showHighDemandOnly}
          onHighDemandToggle={() => setShowHighDemandOnly(!showHighDemandOnly)}
          totalCountries={filteredBundlesByCountry.length}
          hasBundlesSelected={!!selectedCountryData?.bundles}
        />
      </div>

      {/* Desktop: Resizable Panels, Mobile: Single Column */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Desktop Layout with Resizable Panels */}
        <PanelGroup 
          direction="horizontal" 
          className="hidden lg:flex h-full transition-all duration-300"
          autoSaveId="country-pricing-layout"
        >
          {/* Countries Panel */}
          <Panel 
            defaultSize={25} 
            minSize={15} 
            maxSize={40}
            id="countries-panel"
            order={1}
          >
            <List.Container className="h-full" itemCount={filteredBundlesByCountry.length}>
              <List.Header title="Countries" />
              <List.Search
                value={countrySearchQuery}
                onChange={setCountrySearchQuery}
                placeholder="Search countries..."
              />
              <List.Content spacing="normal" padding={false}>
                <div className="p-2">
                  {filteredBundlesByCountry.length === 0 && countrySearchQuery ? (
                    <List.Empty
                      icon={<MapPin className="h-8 w-8 mx-auto text-gray-300" />}
                      message={`No countries found matching "${countrySearchQuery}"`}
                    />
                  ) : filteredBundlesByCountry.length === 0 && !countrySearchQuery ? (
                    <List.Empty
                      icon={<MapPin className="h-12 w-12 mx-auto text-gray-300" />}
                      title="No countries available"
                      message={
                        showHighDemandOnly 
                          ? "No high demand countries found" 
                          : "No pricing data available"
                      }
                    />
                  ) : (
                    filteredBundlesByCountry.map((country) => {
                      const summary = getCountrySummary(country);
                      const isSelected = selectedCountry === country.countryId;
                      const isCountryLoading = loadingCountries.has(country.countryId);
                      
                      return (
                        <List.Item key={country.countryId} asChild>
                          <CountryCard
                            country={country}
                            isSelected={isSelected}
                            isLoading={isCountryLoading}
                            isHighDemand={isHighDemandCountry(country.countryId)}
                            onSelect={() => handleCountrySelect(country.countryId)}
                            onToggleHighDemand={(e) => {
                              e.stopPropagation();
                              toggleCountryHighDemand(country.countryId);
                            }}
                            toggleLoading={toggleLoading}
                            summary={summary}
                          />
                        </List.Item>
                      );
                    })
                  )}
                </div>
              </List.Content>
            </List.Container>
          </Panel>

          <ResizeHandle />

          {/* Bundles Panel */}
          <Panel 
            defaultSize={35} 
            minSize={25}
            id="bundles-panel"
            order={2}
          >
            <div className="h-full flex flex-col">
              {/* Bundles Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-3 flex-shrink-0">
                <h3 className="text-sm font-medium text-gray-700">
                  Bundles ({selectedCountryData?.bundles?.length || 0})
                </h3>
              </div>
              
              <motion.div 
                className="flex-1 flex flex-col min-h-0"
                layout
                transition={{
                  layout: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }
                }}
              >
                {selectedCountryData ? (
                  <div className="flex-1 min-h-0">
                    <BundlesTable 
                      country={selectedCountryData} 
                      showHeader={false}
                      loadingCountries={loadingCountries}
                      selectedBundle={selectedBundle}
                      onBundleSelect={setSelectedBundle}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="mb-4">
                        <Package className="h-12 w-12 mx-auto text-gray-300" />
                      </div>
                      <p className="text-lg">Select a Country</p>
                      <p className="text-sm">Click on a country from the list to view its bundles</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </Panel>

          {/* Preview Panel - With smooth transitions */}
          <AnimatePresence>
            {selectedBundle && (
              <motion.div
                key="preview-panel-group"
                initial={{ width: 0 }}
                animate={{ width: "auto" }}
                exit={{ width: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8
                }}
                style={{ display: "flex", overflow: "hidden" }}
              >
                <ResizeHandle />
                <Panel 
                  defaultSize={40} 
                  minSize={30}
                  maxSize={50}
                  id="preview-panel"
                  order={3}
                >
                  <div className="h-full flex flex-col">
                    {/* Preview Header */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-3 flex-shrink-0 group">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700">Preview</h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedBundle(null)}
                                className="h-6 w-6 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Close preview</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col">
                      <PricingPreviewPanel 
                      bundle={selectedBundle} 
                      onClose={() => setSelectedBundle(null)}
                      onConfigurationSaved={() => {
                        // Refetch bundle data when configuration is saved
                        if (selectedCountry) {
                          onExpandCountry(selectedCountry);
                        }
                      }}
                    />
                    </div>
                  </div>
                </Panel>
              </motion.div>
            )}
          </AnimatePresence>
        </PanelGroup>

        {/* Mobile Layout - Countries List */}
        <div className="lg:hidden h-full">
          <List.Container className="h-full">
            <List.Search
              value={countrySearchQuery}
              onChange={setCountrySearchQuery}
              placeholder="Search countries..."
              className="p-4"
            />
            <List.Content spacing="normal">
              {filteredBundlesByCountry.length === 0 && countrySearchQuery ? (
                <List.Empty
                  icon={<MapPin className="h-8 w-8 mx-auto text-gray-300" />}
                  message={`No countries found matching "${countrySearchQuery}"`}
                />
              ) : filteredBundlesByCountry.length === 0 && !countrySearchQuery ? (
                <List.Empty
                  icon={<MapPin className="h-12 w-12 mx-auto text-gray-300" />}
                  title="No countries available"
                  message={
                    showHighDemandOnly ? "No high demand countries found" : "No pricing data available"
                  }
                />
              ) : (
                filteredBundlesByCountry.map((country) => {
                  const summary = getCountrySummary(country);
                  const isSelected = selectedCountry === country.countryId;
                  const isCountryLoading = loadingCountries.has(country.countryId);
                  
                  return (
                    <List.Item key={country.countryId} asChild>
                      <CountryCard
                        country={country}
                        isSelected={isSelected}
                        isLoading={isCountryLoading}
                        isHighDemand={isHighDemandCountry(country.countryId)}
                        onSelect={() => handleCountrySelect(country.countryId)}
                        onToggleHighDemand={(e) => {
                          e.stopPropagation();
                          toggleCountryHighDemand(country.countryId);
                        }}
                        toggleLoading={toggleLoading}
                        summary={summary}
                      />
                    </List.Item>
                  );
                })
              )}
            </List.Content>
          </List.Container>
        </div>
      </div>

      {/* Mobile: Bottom Sheet */}
      <Sheet open={showMobileSheet} onOpenChange={setShowMobileSheet}>
        <SheetContent side="bottom" className="fixed bottom-0 left-0 right-0 max-h-[85vh] z-50 bg-background border-t rounded-t-lg">
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle className="text-left">
              {selectedCountryData?.countryName || "Country Bundles"}
            </SheetTitle>
            <SheetDescription className="text-left">
              Available eSIM bundles and pricing
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="px-6 pb-6 flex-1 max-h-[calc(85vh-120px)]" showOnHover={true}>
            {selectedCountryData && (
              <BundlesTable 
                country={selectedCountryData} 
                showHeader={false}
                loadingCountries={loadingCountries}
                selectedBundle={selectedBundle}
                onBundleSelect={setSelectedBundle}
              />
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}