import { Alert, AlertDescription } from '@workspace/ui';
import { TrendingDown } from 'lucide-react';
import React from 'react';

interface UnusedDaysFormulaAlertProps {
  unusedDays: number;
  requestedDays: number;
  selectedBundleDuration: number;
  discountPerDay: number;
  currency?: string;
}

export const UnusedDaysFormulaAlert: React.FC<UnusedDaysFormulaAlertProps> = ({
  unusedDays,
  requestedDays,
  selectedBundleDuration,
  discountPerDay,
  currency = 'USD',
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const totalDiscount = unusedDays * discountPerDay;

  return (
    <Alert className="border-blue-200 bg-blue-50">
      <TrendingDown className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <div className="font-medium mb-1">Unused Days Discount Applied</div>
        <div className="text-sm">
          Requested {requestedDays} days, selected {selectedBundleDuration}-day bundle.
        </div>
        <div className="text-sm mt-1">
          <span className="font-medium">Formula:</span> {unusedDays} unused days × {formatCurrency(discountPerDay)}/day = {formatCurrency(totalDiscount)} total discount
        </div>
        <div className="text-xs mt-2 text-blue-600 italic">
          Daily discount rate is calculated based on the markup difference between bundle durations.
        </div>
      </AlertDescription>
    </Alert>
  );
};