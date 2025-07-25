import React from 'react';
import { AlertTriangle, TestTube } from 'lucide-react';
import { Badge, Alert, AlertDescription } from '@workspace/ui';
import { PricingRule } from '@/__generated__/graphql';

interface SingleRuleTestPanelProps {
  rule: PricingRule;
}

export const SingleRuleTestPanel: React.FC<SingleRuleTestPanelProps> = ({ rule }) => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TestTube className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Rule Testing</h3>
        <Badge variant="outline">Disabled</Badge>
      </div>
      
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Rule testing is temporarily unavailable during the pricing engine upgrade.
          This feature will be restored with enhanced testing capabilities once the new pipeline is implemented.
        </AlertDescription>
      </Alert>
      
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Testing Rule:</strong> {rule.name}
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Type:</strong> {rule.type}
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Status:</strong> {rule.isActive ? 'Active' : 'Inactive'}
        </p>
      </div>
    </div>
  );
};