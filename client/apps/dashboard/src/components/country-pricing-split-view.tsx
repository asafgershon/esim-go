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
  Badge,
  Separator,
} from "@workspace/ui";
import { TrendingUp, MapPin, Package, Info, X, Layers, Globe, AlertCircle, Calculator, DollarSign, TrendingDown, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelGroup } from "react-resizable-panels";
import { AnimatePresence, motion } from "framer-motion";
import { BundlesByCountry, CountryBundle } from "../__generated__/graphql";
import { useHighDemandCountries } from "../hooks/useHighDemandCountries";
import { ResizeHandle } from "./resize-handle";

// Extended types for additional display fields
export interface CountryBundleWithDisplay extends CountryBundle {
  pricePerDay: number;
  hasCustomDiscount: boolean;
  configurationLevel?: string;
  discountPerDay?: number;
  dataAmount?: string;
}

export interface BundlesByCountryWithBundles extends BundlesByCountry {
  bundles?: CountryBundleWithDisplay[];
}

interface CountryPricingSplitViewProps {
  bundlesByCountry: BundlesByCountryWithBundles[];
  onExpandCountry: (countryId: string) => Promise<void>;
  loading?: boolean;
}

// Pricing Preview Panel Component
const PricingPreviewPanel = ({ 
  bundle, 
  onClose 
}: { 
  bundle: CountryBundleWithDisplay;
  onClose: () => void;
}) => {
  // Default values for calculations
  const discountRate = 0.3; // 30% discount
  const processingRate = 0.045; // 4.5% processing fee
  const discountPerDay = bundle.discountPerDay || 0.1; // 10% per day default

  // Calculate pricing breakdown
  const cost = bundle.cost || 0;
  const costPlus = bundle.costPlus || 0;
  const totalCost = cost + costPlus;
  const discountValue = totalCost * discountRate;
  const priceAfterDiscount = totalCost - discountValue;
  const processingCost = priceAfterDiscount * processingRate;
  const revenueAfterProcessing = priceAfterDiscount - processingCost;
  const finalRevenue = revenueAfterProcessing - totalCost;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return (rate * 100).toFixed(1) + "%";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-white border-b pb-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Preview & Analysis</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Close preview</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <ScrollArea className="flex-1" showOnHover={true}>
        <div className="space-y-4 pb-4">
          {/* Bundle Information */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Bundle Information
            </h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>Bundle:</strong> {bundle.bundleName}
              </p>
              <p>
                <strong>Country:</strong> {bundle.countryName}
              </p>
              <p>
                <strong>Duration:</strong> {bundle.duration} days
              </p>
              {bundle.dataAmount && (
                <p>
                  <strong>Data:</strong> {bundle.dataAmount}
                </p>
              )}
              <p>
                <strong>eSIM Go Cost:</strong> {formatCurrency(cost)}
              </p>
              <p>
                <strong>Our Markup:</strong> {formatCurrency(costPlus)}
                {bundle.hasCustomDiscount && (
                  <span className="text-orange-600 ml-1">(Custom)</span>
                )}
              </p>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Price Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>eSIM Go Cost:</span>
                <span>{formatCurrency(cost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Our Markup:</span>
                <span className={bundle.hasCustomDiscount ? "text-orange-600 font-medium" : ""}>
                  {formatCurrency(costPlus)}
                  {bundle.hasCustomDiscount && (
                    <span className="text-xs ml-1">(Custom)</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Total Cost:</span>
                <span>{formatCurrency(totalCost)}</span>
              </div>

              <div className="flex justify-between">
                <span>
                  Customer Discount ({formatPercentage(discountRate)}):
                </span>
                <span className="text-green-600">
                  -{formatCurrency(discountValue)}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Price After Discount:</span>
                <span className="text-blue-600">
                  {formatCurrency(priceAfterDiscount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>
                  Processing ({formatPercentage(processingRate)}):
                </span>
                <span className="text-yellow-600">
                  -{formatCurrency(processingCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Revenue After Processing:</span>
                <span>{formatCurrency(revenueAfterProcessing)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Final Revenue (Profit):</span>
                <span className={finalRevenue > 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(finalRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Profit Analysis */}
          <div className="bg-gray-100 p-3 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Profit Analysis</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p>
                <strong>Profit Margin:</strong>{" "}
                {finalRevenue > 0 ? "+" : ""}
                {((finalRevenue / totalCost) * 100).toFixed(1)}%
              </p>
              <p>
                <strong>Break-even Price:</strong>{" "}
                {formatCurrency(totalCost + processingCost + 0.01)}
              </p>
              <p>
                <strong>Current Price:</strong>{" "}
                {formatCurrency(bundle.priceAfterDiscount || 0)}
              </p>
            </div>
          </div>

          {/* Discount Per Day Info */}
          {discountPerDay > 0 && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-yellow-600" />
                <h4 className="text-sm font-medium text-yellow-900">
                  Unused Days Discount
                </h4>
              </div>
              <p className="text-sm text-yellow-800">
                {formatPercentage(discountPerDay)} discount per unused day
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Example: 5 unused days = {formatPercentage(discountPerDay * 5)} discount
              </p>
            </div>
          )}

          {/* Configuration Status */}
          {bundle.hasCustomDiscount && (
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">
                  Custom Configuration Active
                </span>
              </div>
              <p className="text-xs text-orange-700 mt-1">
                This bundle has custom pricing rules applied
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

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

  // Bundles table component (reused in both desktop and mobile)
  const BundlesTable = ({ country, showHeader = true }: { country: BundlesByCountryWithBundles, showHeader?: boolean }) => {
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
        {showHeader && (
          <div className="sticky top-0 z-10 bg-white border-b pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {country.countryName || country.countryId}
                </h3>
                <p className="text-sm text-gray-600">
                  {sortedBundles.length} bundles available
                </p>
              </div>
            </div>
          </div>
        )}
        
        <ScrollArea className="flex-1" showOnHover={true}>
          <div className="space-y-2 pb-4">
            {sortedBundles.map((bundle, index) => (
              <div
                key={bundle.bundleName ? `${bundle.bundleName}-${bundle.duration}` : `bundle-${index}`}
                className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedBundle === bundle ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedBundle(bundle)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-medium">{bundle.bundleName || 'Unknown Bundle'}</h4>
                        <p className="text-sm text-gray-500">
                          {bundle.duration || 0} day{(bundle.duration || 0) !== 1 ? 's' : ''} • 
                          {bundle.dataAmount && ` ${bundle.dataAmount} • `}
                          Cost: ${(bundle.cost || 0).toFixed(2)}
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
            <div className="h-full flex flex-col pr-2">
              <ScrollArea className="flex-1" showOnHover={true}>
                <div className="space-y-3 pt-2 pb-4">
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
            defaultSize={40} 
            minSize={30}
            id="bundles-panel"
            order={2}
          >
            <motion.div 
              className="h-full flex flex-col px-2"
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
                <BundlesTable country={selectedCountryData} showHeader={true} />
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
                  defaultSize={35} 
                  minSize={25}
                  id="preview-panel"
                  order={3}
                >
                  <div className="h-full flex flex-col pl-2">
                    <PricingPreviewPanel 
                      bundle={selectedBundle} 
                      onClose={() => setSelectedBundle(null)}
                    />
                  </div>
                </Panel>
              </motion.div>
            )}
          </AnimatePresence>
        </PanelGroup>

        {/* Mobile Layout - Countries List */}
        <div className="lg:hidden h-full flex flex-col">
          <ScrollArea className="flex-1" showOnHover={true}>
            <div className="space-y-3 pt-2 pb-4 px-4">
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
              <BundlesTable country={selectedCountryData} showHeader={false} />
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}