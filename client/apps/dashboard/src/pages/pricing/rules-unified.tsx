import { useMutation, useQuery } from "@apollo/client";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui";
import {
  BarChart3,
  Check,
  CheckCircle,
  Copy,
  CreditCard,
  DollarSign,
  Edit,
  FilterIcon,
  Pause,
  Play,
  Plus,
  Search,
  Settings,
  Target,
  TestTube,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CLONE_PRICING_RULE,
  CREATE_PRICING_RULE,
  DELETE_PRICING_RULE,
  GET_PRICING_RULES,
  TOGGLE_PRICING_RULE,
  UPDATE_PRICING_RULE,
} from "../../lib/graphql/queries";

// Import components
import { SplitView } from "../../components/common/SplitView";
import { MarkupRuleDrawer } from "../../components/pricing/markup-rule-drawer";
import { ProcessingFeeDrawer } from "../../components/pricing/processing-fee-drawer";
import { RuleBuilder } from "../../components/pricing/rule-builder";
import { SingleRuleTestPanel } from "../../components/pricing/single-rule-test-panel";
import { CreatePricingRuleMutation, TogglePricingRuleMutation, DeletePricingRuleMutation, UpdatePricingRuleMutation, TogglePricingRuleMutationVariables, DeletePricingRuleMutationVariables, UpdatePricingRuleMutationVariables, CreatePricingRuleMutationVariables, PricingRule } from "@/__generated__/graphql";


// Rule category configurations
const ruleCategories = [
  {
    value: "DISCOUNT",
    label: "Discount",
    icon: TrendingUp,
    color: "green",
  },
  {
    value: "CONSTRAINT",
    label: "Constraint",
    icon: Target,
    color: "orange",
  },
  {
    value: "FEE",
    label: "Fee",
    icon: DollarSign,
    color: "blue",
  },
  {
    value: "BUNDLE_ADJUSTMENT",
    label: "Bundle Adjustment",
    icon: Zap,
    color: "purple",
  },
];

