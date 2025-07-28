import {
  ActionType,
  ConditionOperator,
  PricingRule,
  RuleCategory,
} from "@/__generated__/graphql";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DialogFooter,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@workspace/ui";
import {
  AlertTriangle,
  CheckCircle,
  DollarSign,
  HelpCircle,
  Save,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { EnhancedActionBuilder } from "./EnhancedActionBuilder";
import { EnhancedConditionBuilder } from "./EnhancedConditionBuilder";
import { RuleTemplateGallery } from "./RuleTemplateGallery";

interface EnhancedRuleBuilderProps {
  rule: Omit<
    PricingRule,
    "createdAt" | "createdBy" | "id" | "isEditable" | "updatedAt"
  > | null;
  onSave: (
    ruleData: Omit<
      PricingRule,
      "createdAt" | "createdBy" | "id" | "isEditable" | "updatedAt"
    >
  ) => void;
  onCancel: () => void;
}

export const EnhancedRuleBuilder: React.FC<EnhancedRuleBuilderProps> = ({
  rule,
  onSave,
  onCancel,
}) => {
  const [ruleData, setRuleData] = useState<
    Omit<
      PricingRule,
      "createdAt" | "createdBy" | "id" | "isEditable" | "updatedAt"
    >
  >({
    category: RuleCategory.Discount,
    name: "",
    description: "",
    conditions: [{ field: "", operator: ConditionOperator.Equals, value: "" }],
    actions: [{ type: ActionType.ApplyDiscountPercentage, value: 0 }],
    priority: 50,
    isActive: true,
    validFrom: "",
    validUntil: "",
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("basic");

  // Rule category configurations
  const ruleCategories = [
    {
      value: "DISCOUNT",
      label: "Discount",
      icon: TrendingUp,
      color: "green",
      description: "Apply discounts to pricing",
      examples: [
        "Volume discounts",
        "Promotional offers",
        "Customer loyalty rewards",
      ],
    },
    {
      value: "CONSTRAINT",
      label: "Constraint",
      icon: Target,
      color: "orange",
      description: "Set pricing constraints and limits",
      examples: ["Minimum profit margins", "Price floors", "Maximum discounts"],
    },
    {
      value: "FEE",
      label: "Fee",
      icon: DollarSign,
      color: "blue",
      description: "Add processing fees and charges",
      examples: [
        "Payment processing fees",
        "Service charges",
        "Currency conversion fees",
      ],
    },
    {
      value: "BUNDLE_ADJUSTMENT",
      label: "Bundle Adjustment",
      icon: Zap,
      color: "purple",
      description: "Adjust bundle selection and pricing",
      examples: ["Bundle markups", "Duration adjustments", "Regional pricing"],
    },
  ];

  // Initialize with existing rule data
  useEffect(() => {
    if (rule) {
      setRuleData({
        category: rule.category,
        name: rule.name,
        description: rule.description || "",
        conditions:
          rule.conditions.length > 0
            ? rule.conditions
            : [{ field: "", operator: ConditionOperator.Equals, value: "" }],
        actions:
          rule.actions.length > 0
            ? rule.actions
            : [{ type: ActionType.ApplyDiscountPercentage, value: 0 }],
        priority: rule.priority,
        isActive: rule.isActive,
        validFrom: rule.validFrom || "",
        validUntil: rule.validUntil || "",
      });
    }
  }, [rule]);

  const validateRule = (): string[] => {
    const errors: string[] = [];

    if (!ruleData.name.trim()) {
      errors.push("Rule name is required");
    }

    if (ruleData.name.length > 100) {
      errors.push("Rule name must be less than 100 characters");
    }

    if (ruleData.conditions.some((c) => !c.field || !c.operator)) {
      errors.push("All conditions must have field and operator selected");
    }

    if (ruleData.conditions.some((c) => !c.value && c.value !== "0")) {
      errors.push("All conditions must have a value");
    }

    if (ruleData.actions.some((a) => !a.type)) {
      errors.push("All actions must have a type selected");
    }

    if (
      ruleData.actions.some((a) => a.value === undefined || a.value === null)
    ) {
      errors.push("All actions must have a value");
    }

    if (ruleData.priority < 0 || ruleData.priority > 100) {
      errors.push("Priority must be between 0 and 100");
    }

    if (
      ruleData.validFrom &&
      ruleData.validUntil &&
      new Date(ruleData.validFrom) >= new Date(ruleData.validUntil)
    ) {
      errors.push("Valid from date must be before valid until date");
    }

    return errors;
  };

  const handleSave = () => {
    const errors = validateRule();
    setValidationErrors(errors);

    if (errors.length === 0) {
      onSave(ruleData);
    } else {
      toast.error(
        `Please fix ${errors.length} validation error${
          errors.length !== 1 ? "s" : ""
        }`
      );
    }
  };

  const handleTemplateSelect = (template: any) => {
    setRuleData({
      ...template,
      validFrom: "",
      validUntil: "",
    });
    toast.success("Template applied successfully");
  };

  const updateRuleData = (updates: Partial<typeof ruleData>) => {
    setRuleData((prev) => ({ ...prev, ...updates }));
    // Clear validation errors when user makes changes
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const getCategoryConfig = (categoryValue: string) => {
    return ruleCategories.find((cat) => cat.value === categoryValue);
  };

  const selectedCategoryConfig = getCategoryConfig(ruleData.category);

  return (
    <div className="space-y-6">
      {/* Header with Template Gallery */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {rule ? "Edit Rule" : "Create New Rule"}
          </h2>
          <p className="text-gray-600">
            {rule
              ? "Modify the rule configuration below"
              : "Build a new pricing rule using conditions and actions"}
          </p>
        </div>
        <RuleTemplateGallery onSelectTemplate={handleTemplateSelect} />
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Please fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="conditions" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Conditions ({ruleData.conditions.length})
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Actions ({ruleData.actions.length})
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedCategoryConfig && (
                  <selectedCategoryConfig.icon
                    className={`h-5 w-5 text-${selectedCategoryConfig.color}-600`}
                  />
                )}
                Rule Configuration
              </CardTitle>
              <p className="text-sm text-gray-600">
                Define the basic properties and behavior of your rule.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category and Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Rule Category</Label>
                  <Select
                    value={ruleData.category}
                    onValueChange={(value) => {
                      updateRuleData({
                        category: value as RuleCategory,
                        // Reset actions when category changes
                        actions: [
                          {
                            type: ActionType.ApplyDiscountPercentage,
                            value: 0,
                          },
                        ],
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ruleCategories.map((category) => {
                        const Icon = category.icon;
                        return (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">
                                  {category.label}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {category.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {selectedCategoryConfig && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>{selectedCategoryConfig.description}</p>
                      <p>
                        <strong>Examples:</strong>{" "}
                        {selectedCategoryConfig.examples.join(", ")}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">
                    Priority (0-100)
                    <Badge variant="outline" className="ml-2 text-xs">
                      {ruleData.priority >= 90
                        ? "High"
                        : ruleData.priority >= 50
                        ? "Medium"
                        : "Low"}
                    </Badge>
                  </Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    max="100"
                    value={ruleData.priority}
                    onChange={(e) =>
                      updateRuleData({
                        priority: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Higher priority rules are evaluated first. Use 90+ for
                    critical business rules.
                  </p>
                </div>
              </div>

              {/* Rule Name */}
              <div className="space-y-2">
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  value={ruleData.name}
                  onChange={(e) => updateRuleData({ name: e.target.value })}
                  placeholder="Enter a descriptive name for this rule"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500">
                  {ruleData.name.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={ruleData.description || ""}
                  onChange={(e) =>
                    updateRuleData({ description: e.target.value })
                  }
                  placeholder="Describe when and how this rule should be applied"
                  rows={3}
                />
              </div>

              {/* Rule Status and Validity */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Rule Status</Label>
                    <p className="text-sm text-gray-500">
                      {ruleData.isActive
                        ? "Active and affecting pricing"
                        : "Inactive - no effect"}
                    </p>
                  </div>
                  <Switch
                    checked={ruleData.isActive}
                    onCheckedChange={(checked) =>
                      updateRuleData({ isActive: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid-from">Valid From</Label>
                  <Input
                    id="valid-from"
                    type="date"
                    value={ruleData.validFrom || ""}
                    onChange={(e) =>
                      updateRuleData({ validFrom: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid-until">Valid Until</Label>
                  <Input
                    id="valid-until"
                    type="date"
                    value={ruleData.validUntil || ""}
                    onChange={(e) =>
                      updateRuleData({ validUntil: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conditions Tab */}
        <TabsContent value="conditions">
          <EnhancedConditionBuilder
            conditions={ruleData.conditions}
            onChange={(conditions) => updateRuleData({ conditions })}
          />
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions">
          <EnhancedActionBuilder
            actions={ruleData.actions}
            ruleCategory={ruleData.category}
            onChange={(actions) => updateRuleData({ actions })}
          />
        </TabsContent>
      </Tabs>

      {/* Rule Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <CheckCircle className="h-5 w-5" />
            Rule Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <strong>Name:</strong> {ruleData.name || "Unnamed rule"}
              </p>
              <p>
                <strong>Category:</strong>{" "}
                {selectedCategoryConfig?.label || ruleData.category}
              </p>
              <p>
                <strong>Priority:</strong> {ruleData.priority} (evaluated{" "}
                {ruleData.priority >= 90
                  ? "first"
                  : ruleData.priority >= 50
                  ? "middle"
                  : "last"}
                )
              </p>
            </div>
            <div>
              <p>
                <strong>Conditions:</strong> {ruleData.conditions.length}{" "}
                condition{ruleData.conditions.length !== 1 ? "s" : ""}
              </p>
              <p>
                <strong>Actions:</strong> {ruleData.actions.length} action
                {ruleData.actions.length !== 1 ? "s" : ""}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {ruleData.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <DialogFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={validationErrors.length > 0}>
          <Save className="h-4 w-4 mr-2" />
          {rule ? "Update Rule" : "Create Rule"}
        </Button>
      </DialogFooter>
    </div>
  );
};
