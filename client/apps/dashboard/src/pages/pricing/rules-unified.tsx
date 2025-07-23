import React, { useState, useCallback, useEffect } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Separator,
} from '@workspace/ui';
import { 
  Settings, 
  Target, 
  CreditCard,
  Plus,
  TestTube,
  X,
  Search,
  Filter,
  FilterIcon,
  Check,
  DollarSign,
  Zap,
  TrendingUp,
  BarChart3,
  Edit,
  Copy,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  GET_PRICING_RULES,
  CREATE_PRICING_RULE,
  UPDATE_PRICING_RULE,
  DELETE_PRICING_RULE,
  TOGGLE_PRICING_RULE,
  CLONE_PRICING_RULE
} from '../../lib/graphql/queries';
import { toast } from 'sonner';

// Import components
import { RuleBuilder } from '../../components/pricing/rule-builder';
import { RuleTestingPanel } from '../../components/pricing/rule-testing-panel';
import { MarkupRuleDrawer } from '../../components/pricing/markup-rule-drawer';
import { ProcessingFeeDrawer } from '../../components/pricing/processing-fee-drawer';

interface PricingRule {
  id: string;
  type: string;
  name: string;
  description: string;
  conditions: any[];
  actions: any[];
  priority: number;
  isActive: boolean;
  isEditable: boolean;
  validFrom?: string;
  validUntil?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const UnifiedPricingRulesPage: React.FC = () => {
  const [showTestingPanel, setShowTestingPanel] = useState(false);
  const [testingPanelWidth, setTestingPanelWidth] = useState(480);
  const [isMobile, setIsMobile] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRuleType, setSelectedRuleType] = useState<string>('all');
  const [selectedRuleTypes, setSelectedRuleTypes] = useState<string[]>([]);
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
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // GraphQL queries and mutations
  const { data: rulesData, loading, error, refetch } = useQuery(GET_PRICING_RULES);
  const [createRule] = useMutation(CREATE_PRICING_RULE);
  const [updateRule] = useMutation(UPDATE_PRICING_RULE);
  const [deleteRule] = useMutation(DELETE_PRICING_RULE);
  const [toggleRule] = useMutation(TOGGLE_PRICING_RULE);
  const [cloneRule] = useMutation(CLONE_PRICING_RULE);

  const rules = rulesData?.pricingRules || [];

