import React from 'react';
import { AlertTriangle, Calculator } from 'lucide-react';
import { Badge } from '@workspace/ui';
import { Country } from '@/__generated__/graphql';

interface PricingSimulatorContentProps {
  countries: Country[];
}

export const PricingSimulatorContent: React.FC<PricingSimulatorContentProps> = ({
  countries,
}) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Pricing Simulator Unavailable</h3>
        <p className="text-muted-foreground mb-4">
          This component is being upgraded to use the new pricing pipeline.
        </p>
        <Badge variant="outline" className="mb-4">
          Under Development
        </Badge>
        <p className="text-sm text-muted-foreground max-w-md">
          The pricing simulator will be restored once the new pricing engine implementation is complete.
        </p>
      </div>
    </div>
  );
};