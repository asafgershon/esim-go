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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Badge,
} from "@workspace/ui";
import React, { useState, useEffect, useMemo } from "react";
import { Percent, Save, Loader2, Plus, Trash2, X, Check, Calculator, TrendingDown } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { z } from "zod";
import {
  // GET_PRICING_CONFIGURATIONS,
  // CREATE_PRICING_CONFIGURATION,
  // UPDATE_PRICING_CONFIGURATION,
  GET_COUNTRIES,
} from "../lib/graphql/queries";

interface DiscountConfig {
  id?: string;
  name: string;
  description: string;
  countryId?: string;
  regionId?: string;
  duration?: number;
  bundleGroup?: string;
  discountRate: number;
  discountPerDay: number;
  markupAmount?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Zod schema for validation
const discountConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  discountRate: z.number()
    .min(0, "Discount rate cannot be negative")
    .max(1, "Discount rate cannot exceed 100%"),
  discountPerDay: z.number()
    .min(0, "Daily discount cannot be negative")
    .max(1, "Daily discount cannot exceed 100%"),
  markupAmount: z.number()
    .min(0, "Markup cannot be negative")
    .optional()
    .nullable(),
});

// Group configurations by specificity level
const groupConfigurations = (configs: DiscountConfig[]) => {
  const global = configs.filter(c => !c.countryId && !c.bundleGroup);
  const byCountry = configs.filter(c => c.countryId && !c.bundleGroup && !c.duration);
  const byBundleCountry = configs.filter(c => c.countryId && (c.bundleGroup || c.duration));
  
  return { global, byCountry, byBundleCountry };
};

