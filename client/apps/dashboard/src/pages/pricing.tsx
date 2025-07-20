import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  InputWithAdornment,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@workspace/ui";
import { Button } from "@workspace/ui/components/button";
import {
  Calculator, ChevronDown,
  ChevronRight, CreditCard, Loader2, Plus, RotateCcw, Save, Shield, Trash2
} from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  CountryBundle,
  CreateMarkupConfigInput,
  GetBundlesByCountryQuery,
  GetPricingConfigurationsQuery,
  GetPricingConfigurationsQueryVariables,
  MarkupConfig,
  ProcessingFeeConfigurationInput,
  UpdateMarkupConfigInput
} from "../__generated__/graphql";
import {
  BundlesByCountryWithBundles,
  CountryBundleWithDisplay,
  CountryPricingTableGrouped,
} from "../components/country-pricing-table-grouped";
import { PricingConfigDrawer } from "../components/pricing-config-drawer";
import { PricingSimulatorDrawer } from "../components/pricing-simulator-drawer";
import {
  CREATE_MARKUP_CONFIG,
  CREATE_PROCESSING_FEE_CONFIGURATION,
  DELETE_MARKUP_CONFIG,
  GET_BUNDLES_BY_COUNTRY,
  GET_COUNTRIES,
  GET_COUNTRY_BUNDLES,
  GET_CURRENT_PROCESSING_FEE_CONFIGURATION,
  GET_MARKUP_CONFIG,
  GET_PRICING_CONFIGURATIONS,
  UPDATE_MARKUP_CONFIG,
  UPDATE_PROCESSING_FEE_CONFIGURATION,
} from "../lib/graphql/queries";

// Default markup configuration based on Excel table
const defaultMarkupConfig: CreateMarkupConfigInput[] = [
  // Standard - Unlimited Lite
  {
    bundleGroup: "Standard - Unlimited Lite",
    durationDays: 1,
    markupAmount: 3.0,
  },
  {
    bundleGroup: "Standard - Unlimited Lite",
    durationDays: 3,
    markupAmount: 5.0,
  },
  {
    bundleGroup: "Standard - Unlimited Lite",
    durationDays: 5,
    markupAmount: 9.0,
  },
  {
    bundleGroup: "Standard - Unlimited Lite",
    durationDays: 7,
    markupAmount: 12.0,
  },
  {
    bundleGroup: "Standard - Unlimited Lite",
    durationDays: 10,
    markupAmount: 15.0,
  },
  {
    bundleGroup: "Standard - Unlimited Lite",
    durationDays: 15,
    markupAmount: 17.0,
  },
  {
    bundleGroup: "Standard - Unlimited Lite",
    durationDays: 30,
    markupAmount: 20.0,
  },

  // Standard - Unlimited Essential
  {
    bundleGroup: "Standard - Unlimited Essential",
    durationDays: 1,
    markupAmount: 4.0,
  },
  {
    bundleGroup: "Standard - Unlimited Essential",
    durationDays: 3,
    markupAmount: 6.0,
  },
  {
    bundleGroup: "Standard - Unlimited Essential",
    durationDays: 5,
    markupAmount: 10.0,
  },
  {
    bundleGroup: "Standard - Unlimited Essential",
    durationDays: 7,
    markupAmount: 13.0,
  },
  {
    bundleGroup: "Standard - Unlimited Essential",
    durationDays: 10,
    markupAmount: 16.0,
  },
  {
    bundleGroup: "Standard - Unlimited Essential",
    durationDays: 15,
    markupAmount: 18.0,
  },
  {
    bundleGroup: "Standard - Unlimited Essential",
    durationDays: 30,
    markupAmount: 21.0,
  },
];

const bundleGroupOptions = [
  "Standard - Unlimited Lite",
  "Standard - Unlimited Essential",
  "Standard Fixed",
  "Regional Bundles",
];

