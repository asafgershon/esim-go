import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui';
import { TestTube, AlertTriangle } from 'lucide-react';

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
  createdAt: string;
  updatedAt: string;
}

interface RuleTestPanelPlaceholderProps {
  selectedRule: PricingRule | null;
}

export const RuleTestPanelPlaceholder: React.FC<RuleTestPanelPlaceholderProps> = ({ 
  selectedRule 
}) => {
  if (!selectedRule) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <TestTube className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Rule Selected</h3>
          <p className="mt-2 text-gray-500">
            Click the "Test" button on any rule to configure and run tests
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Testing: {selectedRule.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Test Panel Coming Soon
                </span>
              </div>
              <p className="text-sm text-yellow-700 mt-2">
                The rule testing interface will be implemented here. For now, this is a placeholder
                showing that the rule "{selectedRule.name}" is selected for testing.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Rule Details</h4>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{selectedRule.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Priority:</span>
                  <span className="font-medium">{selectedRule.priority}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${selectedRule.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                    {selectedRule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Conditions:</span>
                  <span className="font-medium">{selectedRule.conditions.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Actions:</span>
                  <span className="font-medium">{selectedRule.actions.length}</span>
                </div>
              </div>
            </div>

            {selectedRule.description && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Description</h4>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {selectedRule.description}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};