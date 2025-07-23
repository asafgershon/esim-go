import React, { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  Play, 
  Pause, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Settings,
  BarChart3,
  Zap,
  Target
} from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { 
  GET_PRICING_RULES, 
  CREATE_PRICING_RULE, 
  UPDATE_PRICING_RULE, 
  DELETE_PRICING_RULE,
  TOGGLE_PRICING_RULE,
  CLONE_PRICING_RULE
} from '../../lib/graphql/queries';
import { RuleBuilder } from '../../components/pricing/rule-builder';
import { RuleAnalytics } from '../../components/pricing/rule-analytics';

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

const RulesPage: React.FC = () => {
  const [selectedRuleType, setSelectedRuleType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  
  // Quick filter states
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showInactiveRules, setShowInactiveRules] = useState(false);
  const [showSystemRules, setShowSystemRules] = useState(true);

  // GraphQL queries and mutations
  const { data: rulesData, loading, error, refetch } = useQuery(GET_PRICING_RULES, {
    variables: {
      filter: selectedRuleType !== 'all' ? { type: selectedRuleType } : undefined
    }
  });

  const [createRule] = useMutation(CREATE_PRICING_RULE);
  const [updateRule] = useMutation(UPDATE_PRICING_RULE);
  const [deleteRule] = useMutation(DELETE_PRICING_RULE);
  const [toggleRule] = useMutation(TOGGLE_PRICING_RULE);
  const [cloneRule] = useMutation(CLONE_PRICING_RULE);

  const rules = rulesData?.pricingRules || [];

  // Filter rules based on search, type, and quick filters
  const filteredRules = rules.filter((rule: PricingRule) => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rule.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedRuleType === 'all' || rule.type === selectedRuleType;
    const matchesActiveFilter = showInactiveRules || rule.isActive;
    const matchesSystemFilter = showSystemRules || rule.isEditable;
    
    return matchesSearch && matchesType && matchesActiveFilter && matchesSystemFilter;
  });

  // Group rules by type for better organization
  const rulesByType = filteredRules.reduce((acc: any, rule: PricingRule) => {
    if (!acc[rule.type]) acc[rule.type] = [];
    acc[rule.type].push(rule);
    return acc;
  }, {});

  // Rule type configurations
  const ruleTypes = [
    { value: 'all', label: 'All Rules', icon: Settings, color: 'gray' },
    { value: 'SYSTEM_MARKUP', label: 'System Markup', icon: Target, color: 'blue' },
    { value: 'SYSTEM_PROCESSING', label: 'System Processing', icon: Zap, color: 'purple' },
    { value: 'BUSINESS_DISCOUNT', label: 'Business Discount', icon: TrendingUp, color: 'green' },
    { value: 'PROMOTION', label: 'Promotion', icon: BarChart3, color: 'orange' },
    { value: 'SEGMENT', label: 'Customer Segment', icon: Target, color: 'pink' },
  ];

  const getRuleTypeConfig = (type: string) => {
    return ruleTypes.find(rt => rt.value === type) || ruleTypes[0];
  };

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

  return (
    <div className="space-y-6">
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
                <p className="text-sm font-medium text-gray-600">Business Rules</p>
                <p className="text-2xl font-bold text-purple-600">
                  {rules.filter((r: PricingRule) => r.isEditable).length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
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
              <Select value={selectedRuleType} onValueChange={setSelectedRuleType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {ruleTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Rule
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Quick filters:</span>
              <Button
                variant={showAnalytics ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={showAnalytics ? "" : "border-dashed"}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button
                variant={showInactiveRules ? "default" : "outline"}
                size="sm"
                onClick={() => setShowInactiveRules(!showInactiveRules)}
                className={showInactiveRules ? "" : "border-dashed"}
              >
                <Pause className="h-4 w-4 mr-2" />
                Show Inactive
              </Button>
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
          <Card>
            <Table>
              <TableHeader>
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
          </Card>

          {filteredRules.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <Settings className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No rules found</h3>
                <p className="mt-2 text-gray-500">
                  {searchQuery || selectedRuleType !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first pricing rule'
                  }
                </p>
                <Button 
                  onClick={() => setShowCreateDialog(true)} 
                  className="mt-4"
                >
                  Create Rule
                </Button>
              </div>
            </Card>
          )}

          {/* Analytics Section - Shows when analytics filter is active */}
          {showAnalytics && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Rule Analytics</CardTitle>
                <CardDescription>Performance metrics and insights for your pricing rules</CardDescription>
              </CardHeader>
              <CardContent>
                <RuleAnalytics rules={rules} />
              </CardContent>
            </Card>
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
    </div>
  );
};

export default RulesPage;