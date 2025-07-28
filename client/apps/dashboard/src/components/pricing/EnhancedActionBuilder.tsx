import { ActionType, RuleAction, RuleCategory } from "@/__generated__/graphql";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui";
import {
  AlertTriangle,
  DollarSign,
  Info,
  Percent,
  Plus,
  Target,
  Trash2,
  TrendingDown,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

interface EnhancedActionBuilderProps {
  actions: RuleAction[];
  ruleCategory: RuleCategory;
  onChange: (actions: RuleAction[]) => void;
  className?: string;
}

// Enhanced action definitions with examples and validation
const ACTION_DEFINITIONS = {
  [ActionType.AddMarkup]: {
    label: "Add Markup",
    description: "Add a fixed dollar amount to the price",
    icon: DollarSign,
    unit: "$",
    examples: [0.5, 1.0, 2.5, 5.0],
    minValue: 0,
    maxValue: 50,
    category: ["FEE", "BUNDLE_ADJUSTMENT"],
    preview: (value: number) => `Price increased by $${value.toFixed(2)}`,
    validation: (value: number) => {
      if (value < 0) return "Markup cannot be negative";
      if (value > 50) return "Markup seems too high (>$50)";
      return null;
    },
  },
  [ActionType.ApplyDiscountPercentage]: {
    label: "Apply Percentage Discount",
    description: "Apply a percentage discount to the price",
    icon: TrendingDown,
    unit: "%",
    examples: [5, 10, 15, 20, 25],
    minValue: 0,
    maxValue: 100,
    category: ["DISCOUNT", "BUNDLE_ADJUSTMENT"],
    preview: (value: number) => `Price reduced by ${value}%`,
    validation: (value: number) => {
      if (value < 0) return "Discount cannot be negative";
      if (value > 100) return "Discount cannot exceed 100%";
      if (value > 50) return "High discount (>50%) - double check";
      return null;
    },
  },
  [ActionType.SetProcessingRate]: {
    label: "Set Processing Rate",
    description: "Set the processing fee percentage",
    icon: Percent,
    unit: "%",
    examples: [1.4, 2.9, 3.9, 5.7],
    minValue: 0,
    maxValue: 10,
    category: ["FEE"],
    preview: (value: number) => `Processing fee set to ${value}%`,
    validation: (value: number) => {
      if (value < 0) return "Processing rate cannot be negative";
      if (value > 10) return "Processing rate seems too high (>10%)";
      return null;
    },
  },
  [ActionType.SetMinimumProfit]: {
    label: "Set Minimum Profit",
    description: "Ensure a minimum profit amount",
    icon: Target,
    unit: "$",
    examples: [0.5, 1.0, 2.0, 5.0],
    minValue: 0,
    maxValue: 100,
    category: ["CONSTRAINT"],
    preview: (value: number) => `Minimum profit enforced: $${value.toFixed(2)}`,
    validation: (value: number) => {
      if (value < 0) return "Minimum profit cannot be negative";
      if (value > 100) return "Minimum profit seems too high (>$100)";
      return null;
    },
  },
  [ActionType.SetMinimumPrice]: {
    label: "Set Minimum Price",
    description: "Ensure a minimum final price",
    icon: Target,
    unit: "$",
    examples: [1.0, 2.0, 5.0, 10.0],
    minValue: 0,
    maxValue: 200,
    category: ["CONSTRAINT"],
    preview: (value: number) => `Minimum price enforced: $${value.toFixed(2)}`,
    validation: (value: number) => {
      if (value < 0) return "Minimum price cannot be negative";
      if (value > 200) return "Minimum price seems too high (>$200)";
      return null;
    },
  },
};

const getCategoryIcon = (category: RuleCategory) => {
  switch (category) {
    case RuleCategory.Discount:
      return TrendingDown;
    case RuleCategory.Constraint:
      return Target;
    case RuleCategory.Fee:
      return DollarSign;
    case RuleCategory.BundleAdjustment:
      return Zap;
    default:
      return Info;
  }
};

const getCategoryColor = (category: RuleCategory) => {
  switch (category) {
    case RuleCategory.Discount:
      return "text-green-600";
    case RuleCategory.Constraint:
      return "text-orange-600";
    case RuleCategory.Fee:
      return "text-blue-600";
    case RuleCategory.BundleAdjustment:
      return "text-purple-600";
    default:
      return "text-gray-600";
  }
};

export const EnhancedActionBuilder: React.FC<EnhancedActionBuilderProps> = ({
  actions,
  ruleCategory,
  onChange,
  className = "",
}) => {
  const [testPrice] = useState(19.99); // Example price for preview

  const addAction = () => {
    const availableActions = getAvailableActionsForCategory(ruleCategory);
    const defaultAction = availableActions[0];

    const newAction: RuleAction = {
      type: defaultAction,
      value: 0,
    };
    onChange([...actions, newAction]);
  };

  const removeAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    onChange(newActions);
  };

  const updateAction = (index: number, updates: Partial<RuleAction>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    onChange(newActions);
  };

  const getAvailableActionsForCategory = (
    category: RuleCategory
  ): ActionType[] => {
    return Object.entries(ACTION_DEFINITIONS)
      .filter(([_, definition]) => definition.category.includes(category))
      .map(([actionType]) => actionType as ActionType);
  };

  const getActionDefinition = (actionType: ActionType) => {
    return ACTION_DEFINITIONS[actionType as keyof typeof ACTION_DEFINITIONS];
  };

  const calculatePreviewEffect = (action: RuleAction): string => {
    const definition = getActionDefinition(action.type);
    if (!definition || !action.value) return "";

    switch (action.type) {
      case ActionType.AddMarkup:
        return `$${testPrice.toFixed(2)} → $${(
          testPrice + action.value
        ).toFixed(2)}`;
      case ActionType.ApplyDiscountPercentage:
        const discountAmount = testPrice * (action.value / 100);
        return `$${testPrice.toFixed(2)} → $${(
          testPrice - discountAmount
        ).toFixed(2)} (saves $${discountAmount.toFixed(2)})`;
      case ActionType.SetProcessingRate:
        const processingFee = testPrice * (action.value / 100);
        return `Processing fee: $${processingFee.toFixed(2)} (${
          action.value
        }% of $${testPrice.toFixed(2)})`;
      case ActionType.SetMinimumProfit:
        return `Profit must be at least $${action.value.toFixed(2)}`;
      case ActionType.SetMinimumPrice:
        return `Final price must be at least $${action.value.toFixed(2)}`;
      default:
        return definition.preview(action.value);
    }
  };

  const validateAction = (action: RuleAction): string | null => {
    const definition = getActionDefinition(action.type);
    if (!definition) return null;
    return definition.validation(action.value);
  };

  const availableActions = getAvailableActionsForCategory(ruleCategory);
  const CategoryIcon = getCategoryIcon(ruleCategory);

  return (
    <Card className={className}>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CategoryIcon
              className={`h-5 w-5 ${getCategoryColor(ruleCategory)}`}
            />
            <div>
              <h3 className="text-lg font-semibold">Rule Actions</h3>
              <p className="text-sm text-gray-600">
                Define what happens when this rule is triggered
              </p>
            </div>
          </div>
          <Button
            onClick={addAction}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Action
          </Button>
        </div>

        {actions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Zap className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No actions defined</p>
            <p className="text-sm">
              Click "Add Action" to define what this rule does
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {actions.map((action, index) => {
              const definition = getActionDefinition(action.type);
              const validation = validateAction(action);
              const previewEffect = calculatePreviewEffect(action);
              const ActionIcon = definition?.icon || Info;

              return (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Action {index + 1}</Badge>
                      <Badge variant="secondary" className="text-xs">
                        {ruleCategory}
                      </Badge>
                    </div>
                    {actions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAction(index)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Action Type Selection */}
                    <div className="space-y-2">
                      <Label>Action Type</Label>
                      <Select
                        value={action.type}
                        onValueChange={(value) =>
                          updateAction(index, {
                            type: value as ActionType,
                            value: 0,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select action..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableActions.map((actionType) => {
                            const def = getActionDefinition(actionType);
                            const Icon = def?.icon || Info;
                            return (
                              <SelectItem key={actionType} value={actionType}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <div className="flex flex-col">
                                    <span>{def?.label}</span>
                                    <span className="text-xs text-gray-500">
                                      {def?.description}
                                    </span>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {definition && (
                        <p className="text-xs text-gray-500">
                          {definition.description}
                        </p>
                      )}
                    </div>

                    {/* Value Input */}
                    <div className="space-y-2">
                      <Label>Value</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={definition?.minValue || 0}
                          max={definition?.maxValue || 1000}
                          step={definition?.unit === "%" ? 0.1 : 0.01}
                          value={action.value}
                          onChange={(e) =>
                            updateAction(index, {
                              value: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={validation ? "border-red-300" : ""}
                        />
                        {definition?.unit && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            {definition.unit}
                          </div>
                        )}
                      </div>

                      {/* Example Values */}
                      {definition?.examples && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-gray-500">
                            Quick values:
                          </span>
                          {definition.examples.map((example) => (
                            <Badge
                              key={example}
                              variant="outline"
                              className="cursor-pointer hover:bg-blue-50 text-xs"
                              onClick={() =>
                                updateAction(index, { value: example })
                              }
                            >
                              {example}
                              {definition.unit}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Validation Error */}
                      {validation && (
                        <Alert variant="destructive" className="py-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {validation}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  {/* Action Preview */}
                  {action.type &&
                    action.value &&
                    !validation &&
                    previewEffect && (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <ActionIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Effect Preview
                          </span>
                        </div>
                        <p className="text-sm text-green-700">
                          {previewEffect}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Based on example price of ${testPrice.toFixed(2)}
                        </p>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}

        {/* Actions Summary */}
        {actions.length > 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Actions Summary
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {actions.map((action, index) => {
                const definition = getActionDefinition(action.type);
                return (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-800">
                      {index + 1}
                    </span>
                    {definition?.label}: {action.value}
                    {definition?.unit}
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              Actions are applied in the order listed above
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
