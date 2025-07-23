import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  RadioGroup,
  RadioGroupItem,
  Card,
  CardContent,
  Separator,
  Switch,
} from '@workspace/ui';
import { CreditCard, Info } from 'lucide-react';

interface ProcessingFeeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (ruleData: any) => Promise<void>;
}

export function ProcessingFeeDrawer({ open, onOpenChange, onSave }: ProcessingFeeDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [description, setDescription] = useState('');
  const [feeType, setFeeType] = useState<'percentage' | 'fixed'>('percentage');
  const [feeValue, setFeeValue] = useState('');
  const [minFee, setMinFee] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [applyToMethod, setApplyToMethod] = useState<'all' | 'specific'>('all');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [priority, setPriority] = useState('50');
  const [includeMinMax, setIncludeMinMax] = useState(false);

  const handleSubmit = async () => {
    if (!ruleName || !feeValue) return;

    setLoading(true);
    try {
      const conditions = [];
      
      // Add payment method condition if specific
      if (applyToMethod === 'specific' && paymentMethod) {
        conditions.push({
          type: 'PAYMENT_METHOD',
          operator: 'EQUALS',
          value: paymentMethod
        });
      }

      const actions = [{
        type: feeType === 'percentage' ? 'ADD_PERCENTAGE_FEE' : 'ADD_FIXED_FEE',
        value: parseFloat(feeValue)
      }];

      // Add min/max constraints if enabled
      if (includeMinMax && feeType === 'percentage') {
        if (minFee) {
          actions.push({
            type: 'SET_MINIMUM_FEE',
            value: parseFloat(minFee)
          });
        }
        if (maxFee) {
          actions.push({
            type: 'SET_MAXIMUM_FEE',
            value: parseFloat(maxFee)
          });
        }
      }

      const ruleData = {
        type: 'SYSTEM_PROCESSING',
        name: ruleName,
        description: description || `${feeType === 'percentage' ? feeValue + '%' : '$' + feeValue} processing fee${applyToMethod === 'specific' ? ` for ${paymentMethod}` : ''}`,
        conditions,
        actions,
        priority: parseInt(priority),
        isActive: true
      };

      await onSave(ruleData);
      
      // Reset form
      setRuleName('');
      setDescription('');
      setFeeValue('');
      setMinFee('');
      setMaxFee('');
      setPaymentMethod('');
      setFeeType('percentage');
      setApplyToMethod('all');
      setPriority('50');
      setIncludeMinMax(false);
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
        <SheetHeader className="px-6">
          <SheetTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-600" />
            Add Processing Fee Rule
          </SheetTitle>
          <SheetDescription>
            Create a processing fee rule for transactions. This fee is typically used to cover payment processing costs.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Rule Name</Label>
              <Input
                id="rule-name"
                placeholder="e.g., Credit Card Processing Fee"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe when this fee applies..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Fee Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Fee Configuration</h3>
            
            <div className="space-y-2">
              <Label>Fee Type</Label>
              <RadioGroup value={feeType} onValueChange={(value: 'percentage' | 'fixed') => setFeeType(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="percentage" />
                  <Label htmlFor="percentage" className="font-normal">Percentage (%)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed" className="font-normal">Fixed Amount ($)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee-value">
                Fee Value {feeType === 'percentage' ? '(%)' : '($)'}
              </Label>
              <Input
                id="fee-value"
                type="number"
                step="0.01"
                placeholder={feeType === 'percentage' ? "e.g., 2.9" : "e.g., 0.30"}
                value={feeValue}
                onChange={(e) => setFeeValue(e.target.value)}
              />
            </div>

            {/* Min/Max for percentage fees */}
            {feeType === 'percentage' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="min-max-toggle" className="text-sm font-medium">
                    Set minimum/maximum fee limits
                  </Label>
                  <Switch
                    id="min-max-toggle"
                    checked={includeMinMax}
                    onCheckedChange={setIncludeMinMax}
                  />
                </div>
                
                {includeMinMax && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-fee">Minimum Fee ($)</Label>
                      <Input
                        id="min-fee"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 0.50"
                        value={minFee}
                        onChange={(e) => setMinFee(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-fee">Maximum Fee ($)</Label>
                      <Input
                        id="max-fee"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 10.00"
                        value={maxFee}
                        onChange={(e) => setMaxFee(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Payment Method Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Apply To</h3>
            
            <div className="space-y-2">
              <Label>Payment Methods</Label>
              <RadioGroup value={applyToMethod} onValueChange={(value: 'all' | 'specific') => setApplyToMethod(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all-methods" />
                  <Label htmlFor="all-methods" className="font-normal">All Payment Methods</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific" id="specific-method" />
                  <Label htmlFor="specific-method" className="font-normal">Specific Payment Method</Label>
                </div>
              </RadioGroup>
            </div>

            {applyToMethod === 'specific' && (
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="apple_pay">Apple Pay</SelectItem>
                    <SelectItem value="google_pay">Google Pay</SelectItem>
                    <SelectItem value="bitcoin">Bitcoin</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* Priority */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">High (90)</SelectItem>
                  <SelectItem value="50">Medium (50)</SelectItem>
                  <SelectItem value="10">Low (10)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Higher priority rules are evaluated first</p>
            </div>
          </div>

          {/* Preview */}
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-purple-600 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-purple-900">Rule Preview</p>
                  <p className="text-purple-700">
                    This rule will add a {feeType === 'percentage' ? `${feeValue || '0'}%` : `$${feeValue || '0'}`} processing fee
                    {applyToMethod === 'specific' ? ` for ${paymentMethod || '...'} payments` : ' to all payment methods'}
                    {includeMinMax && feeType === 'percentage' && (minFee || maxFee) && (
                      <span>
                        {minFee && ` (minimum $${minFee})`}
                        {minFee && maxFee && ','}
                        {maxFee && ` (maximum $${maxFee})`}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <SheetFooter className="sticky bottom-0 bg-background px-6 pt-4 mt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !ruleName || !feeValue || (applyToMethod === 'specific' && !paymentMethod)}
          >
            {loading ? 'Creating...' : 'Create Processing Fee'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}