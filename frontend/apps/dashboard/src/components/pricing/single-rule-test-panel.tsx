import React from 'react';
import { PricingRule } from '@/__generated__/graphql';
import { PricingSimulator } from './PricingSimulator';

interface SingleRuleTestPanelProps {
  rule: PricingRule;
}

export const SingleRuleTestPanel: React.FC<SingleRuleTestPanelProps> = ({ rule }) => {
  return (
    <div className="h-full overflow-y-auto">
      <PricingSimulator selectedRule={rule} className="p-6" />
    </div>
  );
};