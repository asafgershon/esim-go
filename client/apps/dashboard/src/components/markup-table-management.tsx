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
} from "@workspace/ui";
import React, { useState, useEffect } from "react";
import { DollarSign, Save, Loader2, Plus, Trash2, X, Check } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { z } from "zod";
import {
  GET_MARKUP_CONFIG,
  CREATE_MARKUP_CONFIG,
  UPDATE_MARKUP_CONFIG,
  DELETE_MARKUP_CONFIG,
  GET_BUNDLE_GROUPS,
} from "../lib/graphql/queries";

interface MarkupConfigItem {
  id?: string;
  bundleGroup: string;
  durationDays: number;
  markupAmount: number;
  isNew?: boolean;
}

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
  const [markupConfig, setMarkupConfig] = useState<MarkupConfigItem[]>(defaultMarkupConfig);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Group selection state for two-column layout
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  
  // Inline editing state
  const [editingItem, setEditingItem] = useState<string | null>(null); // key: bundleGroup-durationDays
  const [editingValue, setEditingValue] = useState<string>("");

  // GraphQL queries and mutations
  const { data: currentConfig, loading: loadingCurrent, refetch } = useQuery(
    GET_MARKUP_CONFIG
  );
  
  const { data: bundleGroupsData, loading: loadingBundleGroups } = useQuery(
    GET_BUNDLE_GROUPS
  );

  const [createMarkupConfig] = useMutation(CREATE_MARKUP_CONFIG);
  const [updateMarkupConfig] = useMutation(UPDATE_MARKUP_CONFIG);
  const [deleteMarkupConfig] = useMutation(DELETE_MARKUP_CONFIG);

  // Load current configuration when data is available
  useEffect(() => {
    if (currentConfig?.markupConfig) {
      const config = currentConfig.markupConfig.map((item: any) => ({
        id: item.id,
        bundleGroup: item.bundleGroup,
        durationDays: item.durationDays,
        markupAmount: item.markupAmount,
      }));
      setMarkupConfig(config);
      setHasChanges(false);
    } else if (!loadingCurrent && !currentConfig?.markupConfig?.length) {
      // No current configuration exists, use defaults
      setMarkupConfig(defaultMarkupConfig);
      setHasChanges(false);
    }
  }, [currentConfig, loadingCurrent]);

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
      const originalConfigs = currentConfig?.markupConfig || [];
      const errors: string[] = [];
      
      for (const item of groupItems) {
        const input = {
          bundleGroup: item.bundleGroup,
          durationDays: item.durationDays,
          markupAmount: item.markupAmount,
        };

        try {
          if (item.id && !item.isNew) {
            // Update existing configuration
            await updateMarkupConfig({
              variables: {
                id: item.id,
                input,
              },
            });
          } else {
            // Check if configuration already exists before creating
            const existingConfig = originalConfigs.find((config: any) => 
              config.bundleGroup === item.bundleGroup && 
              config.durationDays === item.durationDays
            );

            if (!existingConfig) {
              await createMarkupConfig({
                variables: { input },
              });
            } else {
              // If it exists, update it instead
              await updateMarkupConfig({
                variables: {
                  id: existingConfig.id,
                  input,
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
      if (currentConfig?.markupConfig) {
        const currentGroupIds = groupItems.filter(item => item.id).map(item => item.id);
        const originalGroupItems = currentConfig.markupConfig.filter((item: any) => item.bundleGroup === bundleGroup);
        const idsToDelete = originalGroupItems
          .map((item: any) => item.id)
          .filter((id: string) => !currentGroupIds.includes(id));
        
        for (const id of idsToDelete) {
          try {
            await deleteMarkupConfig({
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
    if (currentConfig?.markupConfig) {
      // Restore original configuration for this group
      const originalGroupItems = currentConfig.markupConfig
        .filter((item: any) => item.bundleGroup === bundleGroup)
        .map((item: any) => ({
          id: item.id,
          bundleGroup: item.bundleGroup,
          durationDays: item.durationDays,
          markupAmount: item.markupAmount,
        }));
      
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
  const availableBundleGroups = bundleGroupsData?.bundleGroups
    ? getAvailableBundleGroups(
        bundleGroupsData.bundleGroups,
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

  // Handle group selection
  const handleGroupSelect = (bundleGroup: string) => {
    setSelectedGroup(bundleGroup);
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
    <div className="space-y-6">
      {/* Two Column Layout */}
      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Left Column - Group List */}
        <div className="w-80 flex-shrink-0">
          <div className="space-y-3 h-full overflow-y-auto pr-2 pl-1">{/* Add Group Card - Half Height */}
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
                      ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
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
        </div>

        {/* Right Column - Content Panel */}
        <div className="flex-1 flex flex-col">
          {selectedGroup ? (
            <div className="flex flex-col h-full">
              <div className="border-b pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedGroup}</h3>
                    <p className="text-sm text-gray-600">Fixed markup amounts in USD for different durations</p>
                  </div>
                  
                  {/* Save/Discard buttons for selected group */}
                  {hasChanges && selectedGroup && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDrawerDiscard(selectedGroup)}
                        disabled={contentSaving}
                        className="h-8 w-8 p-0 rounded-full"
                        title="Discard Changes"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDrawerSave(selectedGroup)}
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
              
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {groupedMarkupConfig[selectedGroup]?.map((item) => {
                    const globalIndex = markupConfig.findIndex(
                      config => config.bundleGroup === item.bundleGroup && 
                               config.durationDays === item.durationDays
                    );
                    const editKey = `${item.bundleGroup}-${item.durationDays}`;
                    const isEditing = editingItem === editKey;
                    
                    return (
                      <div key={`${selectedGroup}-${item.durationDays}`} className="group border rounded-lg p-3 hover:bg-gray-50 transition-colors">
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
                
                {(!groupedMarkupConfig[selectedGroup] || groupedMarkupConfig[selectedGroup].length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No configurations found for this group</p>
                  </div>
                )}
              </div>
            </div>
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