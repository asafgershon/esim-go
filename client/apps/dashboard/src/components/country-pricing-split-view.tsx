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
  InputWithAdornment,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui";
import { TrendingUp, MapPin, Package, Info, X, AlertCircle, DollarSign, TrendingDown, CreditCard, Edit3, Check, Percent, Wallet, Smartphone, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelGroup } from "react-resizable-panels";
import { AnimatePresence, motion } from "framer-motion";
import { BundlesByCountry, CountryBundle } from "../__generated__/graphql";
import { useHighDemandCountries } from "../hooks/useHighDemandCountries";
import { ResizeHandle } from "./resize-handle";
import { ConfigurationLevelIndicator } from "./configuration-level-indicator";
import { useMutation } from "@apollo/client";
import { UPDATE_PRICING_CONFIGURATION, GET_COUNTRY_BUNDLES } from "../lib/graphql/queries";

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
  onClose,
  onConfigurationSaved
}: { 
  bundle: CountryBundleWithDisplay;
  onClose: () => void;
  onConfigurationSaved?: () => void;
}) => {
  // Mutations
  const [updatePricingConfiguration, { loading: savingConfig }] = useMutation(UPDATE_PRICING_CONFIGURATION);
  // State for inline editing
  const [isEditingMarkup, setIsEditingMarkup] = useState(false);
  const [customMarkup, setCustomMarkup] = useState("");
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [customDiscount, setCustomDiscount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("ISRAELI_CARD");
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false);
  
  // Get actual values from bundle
  const discountRate = bundle.discountRate || 0;
  const discountPerDay = bundle.discountPerDay || 0.1;
  
  // Payment method configuration
  const paymentMethods = [
    { value: "ISRAELI_CARD", label: "Israeli Card", rate: 0.014, icon: CreditCard },
    { value: "FOREIGN_CARD", label: "Foreign Card", rate: 0.045, icon: CreditCard },
    { value: "BIT", label: "Bit Payment", rate: 0.007, icon: Smartphone },
    { value: "AMEX", label: "American Express", rate: 0.057, icon: CreditCard },
    { value: "DINERS", label: "Diners Club", rate: 0.064, icon: CreditCard },
  ];
  
  const currentPaymentMethod = paymentMethods.find(pm => pm.value === selectedPaymentMethod) || paymentMethods[0];
  const processingRate = currentPaymentMethod.rate;
  
  // Determine configuration level
  const configLevel = bundle.configurationLevel || 'GLOBAL';
  const bundleGroup = (bundle as any).bundleGroup || 'Standard';

  // Use actual pricing values from bundle
  const cost = bundle.cost || 0;  // eSIM Go cost
  const costPlus = bundle.costPlus || 0;  // Our markup
  const totalCost = bundle.totalCost || (cost + costPlus);  // Our selling price before discount
  const discountValue = bundle.discountValue || 0;
  const priceAfterDiscount = bundle.priceAfterDiscount || 0;  // Customer pays this
  
  // Calculate processing cost based on selected payment method
  const processingCost = priceAfterDiscount * processingRate;
  // Net profit = What we receive (after processing) minus only the eSIM Go cost
  const revenueAfterProcessing = priceAfterDiscount - processingCost;
  const netProfit = revenueAfterProcessing - cost;  // Don't subtract markup - that's our profit!
  
  // Handler for saving markup changes
  const handleSaveMarkup = () => {
    // TODO: Call mutation to save markup override
    console.log('Save markup:', customMarkup);
    setIsEditingMarkup(false);
  };
  
  // Handler for saving discount changes
  const handleSaveDiscount = async () => {
    if (!customDiscount || parseFloat(customDiscount) < 0 || parseFloat(customDiscount) > 100) {
      toast.error("Please enter a valid discount percentage (0-100)");
      return;
    }

    try {
      const discountRateDecimal = parseFloat(customDiscount) / 100;
      
      // Create a country-specific pricing configuration with discount override
      const result = await updatePricingConfiguration({
        variables: {
          input: {
            name: `${bundle.countryName} ${bundle.duration}d Discount Override`,
            description: `Custom discount for ${bundle.countryName} ${bundle.duration}-day bundles: ${customDiscount}%`,
            countryId: bundle.countryId,
            duration: bundle.duration,
            bundleGroup: (bundle as any).bundleGroup || null,
            discountRate: discountRateDecimal,
            discountPerDay: discountPerDay,
            markupAmount: null, // Not changing markup in this operation
            isActive: true,
          },
        },
        refetchQueries: [
          {
            query: GET_COUNTRY_BUNDLES,
            variables: { countryId: bundle.countryId },
          },
        ],
      });

      if (result.data?.updatePricingConfiguration?.success) {
        setIsEditingDiscount(false);
        toast.success(`Discount of ${customDiscount}% applied for ${bundle.countryName}`);
        onConfigurationSaved?.();
      } else {
        toast.error(result.data?.updatePricingConfiguration?.error || "Failed to save discount");
      }
    } catch (error: any) {
      console.error("Error saving discount:", error);
      toast.error("Failed to save discount configuration");
    }
  };

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
          <h3 className="text-lg font-semibold">Pricing Analysis</h3>
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
        <div className="space-y-4 p-4">
          {/* Bundle Information */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-sm">{bundle.bundleName}</h4>
                <p className="text-xs text-gray-600 mt-1">
                  {bundle.countryName} • {bundle.duration} days
                  {bundle.dataAmount && ` • ${bundle.dataAmount}`}
                </p>
              </div>
              <ConfigurationLevelIndicator 
                level={configLevel} 
                size="sm" 
                showTooltip 
              />
            </div>
          </div>

          {/* Pricing Calculation */}
          <div className="space-y-3">
            <div className="space-y-2 text-sm">
              {/* Cost Structure */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Base cost</span>
                <span className="font-mono">{formatCurrency(cost)}</span>
              </div>
              
              {/* Markup with inline editing */}
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Markup</span>
                  <ConfigurationLevelIndicator 
                    level={configLevel} 
                    size="xs" 
                    showTooltip 
                  />
                </div>
                {isEditingMarkup ? (
                  <div className="flex items-center gap-1">
                    <InputWithAdornment
                      type="number"
                      min="0"
                      step="0.01"
                      value={customMarkup}
                      onChange={(e) => setCustomMarkup(e.target.value)}
                      placeholder={costPlus.toFixed(2)}
                      leftAdornment="$"
                      className="w-24 h-7 text-sm"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveMarkup}
                      className="h-7 w-7 p-0 text-green-600"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingMarkup(false);
                        setCustomMarkup("");
                      }}
                      className="h-7 w-7 p-0 text-gray-400"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="font-mono">+ {formatCurrency(costPlus)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingMarkup(true);
                        setCustomMarkup(costPlus.toString());
                      }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Selling price</span>
                <span className="font-mono font-medium">{formatCurrency(totalCost)}</span>
              </div>
              
              {/* Discount with inline editing */}
              <div className="flex justify-between items-center pt-2 group">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Discount</span>
                  <ConfigurationLevelIndicator 
                    level={configLevel} 
                    size="xs" 
                    showTooltip 
                  />
                </div>
                {isEditingDiscount ? (
                  <div className="flex items-center gap-1">
                    <InputWithAdornment
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={customDiscount}
                      onChange={(e) => setCustomDiscount(e.target.value)}
                      placeholder={(discountRate * 100).toFixed(0)}
                      rightAdornment="%"
                      className="w-20 h-7 text-sm"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveDiscount}
                      className="h-7 w-7 p-0 text-green-600"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingDiscount(false);
                        setCustomDiscount("");
                      }}
                      className="h-7 w-7 p-0 text-gray-400"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-green-600">
                      - {formatCurrency(discountValue)} ({formatPercentage(discountRate)})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingDiscount(true);
                        setCustomDiscount((discountRate * 100).toString());
                      }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Processing</span>
                  <Popover open={paymentMethodOpen} onOpenChange={setPaymentMethodOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                      >
                        <currentPaymentMethod.icon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Select payment method..." className="h-9" />
                        <CommandEmpty>No payment method found.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {paymentMethods.map((method) => {
                              const Icon = method.icon;
                              return (
                                <CommandItem
                                  key={method.value}
                                  value={method.value}
                                  onSelect={() => {
                                    setSelectedPaymentMethod(method.value);
                                    setPaymentMethodOpen(false);
                                  }}
                                >
                                  <Icon className="mr-2 h-4 w-4" />
                                  <span className="flex-1">{method.label}</span>
                                  <Badge variant="outline" className="text-xs ml-auto">
                                    {formatPercentage(method.rate)}
                                  </Badge>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <span className="text-xs text-gray-500">({formatPercentage(processingRate)})</span>
                </div>
                <span className="font-mono text-orange-600">- {formatCurrency(processingCost)}</span>
              </div>
              
              {/* Final Result */}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Net profit</span>
                <div className="text-right">
                  <div className={`font-mono font-medium text-lg ${
                    netProfit > 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {formatCurrency(netProfit)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {((netProfit / totalCost) * 100).toFixed(1)}% margin
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions & Warnings */}
          <div className="space-y-3">
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => console.log('Open full config')}
              >
                Full Configuration
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => console.log('Test pricing')}
              >
                Test Pricing
              </Button>
            </div>
            
            {/* Custom Discount Per Day Info */}
            {discountPerDay !== 0.1 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-md">
                <TrendingDown className="h-4 w-4 text-yellow-600" />
                <span className="text-xs text-yellow-800">
                  Custom unused day discount: {formatPercentage(discountPerDay)} per day
                </span>
              </div>
            )}
            
            {/* Minimum Profit Warning */}
            {netProfit < 1.50 && (
              <div className="bg-red-50 p-2 rounded-md border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-red-900">
                      Below Minimum Profit
                    </p>
                    <p className="text-xs text-red-700">
                      Must be at least $1.50 profit
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
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
          <div className="space-y-1 p-2">
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
            <motion.div 
              className="h-full flex flex-col"
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
                  defaultSize={40} 
                  minSize={30}
                  maxSize={50}
                  id="preview-panel"
                  order={3}
                >
                  <div className="h-full flex flex-col">
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
              <BundlesTable country={selectedCountryData} showHeader={false} />
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}