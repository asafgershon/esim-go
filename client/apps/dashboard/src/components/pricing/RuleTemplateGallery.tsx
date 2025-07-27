import React from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from '@workspace/ui';
import {
  TrendingDown,
  Target,
  DollarSign,
  Zap,
  CreditCard,
  Globe,
  Calendar,
  Users,
  Sparkles,
} from 'lucide-react';
import { ActionType, ConditionOperator, RuleCategory } from '@/__generated__/graphql';

interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  icon: React.ComponentType<any>;
  useCase: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  template: {
    category: RuleCategory;
    name: string;
    description: string;
    conditions: Array<{
      field: string;
      operator: ConditionOperator;
      value: string;
    }>;
    actions: Array<{
      type: ActionType;
      value: number;
    }>;
    priority: number;
    isActive: boolean;
  };
}

interface RuleTemplateGalleryProps {
  onSelectTemplate: (template: RuleTemplate['template']) => void;
  className?: string;
}

const RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: 'payment-method-fee',
    name: 'Payment Method Processing Fee',
    description: 'Add processing fees based on payment method',
    category: RuleCategory.Fee,
    icon: CreditCard,
    useCase: 'Apply different processing rates for different payment methods',
    difficulty: 'beginner',
    template: {
      category: RuleCategory.Fee,
      name: 'Foreign Card Processing Fee',
      description: 'Apply 3.9% processing fee for foreign credit cards',
      conditions: [
        {
          field: 'payment.method',
          operator: ConditionOperator.Equals,
          value: 'FOREIGN_CARD',
        },
      ],
      actions: [
        {
          type: ActionType.SetProcessingRate,
          value: 3.9,
        },
      ],
      priority: 80,
      isActive: true,
    },
  },
  {
    id: 'early-bird-discount',
    name: 'Early Bird Discount',
    description: '10% discount for long-duration bundles',
    category: RuleCategory.Discount,
    icon: TrendingDown,
    useCase: 'Encourage customers to buy longer plans',
    difficulty: 'beginner',
    template: {
      category: RuleCategory.Discount,
      name: 'Long Duration Discount',
      description: 'Apply 10% discount for bundles 30 days or longer',
      conditions: [
        {
          field: 'request.duration',
          operator: ConditionOperator.GreaterThanOrEqual,
          value: '30',
        },
      ],
      actions: [
        {
          type: ActionType.ApplyDiscountPercentage,
          value: 10,
        },
      ],
      priority: 60,
      isActive: true,
    },
  },
  {
    id: 'minimum-profit-guard',
    name: 'Minimum Profit Protection',
    description: 'Ensure minimum profit margin on all sales',
    category: RuleCategory.Constraint,
    icon: Target,
    useCase: 'Protect business margins from excessive discounts',
    difficulty: 'intermediate',
    template: {
      category: RuleCategory.Constraint,
      name: 'Minimum Profit Guard',
      description: 'Ensure at least $1.00 profit on every transaction',
      conditions: [], // No conditions - applies to all
      actions: [
        {
          type: ActionType.SetMinimumProfit,
          value: 1.0,
        },
      ],
      priority: 90, // High priority to override discounts
      isActive: true,
    },
  },
  {
    id: 'regional-markup',
    name: 'Regional Pricing Adjustment',
    description: 'Add markup for specific regions',
    category: RuleCategory.BundleAdjustment,
    icon: Globe,
    useCase: 'Adjust pricing for different market conditions',
    difficulty: 'intermediate',
    template: {
      category: RuleCategory.BundleAdjustment,
      name: 'Europe Premium Markup',
      description: 'Add $2 markup for European destinations',
      conditions: [
        {
          field: 'request.region',
          operator: ConditionOperator.Equals,
          value: 'Europe',
        },
      ],
      actions: [
        {
          type: ActionType.AddMarkup,
          value: 2.0,
        },
      ],
      priority: 70,
      isActive: true,
    },
  },
  {
    id: 'premium-bundle-fee',
    name: 'Premium Bundle Processing',
    description: 'Higher processing fee for unlimited bundles',
    category: RuleCategory.Fee,
    icon: Sparkles,
    useCase: 'Apply premium pricing for unlimited data plans',
    difficulty: 'intermediate',
    template: {
      category: RuleCategory.Fee,
      name: 'Unlimited Bundle Premium',
      description: 'Add $1.50 premium for unlimited data bundles',
      conditions: [
        {
          field: 'selectedBundle.isUnlimited',
          operator: ConditionOperator.Equals,
          value: 'true',
        },
      ],
      actions: [
        {
          type: ActionType.AddMarkup,
          value: 1.5,
        },
      ],
      priority: 75,
      isActive: true,
    },
  },
  {
    id: 'short-term-discount',
    name: 'Short-term Bundle Incentive',
    description: 'Discount for trying short-term plans',
    category: RuleCategory.Discount,
    icon: Calendar,
    useCase: 'Encourage trial of short-duration plans',
    difficulty: 'beginner',
    template: {
      category: RuleCategory.Discount,
      name: 'Trial Plan Discount',
      description: 'Apply 15% discount for 1-3 day plans',
      conditions: [
        {
          field: 'request.duration',
          operator: ConditionOperator.LessThanOrEqual,
          value: '3',
        },
      ],
      actions: [
        {
          type: ActionType.ApplyDiscountPercentage,
          value: 15,
        },
      ],
      priority: 65,
      isActive: true,
    },
  },
  {
    id: 'unused-days-discount',
    name: 'Unused Days Compensation',
    description: 'Discount per unused day in bundle',
    category: RuleCategory.BundleAdjustment,
    icon: Calendar,
    useCase: 'Compensate customers for overestimated duration',
    difficulty: 'advanced',
    template: {
      category: RuleCategory.BundleAdjustment,
      name: 'Unused Days Refund',
      description: 'Apply 5% discount per unused day (max 25%)',
      conditions: [
        {
          field: 'unusedDays',
          operator: ConditionOperator.GreaterThan,
          value: '0',
        },
      ],
      actions: [
        {
          type: ActionType.ApplyDiscountPercentage,
          value: 5, // This would need to be calculated per unused day
        },
      ],
      priority: 50,
      isActive: true,
    },
  },
  {
    id: 'multi-region-bundle',
    name: 'Multi-Region Bundle Premium',
    description: 'Premium for regional bundles',
    category: RuleCategory.Fee,
    icon: Globe,
    useCase: 'Charge premium for multi-country coverage',
    difficulty: 'intermediate',
    template: {
      category: RuleCategory.Fee,
      name: 'Regional Bundle Premium',
      description: 'Add $3 premium for regional bundles',
      conditions: [
        {
          field: 'group',
          operator: ConditionOperator.Equals,
          value: 'Regional Bundles',
        },
      ],
      actions: [
        {
          type: ActionType.AddMarkup,
          value: 3.0,
        },
      ],
      priority: 70,
      isActive: true,
    },
  },
];

