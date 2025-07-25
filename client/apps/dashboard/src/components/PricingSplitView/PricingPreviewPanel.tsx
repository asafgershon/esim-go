import { Bundle, Country } from "@/__generated__/graphql";
import {
  Badge,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  InputWithAdornment,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui";
import {
  AlertCircle,
  Check,
  CreditCard,
  Edit3,
  Smartphone,
  TrendingDown,
  X,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { ConfigurationLevelIndicator } from "../configuration-level-indicator";

interface PricingPreviewPanelProps {
  bundle: Bundle;
  country: Country;
  onClose: () => void;
  onConfigurationSaved?: () => void;
}

export const PricingPreviewPanel: React.FC<PricingPreviewPanelProps> = ({
  bundle,
  country,
  onClose,
  onConfigurationSaved,
}) => {
  // Mutations
  // TODO: Update to use new rule-based pricing system mutations
  // const [updatePricingRule, { loading: savingConfig }] = useMutation(UPDATE_PRICING_RULE);
  // State for inline editing
  const [isEditingMarkup, setIsEditingMarkup] = useState(false);
  const [customMarkup, setCustomMarkup] = useState("");
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [customDiscount, setCustomDiscount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("ISRAELI_CARD");
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false);
  const [showDiscountTooltip, setShowDiscountTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get actual values from bundle (placeholder until pricingBreakdown is implemented)
  const discountRate = 0; // bundle.pricingBreakdown?.discountRate || 0;
  const discountPerDay = 0.1; // bundle.pricingBreakdown?.discountPerDay || 0.1;

  // Payment method configuration
  const paymentMethods = [
    {
      value: "ISRAELI_CARD",
      label: "Israeli Card",
      rate: 0.014,
      icon: CreditCard,
    },
    {
      value: "FOREIGN_CARD",
      label: "Foreign Card",
      rate: 0.045,
      icon: CreditCard,
    },
    { value: "BIT", label: "Bit Payment", rate: 0.007, icon: Smartphone },
    { value: "AMEX", label: "American Express", rate: 0.057, icon: CreditCard },
    { value: "DINERS", label: "Diners Club", rate: 0.064, icon: CreditCard },
  ];

  const currentPaymentMethod =
    paymentMethods.find((pm) => pm.value === selectedPaymentMethod) ||
    paymentMethods[0];

  // Calculate maximum allowed discount to maintain minimum profit margin
  const maxAllowedDiscount = useMemo(() => {
    const baseCost = bundle.basePrice || 0; // Use basePrice until pricingBreakdown is implemented
    const minimumAllowedPrice = baseCost + 1.5; // cost + $1.50 maximum profit
    const markupAmount = 10; // Default markup until pricingBreakdown is implemented
    const totalCostWithMarkup = baseCost + markupAmount;

    if (totalCostWithMarkup <= minimumAllowedPrice) {
      return 0; // No discount allowed
    }

    const maxDiscount =
      ((totalCostWithMarkup - minimumAllowedPrice) / totalCostWithMarkup) * 100;
    return Math.floor(maxDiscount * 10) / 10; // Round down to 1 decimal place
  }, [bundle.basePrice]);

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
  const handleDiscountChange = useCallback(
    (value: string) => {
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
    },
    [maxAllowedDiscount, showInvalidDiscountTooltip]
  );

  // Use placeholder pricing values until pricingBreakdown is implemented
  const cost = bundle.basePrice || 0; // eSIM Go cost
  const costPlus = 10; // Default markup
  const totalCost = cost + costPlus; // Our selling price before discount
  const discountValue = totalCost * discountRate;
  const priceAfterDiscount = totalCost - discountValue; // Customer pays this

  // Calculate processing and profit
  const processingCost = priceAfterDiscount * processingRate;
  const revenueAfterProcessing = priceAfterDiscount - processingCost;
  const netProfit = revenueAfterProcessing - cost;

  // Handler for saving markup changes
  const handleSaveMarkup = () => {
    // TODO: Call mutation to save markup override using new rule-based pricing system
    const logger = { info: (msg: string, data: any) => console.log(msg, data) };
    logger.info("Save markup:", customMarkup);
    setIsEditingMarkup(false);
  };

  // Handler for saving discount changes
  const handleSaveDiscount = async () => {
    if (!customDiscount || parseFloat(customDiscount) < 0) {
      toast.error("Please enter a valid discount percentage");
      return;
    }

    try {
      // TODO: Update to use new rule-based pricing system
      // This should create or update a pricing rule instead of using the old configuration system
      toast.info(
        `Saving discount of ${customDiscount}% for ${country.name} - Update needed for new pricing system`
      );

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
      const logger = {
        error: (msg: string, err: any) => console.error(msg, err),
      };
      logger.error("Error saving discount:", error);

      // Check for server-side minimum fee validation errors
      if (
        error?.graphQLErrors?.[0]?.extensions?.code ===
        "INSUFFICIENT_PROFIT_MARGIN"
      ) {
        const minPrice = error.graphQLErrors[0].extensions.minimumPrice;
        const calculatedPrice =
          error.graphQLErrors[0].extensions.calculatedPrice;
        toast.error(
          `Discount violates minimum profit margin. Calculated price ($${calculatedPrice}) is below minimum ($${minPrice})`
        );
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
              <h4 className="font-medium text-sm">{bundle.name}</h4>
              <p className="text-xs text-gray-600 mt-1">
                {country.name} • {bundle.validityInDays} days
                {bundle.isUnlimited ? ' • Unlimited' : bundle.dataAmountReadable && ` • ${bundle.dataAmountReadable}`}
              </p>
            </div>
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
                  <span className="font-mono">
                    + {formatCurrency(costPlus)}
                  </span>
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
              <span className="font-mono font-medium">
                {formatCurrency(totalCost)}
              </span>
            </div>

            {/* Discount with inline editing */}
            <div className="flex justify-between items-center pt-2 group">
              <div className="flex items-center gap-1">
                <span className="text-gray-600">Discount</span>
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
                            onChange={(e) =>
                              handleDiscountChange(e.target.value)
                            }
                            placeholder={(discountRate * 100).toFixed(1)}
                            rightAdornment="%"
                            className="w-20 h-7 text-sm"
                            autoFocus
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="bg-gray-900 text-white border-gray-700"
                      >
                        <div className="text-sm">
                          <p className="font-medium">
                            Maximum discount: {maxAllowedDiscount.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-300 mt-1">
                            Higher discounts would violate the minimum profit
                            margin of $1.50 above cost.
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
                    - {formatCurrency(discountValue)} (
                    {formatPercentage(discountRate)})
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
                <Popover
                  open={paymentMethodOpen}
                  onOpenChange={setPaymentMethodOpen}
                >
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
                      <CommandInput
                        placeholder="Select payment method..."
                        className="h-9"
                      />
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
                                <Badge
                                  variant="outline"
                                  className="text-xs ml-auto"
                                >
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
                <span className="text-xs text-gray-500">
                  ({formatPercentage(processingRate)})
                </span>
              </div>
              <span className="font-mono text-orange-600">
                - {formatCurrency(processingCost)}
              </span>
            </div>

            {/* Final Result */}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">Net profit</span>
              <div className="text-right">
                <div
                  className={`font-mono font-medium text-lg ${
                    netProfit > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(netProfit)}
                </div>
                <div className="text-xs text-gray-500">
                  {((netProfit / totalCost) * 100).toFixed(1)}% margin
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Applied Rules Section */}
        {Array.isArray(bundle.appliedRules) &&
          bundle?.appliedRules?.length > 0 && (
            <div className="space-y-3">
              <div className="border-t pt-3">
                <h5 className="font-medium text-sm text-gray-900 mb-2">
                  Applied Rules
                </h5>

                {/* Applied Rules */}
                {bundle?.appliedRules?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-700">
                      Rules:
                    </div>
                    {bundle?.appliedRules.map((rule, index) => (
                      <div
                        key={rule.id || index}
                        className="flex items-center justify-between text-xs bg-blue-50 p-2 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {rule.type}
                          </Badge>
                          <span className="text-gray-700">{rule.name}</span>
                        </div>
                        <span
                          className={`font-mono font-medium ${
                            rule.impact > 0
                              ? "text-green-600"
                              : rule.impact < 0
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {rule.impact > 0 ? "+" : ""}
                          {formatCurrency(rule.impact)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Actions & Warnings */}
        <div className="space-y-3">
          {/* Custom Discount Per Day Info */}
          {discountPerDay !== 0.1 && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-md">
              <TrendingDown className="h-4 w-4 text-yellow-600" />
              <span className="text-xs text-yellow-800">
                Custom unused day discount: {formatPercentage(discountPerDay)}{" "}
                per day
              </span>
            </div>
          )}

          {/* Minimum Profit Warning */}
          {netProfit < 1.5 && (
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
