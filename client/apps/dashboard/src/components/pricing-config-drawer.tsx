import { CountryBundle } from "@/__generated__/graphql";
import { useMutation, useQuery } from "@apollo/client";
import {
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Input,
  InputWithAdornment,
  Label,
  Separator,
  SliderWithValue,
  Switch,
  Textarea,
} from "@workspace/ui";
import { Check, ChevronDown, ChevronRight, Edit3, Info, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  GET_CURRENT_PROCESSING_FEE_CONFIGURATION,
  UPDATE_PRICING_CONFIGURATION,
} from "../lib/graphql/queries";

interface PricingConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pricingData: CountryBundle | null;
  onConfigurationSaved?: () => void;
}

export const PricingConfigDrawer: React.FC<PricingConfigDrawerProps> = ({
  isOpen,
  onClose,
  pricingData,
  onConfigurationSaved,
}) => {
  const [updatePricingConfiguration, { loading }] = useMutation(
    UPDATE_PRICING_CONFIGURATION
  );
  // Note: We'll use pricing configurations for country-specific markup overrides
  // Global markup configs are still handled by the separate markup config mutations
  const { data: processingFeeConfig } = useQuery(
    GET_CURRENT_PROCESSING_FEE_CONFIGURATION,
    {
      skip: !isOpen,
    }
  );
  // TODO: Query for existing country-specific pricing configurations
  // const { data: pricingConfigs } = useQuery(GET_PRICING_CONFIGURATIONS);

  const [isProcessingDetailsOpen, setIsProcessingDetailsOpen] = useState(false);
  const [isBasicConfigOpen, setIsBasicConfigOpen] = useState(false);
  const [isMarkupConfigOpen, setIsMarkupConfigOpen] = useState(false);
  const [isPricingConfigOpen, setIsPricingConfigOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    costSplitPercent: 0.6,
    discountRate: 0.3,
    processingRate: 0.045,
    isActive: true,
    priority: 10,
  });

  // Price range state for dynamic pricing
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  // Simulator state
  const [simulatorDays, setSimulatorDays] = useState(7);

  // Markup override state
  const [isMarkupOverrideOpen, setIsMarkupOverrideOpen] = useState(false);
  const [customMarkupAmount, setCustomMarkupAmount] = useState<string>("");
  const [hasMarkupOverride, setHasMarkupOverride] = useState(false);

  // Available bundle durations (common eSIM Go durations)
  const availableBundles = [3, 5, 7, 10, 14, 21, 30];

  // TODO: Initialize markup override state from pricing configurations
  // useEffect(() => {
  //   const existingConfig = getExistingPricingConfig();
  //   if (existingConfig && existingConfig.markupAmount !== null) {
  //     setHasMarkupOverride(true);
  //     setCustomMarkupAmount(existingConfig.markupAmount.toString());
  //   } else {
  //     setHasMarkupOverride(false);
  //     setCustomMarkupAmount("");
  //   }
  // }, [pricingConfigs, pricingData]);

  // Find the best bundle for simulator
  const getBestBundle = (requestedDays: number) => {
    // Try exact match first
    if (availableBundles.includes(requestedDays)) {
      return requestedDays;
    }
    // Find smallest bundle that covers the requested days
    const suitableBundles = availableBundles.filter(
      (bundle) => bundle >= requestedDays
    );
    if (suitableBundles.length > 0) {
      return Math.min(...suitableBundles);
    }
    // If no bundle covers it, use the largest
    return Math.max(...availableBundles);
  };

  // Get markup source information based on bundle name and duration
  const getMarkupSource = () => {
    if (!pricingData) return "Unknown";

    // Extract bundle group from bundle name
    // This is a simplified mapping - you might need to adjust based on actual bundle names
    let bundleGroup = "Standard - Unlimited Essential"; // Default
    if (pricingData.bundleName.toLowerCase().includes("lite")) {
      bundleGroup = "Standard - Unlimited Lite";
    } else if (pricingData.bundleName.toLowerCase().includes("essential")) {
      bundleGroup = "Standard - Unlimited Essential";
    } else if (pricingData.bundleName.toLowerCase().includes("fixed")) {
      bundleGroup = "Standard Fixed";
    }

    return `${bundleGroup}, ${pricingData.duration} days`;
  };

  // Get bundle group for API calls
  const getBundleGroup = () => {
    if (!pricingData) return "Standard - Unlimited Essential";

    let bundleGroup = "Standard - Unlimited Essential"; // Default
    if (pricingData.bundleName.toLowerCase().includes("lite")) {
      bundleGroup = "Standard - Unlimited Lite";
    } else if (pricingData.bundleName.toLowerCase().includes("essential")) {
      bundleGroup = "Standard - Unlimited Essential";
    } else if (pricingData.bundleName.toLowerCase().includes("fixed")) {
      bundleGroup = "Standard Fixed";
    }

    return bundleGroup;
  };

  // TODO: Find existing country-specific pricing config for this bundle
  const getExistingPricingConfig = () => {
    // if (!pricingConfigs?.pricingConfigurations || !pricingData) return null;
    
    // return pricingConfigs.pricingConfigurations.find(
    //   (config: any) => 
    //     config.countryId === getCountryCode() && 
    //     config.duration === pricingData.duration &&
    //     config.markupAmount !== null
    // );
    return null; // Temporary until we implement proper querying
  };

  // Handle markup override
  const handleMarkupOverride = async () => {
    if (!customMarkupAmount || parseFloat(customMarkupAmount) < 0) {
      toast.error("Please enter a valid markup amount");
      return;
    }

    if (!pricingData) {
      toast.error("No pricing data available");
      return;
    }

    try {
      const markupAmount = parseFloat(customMarkupAmount);
      const bundleGroup = getBundleGroup();
      
      // Create a country-specific pricing configuration with markup override
      const countryCode = pricingData.countryName === "Austria" ? "AT" : null; // TODO: Add proper country code mapping
      
      await updatePricingConfiguration({
        variables: {
          input: {
            name: `${pricingData.countryName} ${pricingData.duration}d Markup Override`,
            description: `Custom markup override for ${pricingData.countryName} ${pricingData.duration}-day bundles: $${markupAmount}`,
            countryId: countryCode,
            duration: pricingData.duration,
            bundleGroup,
            costSplitPercent: formData.costSplitPercent,
            discountRate: formData.discountRate,
            processingRate: getCurrentProcessingRate(),
            markupAmount, // This is the key addition - country-specific markup
            isActive: true,
            priority: 100, // High priority to override global configs
          },
        },
      });

      setHasMarkupOverride(true);
      setIsMarkupOverrideOpen(false);
      toast.success(`Custom markup of $${customMarkupAmount} applied and saved for ${pricingData.countryName} only`);
      
      // Trigger refresh of data
      onConfigurationSaved?.();
    } catch (error) {
      console.error("Error saving markup override:", error);
      toast.error("Failed to save markup override");
    }
  };

  // Cancel markup override
  const cancelMarkupOverride = async () => {
    // TODO: Implement deletion of country-specific pricing configuration
    // For now, just reset the local state
    setHasMarkupOverride(false);
    setCustomMarkupAmount("");
    setIsMarkupOverrideOpen(false);
    toast.info("Markup override removed (local only - need to implement deletion)");
  };

  // Get effective markup amount (override or original)
  const getEffectiveMarkup = () => {
    if (hasMarkupOverride && customMarkupAmount) {
      return parseFloat(customMarkupAmount);
    }
    return pricingData?.costPlus || 0;
  };

  // Get the actual processing rate being used (default Israeli card rate)
  const getCurrentProcessingRate = () => {
    if (processingFeeConfig?.currentProcessingFeeConfiguration) {
      return processingFeeConfig.currentProcessingFeeConfiguration
        .israeliCardsRate;
    }
    return pricingData?.processingRate || 0.045; // Fallback to pricing data or default
  };

  // Initialize form data when pricing data changes
  // useEffect(() => {
  //   if (pricingData) {
  //     setFormData({
  //       name: `${pricingData.countryName} ${pricingData.duration}d Custom Config`,
  //       description: `Custom pricing configuration for ${pricingData.countryName} ${pricingData.duration}-day bundles`,
  //       costSplitPercent: pricingData.cost / pricingData.totalCost,
  //       discountRate: pricingData.discountRate,
  //       processingRate: getCurrentProcessingRate(),
  //       isActive: true,
  //       priority: 10,
  //     });

  //     // Calculate profit-based price boundaries using effective markup
  //     const currentPrice = pricingData.priceAfterDiscount;
  //     const baseCosts = pricingData.cost + getEffectiveMarkup();
  //     const processingCost = currentPrice * pricingData.processingRate;
  //     const breakEvenPrice = baseCosts + processingCost + 0.01; // Minimum profitable price
  //     const maxRecommendedPrice = Math.round(currentPrice * 1.5 * 100) / 100; // 50% above current

  //     setPriceRange([breakEvenPrice, maxRecommendedPrice]);
  //   }
  // }, [
  //   pricingData,
  //   processingFeeConfig,
  //   hasMarkupOverride,
  //   customMarkupAmount,
  //   getCurrentProcessingRate,
  //   getEffectiveMarkup,
  // ]);

  const handleSave = async () => {
    if (!pricingData) return;

    try {
      // Extract country code from country name (this is a simplified approach)
      const countryCode = pricingData.countryName === "Austria" ? "AT" : null;

      const result = await updatePricingConfiguration({
        variables: {
          input: {
            name: formData.name,
            description: formData.description,
            countryId: countryCode,
            duration: pricingData.duration,
            costSplitPercent: formData.costSplitPercent,
            discountRate: formData.discountRate,
            processingRate: formData.processingRate,
            isActive: formData.isActive,
            priority: formData.priority,
          },
        },
      });

      if (result.data?.updatePricingConfiguration?.success) {
        toast.success("Pricing configuration saved successfully!");
        onConfigurationSaved?.();
        onClose();
      } else {
        toast.error(
          result.data?.updatePricingConfiguration?.error ||
            "Failed to save configuration"
        );
      }
    } catch (error) {
      console.error("Error saving pricing configuration:", error);
      toast.error("Failed to save configuration");
    }
  };

  const handleCancel = () => {
    onClose();
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // Calculate preview values using actual costs and effective markup
  const previewCost = pricingData ? pricingData.cost : 0;
  const previewCostPlus = getEffectiveMarkup();
  const previewTotalCost = previewCost + previewCostPlus;
  const previewDiscountValue = previewTotalCost * formData.discountRate;
  const previewPriceAfterDiscount = previewTotalCost - previewDiscountValue;
  const previewProcessingCost =
    previewPriceAfterDiscount * formData.processingRate;
  const previewRevenueAfterProcessing =
    previewPriceAfterDiscount - previewProcessingCost;
  const previewFinalRevenue =
    previewRevenueAfterProcessing - previewCost - previewCostPlus;


  return (
    <Drawer direction="bottom" open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="fixed bottom-0 left-0 right-0 max-h-[85vh] z-50 bg-background border-t rounded-t-lg">
        <DrawerHeader>
          <DrawerTitle>Configure Pricing</DrawerTitle>
          <DrawerDescription>
            {pricingData && (
              <>
                Adjust pricing configuration for{" "}
                <strong>{pricingData.bundleName}</strong> in{" "}
                <strong>{pricingData.countryName}</strong>
              </>
            )}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex h-full overflow-hidden">
          {/* Left Side: Configuration Form */}
          <div className="w-1/3 p-6 border-r overflow-y-auto max-h-[65vh]">
            <h3 className="text-lg font-semibold mb-4">Configuration</h3>
            <div className="space-y-4">
              {/* Basic Configuration Section */}
              <Collapsible
                open={isBasicConfigOpen}
                onOpenChange={setIsBasicConfigOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between p-4 h-auto"
                  >
                    <div className="text-left">
                      <div className="font-medium">Basic Configuration</div>
                      <div className="text-sm text-gray-500">
                        Configuration name and description
                      </div>
                    </div>
                    {isBasicConfigOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-4">
                  <div>
                    <Label htmlFor="name">Configuration Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter configuration name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe this pricing configuration"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Markup Configuration Section */}
              <Collapsible
                open={isMarkupConfigOpen}
                onOpenChange={setIsMarkupConfigOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between p-4 h-auto"
                  >
                    <div className="text-left">
                      <div className="font-medium">Markup Configuration</div>
                      <div className="text-sm text-gray-500">
                        {hasMarkupOverride ? "Custom Override" : "Table Value"}:{" "}
                        {formatCurrency(getEffectiveMarkup())}
                      </div>
                    </div>
                    {isMarkupConfigOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-4">
                  <div>
                    <Label htmlFor="markup">Fixed Markup Amount</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {hasMarkupOverride
                              ? "Custom Override"
                              : `Table Value (${getMarkupSource()})`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-lg font-semibold ${
                              hasMarkupOverride
                                ? "text-orange-600"
                                : "text-gray-900"
                            }`}
                          >
                            {formatCurrency(getEffectiveMarkup())}
                          </span>
                          {!isMarkupOverrideOpen && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsMarkupOverrideOpen(true)}
                              className="h-7 w-7 p-0"
                              title="Override markup for this specific bundle"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Markup Override Input */}
                      {isMarkupOverrideOpen && (
                        <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Info className="h-4 w-4 text-blue-500" />
                            <span className="text-gray-600">
                              Override markup for this specific bundle
                              configuration
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <InputWithAdornment
                              type="number"
                              min="0"
                              step="0.01"
                              value={customMarkupAmount}
                              onChange={(e) =>
                                setCustomMarkupAmount(e.target.value)
                              }
                              placeholder="Enter custom markup"
                              leftAdornment="$"
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleMarkupOverride}
                              className="h-8 w-8 p-0 text-green-600"
                              title="Apply custom markup"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsMarkupOverrideOpen(false)}
                              className="h-8 w-8 p-0 text-red-600"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {hasMarkupOverride && (
                            <div className="flex items-center justify-between pt-2 border-t">
                              <span className="text-sm text-gray-600">
                                Current override active
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelMarkupOverride}
                                className="text-xs"
                              >
                                Remove Override
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-sm text-gray-500">
                        Fixed markup amount added to eSIM Go base cost.
                        {!hasMarkupOverride &&
                          " Values come from your markup configuration table."}
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Pricing Configuration Section */}
              <Collapsible
                open={isPricingConfigOpen}
                onOpenChange={setIsPricingConfigOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between p-4 h-auto"
                  >
                    <div className="text-left">
                      <div className="font-medium">Pricing Rules</div>
                      <div className="text-sm text-gray-500">
                        Discount: {formatPercentage(formData.discountRate)} •
                        Processing:{" "}
                        {formatPercentage(getCurrentProcessingRate())} •
                        Priority: {formData.priority}
                      </div>
                    </div>
                    {isPricingConfigOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-4">
                  <div>
                    <Label htmlFor="discountRate">Discount Rate</Label>
                    <InputWithAdornment
                      id="discountRate"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={Math.round(formData.discountRate * 100)}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          discountRate: parseFloat(e.target.value) / 100,
                        }))
                      }
                      rightAdornment="%"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Discount percentage (e.g., 30 for 30%)
                    </p>
                  </div>

                  <div>
                    <Label>Processing Rate</Label>
                    <div className="mt-2">
                      <Collapsible
                        open={isProcessingDetailsOpen}
                        onOpenChange={setIsProcessingDetailsOpen}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-lg">
                                {formatPercentage(getCurrentProcessingRate())}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {processingFeeConfig?.currentProcessingFeeConfiguration
                                  ? "Dynamic"
                                  : "Default"}
                              </Badge>
                            </div>
                            {isProcessingDetailsOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">
                                Processing Fee Details
                              </span>
                            </div>
                            {processingFeeConfig?.currentProcessingFeeConfiguration ? (
                              <div className="text-sm text-blue-800 space-y-1">
                                <p>
                                  <strong>Israeli Cards:</strong>{" "}
                                  {formatPercentage(
                                    processingFeeConfig
                                      .currentProcessingFeeConfiguration
                                      .israeliCardsRate
                                  )}
                                </p>
                                <p>
                                  <strong>Foreign Cards:</strong>{" "}
                                  {formatPercentage(
                                    processingFeeConfig
                                      .currentProcessingFeeConfiguration
                                      .foreignCardsRate
                                  )}
                                </p>
                                <p>
                                  <strong>Bit Payments:</strong>{" "}
                                  {formatPercentage(
                                    processingFeeConfig
                                      .currentProcessingFeeConfiguration
                                      .bitPaymentRate
                                  )}
                                </p>
                                <p>
                                  <strong>Premium Amex:</strong> +
                                  {formatPercentage(
                                    processingFeeConfig
                                      .currentProcessingFeeConfiguration
                                      .premiumAmexRate
                                  )}
                                </p>
                                <p>
                                  <strong>Premium Diners:</strong> +
                                  {formatPercentage(
                                    processingFeeConfig
                                      .currentProcessingFeeConfiguration
                                      .premiumDinersRate
                                  )}
                                </p>
                                <div className="mt-2 pt-2 border-t border-blue-200">
                                  <p className="text-xs text-blue-600">
                                    Rates are managed centrally in Processing
                                    Fee Configuration
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-blue-800">
                                <p>
                                  Using default processing rate of{" "}
                                  {formatPercentage(0.045)}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                  Configure dynamic rates in Processing Fee
                                  Management
                                </p>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Processing fee is managed centrally and updates
                      automatically
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <InputWithAdornment
                      id="priority"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          priority: parseInt(e.target.value),
                        }))
                      }
                      rightAdornment="priority"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Higher priority overrides lower priority
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, isActive: checked }))
                      }
                    />
                    <Label htmlFor="isActive">Active Configuration</Label>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>

          {/* Middle: Preview and Price Range */}
          <div className="w-1/3 p-6 border-r overflow-y-auto max-h-[65vh]">
            <h3 className="text-lg font-semibold mb-4">Preview & Analysis</h3>

            {/* Bundle Information */}
            {pricingData && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  Bundle Information
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <strong>Requested:</strong> {pricingData.duration} days
                  </p>
                  <p>
                    <strong>eSIM Go Bundle:</strong> {pricingData.bundleName}
                  </p>
                  <p>
                    <strong>eSIM Go Cost:</strong>{" "}
                    {formatCurrency(pricingData.cost)}
                  </p>
                  <p>
                    <strong>Our Markup:</strong>{" "}
                    {formatCurrency(getEffectiveMarkup())}{" "}
                    {hasMarkupOverride && (
                      <span className="text-orange-600">(Override)</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="space-y-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>eSIM Go Cost:</span>
                  <span>{formatCurrency(pricingData?.cost || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Our Markup:</span>
                  <span
                    className={
                      hasMarkupOverride ? "text-orange-600 font-medium" : ""
                    }
                  >
                    {formatCurrency(getEffectiveMarkup())}
                    {hasMarkupOverride && (
                      <span className="text-xs ml-1">(Override)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Cost:</span>
                  <span>
                    {pricingData
                      ? formatCurrency(
                          (pricingData.cost || 0) + getEffectiveMarkup()
                        )
                      : "$0.00"}
                  </span>
                </div>

                {/* Show unused days discount if applicable */}
                {pricingData && pricingData.bundleName.includes("days") && (
                  <div className="flex justify-between text-orange-600">
                    <span>Unused Days Discount:</span>
                    <span>
                      -
                      {formatCurrency(
                        (pricingData.cost + getEffectiveMarkup()) * 0.1
                      )}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>
                    Customer Discount ({formatPercentage(formData.discountRate)}
                    ):
                  </span>
                  <span className="text-green-600">
                    -{formatCurrency(previewDiscountValue)}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Price After Discount:</span>
                  <span className="text-blue-600">
                    {formatCurrency(previewPriceAfterDiscount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Processing ({formatPercentage(formData.processingRate)}):
                  </span>
                  <span className="text-yellow-600">
                    -{formatCurrency(previewProcessingCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Revenue After Processing:</span>
                  <span>{formatCurrency(previewRevenueAfterProcessing)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Final Revenue (Profit):</span>
                  <span className="text-green-600">
                    {formatCurrency(previewFinalRevenue)}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Price Range Analysis */}
            <div className="space-y-4">
              <div>
                <Label>Pricing Boundaries</Label>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Break-even:</span>
                      <Badge variant="destructive">
                        {formatCurrency(
                          previewCost + previewCostPlus + previewProcessingCost
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Current:</span>
                      <Badge variant="secondary">
                        {formatCurrency(previewPriceAfterDiscount)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Max Recommended:</span>
                      <Badge variant="outline">
                        {formatCurrency(priceRange[1])}
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Profit Margin:</strong>{" "}
                      {formatCurrency(previewFinalRevenue)}(
                      {previewFinalRevenue > 0 ? "+" : ""}
                      {(
                        (previewFinalRevenue /
                          (previewCost + previewCostPlus)) *
                        100
                      ).toFixed(1)}
                      %)
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Minimum profitable price:{" "}
                      {formatCurrency(
                        previewCost +
                          previewCostPlus +
                          previewProcessingCost +
                          0.01
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Price Simulator */}
          <div className="w-1/3 p-6 overflow-y-auto max-h-[65vh]">
            <h3 className="text-lg font-semibold mb-4">Price Simulator</h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="simulatorDays">Days: {simulatorDays}</Label>
                <div className="mt-3">
                  <SliderWithValue
                    value={[simulatorDays]}
                    onValueChange={(value) => setSimulatorDays(value[0])}
                    min={1}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Simulate pricing for 1-30 days (maximum eSIM Go bundle length)
                </p>
              </div>

              {/* Simulated Pricing Breakdown */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Simulated Pricing</h4>
                <div className="space-y-2 text-sm">
                  {(() => {
                    const bestBundle = getBestBundle(simulatorDays);
                    const unusedDays = Math.max(0, bestBundle - simulatorDays);
                    const unusedDaysDiscount =
                      unusedDays > 0 ? (unusedDays / bestBundle) * 0.1 : 0;
                    const basePrice = pricingData?.totalCost || 0;
                    const priceAfterUnusedDiscount =
                      basePrice * (1 - unusedDaysDiscount);
                    const finalPrice =
                      priceAfterUnusedDiscount * (1 - formData.discountRate);

                    return (
                      <>
                        <div className="flex justify-between">
                          <span>Days Requested:</span>
                          <Badge variant="outline">{simulatorDays}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Bundle Used:</span>
                          <span>UL essential {bestBundle} days</span>
                        </div>
                        {unusedDays > 0 && (
                          <div className="flex justify-between text-orange-600">
                            <span>Unused Days:</span>
                            <span>{unusedDays} days</span>
                          </div>
                        )}
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span>eSIM Go Cost:</span>
                          <span>{formatCurrency(pricingData?.cost || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            Our Markup (
                            {Math.round(
                              (formData.costSplitPercent /
                                (1 - formData.costSplitPercent)) *
                                100
                            )}
                            %):
                          </span>
                          <span>
                            {formatCurrency(pricingData?.costPlus || 0)}
                          </span>
                        </div>
                        {unusedDays > 0 && (
                          <div className="flex justify-between text-orange-600">
                            <span>
                              Unused Days Discount (
                              {(unusedDaysDiscount * 100).toFixed(1)}%):
                            </span>
                            <span>
                              -{formatCurrency(basePrice * unusedDaysDiscount)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>
                            Customer Discount (
                            {formatPercentage(formData.discountRate)}):
                          </span>
                          <span className="text-green-600">
                            -
                            {formatCurrency(
                              priceAfterUnusedDiscount * formData.discountRate
                            )}
                          </span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium text-lg">
                          <span>Final Price:</span>
                          <span className="text-blue-600">
                            {formatCurrency(finalPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Price per day:</span>
                          <span>
                            {formatCurrency(finalPrice / simulatorDays)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Quick Day Buttons */}
              <div>
                <Label>Quick Select</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[3, 5, 7, 10, 14, 21, 30].map((days) => (
                    <Button
                      key={days}
                      variant={simulatorDays === days ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSimulatorDays(days)}
                    >
                      {days}d
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Configuration"}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
