import { ConditionOperator, RuleCondition } from "@/__generated__/graphql";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@workspace/ui";
import {
  AlertCircle,
  Check,
  ChevronDown,
  HelpCircle,
  Plus,
  RefreshCw,
  Trash2
} from "lucide-react";
import React, { useState } from "react";
import { useRuleBuilderFieldData } from "../../hooks/useRuleBuilderFieldData";

interface EnhancedConditionBuilderProps {
  conditions: RuleCondition[];
  onChange: (conditions: RuleCondition[]) => void;
  className?: string;
}

// Enhanced field definitions based on actual pricing engine usage
// Note: examples are now fetched dynamically via useRuleBuilderFieldData hook
const CONDITION_FIELDS = [
  {
    value: "context.payment.method",
    label: "Payment Method",
    type: "enum",
    description: "The payment method used for the transaction",
    category: "Payment",
    isDynamic: true, // Indicates this field uses dynamic data
  },
  {
    value: "request.duration",
    label: "Duration (Days)",
    type: "number",
    description: "The requested duration in days",
    examples: [1, 7, 14, 30, 90],
    category: "Bundle",
    isDynamic: false,
  },
  {
    value: "request.countryISO",
    label: "Country Code",
    type: "string",
    description: "ISO country code (e.g. US, IL, UK)",
    category: "Geography",
    isDynamic: true,
  },
  {
    value: "request.region",
    label: "Region",
    type: "string",
    description: "Geographic region",
    category: "Geography",
    isDynamic: true,
  },
  {
    value: "request.group",
    label: "Bundle Group",
    type: "enum",
    description: "The bundle group category",
    category: "Bundle",
    isDynamic: true,
  },
  {
    value: "context.customer.segment",
    label: "Customer Segment",
    type: "string",
    description: "Customer classification",
    category: "Customer",
    isDynamic: true,
  },
  {
    value: "selectedBundle.validityInDays",
    label: "Bundle Validity",
    type: "number",
    description: "The selected bundle validity period",
    examples: [1, 3, 7, 14, 30],
    category: "Bundle",
    isDynamic: false,
  },
  {
    value: "selectedBundle.isUnlimited",
    label: "Is Unlimited Bundle",
    type: "boolean",
    description: "Whether the bundle has unlimited data",
    examples: [true, false],
    category: "Bundle",
    isDynamic: false,
  },
  {
    value: "unusedDays",
    label: "Unused Days",
    type: "number",
    description: "Days not used in the bundle",
    examples: [0, 1, 3, 7],
    category: "Bundle",
    isDynamic: false,
  },
  {
    value: "pricing.totalCost",
    label: "Total Cost",
    type: "number",
    description: "Current total cost before discounts",
    examples: [5.99, 19.99, 49.99],
    category: "Pricing",
    isDynamic: false,
  },
  {
    value: "pricing.markup",
    label: "Current Markup",
    type: "number",
    description: "Current markup amount",
    examples: [0, 2.5, 5.0],
    category: "Pricing",
    isDynamic: false,
  },
];

// Operator definitions based on field type
const OPERATORS_BY_TYPE = {
  string: [
    { value: "EQUALS", label: "equals", description: "Exact match" },
    {
      value: "NOT_EQUALS",
      label: "does not equal",
      description: "Not equal to",
    },
    { value: "IN", label: "is one of", description: "Matches any in list" },
    {
      value: "NOT_IN",
      label: "is not one of",
      description: "Does not match any in list",
    },
  ],
  number: [
    { value: "EQUALS", label: "equals", description: "Exact value" },
    {
      value: "NOT_EQUALS",
      label: "does not equal",
      description: "Not equal to",
    },
    { value: "GREATER_THAN", label: "is greater than", description: ">" },
    { value: "LESS_THAN", label: "is less than", description: "<" },
    { value: "GREATER_THAN_OR_EQUAL", label: "is at least", description: ">=" },
    { value: "LESS_THAN_OR_EQUAL", label: "is at most", description: "<=" },
  ],
  enum: [
    { value: "EQUALS", label: "is", description: "Exact match" },
    { value: "NOT_EQUALS", label: "is not", description: "Not equal to" },
    { value: "IN", label: "is one of", description: "Matches any in list" },
    {
      value: "NOT_IN",
      label: "is not one of",
      description: "Does not match any in list",
    },
  ],
  boolean: [{ value: "EQUALS", label: "is", description: "Boolean match" }],
};

