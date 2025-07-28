import { Country, PaymentMethod } from '@/__generated__/graphql';
import { useQuery } from '@apollo/client';
import {
  Button,
  Input,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui';
import {
  Calculator,
  CreditCard,
  Package
} from 'lucide-react';
import React from 'react';
import { GET_BUNDLE_GROUPS } from '../lib/graphql/queries';

interface PricingSimulatorPanelProps {
  countries: Country[];
  selectedCountry: string;
  numOfDays: number;
  paymentMethod: PaymentMethod;
  selectedGroups: string[];
  onCountryChange: (country: string) => void;
  onDaysChange: (days: number) => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onGroupsChange: (groups: string[]) => void;
  onSimulate: () => void;
  loading: boolean;
}

const PAYMENT_METHOD_LABELS = {
  [PaymentMethod.IsraeliCard]: 'Israeli Card',
  [PaymentMethod.ForeignCard]: 'Foreign Card',
  [PaymentMethod.Bit]: 'Bit',
  [PaymentMethod.Amex]: 'American Express',
  [PaymentMethod.Diners]: 'Diners Club',
};

export const PricingSimulatorPanel: React.FC<PricingSimulatorPanelProps> = ({
  countries,
  selectedCountry,
  numOfDays,
  paymentMethod,
  selectedGroups,
  onCountryChange,
  onDaysChange,
  onPaymentMethodChange,
  onGroupsChange,
  onSimulate,
  loading,
}) => {
  // Fetch available bundle groups
  const { data: bundleGroupsData } = useQuery(GET_BUNDLE_GROUPS);
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Simulation Parameters</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your pricing scenario
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Country Selection */}
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select value={selectedCountry} onValueChange={onCountryChange}>
              <SelectTrigger id="country">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.iso} value={country.iso}>
                    <div className="flex items-center gap-2">
                      {country.flag && <span>{country.flag}</span>}
                      <span>{country.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="days">Number of Days</Label>
            <Input
              id="days"
              type="number"
              min="1"
              max="365"
              value={numOfDays}
              onChange={(e) => onDaysChange(parseInt(e.target.value) || 1)}
              className="w-full"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment">Payment Method</Label>
            <Select 
              value={paymentMethod} 
              onValueChange={(value) => onPaymentMethodChange(value as PaymentMethod)}
            >
              <SelectTrigger id="payment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([method, label]) => (
                  <SelectItem key={method} value={method}>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bundle Groups */}
          <div className="space-y-2">
            <Label htmlFor="groups">Bundle Groups (Optional)</Label>
            <Select 
              value={selectedGroups.length === 1 ? selectedGroups[0] : ''} 
              onValueChange={(value) => {
                if (value === 'all') {
                  onGroupsChange([]);
                } else if (value) {
                  onGroupsChange([value]);
                }
              }}
            >
              <SelectTrigger id="groups">
                <SelectValue placeholder="All bundle groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span>All Groups</span>
                  </div>
                </SelectItem>
                {bundleGroupsData?.pricingFilters?.groups?.map((group: string) => (
                  <SelectItem key={group} value={'Standard - Unlimited Plus'}>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>{group}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedGroups.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Package className="h-3 w-3" />
                <span>Filtering by: {selectedGroups.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Simulate Button */}
          <Button 
            onClick={onSimulate} 
            disabled={!selectedCountry || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Calculator className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Simulate Pricing
              </>
            )}
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
};