const UnifiedPricingRulesPage: React.FC = () => {
  const [selectedRuleForTesting, setSelectedRuleForTesting] =
    useState<PricingRule | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRuleCategories, setSelectedRuleCategories] = useState<string[]>([]);
  const [showSystemRules, setShowSystemRules] = useState(true);
  const [typeFilterOpen, setTypeFilterOpen] = useState(false);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMarkupDialog, setShowMarkupDialog] = useState(false);
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // GraphQL queries and mutations
  const {
    data: rulesData,
    loading,
    error,
    refetch,
  } = useQuery(GET_PRICING_RULES);
  const [createRule] = useMutation<CreatePricingRuleMutation, CreatePricingRuleMutationVariables> (CREATE_PRICING_RULE);
  const [updateRule] = useMutation<UpdatePricingRuleMutation, UpdatePricingRuleMutationVariables>(UPDATE_PRICING_RULE);
  const [deleteRule] = useMutation<DeletePricingRuleMutation, DeletePricingRuleMutationVariables>(DELETE_PRICING_RULE);
  const [toggleRule] = useMutation<TogglePricingRuleMutation, TogglePricingRuleMutationVariables>(TOGGLE_PRICING_RULE);
  const [cloneRule] = useMutation(CLONE_PRICING_RULE);

  const rules = rulesData?.pricingRules || [];

  // Filter rules based on search and filters
  const filteredRules = rules.filter((rule: PricingRule) => {
    const matchesSearch =
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedRuleCategories.length === 0 || selectedRuleCategories.includes(rule.category);
    const matchesSystemFilter = showSystemRules || rule.isEditable;

    return matchesSearch && matchesCategory && matchesSystemFilter;
  });

  const toggleRuleCategory = (category: string) => {
    setSelectedRuleCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const getRuleCategoryConfig = (category: string) => {
    return (
      ruleCategories.find((rc) => rc.value === category) || {
        value: category,
        label: category,
        icon: Settings,
        color: "gray",
      }
    );
  };

  // Toggle testing panel

  // Rule actions
  const handleToggleRule = async (ruleId: string) => {
    try {
      await toggleRule({ variables: { id: ruleId } });
      await refetch();
      toast.success("Rule status updated");
    } catch (error) {
      toast.error("Failed to update rule status");
    }
  };

  const handleCloneRule = async (ruleId: string, newName: string) => {
    try {
      await cloneRule({ variables: { id: ruleId, newName } });
      await refetch();
      toast.success("Rule cloned successfully");
    } catch (error) {
      toast.error("Failed to clone rule");
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteRule({ variables: { id: ruleId } });
      await refetch();
      toast.success("Rule deleted successfully");
    } catch (error) {
      toast.error("Failed to delete rule");
    }
  };

  const getRulePriorityColor = (priority: number) => {
    if (priority >= 90) return "bg-red-100 text-red-800";
    if (priority >= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getRulePriorityLabel = (priority: number) => {
    if (priority >= 90) return "High";
    if (priority >= 50) return "Medium";
    return "Low";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-2">Loading pricing rules...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">
          Failed to load pricing rules: {error.message}
        </p>
        <Button onClick={() => refetch()} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  // Mobile view
  if (isMobile) {
    return (
      <div className="space-y-6">
        {/* Mobile header with testing toggle */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Pricing Rules</h2>
        </div>

        {/* Mobile content - simplified view */}
        <div className="space-y-4">
          {/* Add this implementation based on mobile needs */}
          <p className="text-sm text-gray-600">
            Mobile view implementation needed
          </p>
        </div>
      </div>
    );
  }

  // Desktop view
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          {/* Quick add buttons */}
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Custom Rule
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowMarkupDialog(true)}
            className="flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Add Markup
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowProcessingDialog(true)}
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Add Processing Fee
          </Button>
        </div>
      </div>

      {/* Main content with split view */}
      <div className="flex-1 min-h-0">
        <SplitView
          direction="horizontal"
          autoSaveId="pricing-rules-split"
          panels={[
            {
              id: "main-content",
              defaultSize: selectedRuleForTesting ? 70 : 100,
              minSize: 50,
              content: (
                <div className="flex flex-col space-y-4 p-4">
                  {/* Filters */}
                  <div className="flex items-center justify-between gap-4">
                    {/* Search on the left */}
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search rules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Quick Filters on the right */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600">
                        Quick filters:
                      </span>

                      {/* Type Filter Popover */}
                      <Popover
                        open={typeFilterOpen}
                        onOpenChange={setTypeFilterOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant={
                              selectedRuleCategories.length > 0
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            className={
                              selectedRuleCategories.length === 0
                                ? "border-dashed"
                                : ""
                            }
                          >
                            <FilterIcon className="h-4 w-4 mr-2" />
                            Type
                            {selectedRuleCategories.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="ml-2 h-5 px-1"
                              >
                                {selectedRuleCategories.length}
                              </Badge>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3" align="start">
                          <div className="space-y-2">
                            <div className="text-sm font-medium mb-2">
                              Filter by Category
                            </div>
                            {ruleCategories.map((category) => {
                              const Icon = category.icon;
                              const isSelected = selectedRuleCategories.includes(
                                category.value
                              );
                              return (
                                <button
                                  key={category.value}
                                  onClick={() => toggleRuleCategory(category.value)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <Icon
                                      className={`h-4 w-4 text-${category.color}-600`}
                                    />
                                    <span>{category.label}</span>
                                  </div>
                                  {isSelected && (
                                    <Check className="h-4 w-4 text-primary" />
                                  )}
                                </button>
                              );
                            })}
                            {selectedRuleCategories.length > 0 && (
                              <>
                                <Separator className="my-2" />
                                <button
                                  onClick={() => setSelectedRuleCategories([])}
                                  className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                  Clear filters
                                </button>
                              </>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Button
                        variant={!showSystemRules ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowSystemRules(!showSystemRules)}
                        className={!showSystemRules ? "" : "border-dashed"}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Hide System Rules
                      </Button>
                    </div>
                  </div>

                  {/* Rules Table */}
                  <Card className="flex-1 flex flex-col">
                    <div className="flex-1 overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead>Rule</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Conditions</TableHead>
                            <TableHead>Actions</TableHead>
                            <TableHead>Modified</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRules.map((rule: PricingRule) => {
                            const categoryConfig = getRuleCategoryConfig(rule.category);
                            const Icon = categoryConfig.icon;

                            return (
                              <TableRow key={rule.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <div className="p-2 rounded-full bg-gray-100">
                                        <Icon
                                          className={`h-4 w-4 text-${categoryConfig.color}-600`}
                                        />
                                      </div>
                                      {!rule.isEditable && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-600 rounded-full border border-white" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            System rule - Cannot be edited or
                                            deleted
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {rule.name}
                                      </div>
                                      {rule.description && (
                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                          {rule.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="bg-gray-50 text-gray-700"
                                  >
                                    {categoryConfig.label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge
                                        variant="outline"
                                        className={getRulePriorityColor(
                                          rule.priority
                                        )}
                                      >
                                        {rule.priority} -{" "}
                                        {getRulePriorityLabel(rule.priority)}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Higher priority rules are evaluated first
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`h-2 w-2 rounded-full ${
                                        rule.isActive
                                          ? "bg-green-500"
                                          : "bg-gray-400"
                                      }`}
                                    />
                                    <span className="text-sm">
                                      {rule.isActive ? "Active" : "Inactive"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600">
                                    {rule.conditions.length} condition
                                    {rule.conditions.length !== 1 ? "s" : ""}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600">
                                    {rule.actions.length} action
                                    {rule.actions.length !== 1 ? "s" : ""}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-500">
                                    {new Date(
                                      rule.updatedAt
                                    ).toLocaleDateString()}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleToggleRule(rule.id)
                                          }
                                          className="h-8 w-8 p-0"
                                        >
                                          {rule.isActive ? (
                                            <Pause className="h-4 w-4 text-orange-600" />
                                          ) : (
                                            <Play className="h-4 w-4 text-green-600" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {rule.isActive
                                          ? "Deactivate rule"
                                          : "Activate rule"}
                                      </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            setSelectedRuleForTesting(rule)
                                          }
                                          className="h-8 w-8 p-0"
                                        >
                                          <TestTube className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Test rule</TooltipContent>
                                    </Tooltip>

                                    {rule.isEditable && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingRule(rule)}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Edit rule
                                        </TooltipContent>
                                      </Tooltip>
                                    )}

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleCloneRule(
                                              rule.id,
                                              `${rule.name} (Copy)`
                                            )
                                          }
                                          className="h-8 w-8 p-0"
                                        >
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Clone rule
                                      </TooltipContent>
                                    </Tooltip>

                                    {rule.isEditable && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleDeleteRule(rule.id)
                                            }
                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Delete rule
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Sticky Stats Footer */}
                    <div className="sticky bottom-0 bg-background border-t px-4 py-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium text-gray-900">
                              {rules.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-600">Active:</span>
                            <span className="font-medium text-green-600">
                              {
                                rules.filter((r: PricingRule) => r.isActive)
                                  .length
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-blue-500" />
                            <span className="text-gray-600">System:</span>
                            <span className="font-medium text-blue-600">
                              {
                                rules.filter((r: PricingRule) => !r.isEditable)
                                  .length
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-purple-500" />
                            <span className="text-gray-600">Custom:</span>
                            <span className="font-medium text-purple-600">
                              {
                                rules.filter((r: PricingRule) => r.isEditable)
                                  .length
                              }
                            </span>
                          </div>
                        </div>
                        <div className="text-gray-500">
                          Showing {filteredRules.length} of {rules.length} rules
                        </div>
                      </div>
                    </div>
                  </Card>

                  {filteredRules.length === 0 && (
                    <Card className="p-12">
                      <div className="text-center">
                        <Settings className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">
                          No rules found
                        </h3>
                        <p className="mt-2 text-gray-500">
                          {searchQuery || selectedRuleCategories.length > 0
                            ? "Try adjusting your search or filters"
                            : "Get started by creating your first pricing rule"}
                        </p>
                        <div className="mt-4 flex justify-center gap-3">
                          <Button onClick={() => setShowCreateDialog(true)}>
                            Create Custom Rule
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowMarkupDialog(true)}
                          >
                            Add Markup
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowProcessingDialog(true)}
                          >
                            Add Processing Fee
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              ),
            },
            ...(selectedRuleForTesting
              ? [
                  {
                    id: "test-panel",
                    defaultSize: 30,
                    minSize: 25,
                    maxSize: 50,
                    content: (
                      <SingleRuleTestPanel rule={selectedRuleForTesting} />
                    ),
                    header: (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TestTube className="h-4 w-4" />
                          <span className="font-medium">Rule Testing</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRuleForTesting(null)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </div>

      {/* Create/Edit Rule Dialog */}
      <Dialog
        open={showCreateDialog || !!editingRule}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingRule(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule
                ? `Edit Rule: ${editingRule.name}`
                : "Create New Pricing Rule"}
            </DialogTitle>
            <DialogDescription>
              {editingRule
                ? "Modify the rule configuration below. Changes will take effect immediately."
                : "Build a new pricing rule using conditions and actions."}
            </DialogDescription>
          </DialogHeader>
          <RuleBuilder
            rule={editingRule}
            onSave={async (ruleData) => {
              try {
                if (editingRule) {
                  await updateRule({
                    variables: {
                      id: editingRule.id,
                      input: ruleData,
                    },
                  });
                  toast.success("Rule updated successfully");
                } else {
                  await createRule({
                    variables: { input: ruleData },
                  });
                  toast.success("Rule created successfully");
                }
                await refetch();
                setShowCreateDialog(false);
                setEditingRule(null);
              } catch (error) {
                toast.error("Failed to save rule");
              }
            }}
            onCancel={() => {
              setShowCreateDialog(false);
              setEditingRule(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Markup Rule Drawer */}
      <MarkupRuleDrawer
        open={showMarkupDialog}
        onOpenChange={setShowMarkupDialog}
        onSave={async (ruleData) => {
          try {
            await createRule({
              variables: { input: ruleData },
            });
            toast.success("Markup rule created successfully");
            await refetch();
            setShowMarkupDialog(false);
          } catch (error) {
            toast.error("Failed to create markup rule");
          }
        }}
      />

      {/* Processing Fee Drawer */}
      <ProcessingFeeDrawer
        open={showProcessingDialog}
        onOpenChange={setShowProcessingDialog}
        onSave={async (ruleData) => {
          try {
            await createRule({
              variables: { input: ruleData },
            });
            toast.success("Processing fee rule created successfully");
            await refetch();
            setShowProcessingDialog(false);
          } catch (error) {
            toast.error("Failed to create processing fee rule");
          }
        }}
      />
    </div>
  );
};

export default UnifiedPricingRulesPage;
