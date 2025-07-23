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
} from '@workspace/ui';
import { DollarSign, Info } from 'lucide-react';

interface MarkupRuleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (ruleData: any) => Promise<void>;
}

export function MarkupRuleDrawer({ open, onOpenChange, onSave }: MarkupRuleDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [description, setDescription] = useState('');
  const [markupType, setMarkupType] = useState<'percentage' | 'fixed'>('percentage');
  const [markupValue, setMarkupValue] = useState('');
  const [scope, setScope] = useState<'all' | 'country' | 'region' | 'bundle'>('all');
  const [scopeValue, setScopeValue] = useState('');
  const [priority, setPriority] = useState('50');

  const handleSubmit = async () => {
    if (!ruleName || !markupValue) return;

    setLoading(true);
    try {
      const conditions = [];
      
      // Add scope conditions
      if (scope === 'country' && scopeValue) {
        conditions.push({
          type: 'COUNTRY',
          operator: 'EQUALS',
          value: scopeValue
        });
      } else if (scope === 'region' && scopeValue) {
        conditions.push({
          type: 'REGION',
          operator: 'EQUALS',
          value: scopeValue
        });
      } else if (scope === 'bundle' && scopeValue) {
        conditions.push({
          type: 'BUNDLE_GROUP',
          operator: 'EQUALS',
          value: scopeValue
        });
      }

      const ruleData = {
        type: 'SYSTEM_MARKUP',
        name: ruleName,
        description: description || `${markupType === 'percentage' ? markupValue + '%' : '$' + markupValue} markup${scope !== 'all' ? ` for ${scope} ${scopeValue}` : ''}`,
        conditions,
        actions: [{
          type: markupType === 'percentage' ? 'ADD_PERCENTAGE_MARKUP' : 'ADD_FIXED_MARKUP',
          value: parseFloat(markupValue)
        }],
        priority: parseInt(priority),
        isActive: true
      };

      await onSave(ruleData);
      
      // Reset form
      setRuleName('');
      setDescription('');
      setMarkupValue('');
      setScopeValue('');
      setMarkupType('percentage');
      setScope('all');
      setPriority('50');
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Add Markup Rule
          </SheetTitle>
          <SheetDescription>
            Create a simplified markup rule for bundle pricing. This rule will add a percentage or fixed amount to the base price.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Rule Name</Label>
              <Input
                id="rule-name"
                placeholder="e.g., Global 20% Markup"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe when this markup applies..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Markup Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Markup Configuration</h3>
            
            <div className="space-y-2">
              <Label>Markup Type</Label>
              <RadioGroup value={markupType} onValueChange={(value: 'percentage' | 'fixed') => setMarkupType(value)}>
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
              <Label htmlFor="markup-value">
                Markup Value {markupType === 'percentage' ? '(%)' : '($)'}
              </Label>
              <Input
                id="markup-value"
                type="number"
                step="0.01"
                placeholder={markupType === 'percentage' ? "e.g., 20" : "e.g., 5.00"}
                value={markupValue}
                onChange={(e) => setMarkupValue(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Scope Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Apply To</h3>
            
            <div className="space-y-2">
              <Label>Scope</Label>
              <RadioGroup value={scope} onValueChange={(value: 'all' | 'country' | 'region' | 'bundle') => setScope(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="font-normal">All Bundles</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="country" id="country" />
                  <Label htmlFor="country" className="font-normal">Specific Country</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="region" id="region" />
                  <Label htmlFor="region" className="font-normal">Specific Region</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bundle" id="bundle" />
                  <Label htmlFor="bundle" className="font-normal">Specific Bundle Group</Label>
                </div>
              </RadioGroup>
            </div>

            {scope !== 'all' && (
              <div className="space-y-2">
                <Label htmlFor="scope-value">
                  {scope === 'country' ? 'Country' : scope === 'region' ? 'Region' : 'Bundle Group'}
                </Label>
                <Input
                  id="scope-value"
                  placeholder={scope === 'country' ? 'e.g., US' : scope === 'region' ? 'e.g., Europe' : 'e.g., Standard Fixed'}
                  value={scopeValue}
                  onChange={(e) => setScopeValue(e.target.value)}
                />
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
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-blue-900">Rule Preview</p>
                  <p className="text-blue-700">
                    This rule will add a {markupType === 'percentage' ? `${markupValue || '0'}%` : `$${markupValue || '0'}`} markup 
                    {scope === 'all' ? ' to all bundles' : ` to bundles in ${scope} ${scopeValue || '...'}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <SheetFooter className="sticky bottom-0 bg-background pt-4 mt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !ruleName || !markupValue || (scope !== 'all' && !scopeValue)}
          >
            {loading ? 'Creating...' : 'Create Markup Rule'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}