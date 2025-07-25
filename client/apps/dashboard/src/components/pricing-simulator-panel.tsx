import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  ScrollArea,
  Badge,
  Separator,
} from '@workspace/ui';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Globe,
  CreditCard,
} from 'lucide-react';
import { Country, PaymentMethod } from '@/__generated__/graphql';

interface PricingSimulatorPanelProps {
  countries: Country[];
  selectedCountry: string;
  numOfDays: number;
  paymentMethod: PaymentMethod;
  onCountryChange: (country: string) => void;
  onDaysChange: (days: number) => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
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
  onCountryChange,
  onDaysChange,
  onPaymentMethodChange,
  onSimulate,
  loading,
}) => {
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