import {
  ActionType,
  ConditionOperator,
  PricingRule,
  RuleAction,
  RuleCondition,
  RuleType,
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
  BarChart3,
  CheckCircle,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";


interface RuleBuilderProps {
  rule: Omit<PricingRule, "createdAt" | "createdBy" | "id" | "isEditable" | "updatedAt"> | null;
  onSave: (ruleData: Omit<PricingRule, "createdAt" | "createdBy" | "id" | "isEditable" | "updatedAt"> | null) => void;
  onCancel: () => void;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  rule,
  onSave,
  onCancel,
}) => {
  const [ruleData, setRuleData] = useState<Omit<PricingRule, "createdAt" | "createdBy" | "id" | "isEditable" | "updatedAt">>({
    type: RuleType.BusinessDiscount,
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

  // Rule type configurations
  const ruleTypes = [
    {
      value: "BUSINESS_DISCOUNT",
      label: "Business Discount",
      icon: TrendingUp,
      color: "green",
      description: "Apply discounts based on business conditions",
    },
    {
      value: "PROMOTION",
      label: "Promotional Rule",
      icon: BarChart3,
      color: "orange",
      description: "Time-limited promotional pricing",
    },
    {
      value: "SEGMENT",
      label: "Customer Segment",
      icon: Users,
      color: "pink",
      description: "Pricing based on customer segments",
    },
    {
      value: "SYSTEM_MARKUP",
      label: "System Markup",
      icon: Target,
      color: "blue",
      description: "System-level markup rules",
    },
    {
      value: "SYSTEM_PROCESSING",
      label: "System Processing",
      icon: Zap,
      color: "purple",
      description: "Processing fee configurations",
    },
  ];

  // Available condition fields
  const conditionFields = [
    { value: "bundleGroup", label: "Bundle Group", type: "string" },
    { value: "duration", label: "Duration (days)", type: "number" },
    { value: "country", label: "Country", type: "string" },
    { value: "region", label: "Region", type: "string" },
    { value: "paymentMethod", label: "Payment Method", type: "string" },
    { value: "userSegment", label: "User Segment", type: "string" },
    { value: "isNewUser", label: "Is New User", type: "boolean" },
    { value: "purchaseCount", label: "Purchase Count", type: "number" },
    { value: "totalSpent", label: "Total Spent", type: "number" },
    { value: "currentDate", label: "Current Date", type: "date" },
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

  // Available actions based on rule type
  const getActionsForRuleType = (ruleType: string) => {
    switch (ruleType) {
      case "BUSINESS_DISCOUNT":
      case "PROMOTION":
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
      case "SYSTEM_MARKUP":
        return [{ value: "ADD_MARKUP", label: "Add Markup Amount", unit: "$" }];
      case "SYSTEM_PROCESSING":
        return [
          {
            value: "SET_PROCESSING_RATE",
            label: "Set Processing Rate",
            unit: "%",
          },
        ];
      case "SEGMENT":
        return [
          {
            value: "APPLY_DISCOUNT_PERCENTAGE",
            label: "Apply Segment Discount",
            unit: "%",
          },
          { value: "ADD_MARKUP", label: "Add Segment Markup", unit: "$" },
        ];
      default:
        return [];
    }
  };

  // Initialize with existing rule data
  useEffect(() => {
    if (rule) {
      setRuleData({
        type: rule.type,
        name: rule.name,
        description: rule.description || "",
        conditions:
          rule.conditions.length > 0
            ? rule.conditions
            : [{ field: "", operator: ConditionOperator.Equals, value: "" }],
        actions:
          rule.actions.length > 0 ? rule.actions : [{ type: ActionType.ApplyDiscountPercentage, value: 0 }],
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

    if (ruleData.conditions.some((c) => !c.field || !c.operator)) {
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
      onSave(ruleData);
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

  const selectedRuleType = ruleTypes.find((rt) => rt.value === ruleData.type);
  const RuleIcon = selectedRuleType?.icon || Target;

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
                  className={`h-5 w-5 text-${selectedRuleType?.color}-600`}
                />
                Rule Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-type">Rule Type</Label>
                  <Select
                    value={ruleData.type}
                    onValueChange={(value) =>
                      setRuleData((prev) => ({ ...prev, type: value as RuleType }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ruleTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-gray-500">
                                  {type.description}
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
                          const field = conditionFields.find(
                            (f) => f.value === value
                          );
                          updateCondition(index, "field", value);
                          updateCondition(index, "type", field?.type);
                          updateCondition(index, "operator", ""); // Reset operator
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {conditionFields.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          {condition.field &&
                            getOperatorsForType(
                              conditionFields.find(
                                (f) => f.value === condition.field
                              )?.type || "string"
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
                      <Input
                        value={condition.value}
                        onChange={(e) =>
                          updateCondition(index, "value", e.target.value)
                        }
                        placeholder="Enter value"
                        disabled={!condition.operator}
                      />
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
                          {getActionsForRuleType(ruleData.type).map(
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
                                getActionsForRuleType(ruleData.type).find(
                                  (a) => a.value === action.type
                                )?.unit
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
                          className={`h-4 w-4 text-${selectedRuleType?.color}-600`}
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
                        Priority: {ruleData.priority} | Type:{" "}
                        {selectedRuleType?.label}
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
