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
} from "@workspace/ui";
import { TrendingUp, MapPin, Package, X } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelGroup } from "react-resizable-panels";
import { AnimatePresence, motion } from "framer-motion";
import { useHighDemandCountries } from "../../hooks/useHighDemandCountries";
import { ResizeHandle } from "../resize-handle";
import { PricingPreviewPanel } from "./PricingPreviewPanel";
import { BundlesTable } from "./BundlesTable";
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

  // High demand countries functionality
  const {
    isHighDemandCountry,
    toggleCountryHighDemand,
    toggleLoading,
    loading: highDemandLoading,
  } = useHighDemandCountries();

  // Filter countries by high demand status if needed
  const filteredBundlesByCountry = useMemo(() => {
    if (!showHighDemandOnly) {
      return bundlesByCountry;
    }
    
    return bundlesByCountry.filter(country => 
      isHighDemandCountry(country.countryId)
    );
  }, [bundlesByCountry, showHighDemandOnly, isHighDemandCountry]);

  // Get selected country data
  const selectedCountryData = useMemo(() => {
    if (!selectedCountry) return null;
    return filteredBundlesByCountry.find(country => country.countryId === selectedCountry);
  }, [selectedCountry, filteredBundlesByCountry]);

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
      {/* High Demand Filter Controls */}
      <div className="flex-shrink-0 flex items-center gap-4 mb-4">
        <Button
          variant={showHighDemandOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowHighDemandOnly(!showHighDemandOnly)}
          disabled={highDemandLoading}
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          {showHighDemandOnly ? 'Show All Countries' : 'Show High Demand Only'}
        </Button>
        
        {showHighDemandOnly && (
          <span className="text-sm text-gray-500">
            Showing {filteredBundlesByCountry.length} high demand countries
          </span>
        )}
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
            <div className="h-full flex flex-col">
              {/* Countries Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-3 flex-shrink-0">
                <h3 className="text-sm font-medium text-gray-700">Countries ({filteredBundlesByCountry.length})</h3>
              </div>
              <ScrollArea className="flex-1 pr-2" showOnHover={true}>
                <div className="space-y-1 p-2">
              {/* Country Cards */}
              {filteredBundlesByCountry.map((country) => {
                const summary = getCountrySummary(country);
                const isSelected = selectedCountry === country.countryId;
                const isCountryLoading = loadingCountries.has(country.countryId);
                
                return (
                  <Card 
                    key={country.countryId} 
                    className={`group hover:shadow-md transition-all cursor-pointer ${
                      isSelected 
                        ? 'lg:ring-2 lg:ring-blue-500 lg:border-blue-500 lg:bg-blue-50' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => handleCountrySelect(country.countryId)}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-base flex items-center justify-between">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-2 cursor-default">
                                <MapPin className="h-4 w-4" />
                                {country.countryName || country.countryId}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Country: {country.countryName || 'Unknown'}</p>
                              <p>Code: {country.countryId}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        {/* High Demand Toggle Button */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-6 w-6 p-0 transition-opacity ${
                                  isHighDemandCountry(country.countryId) 
                                    ? 'opacity-100' 
                                    : 'opacity-0 group-hover:opacity-100'
                                } hover:bg-orange-50`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCountryHighDemand(country.countryId);
                                }}
                                disabled={toggleLoading}
                              >
                                <TrendingUp className="h-4 w-4 text-orange-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {isHighDemandCountry(country.countryId) 
                                  ? 'Remove from high demand' 
                                  : 'Mark as high demand'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {isCountryLoading ? (
                          <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            Loading bundles...
                          </span>
                        ) : (
                          `${summary.count} bundles • ${summary.range}`
                        )}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}

              {filteredBundlesByCountry.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-lg">No countries available</p>
                  <p className="text-sm">
                    {showHighDemandOnly 
                      ? "No high demand countries found" 
                      : "No pricing data available"
                    }
                  </p>
                </div>
              )}
                </div>
              </ScrollArea>
            </div>
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
        <div className="lg:hidden h-full flex flex-col">
          <ScrollArea className="flex-1" showOnHover={true}>
            <div className="space-y-3 p-4">
              {/* Country Cards for Mobile */}
              {filteredBundlesByCountry.map((country) => {
                const summary = getCountrySummary(country);
                const isSelected = selectedCountry === country.countryId;
                const isCountryLoading = loadingCountries.has(country.countryId);
                
                return (
                  <Card 
                    key={country.countryId} 
                    className={`group hover:shadow-md transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                    }`}
                    onClick={() => handleCountrySelect(country.countryId)}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {country.countryName || country.countryId}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 transition-opacity ${
                            isHighDemandCountry(country.countryId) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          } hover:bg-orange-50`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCountryHighDemand(country.countryId);
                          }}
                          disabled={toggleLoading}
                        >
                          <TrendingUp className="h-4 w-4 text-orange-500" />
                        </Button>
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {isCountryLoading ? (
                          <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            Loading bundles...
                          </span>
                        ) : (
                          `${summary.count} bundles • ${summary.range}`
                        )}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}

              {filteredBundlesByCountry.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-lg">No countries available</p>
                  <p className="text-sm">
                    {showHighDemandOnly ? "No high demand countries found" : "No pricing data available"}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
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