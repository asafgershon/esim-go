import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Alert,
  AlertDescription,
  Separator,
} from '@workspace/ui';
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Percent,
  Info,
} from 'lucide-react';
import { PricingRule } from '@/__generated__/graphql';

interface RuleImpactCardProps {
  rule: PricingRule;
  appliedRule?: any | null;
  pricingResult: any;
  className?: string;
}

const getRuleCategoryIcon = (category: string) => {
  switch (category.toUpperCase()) {
    case 'DISCOUNT':
      return TrendingDown;
    case 'CONSTRAINT':
      return Target;
    case 'FEE':
      return DollarSign;
    case 'BUNDLE_ADJUSTMENT':
      return TrendingUp;
    default:
      return Info;
  }
};

const getRuleCategoryColor = (category: string) => {
  switch (category.toUpperCase()) {
    case 'DISCOUNT':
      return 'green';
    case 'CONSTRAINT':
      return 'orange';
    case 'FEE':
      return 'blue';
    case 'BUNDLE_ADJUSTMENT':
      return 'purple';
    default:
      return 'gray';
  }
};

const getActionTypeLabel = (actionType: string) => {
  switch (actionType) {
    case 'ADD_MARKUP':
      return 'Add Markup';
    case 'APPLY_DISCOUNT_PERCENTAGE':
      return 'Apply Discount %';
    case 'SET_PROCESSING_RATE':
      return 'Set Processing Rate';
    case 'SET_MINIMUM_PROFIT':
      return 'Set Minimum Profit';
    case 'SET_MINIMUM_PRICE':
      return 'Set Minimum Price';
    default:
      return actionType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
};

const getConditionLabel = (field: string, operator: string, value: any) => {
  const fieldLabel = field.replace(/\./g, ' ').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  switch (operator) {
    case 'EQUALS':
      return `${fieldLabel} equals "${value}"`;
    case 'NOT_EQUALS':
      return `${fieldLabel} does not equal "${value}"`;
    case 'GREATER_THAN':
      return `${fieldLabel} > ${value}`;
    case 'LESS_THAN':
      return `${fieldLabel} < ${value}`;
    case 'GREATER_THAN_OR_EQUAL':
      return `${fieldLabel} >= ${value}`;
    case 'LESS_THAN_OR_EQUAL':
      return `${fieldLabel} <= ${value}`;
    case 'IN':
      return `${fieldLabel} in [${Array.isArray(value) ? value.join(', ') : value}]`;
    case 'NOT_IN':
      return `${fieldLabel} not in [${Array.isArray(value) ? value.join(', ') : value}]`;
    default:
      return `${fieldLabel} ${operator.toLowerCase()} ${value}`;
  }
};

export const RuleImpactCard: React.FC<RuleImpactCardProps> = ({
  rule,
  appliedRule,
  pricingResult,
  className = '',
}) => {
  const CategoryIcon = getRuleCategoryIcon(rule.category);
  const categoryColor = getRuleCategoryColor(rule.category);
  const wasApplied = !!appliedRule;
  

  return (
    <Card className={`border-2 ${wasApplied ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              categoryColor === 'green' ? 'bg-green-100' :
              categoryColor === 'orange' ? 'bg-orange-100' :
              categoryColor === 'blue' ? 'bg-blue-100' :
              categoryColor === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
            }`}>
              <CategoryIcon className={`h-5 w-5 ${
                categoryColor === 'green' ? 'text-green-600' :
                categoryColor === 'orange' ? 'text-orange-600' :
                categoryColor === 'blue' ? 'text-blue-600' :
                categoryColor === 'purple' ? 'text-purple-600' : 'text-gray-600'
              }`} />
            </div>
            <div>
              <span className="text-lg font-semibold">{rule.name}</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`${
                  categoryColor === 'green' ? 'bg-green-50 text-green-700' :
                  categoryColor === 'orange' ? 'bg-orange-50 text-orange-700' :
                  categoryColor === 'blue' ? 'bg-blue-50 text-blue-700' :
                  categoryColor === 'purple' ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-700'
                }`}>
                  {rule.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Priority: {rule.priority}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {wasApplied ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Applied</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Not Applied</span>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Rule Description */}
        {rule.description && (
          <p className="text-sm text-gray-600">{rule.description}</p>
        )}

        {/* Application Status Alert */}
        <Alert className={wasApplied ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {wasApplied ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={wasApplied ? 'text-green-800' : 'text-red-800'}>
            {wasApplied ? (
              'This rule was successfully applied during pricing calculation.'
            ) : (
              'This rule did not apply to the current test scenario. Check the conditions below to understand why.'
            )}
          </AlertDescription>
        </Alert>

        {/* Pricing Context */}
        {wasApplied && (
          <div className="p-3 rounded-lg  border">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Final Price:</span>
                <span className="font-mono font-medium">
                  ${pricingResult.finalRevenue?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rule Applied:</span>
                <span className="text-green-600 font-medium">✓ Yes</span>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Rule Configuration */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Rule Configuration</h4>
          
          {/* Conditions */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Conditions ({rule.conditions.length})
            </h5>
            {rule.conditions.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No conditions - always applies</p>
            ) : (
              <div className="space-y-1">
                {rule.conditions.map((condition, index) => (
                  <div key={index} className="text-xs bg-gray-50 p-2 rounded border">
                    {getConditionLabel(condition.field, condition.operator, condition.value)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Actions ({rule.actions.length})
            </h5>
            <div className="space-y-1">
              {rule.actions.map((action, index) => (
                <div key={index} className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span>{getActionTypeLabel(action.type)}</span>
                    <span className="font-mono">
                      {action.type.includes('PERCENTAGE') ? (
                        <span className="flex items-center gap-1">
                          {action.value}<Percent className="h-3 w-3" />
                        </span>
                      ) : (
                        `$${action.value}`
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Debugging Information */}
        {!wasApplied && (
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <h5 className="text-sm font-medium text-yellow-800 mb-2">
              Why wasn't this rule applied?
            </h5>
            <div className="text-xs text-yellow-700 space-y-1">
              <p>• Rule must be active (currently: {rule.isActive ? 'Active ✓' : 'Inactive ✗'})</p>
              <p>• All conditions must be satisfied</p>
              <p>• Rule priority determines execution order</p>
              <p>• Check test inputs match the rule conditions</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};