const defaultProcessingFees: ProcessingFeeConfigurationInput = {
  israeliCardsRate: 0.014, // 1.4% stored as decimal
  foreignCardsRate: 0.039, // 3.9% stored as decimal
  premiumDinersRate: 0.003, // 0.3% stored as decimal
  premiumAmexRate: 0.008, // 0.8% stored as decimal
  bitPaymentRate: 0.001, // 0.1% stored as decimal
  fixedFeeNIS: 0,
  fixedFeeForeign: 0,
  monthlyFixedCost: 0,
  bankWithdrawalFee: 9.9,
  monthlyMinimumFee: 0,
  setupCost: 250,
  threeDSecureFee: 0,
  chargebackFee: 50,
  cancellationFee: 30,
  invoiceServiceFee: 69,
  appleGooglePayFee: 0,
  effectiveFrom: new Date().toISOString(),
  effectiveTo: null,
  notes: "",
};

const PricingPage: React.FC = () => {
  const [countryGroups, setCountryGroups] = useState<
    BundlesByCountryWithBundles[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<CountryBundle | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // States for Markup tab
  const [markupConfig, setMarkupConfig] = useState<
    (MarkupConfig & { isNew?: boolean })[]
  >([]);
  const [markupHasChanges, setMarkupHasChanges] = useState(false);
  const [markupIsSubmitting, setMarkupIsSubmitting] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [isNewItemsOpen, setIsNewItemsOpen] = useState(true);

  // States for Processing Fee tab
  const [fees, setFees] = useState<ProcessingFeeConfigurationInput>(
    defaultProcessingFees
  );
  const [processingHasChanges, setProcessingHasChanges] = useState(false);
  const [processingIsSubmitting, setProcessingIsSubmitting] = useState(false);

  // TODO: Add proper admin authentication when auth system is implemented
  const isAdmin = true; // Temporary - replace with actual admin check

  // Fetch bundles by country data with aggregated pricing
  const {
    data: bundlesByCountryData,
    loading: bundlesLoading,
    error: bundlesError,
  } = useQuery<GetBundlesByCountryQuery>(GET_BUNDLES_BY_COUNTRY);
  const { data: countriesData } = useQuery(GET_COUNTRIES);
  const { refetch: refetchPricingConfigs } = useQuery<
    GetPricingConfigurationsQuery,
    GetPricingConfigurationsQueryVariables
  >(GET_PRICING_CONFIGURATIONS);
  const [getCountryBundles] = useLazyQuery(GET_COUNTRY_BUNDLES);

  // Markup configuration queries and mutations
  const {
    data: currentMarkupConfig,
    loading: loadingMarkup,
    refetch: refetchMarkup,
  } = useQuery(GET_MARKUP_CONFIG);
  const [createMarkupConfig] = useMutation(CREATE_MARKUP_CONFIG);
  const [updateMarkupConfig] = useMutation(UPDATE_MARKUP_CONFIG);
  const [deleteMarkupConfig] = useMutation(DELETE_MARKUP_CONFIG);

  // Processing fee configuration queries and mutations
  const {
    data: currentProcessingConfig,
    loading: loadingProcessing,
    refetch: refetchProcessing,
  } = useQuery(GET_CURRENT_PROCESSING_FEE_CONFIGURATION);
  const [createProcessingFeeConfig] = useMutation(
    CREATE_PROCESSING_FEE_CONFIGURATION
  );
  const [updateProcessingFeeConfig] = useMutation(
    UPDATE_PROCESSING_FEE_CONFIGURATION
  );

  // Set country groups from bundlesByCountry query
  useEffect(() => {
    if (bundlesByCountryData?.bundlesByCountry) {
      setCountryGroups(bundlesByCountryData.bundlesByCountry);
      setLoading(false);
    } else if (bundlesByCountryData && !bundlesByCountryData.bundlesByCountry) {
      setCountryGroups([]);
      setLoading(false);
    }
  }, [bundlesByCountryData]);

  // Load markup configuration
  useEffect(() => {
    if (currentMarkupConfig?.markupConfig) {
      const config = currentMarkupConfig.markupConfig.map(
        (item: MarkupConfig) => ({
          ...item,
          isNew: false,
        })
      );
      setMarkupConfig(config);
      setMarkupHasChanges(false);
    } else if (!loadingMarkup && !currentMarkupConfig?.markupConfig?.length) {
      // No current configuration exists, use defaults
      setMarkupConfig([]);
      setMarkupHasChanges(false);
    }
  }, [currentMarkupConfig, loadingMarkup]);

  // Load processing fee configuration
  useEffect(() => {
    if (currentProcessingConfig?.currentProcessingFeeConfiguration) {
      const config = currentProcessingConfig.currentProcessingFeeConfiguration;
      setFees({
        israeliCardsRate: config.israeliCardsRate,
        foreignCardsRate: config.foreignCardsRate,
        premiumDinersRate: config.premiumDinersRate,
        premiumAmexRate: config.premiumAmexRate,
        bitPaymentRate: config.bitPaymentRate,
        fixedFeeNIS: config.fixedFeeNIS,
        fixedFeeForeign: config.fixedFeeForeign,
        monthlyFixedCost: config.monthlyFixedCost,
        bankWithdrawalFee: config.bankWithdrawalFee,
        monthlyMinimumFee: config.monthlyMinimumFee,
        setupCost: config.setupCost,
        threeDSecureFee: config.threeDSecureFee,
        chargebackFee: config.chargebackFee,
        cancellationFee: config.cancellationFee,
        invoiceServiceFee: config.invoiceServiceFee,
        appleGooglePayFee: config.appleGooglePayFee,
        effectiveFrom: new Date().toISOString(),
        effectiveTo: null,
        notes: "",
      });
      setProcessingHasChanges(false);
    } else if (
      !loadingProcessing &&
      !currentProcessingConfig?.currentProcessingFeeConfiguration
    ) {
      setFees(defaultProcessingFees);
      setProcessingHasChanges(false);
    }
  }, [currentProcessingConfig, loadingProcessing]);

  // Update loading and error states
  useEffect(() => {
    setLoading(bundlesLoading);
    if (bundlesError) {
      setError(bundlesError.message);
    } else {
      setError(null);
    }
  }, [bundlesLoading, bundlesError]);

  // Lazy load bundles for a country when expanded
  const handleExpandCountry = async (countryId: string) => {
    try {
      const result = await getCountryBundles({
        variables: {
          countryId: countryId,
        },
      });

      if (result.data?.countryBundles) {
        const bundles: CountryBundleWithDisplay[] = result.data.countryBundles;

        setCountryGroups((prev) =>
          prev.map((group) =>
            group.countryId === countryId
              ? {
                  ...group,
                  bundles,
                  totalBundles: bundles.length,
                  lastFetched: new Date().toISOString(),
                }
              : group
          )
        );
      }
    } catch (error) {
      console.error("Error fetching bundles for country:", countryId, error);
    }
  };

  // Handle bundle click to open drawer - use useCallback for stability
  const handleBundleClick = useCallback((bundle: CountryBundle) => {    
      setSelectedRow(() => bundle);
      setIsDrawerOpen(() => true);
  }, []);

  // Handle drawer close - use useCallback for stability
  const handleDrawerClose = useCallback(() => {
    console.log("Pricing page: closing drawer");
    
    setIsDrawerOpen(() => false);
    setSelectedRow(() => null);
  }, []);

  // Handle configuration saved
  const handleConfigurationSaved = () => {
    refetchPricingConfigs();
    setCountryGroups([]);
    setLoading(true);
  };

  // Markup configuration helpers
  const formatCurrencyForDisplay = (amount: number) => {
    return amount.toFixed(2);
  };

  const toggleGroup = (bundleGroup: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [bundleGroup]: !prev[bundleGroup],
    }));
  };

  const getGroupSummary = (items: MarkupConfig[]) => {
    const count = items.length;
    const minMarkup = Math.min(...items.map((item) => item.markupAmount));
    const maxMarkup = Math.max(...items.map((item) => item.markupAmount));
    const avgMarkup =
      items.reduce((sum, item) => sum + item.markupAmount, 0) / count;

    return {
      count,
      range:
        minMarkup === maxMarkup
          ? `$${minMarkup.toFixed(2)}`
          : `$${minMarkup.toFixed(2)} - $${maxMarkup.toFixed(2)}`,
      average: `$${avgMarkup.toFixed(2)}`,
    };
  };

  const groupedMarkupConfig = markupConfig.reduce((acc, item) => {
    if (!acc[item.bundleGroup]) {
      acc[item.bundleGroup] = [];
    }
    acc[item.bundleGroup].push(item);
    return acc;
  }, {} as Record<string, (MarkupConfig & { isNew?: boolean })[]>);

  Object.keys(groupedMarkupConfig).forEach((group) => {
    groupedMarkupConfig[group].sort((a, b) => a.durationDays - b.durationDays);
  });

  const handleMarkupChange = (
    index: number,
    field: keyof MarkupConfig,
    value: string | number
  ) => {
    const newConfig = [...markupConfig];
    if (field === "markupAmount" || field === "durationDays") {
      newConfig[index] = {
        ...newConfig[index],
        [field]: typeof value === "string" ? parseFloat(value) || 0 : value,
      };
    } else {
      newConfig[index] = {
        ...newConfig[index],
        [field]: value,
      };
    }
    setMarkupConfig(newConfig);
    setMarkupHasChanges(true);
  };

  const handleAddMarkup = () => {
    const newMarkup: MarkupConfig & { isNew?: boolean } = {
      id: `new-${Date.now()}`,
      bundleGroup: bundleGroupOptions[0],
      durationDays: 1,
      markupAmount: 5.0,
      isNew: true,
    };
    setMarkupConfig([...markupConfig, newMarkup]);
    setMarkupHasChanges(true);
  };

  const handleRemoveMarkup = (index: number) => {
    const newConfig = markupConfig.filter((_, i) => i !== index);
    setMarkupConfig(newConfig);
    setMarkupHasChanges(true);
  };

  const handleSaveMarkup = async () => {
    if (!markupHasChanges) return;

    setMarkupIsSubmitting(true);
    try {
      for (const item of markupConfig) {
        const input: CreateMarkupConfigInput = {
          bundleGroup: item.bundleGroup,
          durationDays: item.durationDays,
          markupAmount: item.markupAmount,
        };

        if (!item.isNew && item.id && !item.id.startsWith("new-")) {
          await updateMarkupConfig({
            variables: {
              id: item.id,
              input: input as UpdateMarkupConfigInput,
            },
          });
        } else {
          await createMarkupConfig({
            variables: { input },
          });
        }
      }

      if (currentMarkupConfig?.markupConfig) {
        const currentIds = markupConfig
          .filter((item) => item.id && !item.id.startsWith("new-"))
          .map((item) => item.id);
        const originalIds = currentMarkupConfig.markupConfig.map(
          (item: MarkupConfig) => item.id
        );
        const idsToDelete = originalIds.filter(
          (id: string) => !currentIds.includes(id)
        );

        for (const id of idsToDelete) {
          await deleteMarkupConfig({
            variables: { id },
          });
        }
      }

      await refetchMarkup();

      setMarkupHasChanges(false);
      toast.success("תצורת המארק-אפ נשמרה בהצלחה");
    } catch (error) {
      console.error("Error saving markup configuration:", error);
      toast.error("אירעה שגיאה בשמירת תצורת המארק-אפ");
    } finally {
      setMarkupIsSubmitting(false);
    }
  };

  const handleResetMarkup = () => {
    setMarkupConfig(
      defaultMarkupConfig.map((item, index) => ({
        ...item,
        id: `new-${index}`,
        isNew: true,
      }))
    );
    setMarkupHasChanges(true);
  };

  // Processing fee helpers
  const formatPercentageForDisplay = (decimal: number) => {
    return (decimal * 100).toFixed(1);
  };

  const parsePercentageFromDisplay = (percentage: string) => {
    return (parseFloat(percentage) || 0) / 100;
  };

  const handlePercentageChange = (
    field: keyof ProcessingFeeConfigurationInput,
    value: string
  ) => {
    const decimalValue = parsePercentageFromDisplay(value);
    setFees((prev) => ({
      ...prev,
      [field]: decimalValue,
    }));
    setProcessingHasChanges(true);
  };

  const handleCurrencyChange = (
    field: keyof ProcessingFeeConfigurationInput,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setFees((prev) => ({
      ...prev,
      [field]: numValue,
    }));
    setProcessingHasChanges(true);
  };

  const handleSaveProcessingFees = async () => {
    if (!processingHasChanges) return;

    setProcessingIsSubmitting(true);
    try {
      const input: ProcessingFeeConfigurationInput = {
        ...fees,
        effectiveFrom: new Date().toISOString(),
        notes: `Updated on ${new Date().toLocaleDateString("he-IL")}`,
      };

      if (currentProcessingConfig?.currentProcessingFeeConfiguration) {
        await updateProcessingFeeConfig({
          variables: {
            id: currentProcessingConfig.currentProcessingFeeConfiguration.id,
            input,
          },
        });
      } else {
        await createProcessingFeeConfig({
          variables: { input },
        });
      }

      await refetchProcessing();

      setProcessingHasChanges(false);
      toast.success("הגדרות עמלות הסליקה נשמרו בהצלחה");
    } catch (error) {
      console.error("Error saving processing fee configuration:", error);
      toast.error("אירעה שגיאה בשמירת הגדרות עמלות הסליקה");
    } finally {
      setProcessingIsSubmitting(false);
    }
  };

  const handleResetProcessingFees = () => {
    setFees(defaultProcessingFees);
    setProcessingHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">
          Loading pricing data from eSIM Go API...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            {countryGroups.length} countries
          </div>
          <Button
            onClick={() => setIsSimulatorOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Pricing Simulator
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-fit">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="markup">Markup</TabsTrigger>
          <TabsTrigger value="processing">Processing Fee</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4 mt-6">
          <CountryPricingTableGrouped
            bundlesByCountry={countryGroups}
            onBundleClick={handleBundleClick}
            onExpandCountry={handleExpandCountry}
          />
        </TabsContent>

        <TabsContent value="markup" className="space-y-4 mt-6" dir="rtl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">ניהול טבלת מארק-אפ</h2>
              <Shield
                className="h-4 w-4 text-amber-500"
                title="נדרשות הרשאות מנהל"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleResetMarkup}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                איפוס לברירת מחדל
              </Button>
              <Button
                onClick={handleSaveMarkup}
                disabled={
                  !markupHasChanges ||
                  markupIsSubmitting ||
                  loadingMarkup ||
                  !isAdmin
                }
                className="flex items-center gap-2"
              >
                {markupIsSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {markupIsSubmitting ? "שומר..." : "שמירה"}
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            עדכן את סכומי המארק-אפ הקבועים לכל קבוצת חבילות ומשך זמן (נדרשות
            הרשאות מנהל)
          </div>

          {loadingMarkup ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">טוען תצורת מארק-אפ...</span>
            </div>
          ) : (
            <>
              {Object.entries(groupedMarkupConfig).map(
                ([bundleGroup, items]) => {
                  const summary = getGroupSummary(items);
                  const isCollapsed = collapsedGroups[bundleGroup];

                  return (
                    <Card key={bundleGroup}>
                      <Collapsible
                        open={!isCollapsed}
                        onOpenChange={() => toggleGroup(bundleGroup)}
                      >
                        <CollapsibleTrigger asChild>
                          <CardHeader className="hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  {bundleGroup}
                                  {isCollapsed ? (
                                    <ChevronRight className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </CardTitle>
                                <CardDescription>
                                  {isCollapsed
                                    ? `${summary.count} תצורות • טווח: ${summary.range} • ממוצע: ${summary.average}`
                                    : "סכומי מארק-אפ קבועים בדולרים עבור משכי זמן שונים"}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                              {items.map((item, itemIndex) => {
                                const globalIndex = markupConfig.findIndex(
                                  (config) =>
                                    config.bundleGroup === item.bundleGroup &&
                                    config.durationDays === item.durationDays
                                );

                                return (
                                  <div
                                    key={`${bundleGroup}-${item.durationDays}`}
                                    className="space-y-2 p-3 border rounded-lg"
                                  >
                                    <div className="flex items-center justify-between">
                                      <Label className="text-xs font-medium">
                                        {item.durationDays} ימים
                                      </Label>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleRemoveMarkup(globalIndex)
                                        }
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>

                                    <div className="space-y-1">
                                      <Label
                                        htmlFor={`duration-${globalIndex}`}
                                        className="text-xs"
                                      >
                                        משך זמן (ימים)
                                      </Label>
                                      <Input
                                        id={`duration-${globalIndex}`}
                                        type="number"
                                        min="1"
                                        value={item.durationDays}
                                        onChange={(e) =>
                                          handleMarkupChange(
                                            globalIndex,
                                            "durationDays",
                                            e.target.value
                                          )
                                        }
                                        className="text-sm"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <Label
                                        htmlFor={`markup-${globalIndex}`}
                                        className="text-xs"
                                      >
                                        מארק-אפ ($)
                                      </Label>
                                      <InputWithAdornment
                                        id={`markup-${globalIndex}`}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formatCurrencyForDisplay(
                                          item.markupAmount
                                        )}
                                        onChange={(e) =>
                                          handleMarkupChange(
                                            globalIndex,
                                            "markupAmount",
                                            e.target.value
                                          )
                                        }
                                        leftAdornment="$"
                                        className="text-sm"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  );
                }
              )}

              <Card>
                <Collapsible
                  open={isAddSectionOpen}
                  onOpenChange={setIsAddSectionOpen}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="hover:bg-gray-50 cursor-pointer">
                      <CardTitle className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        הוסף תצורת מארק-אפ חדשה
                        {isAddSectionOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </CardTitle>
                      {!isAddSectionOpen && (
                        <CardDescription>
                          לחץ כאן כדי להוסיף תצורות מארק-אפ חדשות
                        </CardDescription>
                      )}
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <Button
                        variant="outline"
                        onClick={handleAddMarkup}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        הוסף מארק-אפ חדש
                      </Button>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {markupConfig.filter((item) => item.isNew).length > 0 && (
                <Card>
                  <Collapsible
                    open={isNewItemsOpen}
                    onOpenChange={setIsNewItemsOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="hover:bg-gray-50 cursor-pointer">
                        <CardTitle className="flex items-center gap-2">
                          תצורות חדשות (לא נשמרו)
                          {isNewItemsOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </CardTitle>
                        <CardDescription>
                          {isNewItemsOpen
                            ? "תצורות אלו ייווספו כאשר תשמור את השינויים"
                            : `${
                                markupConfig.filter((item) => item.isNew).length
                              } תצורות חדשות ממתינות לשמירה`}
                        </CardDescription>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="space-y-3">
                          {markupConfig.map((item, index) => {
                            if (!item.isNew) return null;

                            return (
                              <div
                                key={index}
                                className="flex items-end gap-3 p-3 bg-blue-50 rounded-lg"
                              >
                                <div className="space-y-1 flex-1">
                                  <Label className="text-xs">
                                    קבוצת חבילות
                                  </Label>
                                  <Select
                                    value={item.bundleGroup}
                                    onValueChange={(value) =>
                                      handleMarkupChange(
                                        index,
                                        "bundleGroup",
                                        value
                                      )
                                    }
                                  >
                                    <SelectTrigger className="text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {bundleGroupOptions.map((option) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-1">
                                  <Label
                                    htmlFor={`new-duration-${index}`}
                                    className="text-xs"
                                  >
                                    ימים
                                  </Label>
                                  <Input
                                    id={`new-duration-${index}`}
                                    type="number"
                                    min="1"
                                    value={item.durationDays}
                                    onChange={(e) =>
                                      handleMarkupChange(
                                        index,
                                        "durationDays",
                                        e.target.value
                                      )
                                    }
                                    className="w-20 text-sm"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label
                                    htmlFor={`new-markup-${index}`}
                                    className="text-xs"
                                  >
                                    מארק-אפ ($)
                                  </Label>
                                  <InputWithAdornment
                                    id={`new-markup-${index}`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formatCurrencyForDisplay(
                                      item.markupAmount
                                    )}
                                    onChange={(e) =>
                                      handleMarkupChange(
                                        index,
                                        "markupAmount",
                                        e.target.value
                                      )
                                    }
                                    leftAdornment="$"
                                    className="w-24 text-sm"
                                  />
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveMarkup(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="processing" className="space-y-4 mt-6" dir="rtl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              ניהול עמלות סליקה
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleResetProcessingFees}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                איפוס לברירת מחדל
              </Button>
              <Button
                onClick={handleSaveProcessingFees}
                disabled={
                  !processingHasChanges ||
                  processingIsSubmitting ||
                  loadingProcessing
                }
                className="flex items-center gap-2"
              >
                {processingIsSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {processingIsSubmitting ? "שומר..." : "שמירה"}
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            עדכן את פרמטרי העמלות בהתאם להצעת המחיר שקיבלת מספק הסליקה
          </div>

          {loadingProcessing ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">טוען הגדרות עמלות...</span>
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>תעריפי עמלות סליקה ועלויות שוטפות</CardTitle>
                  <CardDescription>
                    עמלות בסיסיות על פי סוג כרטיס ומקור הנפקה
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor="israeliCards"
                        className="text-xs font-medium"
                      >
                        כרטיסים ישראליים
                      </Label>
                      <InputWithAdornment
                        id="israeliCards"
                        type="number"
                        step="0.1"
                        value={formatPercentageForDisplay(
                          fees.israeliCardsRate
                        )}
                        onChange={(e) =>
                          handlePercentageChange(
                            "israeliCardsRate",
                            e.target.value
                          )
                        }
                        placeholder="1.4"
                        rightAdornment="%"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="foreignCards"
                        className="text-xs font-medium"
                      >
                        כרטיסים זרים
                      </Label>
                      <InputWithAdornment
                        id="foreignCards"
                        type="number"
                        step="0.1"
                        value={formatPercentageForDisplay(
                          fees.foreignCardsRate
                        )}
                        onChange={(e) =>
                          handlePercentageChange(
                            "foreignCardsRate",
                            e.target.value
                          )
                        }
                        placeholder="3.9"
                        rightAdornment="%"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="premiumDiners"
                        className="text-xs font-medium"
                      >
                        תוספת דיינרס
                      </Label>
                      <InputWithAdornment
                        id="premiumDiners"
                        type="number"
                        step="0.1"
                        value={formatPercentageForDisplay(
                          fees.premiumDinersRate
                        )}
                        onChange={(e) =>
                          handlePercentageChange(
                            "premiumDinersRate",
                            e.target.value
                          )
                        }
                        placeholder="0.3"
                        rightAdornment="%"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="premiumAmex"
                        className="text-xs font-medium"
                      >
                        תוספת אמקס
                      </Label>
                      <InputWithAdornment
                        id="premiumAmex"
                        type="number"
                        step="0.1"
                        value={formatPercentageForDisplay(fees.premiumAmexRate)}
                        onChange={(e) =>
                          handlePercentageChange(
                            "premiumAmexRate",
                            e.target.value
                          )
                        }
                        placeholder="0.8"
                        rightAdornment="%"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="bitPayment"
                        className="text-xs font-medium"
                      >
                        תשלום ביט
                      </Label>
                      <InputWithAdornment
                        id="bitPayment"
                        type="number"
                        step="0.1"
                        value={formatPercentageForDisplay(fees.bitPaymentRate)}
                        onChange={(e) =>
                          handlePercentageChange(
                            "bitPaymentRate",
                            e.target.value
                          )
                        }
                        placeholder="0.1"
                        rightAdornment="%"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>עמלות קבועות</CardTitle>
                  <CardDescription>
                    עמלות קבועות ועלויות חודשיות
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor="fixedFeeNIS"
                        className="text-xs font-medium"
                      >
                        עמלה קבועה ש"ח
                      </Label>
                      <InputWithAdornment
                        id="fixedFeeNIS"
                        type="number"
                        step="0.01"
                        value={formatCurrencyForDisplay(fees.fixedFeeNIS)}
                        onChange={(e) =>
                          handleCurrencyChange("fixedFeeNIS", e.target.value)
                        }
                        placeholder="0.00"
                        leftAdornment="₪"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="fixedFeeForeign"
                        className="text-xs font-medium"
                      >
                        עמלה קבועה מט"ח
                      </Label>
                      <InputWithAdornment
                        id="fixedFeeForeign"
                        type="number"
                        step="0.01"
                        value={formatCurrencyForDisplay(fees.fixedFeeForeign)}
                        onChange={(e) =>
                          handleCurrencyChange(
                            "fixedFeeForeign",
                            e.target.value
                          )
                        }
                        placeholder="0.00"
                        leftAdornment="₪"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="monthlyFixedCost"
                        className="text-xs font-medium"
                      >
                        עלות חודשית
                      </Label>
                      <InputWithAdornment
                        id="monthlyFixedCost"
                        type="number"
                        step="0.01"
                        value={formatCurrencyForDisplay(fees.monthlyFixedCost)}
                        onChange={(e) =>
                          handleCurrencyChange(
                            "monthlyFixedCost",
                            e.target.value
                          )
                        }
                        placeholder="0.00"
                        leftAdornment="₪"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="bankWithdrawalFee"
                        className="text-xs font-medium"
                      >
                        משיכה לבנק
                      </Label>
                      <InputWithAdornment
                        id="bankWithdrawalFee"
                        type="number"
                        step="0.01"
                        value={formatCurrencyForDisplay(fees.bankWithdrawalFee)}
                        onChange={(e) =>
                          handleCurrencyChange(
                            "bankWithdrawalFee",
                            e.target.value
                          )
                        }
                        placeholder="9.90"
                        leftAdornment="₪"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="monthlyMinimumFee"
                        className="text-xs font-medium"
                      >
                        מינימום חודשי
                      </Label>
                      <InputWithAdornment
                        id="monthlyMinimumFee"
                        type="number"
                        step="0.01"
                        value={formatCurrencyForDisplay(fees.monthlyMinimumFee)}
                        onChange={(e) =>
                          handleCurrencyChange(
                            "monthlyMinimumFee",
                            e.target.value
                          )
                        }
                        placeholder="0.00"
                        leftAdornment="₪"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="setupCost"
                        className="text-xs font-medium"
                      >
                        עלות הקמה
                      </Label>
                      <InputWithAdornment
                        id="setupCost"
                        type="number"
                        step="0.01"
                        value={formatCurrencyForDisplay(fees.setupCost)}
                        onChange={(e) =>
                          handleCurrencyChange("setupCost", e.target.value)
                        }
                        placeholder="250.00"
                        leftAdornment="₪"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>שירותי ערך מוסף</CardTitle>
                  <CardDescription>
                    עמלות נוספות עבור שירותים מתקדמים
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor="threeDSecureFee"
                        className="text-xs font-medium"
                      >
                        3DSecure
                      </Label>
                      <InputWithAdornment
                        id="threeDSecureFee"
                        type="number"
                        step="0.01"
                        value={formatCurrencyForDisplay(fees.threeDSecureFee)}
                        onChange={(e) =>
                          handleCurrencyChange(
                            "threeDSecureFee",
                            e.target.value
                          )
                        }
                        placeholder="0.00"
                        leftAdornment="₪"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="chargebackFee"
                        className="text-xs font-medium"
                      >
                        הכחשות עסקה
                      </Label>
                      <InputWithAdornment
                        id="chargebackFee"
                        type="number"
                        step="0.01"
                        value={formatCurrencyForDisplay(fees.chargebackFee)}
                        onChange={(e) =>
                          handleCurrencyChange("chargebackFee", e.target.value)
                        }
                        placeholder="50.00"
                        leftAdornment="₪"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="cancellationFee"
                        className="text-xs font-medium"
                      >
                        ביטול עסקה
                      </Label>
                      <InputWithAdornment
                        id="cancellationFee"
                        type="number"
                        step="0.01"
                        value={formatCurrencyForDisplay(fees.cancellationFee)}
                        onChange={(e) =>
                          handleCurrencyChange(
                            "cancellationFee",
                            e.target.value
                          )
                        }
                        placeholder="30.00"
                        leftAdornment="₪"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="invoiceServiceFee"
                        className="text-xs font-medium"
                      >
                        חשבוניות/קבלות
                      </Label>
                      <InputWithAdornment
                        id="invoiceServiceFee"
                        type="number"
                        step="0.01"
                        value={formatCurrencyForDisplay(fees.invoiceServiceFee)}
                        onChange={(e) =>
                          handleCurrencyChange(
                            "invoiceServiceFee",
                            e.target.value
                          )
                        }
                        placeholder="69.00"
                        leftAdornment="₪"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="appleGooglePayFee"
                        className="text-xs font-medium"
                      >
                        Apple/Google Pay
                      </Label>
                      <InputWithAdornment
                        id="appleGooglePayFee"
                        type="number"
                        step="0.01"
                        value={formatCurrencyForDisplay(fees.appleGooglePayFee)}
                        onChange={(e) =>
                          handleCurrencyChange(
                            "appleGooglePayFee",
                            e.target.value
                          )
                        }
                        placeholder="0.00"
                        leftAdornment="₪"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Drawer for pricing configuration */}
      <PricingConfigDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        pricingData={selectedRow}
        onConfigurationSaved={handleConfigurationSaved}
      />

      {/* Pricing Simulator Drawer */}
      <PricingSimulatorDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        countries={countriesData?.countries || []}
      />
    </div>
  );
};

export default PricingPage;