  // Filter rules based on search and filters
  const filteredRules = rules.filter((rule: PricingRule) => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rule.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedRuleTypes.length === 0 || selectedRuleTypes.includes(rule.type);
    const matchesSystemFilter = showSystemRules || rule.isEditable;
    
    return matchesSearch && matchesType && matchesSystemFilter;
  });

  // Rule type configurations
  const ruleTypes = [
    { value: 'SYSTEM_MARKUP', label: 'Markup', icon: DollarSign, color: 'green' },
    { value: 'SYSTEM_PROCESSING', label: 'Processing', icon: CreditCard, color: 'purple' },
    { value: 'BUSINESS_DISCOUNT', label: 'Discount', icon: TrendingUp, color: 'blue' },
    { value: 'PROMOTION', label: 'Promotion', icon: BarChart3, color: 'orange' },
    { value: 'SEGMENT', label: 'Segment', icon: Target, color: 'pink' },
  ];

  const toggleRuleType = (type: string) => {
    setSelectedRuleTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getRuleTypeConfig = (type: string) => {
    return ruleTypes.find(rt => rt.value === type) || { value: type, label: type, icon: Settings, color: 'gray' };
  };

  // Toggle testing panel
  const toggleTestingPanel = useCallback(() => {
    setShowTestingPanel(prev => !prev);
  }, []);

  // Handle panel resize
  const handlePanelResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = testingPanelWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth - (e.clientX - startX);
      setTestingPanelWidth(Math.min(Math.max(newWidth, 320), 800));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [testingPanelWidth]);

  // Rule actions
  const handleToggleRule = async (ruleId: string) => {
    try {
      await toggleRule({ variables: { id: ruleId } });
      await refetch();
      toast.success('Rule status updated');
    } catch (error) {
      toast.error('Failed to update rule status');
    }
  };

  const handleCloneRule = async (ruleId: string, newName: string) => {
    try {
      await cloneRule({ variables: { id: ruleId, newName } });
      await refetch();
      toast.success('Rule cloned successfully');
    } catch (error) {
      toast.error('Failed to clone rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteRule({ variables: { id: ruleId } });
      await refetch();
      toast.success('Rule deleted successfully');
    } catch (error) {
      toast.error('Failed to delete rule');
    }
  };

  const getRulePriorityColor = (priority: number) => {
    if (priority >= 90) return 'bg-red-100 text-red-800';
    if (priority >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getRulePriorityLabel = (priority: number) => {
    if (priority >= 90) return 'High';
    if (priority >= 50) return 'Medium';
    return 'Low';
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
        <p className="text-red-800">Failed to load pricing rules: {error.message}</p>
        <Button onClick={() => refetch()} className="mt-2">Try Again</Button>
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
          <Button
            variant={showTestingPanel ? 'default' : 'outline'}
            size="sm"
            onClick={toggleTestingPanel}
            className="flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            Test
          </Button>
        </div>

        {/* Mobile content - simplified view */}
        <div className="space-y-4">
          {/* Add this implementation based on mobile needs */}
          <p className="text-sm text-gray-600">Mobile view implementation needed</p>
        </div>

        {/* Mobile Testing Panel Sheet */}
        <Sheet open={showTestingPanel} onOpenChange={setShowTestingPanel}>
          <SheetContent side="bottom" className="h-[85vh]">
            <SheetHeader>
              <SheetTitle>Rule Testing Panel</SheetTitle>
            </SheetHeader>
            <div className="mt-4 h-full overflow-y-auto pb-20">
              <RuleTestingPanel rules={rules} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Desktop view
  return (
    <div className="h-full flex flex-col">
      {/* Header with testing toggle */}
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
        <Button
          variant={showTestingPanel ? 'default' : 'outline'}
          size="sm"
          onClick={toggleTestingPanel}
          className="flex items-center gap-2"
        >
          <TestTube className="h-4 w-4" />
          {showTestingPanel ? 'Hide' : 'Show'} Testing Panel
        </Button>
      </div>

      {/* Main content with split view */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Rules</p>
                    <p className="text-2xl font-bold text-gray-900">{rules.length}</p>
                  </div>
                  <Settings className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Rules</p>
                    <p className="text-2xl font-bold text-green-600">
                      {rules.filter((r: PricingRule) => r.isActive).length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">System Rules</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {rules.filter((r: PricingRule) => !r.isEditable).length}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Custom Rules</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {rules.filter((r: PricingRule) => r.isEditable).length}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            {/* Search and Type Filter */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Quick filters:</span>
              
              {/* Type Filter Popover */}
              <Popover open={typeFilterOpen} onOpenChange={setTypeFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={selectedRuleTypes.length > 0 ? "default" : "outline"}
                    size="sm"
                    className={selectedRuleTypes.length === 0 ? "border-dashed" : ""}
                  >
                    <FilterIcon className="h-4 w-4 mr-2" />
                    Type
                    {selectedRuleTypes.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1">
                        {selectedRuleTypes.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <div className="space-y-2">
                    <div className="text-sm font-medium mb-2">Filter by Rule Type</div>
                    {ruleTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = selectedRuleTypes.includes(type.value);
                      return (
                        <button
                          key={type.value}
                          onClick={() => toggleRuleType(type.value)}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 text-${type.color}-600`} />
                            <span>{type.label}</span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      );
                    })}
                    {selectedRuleTypes.length > 0 && (
                      <>
                        <Separator className="my-2" />
                        <button
                          onClick={() => setSelectedRuleTypes([])}
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
                    const typeConfig = getRuleTypeConfig(rule.type);
                    const Icon = typeConfig.icon;

                    return (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full bg-${typeConfig.color}-100`}>
                              <Icon className={`h-4 w-4 text-${typeConfig.color}-600`} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{rule.name}</div>
                              {rule.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {rule.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`bg-${typeConfig.color}-50 text-${typeConfig.color}-700`}>
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge 
                                variant="outline" 
                                className={getRulePriorityColor(rule.priority)}
                              >
                                {rule.priority} - {getRulePriorityLabel(rule.priority)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              Higher priority rules are evaluated first
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span className="text-sm">{rule.isActive ? 'Active' : 'Inactive'}</span>
                            {!rule.isEditable && (
                              <Badge variant="secondary" className="text-xs">System</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {new Date(rule.updatedAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleRule(rule.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  {rule.isActive ? 
                                    <Pause className="h-4 w-4 text-orange-600" /> : 
                                    <Play className="h-4 w-4 text-green-600" />
                                  }
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {rule.isActive ? 'Deactivate rule' : 'Activate rule'}
                              </TooltipContent>
                            </Tooltip>

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
                              <TooltipContent>Edit rule</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCloneRule(rule.id, `${rule.name} (Copy)`)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Clone rule</TooltipContent>
                            </Tooltip>

                            {rule.isEditable && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteRule(rule.id)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete rule</TooltipContent>
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
          </Card>

          {filteredRules.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <Settings className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No rules found</h3>
                <p className="mt-2 text-gray-500">
                  {searchQuery || selectedRuleTypes.length > 0
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first pricing rule'
                  }
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <Button onClick={() => setShowCreateDialog(true)}>
                    Create Custom Rule
                  </Button>
                  <Button variant="outline" onClick={() => setShowMarkupDialog(true)}>
                    Add Markup
                  </Button>
                  <Button variant="outline" onClick={() => setShowProcessingDialog(true)}>
                    Add Processing Fee
                  </Button>
                </div>
              </div>
            </Card>
          )}

        </div>

        {/* Desktop Testing Panel - Integrated split view */}
        {showTestingPanel && (
          <div 
            className="relative border-l bg-background flex flex-col"
            style={{ width: `${testingPanelWidth}px` }}
          >
            {/* Resize Handle */}
            <div
              className="absolute left-0 top-0 h-full w-1 cursor-ew-resize hover:bg-blue-500 transition-colors z-10"
              onMouseDown={handlePanelResize}
              style={{ marginLeft: '-2px' }}
            />
            
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Rule Testing Panel</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTestingPanel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Testing Panel Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <RuleTestingPanel rules={rules} />
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Rule Dialog */}
      <Dialog open={showCreateDialog || !!editingRule} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingRule(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? `Edit Rule: ${editingRule.name}` : 'Create New Pricing Rule'}
            </DialogTitle>
            <DialogDescription>
              {editingRule ? 
                'Modify the rule configuration below. Changes will take effect immediately.' :
                'Build a new pricing rule using conditions and actions.'
              }
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
                      input: ruleData
                    }
                  });
                  toast.success('Rule updated successfully');
                } else {
                  await createRule({
                    variables: { input: ruleData }
                  });
                  toast.success('Rule created successfully');
                }
                await refetch();
                setShowCreateDialog(false);
                setEditingRule(null);
              } catch (error) {
                toast.error('Failed to save rule');
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
              variables: { input: ruleData }
            });
            toast.success('Markup rule created successfully');
            await refetch();
            setShowMarkupDialog(false);
          } catch (error) {
            toast.error('Failed to create markup rule');
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
              variables: { input: ruleData }
            });
            toast.success('Processing fee rule created successfully');
            await refetch();
            setShowProcessingDialog(false);
          } catch (error) {
            toast.error('Failed to create processing fee rule');
          }
        }}
      />
    </div>
  );
};

export default UnifiedPricingRulesPage;