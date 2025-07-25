import {
  Button,
  Input,
  InputWithAdornment,
  Label,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  ScrollArea,
} from "@workspace/ui";
import React, { useState, useEffect } from "react";
import { DollarSign, Save, Loader2, Plus, Trash2, X, Check } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { z } from "zod";
import {
  GET_PRICING_RULES,
  CREATE_PRICING_RULE,
  UPDATE_PRICING_RULE,
  DELETE_PRICING_RULE,
  GET_BUNDLE_GROUPS,
} from "../lib/graphql/queries";
import { useMobile } from "../hooks/useMobile";

interface MarkupConfigItem {
  id?: string;
  bundleGroup: string;
  durationDays: number;
  markupAmount: number;
  isNew?: boolean;
}

// Helper functions to convert between markup configs and pricing rules
const convertMarkupConfigToPricingRule = (config: MarkupConfigItem) => ({
  type: 'SYSTEM_MARKUP' as const,
  name: `${config.bundleGroup} - ${config.durationDays} days`,
  description: `Fixed markup of $${config.markupAmount} for ${config.bundleGroup} ${config.durationDays}-day bundles`,
  conditions: [
    {
      field: 'bundleGroup',
      operator: 'EQUALS',
      value: config.bundleGroup
    },
    {
      field: 'duration',
      operator: 'EQUALS', 
      value: config.durationDays
    }
  ],
  actions: [
    {
      type: 'ADD_MARKUP',
      value: config.markupAmount,
      metadata: {}
    }
  ],
  priority: 100, // High priority for system rules
  isActive: true,
  isEditable: false // System markup rules are not editable through UI
});

const convertPricingRuleToMarkupConfig = (rule: any): MarkupConfigItem | null => {
  // Only process SYSTEM_MARKUP rules
  if (rule.type !== 'SYSTEM_MARKUP') return null;
  
  // Extract bundle group and duration from conditions
  const bundleGroupCondition = rule.conditions.find((c: any) => c.field === 'bundleGroup');
  const durationCondition = rule.conditions.find((c: any) => c.field === 'duration');
  
  // Extract markup amount from actions
  const markupAction = rule.actions.find((a: any) => a.type === 'ADD_MARKUP');
  
  if (!bundleGroupCondition || !durationCondition || !markupAction) {
    return null;
  }
  
  return {
    id: rule.id,
    bundleGroup: bundleGroupCondition.value,
    durationDays: durationCondition.value,
    markupAmount: markupAction.value,
  };
};

// Zod schema for validation
const markupConfigSchema = z.object({
  id: z.string().optional(),
  bundleGroup: z.string().min(1, "Bundle group is required"),
  durationDays: z.number()
    .min(1, "Duration must be at least 1 day")
    .max(365, "Duration cannot exceed 365 days")
    .int("Duration must be a whole number"),
  markupAmount: z.number()
    .min(0, "Markup amount cannot be negative")
    .max(1000, "Markup amount cannot exceed $1000")
    .multipleOf(0.01, "Markup amount must be a valid currency amount"),
  isNew: z.boolean().optional(),
});

// Form schema ready for future react-hook-form integration
const markupConfigFormSchema = z.object({
  configs: z.array(markupConfigSchema),
});