export const DiscountConfigurationManagement: React.FC = () => {
  const isAdmin = true; // TODO: Replace with actual admin check
  const [selectedConfig, setSelectedConfig] = useState<DiscountConfig | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  
  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  
  // New configuration state
  const [newConfig, setNewConfig] = useState<Partial<DiscountConfig>>({
    name: '',
    description: '',
    discountRate: 0,
    discountPerDay: 0,
    isActive: true,
  });

  // GraphQL queries and mutations
  // const { data: configurationsData, loading: loadingConfigs, refetch } = useQuery(
  //   GET_PRICING_CONFIGURATIONS
  // );
  
  const { data: countriesData } = useQuery(GET_COUNTRIES);

  // const [createConfiguration] = useMutation(CREATE_PRICING_CONFIGURATION);
  // const [updateConfiguration] = useMutation(UPDATE_PRICING_CONFIGURATION);
  
  // Temporary mock data since pricing configurations feature was removed
  const configurationsData = null;
  const loadingConfigs = false;
  const refetch = () => {};

  // Group configurations by type
  const groupedConfigs = useMemo(() => {
    if (!configurationsData?.pricingConfigurations) {
      return { global: [], byCountry: [], byBundleCountry: [] };
    }
    return groupConfigurations(configurationsData.pricingConfigurations);
  }, [configurationsData]);

  // Helper function to format percentage for display
  const formatPercentageForDisplay = (decimal: number) => {
    return (decimal * 100).toFixed(1);
  };

  // Helper function to get country name
  const getCountryName = (countryId: string) => {
    const country = countriesData?.countries?.find(c => c.id === countryId);
    return country?.name || countryId;
  };

  // Save configuration
  const handleSave = async (config: DiscountConfig) => {
    setContentSaving(true);
    try {
      const input = {
        id: config.id,
        name: config.name,
        description: config.description,
        countryId: config.countryId || null,
        regionId: config.regionId || null,
        duration: config.duration || null,
        bundleGroup: config.bundleGroup || null,
        discountRate: config.discountRate,
        discountPerDay: config.discountPerDay,
        markupAmount: config.markupAmount || null,
        isActive: config.isActive,
      };

      if (config.id) {
        await updateConfiguration({
          variables: { input },
        });
        toast.success("Discount configuration updated successfully");
      } else {
        await createConfiguration({
          variables: { input },
        });
        toast.success("Discount configuration created successfully");
      }

      await refetch();
      setShowAddModal(false);
      setNewConfig({
        name: '',
        description: '',
        discountRate: 0,
        discountPerDay: 0,
        isActive: true,
      });
    } catch (error) {
      console.error("Error saving discount configuration:", error);
      toast.error("Error saving configuration");
    } finally {
      setContentSaving(false);
    }
  };

  // Deactivate configuration
  const handleDeactivate = async (config: DiscountConfig) => {
    if (!config.id) return;
    
    try {
      const updatedConfig = {
        ...config,
        isActive: false,
      };
      
      await handleSave(updatedConfig);
      toast.success("Discount configuration deactivated");
      setSelectedConfig(null);
    } catch (error) {
      console.error("Error deactivating configuration:", error);
      toast.error("Error deactivating configuration");
    }
  };

  // Inline editing functions
  const startEditing = (field: string, currentValue: number) => {
    setEditingField(field);
    setEditingValue(formatPercentageForDisplay(currentValue));
  };

  const saveEdit = async (field: string) => {
    if (!selectedConfig) return;
    
    const numericValue = parseFloat(editingValue) / 100;
    
    const updatedConfig = {
      ...selectedConfig,
      [field]: numericValue,
    };

    await handleSave(updatedConfig);
    setEditingField(null);
    setEditingValue("");
  };

  const discardEdit = () => {
    setEditingField(null);
    setEditingValue("");
  };

  // Render editable field
  const renderEditableField = (
    field: string,
    label: string,
    value: number,
    description?: string
  ) => {
    const isEditing = editingField === field;
    
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-gray-600">{description}</p>
        )}
        {isEditing ? (
          <div className="flex items-center gap-2">
            <InputWithAdornment
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              rightAdornment="%"
              className="text-sm flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveEdit(field);
                } else if (e.key === 'Escape') {
                  discardEdit();
                }
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => saveEdit(field)}
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={discardEdit}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div 
            className="w-full p-3 cursor-pointer rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-between"
            onClick={() => startEditing(field, value)}
          >
            <span className="text-lg font-semibold">
              {formatPercentageForDisplay(value)}%
            </span>
            <Percent className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>
    );
  };

  // Configuration card component
  const ConfigurationCard = ({ config, onClick }: { config: DiscountConfig; onClick: () => void }) => {
    const isSelected = selectedConfig?.id === config.id;
    
    return (
      <Card 
        className={`hover:shadow-md transition-all cursor-pointer ${
          isSelected 
            ? 'lg:ring-2 lg:ring-blue-500 lg:border-blue-500 lg:bg-blue-50' 
            : 'hover:border-gray-300'
        } ${!config.isActive ? 'opacity-60' : ''}`}
        onClick={onClick}
      >
        <CardHeader className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base flex items-center gap-2">
                {config.name}
                {!config.isActive && <Badge variant="secondary">Inactive</Badge>}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {config.description}
              </CardDescription>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  {formatPercentageForDisplay(config.discountRate)}%
                </span>
                {config.discountPerDay > 0 && (
                  <span className="flex items-center gap-1 text-gray-600">
                    + {formatPercentageForDisplay(config.discountPerDay)}%/day
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  };

  // Discount details component
  const DiscountDetails = ({ config, showHeader = true }: { config: DiscountConfig; showHeader?: boolean }) => (
    <div className="flex flex-col h-full">
      {showHeader && (
        <div className="border-b pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{config.name}</h3>
              <p className="text-sm text-gray-600">{config.description}</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeactivate(config)}
                disabled={contentSaving || !config.id || !config.isActive}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title={config.isActive ? "Deactivate configuration" : "Configuration already inactive"}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <ScrollArea className="flex-1" showOnHover={true}>
        <div className="space-y-6">
          {/* Discount Configuration */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Discount Settings</h4>
            
            {renderEditableField(
              'discountRate',
              'Standard Discount Rate',
              config.discountRate,
              'Percentage discount applied to the final price'
            )}
            
            {renderEditableField(
              'discountPerDay',
              'Progressive Daily Discount',
              config.discountPerDay,
              'Additional discount per unused day when using longer bundles'
            )}
          </div>

          {/* Custom Markup Override */}
          {config.markupAmount !== null && config.markupAmount !== undefined && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">Custom Markup Override</h4>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm">
                  This configuration overrides the global markup with a fixed amount of ${config.markupAmount}
                </p>
              </div>
            </div>
          )}

          {/* Visual Calculator */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Pricing Example
            </h4>
            <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Price:</span>
                <span className="font-medium">$50.00</span>
              </div>
              {config.discountRate > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Standard Discount ({formatPercentageForDisplay(config.discountRate)}%):</span>
                  <span className="font-medium">-${(50 * config.discountRate).toFixed(2)}</span>
                </div>
              )}
              {config.discountPerDay > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Unused Days (3 days × {formatPercentageForDisplay(config.discountPerDay)}%):</span>
                  <span className="font-medium">-${(50 * config.discountPerDay * 3).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Final Price:</span>
                <span>${(50 * (1 - config.discountRate - config.discountPerDay * 3)).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Configuration Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Configuration Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant={config.isActive ? "default" : "secondary"}>
                  {config.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {config.countryId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Country:</span>
                  <span>{getCountryName(config.countryId)}</span>
                </div>
              )}
              {config.bundleGroup && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Bundle Group:</span>
                  <span>{config.bundleGroup}</span>
                </div>
              )}
              {config.duration && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span>{config.duration} days</span>
                </div>
              )}
              {config.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span>{new Date(config.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  // Handle configuration selection
  const handleConfigSelect = (config: DiscountConfig) => {
    setSelectedConfig(config);
    setShowMobileSheet(true);
  };

  if (loadingConfigs) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading discount configurations...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Desktop: Two Column Layout, Mobile: Single Column */}
      <div className="flex-1 lg:flex lg:gap-6 min-h-0">
        {/* Configuration List - Full width on mobile, left column on desktop */}
        <div className="lg:w-80 lg:flex-shrink-0 lg:h-full lg:flex lg:flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Discount Configurations</h2>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              disabled={!isAdmin}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          
          <ScrollArea className="lg:flex-1 lg:pr-2" showOnHover={true}>
            <div className="space-y-6">
              {/* Global Configurations */}
              {groupedConfigs.global.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-600">Global Default</h3>
                  {groupedConfigs.global.map((config) => (
                    <ConfigurationCard
                      key={config.id}
                      config={config}
                      onClick={() => handleConfigSelect(config)}
                    />
                  ))}
                </div>
              )}

              {/* Country-specific Configurations */}
              {groupedConfigs.byCountry.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-600">Country Specific</h3>
                  {groupedConfigs.byCountry.map((config) => (
                    <ConfigurationCard
                      key={config.id}
                      config={config}
                      onClick={() => handleConfigSelect(config)}
                    />
                  ))}
                </div>
              )}

              {/* Bundle + Country Configurations */}
              {groupedConfigs.byBundleCountry.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-600">Bundle + Country</h3>
                  {groupedConfigs.byBundleCountry.map((config) => (
                    <ConfigurationCard
                      key={config.id}
                      config={config}
                      onClick={() => handleConfigSelect(config)}
                    />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {configurationsData?.pricingConfigurations?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Percent className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-lg">No Discount Configurations</p>
                  <p className="text-sm">Create your first discount rule</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Desktop: Right Column - Content Panel (hidden on mobile) */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col">
          {selectedConfig ? (
            <DiscountDetails config={selectedConfig} showHeader={true} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="mb-4">
                  <TrendingDown className="h-12 w-12 mx-auto text-gray-300" />
                </div>
                <p className="text-lg">Select a Configuration</p>
                <p className="text-sm">Choose a discount configuration to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Bottom Sheet */}
      <Sheet open={showMobileSheet} onOpenChange={setShowMobileSheet}>
        <SheetContent side="bottom" className="fixed bottom-0 left-0 right-0 max-h-[85vh] z-50 bg-background border-t rounded-t-lg">
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle className="text-left">{selectedConfig?.name}</SheetTitle>
            <SheetDescription className="text-left">
              {selectedConfig?.description}
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="px-6 pb-6 flex-1 max-h-[calc(85vh-120px)]" showOnHover={true}>
            {selectedConfig && <DiscountDetails config={selectedConfig} showHeader={false} />}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Add/Edit Configuration Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Discount Configuration</DialogTitle>
            <DialogDescription>
              Set up a new discount rule for specific countries or globally
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={newConfig.name || ''}
                onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                placeholder="e.g., Summer Sale - Europe"
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Input
                value={newConfig.description || ''}
                onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                placeholder="e.g., 15% discount for European countries"
              />
            </div>
            
            <div>
              <Label>Country (Optional)</Label>
              <Select
                value={newConfig.countryId || ''}
                onValueChange={(value) => setNewConfig({ ...newConfig, countryId: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a country (or leave empty for global)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Global (All Countries)</SelectItem>
                  {countriesData?.countries?.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Standard Discount (%)</Label>
              <InputWithAdornment
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formatPercentageForDisplay(newConfig.discountRate || 0)}
                onChange={(e) => setNewConfig({ 
                  ...newConfig, 
                  discountRate: parseFloat(e.target.value) / 100 || 0 
                })}
                rightAdornment="%"
                placeholder="0"
              />
            </div>
            
            <div>
              <Label>Daily Progressive Discount (%)</Label>
              <InputWithAdornment
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formatPercentageForDisplay(newConfig.discountPerDay || 0.1)}
                onChange={(e) => setNewConfig({ 
                  ...newConfig, 
                  discountPerDay: parseFloat(e.target.value) / 100 || 0 
                })}
                rightAdornment="%"
                placeholder="10"
              />
              <p className="text-xs text-gray-600 mt-1">
                Discount per unused day when using longer bundles
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={newConfig.isActive ?? true}
                onCheckedChange={(checked) => setNewConfig({ ...newConfig, isActive: checked })}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleSave(newConfig as DiscountConfig)}
              disabled={!newConfig.name || !newConfig.description || contentSaving}
            >
              {contentSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Configuration'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};