const getDifficultyColor = (difficulty: RuleTemplate['difficulty']) => {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-800';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800';
    case 'advanced':
      return 'bg-red-100 text-red-800';
  }
};

const getCategoryColor = (category: RuleCategory) => {
  switch (category) {
    case RuleCategory.Discount:
      return 'bg-green-100 text-green-800';
    case RuleCategory.Constraint:
      return 'bg-orange-100 text-orange-800';
    case RuleCategory.Fee:
      return 'bg-blue-100 text-blue-800';
    case RuleCategory.BundleAdjustment:
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const RuleTemplateGallery: React.FC<RuleTemplateGalleryProps> = ({
  onSelectTemplate,
  className = '',
}) => {
  const groupedTemplates = RULE_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<RuleCategory, RuleTemplate[]>);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={`flex items-center gap-2 ${className}`}>
          <Sparkles className="h-4 w-4" />
          Browse Templates
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[900px] max-h-[600px] p-0" 
        align="start"
        side="bottom"
      >
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">Rule Templates</h3>
          <p className="text-sm text-gray-600">
            Choose from common rule patterns to get started quickly.
          </p>
        </div>
        
        <ScrollArea className="h-[500px]">
          <div className="p-4 space-y-6">
            {Object.entries(groupedTemplates).map(([category, templates]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{category.replace('_', ' ')}</h4>
                  <Badge className={getCategoryColor(category as RuleCategory)}>
                    {templates.length} template{templates.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {templates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <Card key={template.id} className="cursor-pointer hover:shadow-sm transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-gray-600" />
                              <CardTitle className="text-sm">{template.name}</CardTitle>
                            </div>
                            <Badge className={getDifficultyColor(template.difficulty)} variant="secondary">
                              {template.difficulty}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-xs text-gray-600">{template.description}</p>
                          
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>Conditions: {template.template.conditions.length || 'None'}</span>
                            <span>Actions: {template.template.actions.length}</span>
                            <span>Priority: {template.template.priority}</span>
                          </div>
                          
                          <Button 
                            onClick={() => onSelectTemplate(template.template)}
                            className="w-full"
                            size="sm"
                            variant="outline"
                          >
                            Use Template
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
            
            <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Template Tips</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• <strong>Beginner</strong> templates are simple with 1-2 conditions</li>
                <li>• <strong>Intermediate</strong> templates combine multiple conditions or actions</li>
                <li>• <strong>Advanced</strong> templates require understanding of complex business logic</li>
                <li>• You can always modify templates after selection to fit your specific needs</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};