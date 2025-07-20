import {
  Button,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui";
import React, { useState, useEffect } from "react";
import { DollarSign, Save, RotateCcw, Loader2, Plus, Trash2, Shield } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import {
  GET_MARKUP_CONFIG,
  CREATE_MARKUP_CONFIG,
  UPDATE_MARKUP_CONFIG,
  DELETE_MARKUP_CONFIG,
} from "../lib/graphql/queries";

interface MarkupTableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MarkupConfigItem {
  id?: string;
  bundleGroup: string;
  durationDays: number;
  markupAmount: number;
  isNew?: boolean;
}

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

export const MarkupTableDrawer: React.FC<MarkupTableDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  // TODO: Add proper admin authentication when auth system is implemented
  const isAdmin = true; // Temporary - replace with actual admin check
  const [markupConfig, setMarkupConfig] = useState<MarkupConfigItem[]>(defaultMarkupConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // GraphQL queries and mutations
  const { data: currentConfig, loading: loadingCurrent, refetch } = useQuery(
    GET_MARKUP_CONFIG,
    {
      skip: !isOpen, // Only run when drawer is open
    }
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

  // Add new markup configuration
  const handleAddMarkup = () => {
    const newMarkup: MarkupConfigItem = {
      bundleGroup: bundleGroupOptions[0],
      durationDays: 1,
      markupAmount: 5.00,
      isNew: true,
    };
    setMarkupConfig([...markupConfig, newMarkup]);
    setHasChanges(true);
  };

  // Remove markup configuration
  const handleRemoveMarkup = (index: number) => {
    const newConfig = markupConfig.filter((_, i) => i !== index);
    setMarkupConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSubmitting(true);
    try {
      // Process each markup config item
      for (const item of markupConfig) {
        const input = {
          bundleGroup: item.bundleGroup,
          durationDays: item.durationDays,
          markupAmount: item.markupAmount,
        };

        if (item.id && !item.isNew) {
          // Update existing configuration
          await updateMarkupConfig({
            variables: {
              id: item.id,
              input,
            },
          });
        } else {
          // Create new configuration
          await createMarkupConfig({
            variables: { input },
          });
        }
      }

      // Handle deletions (items that were in original config but not in current)
      if (currentConfig?.markupConfig) {
        const currentIds = markupConfig.filter(item => item.id).map(item => item.id);
        const originalIds = currentConfig.markupConfig.map((item: any) => item.id);
        const idsToDelete = originalIds.filter((id: string) => !currentIds.includes(id));
        
        for (const id of idsToDelete) {
          await deleteMarkupConfig({
            variables: { id },
          });
        }
      }

      // Refetch current configuration to get the latest data
      await refetch();
      
      setHasChanges(false);
      toast.success("תצורת המארק-אפ נשמרה בהצלחה");
      onClose();
    } catch (error) {
      console.error("Error saving markup configuration:", error);
      toast.error("אירעה שגיאה בשמירת תצורת המארק-אפ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setMarkupConfig(defaultMarkupConfig);
    setHasChanges(true);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-w-5xl mx-auto">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2" dir="rtl">
            <DollarSign className="h-5 w-5" />
            ניהול טבלת מארק-אפ
            <Shield className="h-4 w-4 text-amber-500" title="נדרשות הרשאות מנהל" />
          </DrawerTitle>
          <DrawerDescription>
            עדכן את סכומי המארק-אפ הקבועים לכל קבוצת חבילות ומשך זמן (נדרשות הרשאות מנהל)
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 space-y-4 max-h-[70vh] overflow-y-auto" dir="rtl">
          {loadingCurrent ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">טוען תצורת מארק-אפ...</span>
            </div>
          ) : (
            <>
              {/* Markup Configuration by Bundle Group */}
              {Object.entries(groupedMarkupConfig).map(([bundleGroup, items]) => (
                <Card key={bundleGroup}>
                  <CardHeader>
                    <CardTitle className="text-lg">{bundleGroup}</CardTitle>
                    <CardDescription>
                      סכומי מארק-אפ קבועים בדולרים עבור משכי זמן שונים
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                      {items.map((item, itemIndex) => {
                        const globalIndex = markupConfig.findIndex(
                          config => config.bundleGroup === item.bundleGroup && 
                                   config.durationDays === item.durationDays
                        );
                        
                        return (
                          <div key={`${bundleGroup}-${item.durationDays}`} className="space-y-2 p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium">
                                {item.durationDays} ימים
                              </Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMarkup(globalIndex)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="space-y-1">
                              <Label htmlFor={`duration-${globalIndex}`} className="text-xs">
                                משך זמן (ימים)
                              </Label>
                              <Input
                                id={`duration-${globalIndex}`}
                                type="number"
                                min="1"
                                value={item.durationDays}
                                onChange={(e) =>
                                  handleMarkupChange(globalIndex, "durationDays", e.target.value)
                                }
                                className="text-sm"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <Label htmlFor={`markup-${globalIndex}`} className="text-xs">
                                מארק-אפ ($)
                              </Label>
                              <InputWithAdornment
                                id={`markup-${globalIndex}`}
                                type="number"
                                step="0.01"
                                min="0"
                                value={formatCurrencyForDisplay(item.markupAmount)}
                                onChange={(e) =>
                                  handleMarkupChange(globalIndex, "markupAmount", e.target.value)
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
                </Card>
              ))}

              {/* Add New Markup Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    הוסף תצורת מארק-אפ חדשה
                  </CardTitle>
                </CardHeader>
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
              </Card>

              {/* New/Unsaved Items */}
              {markupConfig.filter(item => item.isNew).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>תצורות חדשות (לא נשמרו)</CardTitle>
                    <CardDescription>
                      תצורות אלו ייווספו כאשר תשמור את השינויים
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {markupConfig.map((item, index) => {
                        if (!item.isNew) return null;
                        
                        return (
                          <div key={index} className="flex items-end gap-3 p-3 bg-blue-50 rounded-lg">
                            <div className="space-y-1 flex-1">
                              <Label htmlFor={`new-group-${index}`} className="text-xs">
                                קבוצת חבילות
                              </Label>
                              <select
                                id={`new-group-${index}`}
                                value={item.bundleGroup}
                                onChange={(e) =>
                                  handleMarkupChange(index, "bundleGroup", e.target.value)
                                }
                                className="w-full p-2 border rounded text-sm"
                              >
                                {bundleGroupOptions.map(option => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="space-y-1">
                              <Label htmlFor={`new-duration-${index}`} className="text-xs">
                                ימים
                              </Label>
                              <Input
                                id={`new-duration-${index}`}
                                type="number"
                                min="1"
                                value={item.durationDays}
                                onChange={(e) =>
                                  handleMarkupChange(index, "durationDays", e.target.value)
                                }
                                className="w-20 text-sm"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <Label htmlFor={`new-markup-${index}`} className="text-xs">
                                מארק-אפ ($)
                              </Label>
                              <InputWithAdornment
                                id={`new-markup-${index}`}
                                type="number"
                                step="0.01"
                                min="0"
                                value={formatCurrencyForDisplay(item.markupAmount)}
                                onChange={(e) =>
                                  handleMarkupChange(index, "markupAmount", e.target.value)
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
                </Card>
              )}
            </>
          )}
        </div>

        <Separator />

        <DrawerFooter>
          <div className="flex justify-between items-center w-full">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              איפוס לברירת מחדל
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                ביטול
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSubmitting || loadingCurrent || !isAdmin}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSubmitting ? "שומר..." : "שמירה"}
              </Button>
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};