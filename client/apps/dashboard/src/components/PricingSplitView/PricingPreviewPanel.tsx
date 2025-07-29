import {
  Bundle,
  Country,
  PaymentMethodInfo,
  CreatePricingRuleInput,
  CreatePricingRuleMutation,
  CreatePricingRuleMutationVariables,
  RuleCategory,
  ActionType,
  ConditionOperator,
} from "@/__generated__/graphql";
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
import { useMutation } from "@apollo/client";
import {
  CREATE_PRICING_RULE,
  CALCULATE_BATCH_ADMIN_PRICING,
} from "../../lib/graphql/queries";
import { cleanPricingRuleForMutation } from "../../utils/graphql-utils";
import { ConfigurationLevelIndicator } from "../configuration-level-indicator";
import { AppliedRules } from "../applied-rules";

interface PricingPreviewPanelProps {
  bundle: Bundle & {
    appliedRules?: Array<{
      id?: string;
      name: string;
      type: string;
      impact: number;
    }>;
  };
  country: Country;
  paymentMethods?: PaymentMethodInfo[];
  onClose: () => void;
  onConfigurationSaved?: () => void;
}

export const PricingPreviewPanel: React.FC<PricingPreviewPanelProps> = ({
  bundle,
  country,
  paymentMethods = [],
  onClose,
  onConfigurationSaved,
}) => {
  // Mutations
  const [createPricingRule, { loading: savingConfig }] = useMutation<
    CreatePricingRuleMutation,
    CreatePricingRuleMutationVariables
  >(CREATE_PRICING_RULE);

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

  // Get actual values from bundle pricing breakdown if available
  const discountRate = bundle.pricingBreakdown?.discountRate || 0;
  const discountPerDay = bundle.pricingBreakdown?.discountPerDay || 0.1;

  // Payment method configuration - use passed data if available, otherwise fallback to defaults
  const paymentMethodsConfig =
    paymentMethods.length > 0
      ? paymentMethods.map((pm) => ({
          value: pm.value,
          label: pm.label,
          rate: pm.processingRate,
          icon: pm.icon === "smartphone" ? Smartphone : CreditCard,
        }))
      : [
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
          {
            value: "AMEX",
            label: "American Express",
            rate: 0.057,
            icon: CreditCard,
          },
          {
            value: "DINERS",
            label: "Diners Club",
            rate: 0.064,
            icon: CreditCard,
          },
        ];

  const currentPaymentMethod =
    paymentMethodsConfig.find((pm) => pm.value === selectedPaymentMethod) ||
    paymentMethodsConfig[0];

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

  // Use pricing values from pricingBreakdown if available, otherwise use calculated values
  const cost = bundle.pricingBreakdown?.cost || bundle.basePrice || 0; // eSIM Go cost
  const markup = bundle.pricingBreakdown?.markup || 0; // Markup amount
  const totalCost = bundle.pricingBreakdown?.totalCost || cost + markup; // Our selling price before discount
  const discountValue =
    bundle.pricingBreakdown?.discountValue || totalCost * discountRate;
  const priceAfterDiscount =
    bundle.pricingBreakdown?.priceAfterDiscount || totalCost - discountValue; // Customer pays this

  // Calculate customer price (includes processing fee)
  const processingCost = priceAfterDiscount * processingRate;
  const customerPrice = priceAfterDiscount + processingCost;
  const revenueAfterProcessing = priceAfterDiscount; // Revenue after processing fee removed
  const netProfit = revenueAfterProcessing - cost;

  // Handler for saving markup changes
  const handleSaveMarkup = async () => {
    if (!customMarkup || parseFloat(customMarkup) < 0) {
      toast.error("Please enter a valid markup amount");
      return;
    }

    const markupValue = parseFloat(customMarkup);
    const countryCode = bundle.countries[0]; // Get first country from array

    try {
      const ruleInput = {
        category: RuleCategory.BundleAdjustment,
        name: `${country.name} ${bundle.validityInDays}d Markup Override`,
        description: `Custom markup for ${country.name} ${bundle.validityInDays}-day bundles: $${markupValue}`,
        conditions: [
          {
            field: "country",
            operator: ConditionOperator.Equals,
            value: JSON.stringify(countryCode),
          },
          {
            field: "duration",
            operator: ConditionOperator.Equals,
            value: JSON.stringify(bundle.validityInDays),
          },
        ],
        actions: [{ type: ActionType.AddMarkup, value: markupValue }],
        priority: 100,
        isActive: true,
      };

      const result = await createPricingRule({
        variables: {
          input: cleanPricingRuleForMutation(ruleInput),
        },
        refetchQueries: [
          {
            query: CALCULATE_BATCH_ADMIN_PRICING,
            variables: {
              inputs: [
                {
                  countryId: countryCode,
                  numOfDays: bundle.validityInDays,
                  groups: bundle.groups,
                },
              ],
            },
          },
        ],
      });

      setIsEditingMarkup(false);
      toast.success(`Markup of $${markupValue} applied for ${country.name}`);
      onConfigurationSaved?.();
    } catch (error: any) {
      const logger = {
        error: (msg: string, err: any) => console.error(msg, err),
      };
      logger.error("Error saving markup:", error);
      toast.error(error?.message || "Failed to save markup configuration");
    }
  };

  // Handler for saving discount changes
  const handleSaveDiscount = async () => {
    if (!customDiscount || parseFloat(customDiscount) < 0) {
      toast.error("Please enter a valid discount percentage");
      return;
    }

    const discountValue = parseFloat(customDiscount);
    const countryCode = bundle.countries[0]; // Get first country from array
    const bundleName = bundle.name;

    try {
      const ruleInput = {
        category: RuleCategory.Discount,
        name: `${country.name} ${bundle.validityInDays}d Discount Override`,
        description: `Custom discount for ${country.name} ${bundle.validityInDays}-day bundles: ${discountValue}%`,
        conditions: [
          {
            field: "country",
            operator: ConditionOperator.Equals,
            value: JSON.stringify(countryCode),
          },
          {
            field: "duration",
            operator: ConditionOperator.Equals,
            value: JSON.stringify(bundle.validityInDays),
          },
        ],
        actions: [
          {
            type: ActionType.ApplyDiscountPercentage,
            value: discountValue,
          },
        ],
        priority: 100,
        isActive: true,
      };

      const result = await createPricingRule({
        variables: {
          input: cleanPricingRuleForMutation(ruleInput),
        },
        refetchQueries: [
          {
            query: CALCULATE_BATCH_ADMIN_PRICING,
            variables: {
              inputs: [
                {
                  countryId: countryCode,
                  numOfDays: bundle.validityInDays,
                  groups: bundle.groups,
                },
              ],
            },
          },
        ],
      });

      setIsEditingDiscount(false);
      toast.success(
        `Discount of ${discountValue}% applied for ${country.name}`
      );
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
                {bundle.isUnlimited
                  ? " • Unlimited"
                  : bundle.dataAmountReadable &&
                    ` • ${bundle.dataAmountReadable}`}
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Calculation */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Pricing Breakdown</h4>
          <div className="space-y-2 text-sm">
            {/* Cost Structure */}
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Base Cost</span>
              <span className="font-mono">{formatCurrency(cost)}</span>
            </div>

            {/* Markup with inline editing */}
            <div className="flex justify-between items-center py-1 group">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">
                  + Markup
                  {cost && markup ? (
                    <span className="text-xs ml-1">
                      ({((markup / cost) * 100).toFixed(1)}%)
                    </span>
                  ) : null}
                </span>
              </div>
              {isEditingMarkup ? (
                <div className="flex items-center gap-1">
                  <InputWithAdornment
                    type="number"
                    min="0"
                    step="0.01"
                    value={customMarkup}
                    onChange={(e) => setCustomMarkup(e.target.value)}
                    placeholder={markup.toFixed(2)}
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
                  <span className="font-mono">{formatCurrency(markup)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingMarkup(true);
                      setCustomMarkup(markup.toString());
                    }}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Discount with inline editing */}
            {discountValue > 0 && (
              <>
                <div className="flex justify-between items-center py-1 group">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">
                      - Discount ({formatPercentage(discountRate)})
                    </span>
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
                        -{formatCurrency(discountValue)}
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
                {bundle.pricingBreakdown?.unusedDays && bundle.pricingBreakdown.unusedDays > 0 && (
                  <div className="flex justify-between items-center text-xs text-blue-600 italic">
                    <span>  ↳ Includes unused days:</span>
                    <span className="font-mono">
                      -{formatCurrency((bundle.pricingBreakdown.unusedDays || 0) * (bundle.pricingBreakdown.discountPerDay || 0))}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Processing Fee */}
            <div className="flex justify-between items-center py-1 group">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">
                  + Processing Fee ({formatPercentage(processingRate)})
                </span>
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
                          {paymentMethodsConfig.map((method) => {
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
              </div>
              <span className="font-mono">{formatCurrency(processingCost)}</span>
            </div>

            {/* Customer Price */}
            <div className="flex justify-between items-center py-1 pt-2 border-t">
              <span className="font-medium">Customer Price</span>
              <span className="font-mono font-medium text-lg">
                {formatCurrency(customerPrice)}
              </span>
            </div>

            {/* Revenue Breakdown */}
            <div className="mt-3 pt-3 border-t border-gray-300 space-y-1">
              <div className="text-xs font-medium text-gray-500 mb-1">Revenue Breakdown</div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground text-xs">Customer Price</span>
                <span className="font-mono text-xs">{formatCurrency(customerPrice)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground text-xs">- Processing Fee</span>
                <span className="font-mono text-xs text-orange-600">-{formatCurrency(processingCost)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs font-medium">Revenue After Processing</span>
                <span className="font-mono text-xs font-medium">{formatCurrency(revenueAfterProcessing)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground text-xs">- Base Cost</span>
                <span className="font-mono text-xs text-red-600">-{formatCurrency(cost)}</span>
              </div>
              <div className="flex justify-between items-center py-1 pt-1 border-t">
                <span className="text-xs font-medium">Net Profit</span>
                <span className={`font-mono text-sm font-bold ${netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netProfit)}
                  <span className="text-xs font-normal ml-1">
                    ({((netProfit / customerPrice) * 100).toFixed(1)}% margin)
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Applied Rules Section */}
        {Array.isArray(bundle.appliedRules) &&
          bundle?.appliedRules?.length > 0 && (
            <div className="border-t pt-3">
              <AppliedRules
                rules={bundle.appliedRules}
                currency="USD"
                compact={true}
              />
            </div>
          )}

        {/* Actions & Warnings */}
        <div className="space-y-3">
          {/* Unused Days Discount Info */}
          {bundle.pricingBreakdown?.unusedDays && bundle.pricingBreakdown.unusedDays > 0 && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md border border-blue-200">
              <TrendingDown className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-medium text-blue-900 mb-1">
                  Unused Days Discount Applied
                </div>
                <div className="text-xs text-blue-800 space-y-1">
                  <div>
                    You requested fewer days than the bundle provides, so we're giving you a discount for the unused days.
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span>• Unused days: {bundle.pricingBreakdown.unusedDays}</span>
                    <span>• Discount per day: ${bundle.pricingBreakdown.discountPerDay?.toFixed(2) || '0.00'}</span>
                    <span>• Total discount: ${(bundle.pricingBreakdown.unusedDays * (bundle.pricingBreakdown.discountPerDay || 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
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
