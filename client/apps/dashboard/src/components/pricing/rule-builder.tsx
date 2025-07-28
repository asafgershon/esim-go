import {
  ActionType,
  ConditionOperator,
  PricingRule,
  RuleAction,
  RuleCategory,
  RuleCondition,
} from "@/__generated__/graphql";
import {
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
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface RuleBuilderProps {
  rule: Omit<
    PricingRule,
    "createdAt" | "createdBy" | "id" | "isEditable" | "updatedAt"
  > | null;
  onSave: (
    ruleData: Omit<
      PricingRule,
      "createdAt" | "createdBy" | "id" | "isEditable" | "updatedAt"
    > | null
  ) => void;
  onCancel: () => void;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
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

  // Helper function to determine field type
  const getFieldType = (field: string): string => {
    const fieldTypes: Record<string, string> = {
      duration: "number",
      isUnlimited: "boolean",
      cost: "number",
      unusedDays: "number",
      group: "string",
      country: "string",
      region: "string",
      paymentMethod: "string",
      planId: "string",
    };
    return fieldTypes[field] || "string";
  };

  // Rule category configurations
  const ruleCategories = [
    {
      value: "DISCOUNT",
      label: "Discount",
      icon: TrendingUp,
      color: "green",
      description: "Apply discounts to pricing",
    },
    {
      value: "CONSTRAINT",
      label: "Constraint",
      icon: Target,
      color: "orange",
      description: "Set pricing constraints and limits",
    },
    {
      value: "FEE",
      label: "Fee",
      icon: DollarSign,
      color: "blue",
      description: "Add processing fees and charges",
    },
    {
      value: "BUNDLE_ADJUSTMENT",
      label: "Bundle Adjustment",
      icon: Zap,
      color: "purple",
      description: "Adjust bundle selection and pricing",
    },
  ];

  // Available operators based on field type
  const getOperatorsForType = (type: string) => {
    switch (type) {
      case "string":
        return [
          { value: "EQUALS", label: "Equals" },
          { value: "NOT_EQUALS", label: "Not Equals" },
          { value: "IN", label: "In List" },
          { value: "NOT_IN", label: "Not In List" },
        ];
      case "number":
        return [
          { value: "EQUALS", label: "Equals" },
          { value: "NOT_EQUALS", label: "Not Equals" },
          { value: "GREATER_THAN", label: "Greater Than" },
          { value: "LESS_THAN", label: "Less Than" },
          { value: "BETWEEN", label: "Between" },
        ];
      case "boolean":
        return [{ value: "EQUALS", label: "Equals" }];
      case "date":
        return [
          { value: "EQUALS", label: "On Date" },
          { value: "GREATER_THAN", label: "After Date" },
          { value: "LESS_THAN", label: "Before Date" },
          { value: "BETWEEN", label: "Between Dates" },
        ];
      default:
        return [{ value: "EQUALS", label: "Equals" }];
    }
  };

  // Available actions based on rule category
  const getActionsForRuleCategory = (category: string) => {
    switch (category) {
      case "DISCOUNT":
        return [
          {
            value: "APPLY_DISCOUNT_PERCENTAGE",
            label: "Apply Percentage Discount",
            unit: "%",
          },
          {
            value: "APPLY_FIXED_DISCOUNT",
            label: "Apply Fixed Discount",
            unit: "$",
          },
          {
            value: "SET_DISCOUNT_PER_UNUSED_DAY",
            label: "Discount Per Unused Day",
            unit: "%/day",
          },
        ];
      case "CONSTRAINT":
        return [
          { value: "SET_MINIMUM_PRICE", label: "Set Minimum Price", unit: "$" },
          {
            value: "SET_MINIMUM_PROFIT",
            label: "Set Minimum Profit",
            unit: "$",
          },
        ];
      case "FEE":
        return [
          {
            value: "SET_PROCESSING_RATE",
            label: "Set Processing Rate",
            unit: "%",
          },
          { value: "ADD_MARKUP", label: "Add Markup Amount", unit: "$" },
        ];
      case "BUNDLE_ADJUSTMENT":
        return [
          { value: "ADD_MARKUP", label: "Add Bundle Markup", unit: "$" },
          {
            value: "APPLY_DISCOUNT_PERCENTAGE",
            label: "Apply Bundle Discount",
            unit: "%",
          },
        ];
      default:
        return [];
    }
  };

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

    if (ruleData.conditions.length > 0 && ruleData.conditions.some((c) => !c.field || !c.operator)) {
      errors.push("All conditions must have field and operator selected");
    }

    if (ruleData.actions.some((a) => !a.type)) {
      errors.push("All actions must have a type selected");
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
      // Clean the data to remove __typename fields before sending to GraphQL
      const cleanRuleData = {
        category: ruleData.category,
        name: ruleData.name,
        description: ruleData.description,
        conditions: ruleData.conditions.map((condition) => ({
          field: condition.field,
          operator: condition.operator,
          value: condition.value,
          type: condition.type,
        })),
        actions: ruleData.actions.map((action) => ({
          type: action.type,
          value: action.value,
          metadata: action.metadata,
        })),
        priority: ruleData.priority,
        isActive: ruleData.isActive,
        validFrom: ruleData.validFrom,
        validUntil: ruleData.validUntil,
      };

      onSave(cleanRuleData);
    } else {
      toast.error("Please fix validation errors before saving");
    }
  };

  const addCondition = () => {
    setRuleData((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        { field: "", operator: ConditionOperator.Equals, value: "" },
      ],
    }));
  };

  const removeCondition = (index: number) => {
    if (ruleData.conditions.length > 1) {
      setRuleData((prev) => ({
        ...prev,
        conditions: prev.conditions.filter((_, i) => i !== index),
      }));
    }
  };

  const updateCondition = (
    index: number,
    field: keyof RuleCondition,
    value: any
  ) => {
    setRuleData((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      ),
    }));
  };

  const addAction = () => {
    setRuleData((prev) => ({
      ...prev,
      actions: [
        ...prev.actions,
        { type: ActionType.ApplyDiscountPercentage, value: 0 },
      ],
    }));
  };

  const removeAction = (index: number) => {
    if (ruleData.actions.length > 1) {
      setRuleData((prev) => ({
        ...prev,
        actions: prev.actions.filter((_, i) => i !== index),
      }));
    }
  };

  const updateAction = (index: number, field: keyof RuleAction, value: any) => {
    setRuleData((prev) => ({
      ...prev,
      actions: prev.actions.map((action, i) =>
        i === index ? { ...action, [field]: value } : action
      ),
    }));
  };

  const selectedRuleCategory = ruleCategories.find(
    (rc) => rc.value === ruleData.category
  );
  const RuleIcon = selectedRuleCategory?.icon || Target;

  return (
    <div className="space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">
                Please fix the following errors:
              </span>
            </div>
            <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Rule Builder Tabs */}
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RuleIcon
                  className={`h-5 w-5 text-${selectedRuleCategory?.color}-600`}
                />
                Rule Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-category">Rule Category</Label>
                  <Select
                    value={ruleData.category}
                    onValueChange={(value) =>
                      setRuleData((prev) => ({
                        ...prev,
                        category: value as RuleCategory,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ruleCategories.map((category) => {
                        const Icon = category.icon;
                        return (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            <div className="flex items-center gap-2">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority (0-100)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    max="100"
                    value={ruleData.priority}
                    onChange={(e) =>
                      setRuleData((prev) => ({
                        ...prev,
                        priority: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Higher priority rules are evaluated first
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  value={ruleData.name}
                  onChange={(e) =>
                    setRuleData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter a descriptive name for this rule"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={ruleData.description || ""}
                  onChange={(e) =>
                    setRuleData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe when and how this rule should be applied"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Rule Status</Label>
                  <p className="text-sm text-gray-500">
                    Inactive rules won't affect pricing calculations
                  </p>
                </div>
                <Switch
                  checked={ruleData.isActive}
                  onCheckedChange={(checked) =>
                    setRuleData((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conditions Tab */}
        <TabsContent value="conditions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rule Conditions</CardTitle>
              <p className="text-sm text-gray-600">
                Define when this rule should apply. All conditions must be met
                for the rule to trigger.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {ruleData.conditions.map((condition, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Condition {index + 1}</h4>
                    {ruleData.conditions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCondition(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Field</Label>
                      <Select
                        value={condition.field}
                        onValueChange={(value) => {
                          updateCondition(index, "field", value);
                          // Set appropriate type based on field
                          const fieldType = getFieldType(value);
                          updateCondition(index, "type", fieldType);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="group">Bundle Group</SelectItem>
                          <SelectItem value="duration">
                            Duration (days)
                          </SelectItem>
                          <SelectItem value="isUnlimited">
                            Is Unlimited
                          </SelectItem>
                          <SelectItem value="country">Country Code</SelectItem>
                          <SelectItem value="region">Region</SelectItem>
                          <SelectItem value="cost">Cost</SelectItem>
                          <SelectItem value="paymentMethod">
                            Payment Method
                          </SelectItem>
                          <SelectItem value="planId">Plan ID</SelectItem>
                          <SelectItem value="unusedDays">
                            Unused Days
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Select the field to match against
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Label>Operator</Label>
                      <Select
                        value={condition.operator}
                        onValueChange={(value) =>
                          updateCondition(index, "operator", value)
                        }
                        disabled={!condition.field}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {getOperatorsForType(
                            getFieldType(condition.field)
                          ).map((operator) => (
                            <SelectItem
                              key={operator.value}
                              value={operator.value}
                            >
                              {operator.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label>Value</Label>
                      {getFieldType(condition.field) === "boolean" ? (
                        <Select
                          value={String(condition.value)}
                          onValueChange={(value) =>
                            updateCondition(index, "value", value === "true")
                          }
                          disabled={!condition.operator}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select value" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : condition.field === "group" ? (
                        <Select
                          value={condition.value}
                          onValueChange={(value) =>
                            updateCondition(index, "value", value)
                          }
                          disabled={!condition.operator}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select bundle group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Standard Fixed">
                              Standard Fixed
                            </SelectItem>
                            <SelectItem value="Standard - Unlimited Lite">
                              Standard - Unlimited Lite
                            </SelectItem>
                            <SelectItem value="Standard - Unlimited Essential">
                              Standard - Unlimited Essential
                            </SelectItem>
                            <SelectItem value="Standard - Unlimited Plus">
                              Standard - Unlimited Plus
                            </SelectItem>
                            <SelectItem value="Regional Bundles">
                              Regional Bundles
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : condition.field === "paymentMethod" ? (
                        <Select
                          value={condition.value}
                          onValueChange={(value) =>
                            updateCondition(index, "value", value)
                          }
                          disabled={!condition.operator}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ISRAELI_CARD">
                              Israeli Card
                            </SelectItem>
                            <SelectItem value="FOREIGN_CARD">
                              Foreign Card
                            </SelectItem>
                            <SelectItem value="AMEX">
                              American Express
                            </SelectItem>
                            <SelectItem value="BIT">Bit</SelectItem>
                            <SelectItem value="DINERS">Diners Club</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={
                            getFieldType(condition.field) === "number"
                              ? "number"
                              : "text"
                          }
                          value={condition.value}
                          onChange={(e) => {
                            const fieldType = getFieldType(condition.field);
                            const value =
                              fieldType === "number"
                                ? e.target.value
                                  ? Number(e.target.value)
                                  : ""
                                : e.target.value;
                            updateCondition(index, "value", value);
                          }}
                          placeholder="Enter value"
                          disabled={!condition.operator}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addCondition}
                className="w-full flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Condition
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rule Actions</CardTitle>
              <p className="text-sm text-gray-600">
                Define what happens when this rule conditions are met.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {ruleData.actions.map((action, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Action {index + 1}</h4>
                    {ruleData.actions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAction(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Action Type</Label>
                      <Select
                        value={action.type}
                        onValueChange={(value) =>
                          updateAction(index, "type", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          {getActionsForRuleCategory(ruleData.category).map(
                            (actionType) => (
                              <SelectItem
                                key={actionType.value}
                                value={actionType.value}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{actionType.label}</span>
                                  <Badge variant="outline" className="ml-2">
                                    {actionType.unit}
                                  </Badge>
                                </div>
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label>Value</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          value={action.value}
                          onChange={(e) =>
                            updateAction(
                              index,
                              "value",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="Enter value"
                          disabled={!action.type}
                        />
                        {action.type && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-sm text-gray-500">
                              {
                                getActionsForRuleCategory(
                                  ruleData.category
                                ).find((a) => a.value === action.type)?.unit
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addAction}
                className="w-full flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Action
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid-from">Valid From</Label>
                  <Input
                    id="valid-from"
                    type="datetime-local"
                    value={ruleData.validFrom || ""}
                    onChange={(e) =>
                      setRuleData((prev) => ({
                        ...prev,
                        validFrom: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty for no start date restriction
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid-until">Valid Until</Label>
                  <Input
                    id="valid-until"
                    type="datetime-local"
                    value={ruleData.validUntil || ""}
                    onChange={(e) =>
                      setRuleData((prev) => ({
                        ...prev,
                        validUntil: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty for no end date restriction
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Rule Preview</Label>
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <RuleIcon
                          className={`h-4 w-4 text-${selectedRuleCategory?.color}-600`}
                        />
                        <span className="font-medium">
                          {ruleData.name || "Untitled Rule"}
                        </span>
                        <Badge
                          variant={ruleData.isActive ? "default" : "secondary"}
                        >
                          {ruleData.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Priority: {ruleData.priority} | Category:{" "}
                        {selectedRuleCategory?.label}
                      </p>
                      <p className="text-sm text-gray-600">
                        {ruleData.conditions.length} condition(s),{" "}
                        {ruleData.actions.length} action(s)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Footer */}
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {rule ? "Update Rule" : "Create Rule"}
        </Button>
      </DialogFooter>
    </div>
  );
};