// Default markup configuration based on Excel table
const defaultMarkupConfig: MarkupConfigItem[] = [
  // Standard - Unlimited Lite
  { bundleGroup: "Standard - Unlimited Lite", durationDays: 1, markupAmount: 3.00 },
  { bundleGroup: "Standard - Unlimited Lite", durationDays: 3, markupAmount: 5.00 },
  { bundleGroup: "Standard - Unlimited Lite", durationDays: 5, markupAmount: 9.00 },
  { bundleGroup: "Standard - Unlimited Lite", durationDays: 7, markupAmount: 12.00 },
  { bundleGroup: "Standard - Unlimited Lite", durationDays: 10, markupAmount: 15.00 },
  { bundleGroup: "Standard - Unlimited Lite", durationDays: 15, markupAmount: 17.00 },
  { bundleGroup: "Standard - Unlimited Lite", durationDays: 30, markupAmount: 20.00 },
  
  // Standard - Unlimited Essential
  { bundleGroup: "Standard - Unlimited Essential", durationDays: 1, markupAmount: 4.00 },
  { bundleGroup: "Standard - Unlimited Essential", durationDays: 3, markupAmount: 6.00 },
  { bundleGroup: "Standard - Unlimited Essential", durationDays: 5, markupAmount: 10.00 },
  { bundleGroup: "Standard - Unlimited Essential", durationDays: 7, markupAmount: 13.00 },
  { bundleGroup: "Standard - Unlimited Essential", durationDays: 10, markupAmount: 16.00 },
  { bundleGroup: "Standard - Unlimited Essential", durationDays: 15, markupAmount: 18.00 },
  { bundleGroup: "Standard - Unlimited Essential", durationDays: 30, markupAmount: 21.00 },
];

const bundleGroupOptions = [
  "Standard - Unlimited Lite",
  "Standard - Unlimited Essential",
  "Standard Fixed",
  "Regional Bundles",
];

// Get available bundle groups that haven't been configured yet
const getAvailableBundleGroups = (allGroups: string[], configuredGroups: string[]) => {
  return allGroups.filter(group => !configuredGroups.includes(group));
};