export const EnhancedConditionBuilder: React.FC<
  EnhancedConditionBuilderProps
> = ({ conditions, onChange, className = "" }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFieldPopover, setActiveFieldPopover] = useState<number | null>(
    null
  );

  // Fetch dynamic field data
  const fieldData = useRuleBuilderFieldData();

  const addCondition = () => {
    const newCondition: RuleCondition = {
      field: "",
      operator: ConditionOperator.Equals,
      value: "",
    };
    onChange([...conditions, newCondition]);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    onChange(newConditions);
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onChange(newConditions);
  };

  const getFieldDefinition = (fieldValue: string) => {
    return CONDITION_FIELDS.find((f) => f.value === fieldValue);
  };

  // Get dynamic examples for a field
  const getFieldExamples = (fieldValue: string) => {
    const field = getFieldDefinition(fieldValue);
    if (!field) return [];

    // Use dynamic data if available and field is marked as dynamic
    if (field.isDynamic) {
      console.log(fieldData);
      const dynamicOptions = fieldData.getFieldOptions(fieldValue);
      return dynamicOptions.map((option) => option.value);
    }

    // Fall back to static examples
    return field.examples || [];
  };

  const getOperatorsForField = (fieldValue: string) => {
    const field = getFieldDefinition(fieldValue);
    if (!field) return OPERATORS_BY_TYPE.string;
    return (
      OPERATORS_BY_TYPE[field.type as keyof typeof OPERATORS_BY_TYPE] ||
      OPERATORS_BY_TYPE.string
    );
  };

  const filteredFields = CONDITION_FIELDS.filter(
    (field) =>
      field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedFields = filteredFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, typeof CONDITION_FIELDS>);

  const renderValueInput = (condition: RuleCondition, index: number) => {
    const field = getFieldDefinition(condition.field);
    const isListOperator =
      condition.operator === "IN" || condition.operator === "NOT_IN";

    if (!field) {
      return (
        <Input
          placeholder="Enter value"
          value={condition.value}
          onChange={(e) => updateCondition(index, { value: e.target.value })}
        />
      );
    }

    if (field.type === "boolean") {
      return (
        <Select
          value={condition.value}
          onValueChange={(value) => updateCondition(index, { value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    // Handle enum fields with dynamic or static data
    if (
      field.type === "enum" ||
      (field.isDynamic && fieldData.getFieldOptions(condition.field).length > 0)
    ) {
      console.log(fieldData.getFieldOptions(condition.field));
      const options = field.isDynamic
        ? fieldData.getFieldOptions(condition.field)
        : (field.examples || []).map((ex) => ({
            value: String(ex),
            label: String(ex),
            description: ''
          }));

      const isLoading =
        field.isDynamic && fieldData.isFieldLoading(condition.field);
      const hasError =
        field.isDynamic && fieldData.hasFieldError(condition.field);

      if (isListOperator) {
        // For IN/NOT_IN operators, show multi-select or comma-separated input
        return (
          <div className="space-y-2">
            <Input
              placeholder="Comma-separated values (e.g., US, UK, FR)"
              value={condition.value}
              onChange={(e) =>
                updateCondition(index, { value: e.target.value })
              }
              disabled={isLoading}
            />
            {isLoading ? (
              <div className="flex gap-1">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-20" />
              </div>
            ) : hasError ? (
              <div className="flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span>Failed to load options</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {options.slice(0, 8).map((option) => (
                  <Badge
                    key={option.value}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50 text-xs"
                    onClick={() => {
                      const currentValues = condition.value
                        ? condition.value.split(",").map((v: string) => v.trim())
                        : [];
                      if (!currentValues.includes(option.value)) {
                        const newValue = [...currentValues, option.value].join(
                          ", "
                        );
                        updateCondition(index, { value: newValue });
                      }
                    }}
                  >
                    {option.label}
                  </Badge>
                ))}
                {options.length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{options.length - 8} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <Select
            value={condition.value}
            onValueChange={(value) => updateCondition(index, { value })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={isLoading ? "Loading..." : "Select value..."}
              />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <div className="p-2">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : hasError ? (
                <div className="p-2 text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Failed to load options
                </div>
              ) : (
                options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-gray-500">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        );
      }
    }

    // Default input for numbers and strings
    return (
      <div className="space-y-2">
        <Input
          type={field.type === "number" ? "number" : "text"}
          placeholder={`Enter ${field.type === "number" ? "number" : "value"}`}
          value={condition.value}
          onChange={(e) => updateCondition(index, { value: e.target.value })}
        />
        {(() => {
          const examples = getFieldExamples(condition.field);
          const isLoading =
            field?.isDynamic && fieldData.isFieldLoading(condition.field);
          const hasError =
            field?.isDynamic && fieldData.hasFieldError(condition.field);

          if (isLoading) {
            return (
              <div className="flex gap-1">
                <span className="text-xs text-gray-500">Examples:</span>
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-10" />
              </div>
            );
          }

          if (hasError) {
            return (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span>Failed to load examples</span>
              </div>
            );
          }

          if (examples.length > 0) {
            return (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-gray-500">Examples:</span>
                {examples.slice(0, 3).map((example) => (
                  <Badge
                    key={String(example)}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50 text-xs"
                    onClick={() =>
                      updateCondition(index, { value: String(example) })
                    }
                  >
                    {example}
                  </Badge>
                ))}
                {examples.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{examples.length - 3} more
                  </Badge>
                )}
              </div>
            );
          }

          return null;
        })()}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Rule Conditions</h3>
            <p className="text-sm text-gray-600">
              Define when this rule should apply. All conditions must be met.
            </p>
            {fieldData.lastUpdated && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Field data updated {fieldData.lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <Button
            onClick={addCondition}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Condition
          </Button>
        </div>

        {conditions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <HelpCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No conditions defined</p>
            <p className="text-sm">Click "Add Condition" to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conditions.map((condition, index) => {
              const field = getFieldDefinition(condition.field);
              const operators = getOperatorsForField(condition.field);
              const selectedOperator = operators.find(
                (op) => op.value === condition.operator
              );

              return (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Condition {index + 1}</Badge>
                      {field && (
                        <Badge variant="secondary" className="text-xs">
                          {field.category}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(index)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Field Selection */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Field</Label>
                      <Popover
                        open={activeFieldPopover === index}
                        onOpenChange={(open) =>
                          setActiveFieldPopover(open ? index : null)
                        }
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                            role="combobox"
                          >
                            {field?.label || "Select field..."}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          <Command className="max-h-[400px]">
                            <CommandInput
                              placeholder="Search fields..."
                              value={searchQuery}
                              onValueChange={setSearchQuery}
                            />
                            <CommandList>
                              <CommandEmpty>No fields found.</CommandEmpty>
                              {Object.entries(groupedFields).map(
                                ([category, fields]) => (
                                  <CommandGroup
                                    key={category}
                                    heading={category}
                                  >
                                    {fields.map((field) => (
                                      <CommandItem
                                        key={field.value}
                                        value={field.value}
                                        onSelect={(value) => {
                                          updateCondition(index, {
                                            field: value,
                                            operator: ConditionOperator.Equals,
                                            value: "",
                                          });
                                          setActiveFieldPopover(null);
                                          setSearchQuery("");
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <div className="flex items-center gap-2">
                                            <Check
                                              className={`h-4 w-4 ${
                                                condition.field === field.value
                                                  ? "opacity-100"
                                                  : "opacity-0"
                                              }`}
                                            />
                                            <span className="font-medium">
                                              {field.label}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-500 ml-6">
                                            {field.description}
                                          </p>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                )
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {field && (
                        <p className="text-xs text-gray-500">
                          {field.description}
                        </p>
                      )}
                    </div>

                    {/* Operator Selection */}
                    <div className="space-y-2">
                      <Label>Operator</Label>
                      <Select
                        value={condition.operator}
                        onValueChange={(value) =>
                          updateCondition(index, {
                            operator: value as ConditionOperator,
                          })
                        }
                        disabled={!condition.field}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select operator..." />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((operator) => (
                            <SelectItem
                              key={operator.value}
                              value={operator.value}
                            >
                              <div className="flex flex-col">
                                <span>{operator.label}</span>
                                <span className="text-xs text-gray-500">
                                  {operator.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Value Input */}
                    <div className="space-y-2">
                      <Label>Value</Label>
                      {renderValueInput(condition, index)}
                    </div>
                  </div>

                  {/* Condition Preview */}
                  {condition.field && condition.operator && condition.value && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Preview:</strong>{" "}
                        {field?.label || condition.field}{" "}
                        {selectedOperator?.label || condition.operator} "
                        {condition.value}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
