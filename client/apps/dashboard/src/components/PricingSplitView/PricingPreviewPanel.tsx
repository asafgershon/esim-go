import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Button,
  ScrollArea,
  Badge,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui";
import { TrendingDown, AlertCircle, X, Edit3, Check, CreditCard, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@apollo/client";
import { GET_COUNTRY_BUNDLES } from "../../lib/graphql/queries";
import { ConfigurationLevelIndicator } from "../configuration-level-indicator";
import { CountryBundleWithDisplay } from "./types";

interface PricingPreviewPanelProps {
  bundle: CountryBundleWithDisplay;
  onClose: () => void;
  onConfigurationSaved?: () => void;
}

export const PricingPreviewPanel: React.FC<PricingPreviewPanelProps> = ({ 
  bundle, 
  onClose,
  onConfigurationSaved
}) => {
  // Mutations
  // TODO: Update to use new rule-based pricing system mutations
  // const [updatePricingRule, { loading: savingConfig }] = useMutation(UPDATE_PRICING_RULE);
  // State for inline editing
  const [isEditingMarkup, setIsEditingMarkup] = useState(false);
  const [customMarkup, setCustomMarkup] = useState("");
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [customDiscount, setCustomDiscount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("ISRAELI_CARD");
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false);
  const [showDiscountTooltip, setShowDiscountTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout>();
  
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
  
  // Calculate maximum allowed discount to maintain minimum profit margin
  const maxAllowedDiscount = useMemo(() => {
    const baseCost = bundle.cost || 0; // Fixed: use bundle.cost instead of catalogPrice
    const minimumAllowedPrice = baseCost + 1.50; // cost + $1.50 minimum profit
    const markupAmount = bundle.costPlus || 10; // Use actual markup instead of hardcoded value
    const totalCostWithMarkup = baseCost + markupAmount;
    
    if (totalCostWithMarkup <= minimumAllowedPrice) {
      return 0; // No discount allowed
    }
    
    const maxDiscount = ((totalCostWithMarkup - minimumAllowedPrice) / totalCostWithMarkup) * 100;
    return Math.floor(maxDiscount * 10) / 10; // Round down to 1 decimal place
  }, [bundle.cost, bundle.costPlus]);
  
  // Show tooltip when invalid discount is attempted
  const showInvalidDiscountTooltip = useCallback(() => {
    setShowDiscountTooltip(true);
    
    // Clear existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    
    // Hide tooltip after 3 seconds
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowDiscountTooltip(false);
    }, 3000);
  }, []);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);
  const processingRate = currentPaymentMethod.rate;
  
  // Custom discount input handler with validation
  const handleDiscountChange = useCallback((value: string) => {
    const numericValue = parseFloat(value);
    
    // Allow empty string and valid numeric input
    if (value === "" || (!isNaN(numericValue) && numericValue >= 0)) {
      // Check if the value exceeds maximum allowed discount
      if (!isNaN(numericValue) && numericValue > maxAllowedDiscount) {
        showInvalidDiscountTooltip();
        // Don't update the input value, but show the tooltip
        return;
      }
      
      setCustomDiscount(value);
    }
  }, [maxAllowedDiscount, showInvalidDiscountTooltip]);
  
  // Determine configuration level
  const configLevel = bundle.configurationLevel || 'GLOBAL';
  const bundleGroup = (bundle as any).bundleGroup || 'Standard';

  // Use actual pricing values from bundle
  const cost = bundle.cost || 0;  // eSIM Go cost
  const costPlus = bundle.costPlus || 0;  // Our markup
  const totalCost = bundle.totalCost || (cost + costPlus);  // Our selling price before discount
  const discountValue = bundle.discountValue || 0;
  const priceAfterDiscount = bundle.priceAfterDiscount || 0;  // Customer pays this
  
  // Use pre-calculated values from bundle (updated for selected payment method)
  const processingCost = bundle.processingCost || (priceAfterDiscount * processingRate);
  const revenueAfterProcessing = priceAfterDiscount - processingCost;
  const netProfit = bundle.netProfit || (revenueAfterProcessing - cost);  // Use pre-calculated if available
  
  // Handler for saving markup changes
  const handleSaveMarkup = () => {
    // TODO: Call mutation to save markup override using new rule-based pricing system
    const logger = { info: (msg: string, data: any) => console.log(msg, data) };
    logger.info('Save markup:', customMarkup);
    setIsEditingMarkup(false);
  };
  
  // Handler for saving discount changes
  const handleSaveDiscount = async () => {
    if (!customDiscount || parseFloat(customDiscount) < 0) {
      toast.error("Please enter a valid discount percentage");
      return;
    }

    const discountRateDecimal = parseFloat(customDiscount) / 100;

    try {
      // TODO: Update to use new rule-based pricing system
      // This should create or update a pricing rule instead of using the old configuration system
      toast.info(`Saving discount of ${customDiscount}% for ${bundle.countryName} - Update needed for new pricing system`);
      
      // Placeholder for new rule-based pricing update
      // const result = await createPricingRule({
      //   variables: {
      //     input: {
      //       name: `${bundle.countryName} ${bundle.duration}d Discount Override`,
      //       description: `Custom discount for ${bundle.countryName} ${bundle.duration}-day bundles: ${customDiscount}%`,
      //       type: 'DISCOUNT',
      //       conditions: [
      //         { field: 'countryId', operator: 'EQUALS', value: bundle.countryId },
      //         { field: 'duration', operator: 'EQUALS', value: bundle.duration.toString() }
      //       ],
      //       actions: [
      //         { type: 'PERCENTAGE_DISCOUNT', value: discountRateDecimal }
      //       ],
      //       priority: 100,
      //       isActive: true,
      //     },
      //   },
      //   refetchQueries: [
      //     {
      //       query: GET_COUNTRY_BUNDLES,
      //       variables: { countryId: bundle.countryId },
      //     },
      //   ],
      // });
      
      setIsEditingDiscount(false);
      // toast.success(`Discount of ${customDiscount}% applied for ${bundle.countryName}`);
      onConfigurationSaved?.();
    } catch (error: any) {
      const logger = { error: (msg: string, err: any) => console.error(msg, err) };
      logger.error("Error saving discount:", error);
      
      // Check for server-side minimum fee validation errors
      if (error?.graphQLErrors?.[0]?.extensions?.code === 'INSUFFICIENT_PROFIT_MARGIN') {
        const minPrice = error.graphQLErrors[0].extensions.minimumPrice;
        const calculatedPrice = error.graphQLErrors[0].extensions.calculatedPrice;
        toast.error(`Discount violates minimum profit margin. Calculated price ($${calculatedPrice}) is below minimum ($${minPrice})`);
      } else {
        toast.error(error?.message || "Failed to save discount configuration");
      }
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
                    <TooltipProvider>
                      <Tooltip open={showDiscountTooltip}>
                        <TooltipTrigger asChild>
                          <div>
                            <InputWithAdornment
                              type="number"
                              min="0"
                              max={maxAllowedDiscount}
                              step="0.1"
                              value={customDiscount}
                              onChange={(e) => handleDiscountChange(e.target.value)}
                              placeholder={(discountRate * 100).toFixed(1)}
                              rightAdornment="%"
                              className="w-20 h-7 text-sm"
                              autoFocus
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-900 text-white border-gray-700">
                          <div className="text-sm">
                            <p className="font-medium">Maximum discount: {maxAllowedDiscount.toFixed(1)}%</p>
                            <p className="text-xs text-gray-300 mt-1">
                              Higher discounts would violate the minimum profit margin of $1.50 above cost.
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
  );
};