export const MarkupTableManagement: React.FC = () => {
  // TODO: Add proper admin authentication when auth system is implemented
  const isAdmin = true; // Temporary - replace with actual admin check
  const isMobile = useMobile();
  const [markupConfig, setMarkupConfig] = useState<MarkupConfigItem[]>(defaultMarkupConfig);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Group selection state for two-column layout
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  
  // Inline editing state
  const [editingItem, setEditingItem] = useState<string | null>(null); // key: bundleGroup-durationDays
  const [editingValue, setEditingValue] = useState<string>("");
  
  // New bundle creation state
  const [creatingBundle, setCreatingBundle] = useState<string | null>(null); // bundleGroup currently creating for
  const [newBundleDays, setNewBundleDays] = useState<string>("");
  const [newBundlePrice, setNewBundlePrice] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");

  // GraphQL queries and mutations
  const { data: pricingRulesData, loading: loadingCurrent, refetch } = useQuery(
    GET_PRICING_RULES,
    {
      variables: {
        filter: { type: 'SYSTEM_MARKUP' }
      }
    }
  );
  
  const { data: bundleGroupsData, loading: loadingBundleGroups } = useQuery(
    GET_BUNDLE_GROUPS
  );

  const [createPricingRule] = useMutation(CREATE_PRICING_RULE);
  const [updatePricingRule] = useMutation(UPDATE_PRICING_RULE);
  const [deletePricingRule] = useMutation(DELETE_PRICING_RULE);

  // Load current configuration when data is available
  useEffect(() => {
    if (pricingRulesData?.pricingRules) {
      // Convert pricing rules to markup config items
      const config = pricingRulesData.pricingRules
        .map((rule: any) => convertPricingRuleToMarkupConfig(rule))
        .filter((config: MarkupConfigItem | null): config is MarkupConfigItem => config !== null);
      
      setMarkupConfig(config);
      setHasChanges(false);
    } else if (!loadingCurrent && (!pricingRulesData?.pricingRules || pricingRulesData.pricingRules.length === 0)) {
      // No current configuration exists, use defaults
      setMarkupConfig(defaultMarkupConfig);
      setHasChanges(false);
    }
  }, [pricingRulesData, loadingCurrent]);

  // Helper function to format currency with proper decimals
  const formatCurrencyForDisplay = (amount: number) => {
    return amount.toFixed(2);
  };

  // Save changes for specific bundle group in drawer
  const handleDrawerSave = async (bundleGroup: string) => {
    setContentSaving(true);
    try {
      // Filter items for this specific bundle group
      const groupItems = markupConfig.filter(item => item.bundleGroup === bundleGroup);
      const originalRules = pricingRulesData?.pricingRules || [];
      const errors: string[] = [];
      
      for (const item of groupItems) {
        const ruleInput = convertMarkupConfigToPricingRule(item);

        try {
          if (item.id && !item.isNew) {
            // Update existing pricing rule - only pass fields allowed in UpdatePricingRuleInput
            await updatePricingRule({
              variables: {
                id: item.id,
                input: {
                  name: ruleInput.name,
                  description: ruleInput.description,
                  conditions: ruleInput.conditions,
                  actions: ruleInput.actions,
                  priority: ruleInput.priority,
                  isActive: ruleInput.isActive,
                },
              },
            });
          } else {
            // Check if rule already exists before creating
            const existingRule = originalRules.find((rule: any) => {
              const bundleGroupCond = rule.conditions.find((c: any) => c.field === 'bundleGroup');
              const durationCond = rule.conditions.find((c: any) => c.field === 'duration');
              return bundleGroupCond?.value === item.bundleGroup && 
                     durationCond?.value === item.durationDays;
            });

            if (!existingRule) {
              await createPricingRule({
                variables: { input: ruleInput },
              });
            } else {
              // If it exists, update it instead - only pass fields allowed in UpdatePricingRuleInput
              await updatePricingRule({
                variables: {
                  id: existingRule.id,
                  input: {
                    name: ruleInput.name,
                    description: ruleInput.description,
                    conditions: ruleInput.conditions,
                    actions: ruleInput.actions,
                    priority: ruleInput.priority,
                    isActive: ruleInput.isActive,
                  },
                },
              });
            }
          }
        } catch (error: any) {
          const errorMessage = error?.message || 'Unknown error';
          errors.push(`${item.durationDays} days: ${errorMessage}`);
        }
      }

      // Handle deletions for this group
      if (pricingRulesData?.pricingRules) {
        const currentGroupIds = groupItems.filter(item => item.id).map(item => item.id);
        const originalGroupRules = pricingRulesData.pricingRules.filter((rule: any) => {
          const bundleGroupCond = rule.conditions.find((c: any) => c.field === 'bundleGroup');
          return bundleGroupCond?.value === bundleGroup;
        });
        const idsToDelete = originalGroupRules
          .map((rule: any) => rule.id)
          .filter((id: string) => !currentGroupIds.includes(id));
        
        for (const id of idsToDelete) {
          try {
            await deletePricingRule({
              variables: { id },
            });
          } catch (error: any) {
            errors.push(`Delete error: ${error?.message || 'Unknown error'}`);
          }
        }
      }

      // Refetch and update state
      await refetch();
      setHasChanges(false);
      
      if (errors.length > 0) {
        toast.error(`${bundleGroup} configuration saved with errors: ${errors.join(', ')}`);
      } else {
        toast.success(`${bundleGroup} configuration saved successfully`);
      }
      // Don't close drawer in new layout - user stays in the content panel
    } catch (error) {
      console.error("Error saving markup configuration:", error);
      toast.error("Error saving configuration");
    } finally {
      setContentSaving(false);
    }
  };

  // Discard changes for specific bundle group
  const handleDrawerDiscard = (bundleGroup: string) => {
    if (pricingRulesData?.pricingRules) {
      // Restore original configuration for this group from pricing rules
      const originalGroupItems = pricingRulesData.pricingRules
        .map((rule: any) => convertPricingRuleToMarkupConfig(rule))
        .filter((config: MarkupConfigItem | null): config is MarkupConfigItem => 
          config !== null && config.bundleGroup === bundleGroup
        );
      
      // Remove current group items and add back original ones
      const otherGroupItems = markupConfig.filter(item => item.bundleGroup !== bundleGroup);
      setMarkupConfig([...otherGroupItems, ...originalGroupItems]);
    } else {
      // If no original config, remove the group entirely (for newly added groups)
      setMarkupConfig(markupConfig.filter(item => item.bundleGroup !== bundleGroup));
    }
    
    setHasChanges(false);
    // Don't close drawer in new layout - user stays in the content panel
    toast.info(`Changes in ${bundleGroup} discarded`);
  };

  // Add new group functionality
  const handleAddGroup = (newSelectedGroup: string) => {
    // Add default markup configurations for the new group
    const newConfigs: MarkupConfigItem[] = [
      { bundleGroup: newSelectedGroup, durationDays: 1, markupAmount: 3.00, isNew: true },
      { bundleGroup: newSelectedGroup, durationDays: 3, markupAmount: 5.00, isNew: true },
      { bundleGroup: newSelectedGroup, durationDays: 5, markupAmount: 9.00, isNew: true },
      { bundleGroup: newSelectedGroup, durationDays: 7, markupAmount: 12.00, isNew: true },
      { bundleGroup: newSelectedGroup, durationDays: 10, markupAmount: 15.00, isNew: true },
      { bundleGroup: newSelectedGroup, durationDays: 15, markupAmount: 17.00, isNew: true },
      { bundleGroup: newSelectedGroup, durationDays: 30, markupAmount: 20.00, isNew: true },
    ];
    
    setMarkupConfig([...markupConfig, ...newConfigs]);
    setHasChanges(true);
    setShowAddGroupModal(false);
    
    // Select the newly added group in the right panel
    setSelectedGroup(newSelectedGroup);
  };

  // Get summary info for a bundle group
  const getGroupSummary = (items: MarkupConfigItem[]) => {
    const count = items.length;
    const minMarkup = Math.min(...items.map(item => item.markupAmount));
    const maxMarkup = Math.max(...items.map(item => item.markupAmount));
    const avgMarkup = items.reduce((sum, item) => sum + item.markupAmount, 0) / count;
    
    return {
      count,
      range: minMarkup === maxMarkup ? `$${minMarkup.toFixed(2)}` : `$${minMarkup.toFixed(2)} - $${maxMarkup.toFixed(2)}`,
      average: `$${avgMarkup.toFixed(2)}`
    };
  };

  // Group markup config by bundle group for better organization
  const groupedMarkupConfig = markupConfig.reduce((acc, item) => {
    if (!acc[item.bundleGroup]) {
      acc[item.bundleGroup] = [];
    }
    acc[item.bundleGroup].push(item);
    return acc;
  }, {} as Record<string, MarkupConfigItem[]>);

  // Sort items within each group by duration
  Object.keys(groupedMarkupConfig).forEach(group => {
    groupedMarkupConfig[group].sort((a, b) => a.durationDays - b.durationDays);
  });

  // Get available bundle groups (must be after groupedMarkupConfig is defined)
  const availableBundleGroups = bundleGroupsData?.pricingFilters?.groups
    ? getAvailableBundleGroups(
        bundleGroupsData.pricingFilters.groups.map(group => ({ group })),
        Object.keys(groupedMarkupConfig)
      )
    : [];

  // Set default selected group (first group or null if none exist)
  useEffect(() => {
    const groupKeys = Object.keys(groupedMarkupConfig);
    if (!selectedGroup && groupKeys.length > 0) {
      setSelectedGroup(groupKeys[0]);
    }
  }, [groupedMarkupConfig, selectedGroup]);

  // Bundle content component (reused in both desktop and mobile)
  const BundleContent = ({ bundleGroup, showHeader = true }: { bundleGroup: string, showHeader?: boolean }) => (
    <div className="flex flex-col h-full">
      {showHeader && (
        <div className="border-b pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{bundleGroup}</h3>
              <p className="text-sm text-gray-600">Fixed markup amounts in USD for different durations</p>
            </div>
            
            {/* Save/Discard buttons for selected group */}
            {hasChanges && bundleGroup && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDrawerDiscard(bundleGroup)}
                  disabled={contentSaving}
                  className="h-8 w-8 p-0 rounded-full"
                  title="Discard Changes"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleDrawerSave(bundleGroup)}
                  disabled={contentSaving || !isAdmin}
                  className="h-8 w-8 p-0 rounded-full"
                  title={contentSaving ? "Saving..." : "Save Changes"}
                >
                  {contentSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Save/Discard buttons for mobile (when header is hidden) */}
      {!showHeader && hasChanges && bundleGroup && (
        <div className="flex justify-end gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDrawerDiscard(bundleGroup)}
            disabled={contentSaving}
            className="h-8 px-3"
            title="Discard Changes"
          >
            <X className="h-4 w-4 mr-1" />
            Discard
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleDrawerSave(bundleGroup)}
            disabled={contentSaving || !isAdmin}
            className="h-8 px-3"
            title={contentSaving ? "Saving..." : "Save Changes"}
          >
            {contentSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {contentSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
      
      <ScrollArea className="flex-1" showOnHover={true}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Add Bundle Card - Dashed style matching Add Group */}
          {creatingBundle === bundleGroup ? (
            <TooltipProvider>
              <Tooltip open={!!validationError}>
                <TooltipTrigger asChild>
                  <div className={`border-2 border-dashed rounded-lg p-3 transition-all ${
                    validationError 
                      ? 'border-red-400 bg-red-50' 
                      : 'border-gray-300 bg-gray-50'
                  }`}>
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          validationError ? 'text-red-600' : 'text-gray-600'
                        }`}>New Bundle</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={discardNewBundle}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          value={newBundleDays}
                          onChange={(e) => handleNewBundleDaysChange(e.target.value, bundleGroup)}
                          placeholder="Days"
                          className={`text-sm ${
                            validationError ? 'border-red-300 focus:border-red-400' : ''
                          }`}
                          autoFocus
                        />
                        <InputWithAdornment
                          type="number"
                          step="0.01"
                          min="0"
                          value={newBundlePrice}
                          onChange={(e) => handleNewBundlePriceChange(e.target.value, bundleGroup)}
                          leftAdornment="$"
                          placeholder="0.00"
                          className={`text-sm ${
                            validationError ? 'border-red-300 focus:border-red-400' : ''
                          }`}
                        />
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => saveNewBundle(bundleGroup)}
                          className="w-full h-8"
                          disabled={!newBundleDays || !newBundlePrice || !!validationError}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-red-600 text-white border-red-600">
                  <p className="text-sm">{validationError}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div 
              className="border-2 border-dashed border-gray-300 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-lg p-3"
              onClick={() => startCreatingBundle(bundleGroup)}
            >
              <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
                <div className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors mb-2">
                  <Plus className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Add Bundle</span>
              </div>
            </div>
          )}

          {groupedMarkupConfig[bundleGroup]?.map((item) => {
            const globalIndex = markupConfig.findIndex(
              config => config.bundleGroup === item.bundleGroup && 
                       config.durationDays === item.durationDays
            );
            const editKey = `${item.bundleGroup}-${item.durationDays}`;
            const isEditing = editingItem === editKey;
            
            return (
              <div key={`${bundleGroup}-${item.durationDays}`} className="group border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{item.durationDays} days</span>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMarkup(globalIndex)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <InputWithAdornment
                          type="number"
                          step="0.5"
                          min="0"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          leftAdornment="$"
                          className="text-sm w-full"
                          placeholder="0.00"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveEdit(item.bundleGroup, item.durationDays);
                            } else if (e.key === 'Escape') {
                              discardEdit();
                            }
                          }}
                        />
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => saveEdit(item.bundleGroup, item.durationDays)}
                            className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={discardEdit}
                            className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="w-full p-2 cursor-pointer rounded hover:bg-gray-100 transition-colors text-center"
                        onClick={() => startEditing(item.bundleGroup, item.durationDays, item.markupAmount)}
                      >
                        <span className="text-lg font-semibold">${formatCurrencyForDisplay(item.markupAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {(!groupedMarkupConfig[bundleGroup] || groupedMarkupConfig[bundleGroup].length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <p>No configurations found for this group</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // Handle group selection
  const handleGroupSelect = (bundleGroup: string) => {
    setSelectedGroup(bundleGroup);
    // On mobile, open the bottom sheet
    if (isMobile) {
      setShowMobileSheet(true);
    }
  };

  // Inline editing functions
  const startEditing = (bundleGroup: string, durationDays: number, currentValue: number) => {
    const key = `${bundleGroup}-${durationDays}`;
    setEditingItem(key);
    setEditingValue(formatCurrencyForDisplay(currentValue));
  };

  const saveEdit = (bundleGroup: string, durationDays: number) => {
    const globalIndex = markupConfig.findIndex(
      config => config.bundleGroup === bundleGroup && config.durationDays === durationDays
    );
    
    if (globalIndex !== -1) {
      handleMarkupChange(globalIndex, "markupAmount", editingValue);
    }
    
    setEditingItem(null);
    setEditingValue("");
  };

  const discardEdit = () => {
    setEditingItem(null);
    setEditingValue("");
  };

  // New bundle creation functions
  const startCreatingBundle = (bundleGroup: string) => {
    setCreatingBundle(bundleGroup);
    setNewBundleDays("");
    setNewBundlePrice("");
    setValidationError("");
  };

  // Validate new bundle form in real-time
  const validateNewBundle = (bundleGroup: string, days: string, price: string): string => {
    if (!days && !price) {
      return "";
    }
    
    const daysNum = parseInt(days);
    const priceNum = parseFloat(price);
    
    if (days && (!daysNum || daysNum <= 0)) {
      return "Duration must be a positive number";
    }
    
    if (days && daysNum > 365) {
      return "Duration cannot exceed 365 days";
    }
    
    if (price && (!priceNum || priceNum < 0)) {
      return "Price must be a positive number";
    }
    
    if (price && priceNum > 1000) {
      return "Price cannot exceed $1000";
    }
    
    // Check for duplicate duration
    if (days) {
      const existingBundle = markupConfig.find(
        config => config.bundleGroup === bundleGroup && config.durationDays === daysNum
      );
      
      if (existingBundle) {
        return `A bundle with ${daysNum} days already exists`;
      }
    }
    
    return "";
  };

  const saveNewBundle = (bundleGroup: string) => {
    const error = validateNewBundle(bundleGroup, newBundleDays, newBundlePrice);
    
    if (error) {
      setValidationError(error);
      return;
    }

    const days = parseInt(newBundleDays);
    const price = parseFloat(newBundlePrice);
    
    if (!days || days <= 0 || !price || price < 0) {
      setValidationError("Please enter valid days and price values");
      return;
    }

    // Add new bundle to the configuration
    const newBundle: MarkupConfigItem = {
      bundleGroup,
      durationDays: days,
      markupAmount: price,
      isNew: true
    };

    setMarkupConfig([...markupConfig, newBundle]);
    setHasChanges(true);
    setCreatingBundle(null);
    setNewBundleDays("");
    setNewBundlePrice("");
    setValidationError("");
    toast.success(`New ${days}-day bundle added to ${bundleGroup}`);
  };

  const discardNewBundle = () => {
    setCreatingBundle(null);
    setNewBundleDays("");
    setNewBundlePrice("");
    setValidationError("");
  };

  // Real-time validation on input change
  const handleNewBundleDaysChange = (value: string, bundleGroup: string) => {
    setNewBundleDays(value);
    const error = validateNewBundle(bundleGroup, value, newBundlePrice);
    setValidationError(error);
  };

  const handleNewBundlePriceChange = (value: string, bundleGroup: string) => {
    setNewBundlePrice(value);
    const error = validateNewBundle(bundleGroup, newBundleDays, value);
    setValidationError(error);
  };

  // Handler for markup amount changes
  const handleMarkupChange = (index: number, field: keyof MarkupConfigItem, value: string | number) => {
    const newConfig = [...markupConfig];
    if (field === 'markupAmount' || field === 'durationDays') {
      newConfig[index] = {
        ...newConfig[index],
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value,
      };
    } else {
      newConfig[index] = {
        ...newConfig[index],
        [field]: value,
      };
    }
    setMarkupConfig(newConfig);
    setHasChanges(true);
  };

  // Remove markup configuration
  const handleRemoveMarkup = (index: number) => {
    const newConfig = markupConfig.filter((_, i) => i !== index);
    setMarkupConfig(newConfig);
    setHasChanges(true);
  };

  if (loadingCurrent) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading markup configuration...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Desktop: Two Column Layout, Mobile: Single Column */}
      <div className="flex-1 lg:flex lg:gap-6 min-h-0">
        {/* Group List - Full width on mobile, left column on desktop */}
        <div className="lg:w-80 lg:flex-shrink-0 lg:h-full lg:flex lg:flex-col">
          <ScrollArea className="lg:flex-1 lg:pr-2 lg:pl-1" showOnHover={true}>
            <div className="space-y-3">
              {/* Add Group Card */}
              {!loadingBundleGroups && availableBundleGroups.length > 0 && (
                <Card 
                  className="border-2 border-dashed border-gray-300 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer bg-gray-50 hover:bg-gray-100 h-16"
                  onClick={() => setShowAddGroupModal(true)}
                >
                  <CardHeader className="flex items-center justify-center h-full p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
                        <Plus className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Add Group</span>
                    </div>
                  </CardHeader>
                </Card>
              )}

              {/* Group Cards */}
              {Object.entries(groupedMarkupConfig).map(([bundleGroup, items]) => {
                const summary = getGroupSummary(items);
                const isSelected = selectedGroup === bundleGroup;
                
                return (
                  <Card 
                    key={bundleGroup} 
                    className={`hover:shadow-md transition-all cursor-pointer ${
                      isSelected 
                        ? 'lg:ring-2 lg:ring-blue-500 lg:border-blue-500 lg:bg-blue-50' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => handleGroupSelect(bundleGroup)}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">{bundleGroup}</CardTitle>
                      <CardDescription className="text-sm">
                        {summary.count} configs • Range: {summary.range} • Average: {summary.average}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Desktop: Right Column - Content Panel (hidden on mobile) */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col">
          {selectedGroup ? (
            <BundleContent bundleGroup={selectedGroup} showHeader={true} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="mb-4">
                  <DollarSign className="h-12 w-12 mx-auto text-gray-300" />
                </div>
                <p className="text-lg">Select or Create a Group</p>
                <p className="text-sm">Click on a group from the list or add a new group</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Bottom Sheet */}
      {isMobile && (
        <Sheet open={showMobileSheet} onOpenChange={setShowMobileSheet}>
        <SheetContent side="bottom" className="fixed bottom-0 left-0 right-0 max-h-[85vh] z-50 bg-background border-t rounded-t-lg">
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle className="text-left">{selectedGroup}</SheetTitle>
            <SheetDescription className="text-left">
              Fixed markup amounts in USD for different durations
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="px-6 pb-6 flex-1 max-h-[calc(85vh-120px)]" showOnHover={true}>
            {selectedGroup && <BundleContent bundleGroup={selectedGroup} showHeader={false} />}
          </ScrollArea>
        </SheetContent>
        </Sheet>
      )}

      {/* Add Group Dialog */}
      <Dialog open={showAddGroupModal} onOpenChange={setShowAddGroupModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bundle Group</DialogTitle>
            <DialogDescription>
              Select a bundle group to add to the pricing system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {availableBundleGroups.map((group) => (
              <Button
                key={group}
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => handleAddGroup(group)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {group}
              </Button>
            ))}
            {availableBundleGroups.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                All bundle groups have already been configured
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};