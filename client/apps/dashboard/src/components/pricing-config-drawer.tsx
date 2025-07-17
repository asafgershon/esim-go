import { useMutation } from '@apollo/client';
import {
  Badge,
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Input,
  Label,
  Separator,
  Slider,
  Switch, Textarea
} from '@workspace/ui';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UPDATE_PRICING_CONFIGURATION } from '../lib/graphql/queries';

interface PricingData {
  bundleName: string;
  countryName: string;
  duration: number;
  cost: number;
  costPlus: number;
  totalCost: number;
  discountRate: number;
  discountValue: number;
  priceAfterDiscount: number;
  processingRate: number;
  processingCost: number;
  revenueAfterProcessing: number;
  finalRevenue: number;
  currency: string;
}

interface PricingConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pricingData: PricingData | null;
  onConfigurationSaved?: () => void;
}

export const PricingConfigDrawer: React.FC<PricingConfigDrawerProps> = ({
  isOpen,
  onClose,
  pricingData,
  onConfigurationSaved,
}) => {
  const [updatePricingConfiguration, { loading }] = useMutation(UPDATE_PRICING_CONFIGURATION);
  
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    costSplitPercent: 0.6,
    discountRate: 0.3,
    processingRate: 0.045,
    isActive: true,
    priority: 10,
  });

  // Price range state for dynamic pricing
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  
  // Simulator state
  const [simulatorDays, setSimulatorDays] = useState(7);

  // Initialize form data when pricing data changes
  useEffect(() => {
    if (pricingData) {
      setFormData({
        name: `${pricingData.countryName} ${pricingData.duration}d Custom Config`,
        description: `Custom pricing configuration for ${pricingData.countryName} ${pricingData.duration}-day bundles`,
        costSplitPercent: pricingData.cost / pricingData.totalCost,
        discountRate: pricingData.discountRate,
        processingRate: pricingData.processingRate,
        isActive: true,
        priority: 10,
      });
      
      // Calculate profit-based price boundaries
      const currentPrice = pricingData.priceAfterDiscount;
      const baseCosts = pricingData.cost + pricingData.costPlus;
      const processingCost = currentPrice * pricingData.processingRate;
      const breakEvenPrice = baseCosts + processingCost + 0.01; // Minimum profitable price
      const maxRecommendedPrice = Math.round(currentPrice * 1.5 * 100) / 100; // 50% above current
      
      setPriceRange([breakEvenPrice, maxRecommendedPrice]);
    }
  }, [pricingData]);

  const handleSave = async () => {
    if (!pricingData) return;

    try {
      // Extract country code from country name (this is a simplified approach)
      const countryCode = pricingData.countryName === 'Austria' ? 'AT' : null;

      const result = await updatePricingConfiguration({
        variables: {
          input: {
            name: formData.name,
            description: formData.description,
            countryId: countryCode,
            duration: pricingData.duration,
            costSplitPercent: formData.costSplitPercent,
            discountRate: formData.discountRate,
            processingRate: formData.processingRate,
            isActive: formData.isActive,
            priority: formData.priority,
          },
        },
      });

      if (result.data?.updatePricingConfiguration?.success) {
        toast.success('Pricing configuration saved successfully!');
        onConfigurationSaved?.();
        onClose();
      } else {
        toast.error(result.data?.updatePricingConfiguration?.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving pricing configuration:', error);
      toast.error('Failed to save configuration');
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return (rate * 100).toFixed(1) + '%';
  };

  // Calculate preview values based on form data
  const previewCost = pricingData ? pricingData.totalCost * formData.costSplitPercent : 0;
  const previewCostPlus = pricingData ? pricingData.totalCost * (1 - formData.costSplitPercent) : 0;
  const previewDiscountValue = pricingData ? pricingData.totalCost * formData.discountRate : 0;
  const previewPriceAfterDiscount = pricingData ? pricingData.totalCost - previewDiscountValue : 0;
  const previewProcessingCost = previewPriceAfterDiscount * formData.processingRate;
  const previewRevenueAfterProcessing = previewPriceAfterDiscount - previewProcessingCost;
  const previewFinalRevenue = previewRevenueAfterProcessing - previewCost - previewCostPlus;

  if (!isOpen) {
    return null;
  }

  return (
    <Drawer direction="bottom" open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="fixed bottom-0 left-0 right-0 max-h-[85vh] z-50 bg-background border-t rounded-t-lg">
        <DrawerHeader>
          <DrawerTitle>Configure Pricing</DrawerTitle>
          <DrawerDescription>
            {pricingData && (
              <>
                Adjust pricing configuration for <strong>{pricingData.bundleName}</strong> in <strong>{pricingData.countryName}</strong>
              </>
            )}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex h-full overflow-hidden">
          {/* Left Side: Configuration Form */}
          <div className="w-1/3 p-6 border-r overflow-y-auto max-h-[65vh]">
            <h3 className="text-lg font-semibold mb-4">Configuration</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Configuration Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter configuration name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this pricing configuration"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="markupPercent">Markup Percentage</Label>
                  <Input
                    id="markupPercent"
                    type="number"
                    min="0"
                    max="200"
                    step="1"
                    value={Math.round((formData.costSplitPercent / (1 - formData.costSplitPercent)) * 100)}
                    onChange={(e) => {
                      const markup = parseFloat(e.target.value) / 100;
                      const costSplit = 1 / (1 + markup);
                      setFormData(prev => ({ ...prev, costSplitPercent: costSplit }));
                    }}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Markup percentage over eSIM Go cost (e.g., 40 for 40% markup)
                  </p>
                </div>

                <div>
                  <Label htmlFor="discountRate">Discount Rate</Label>
                  <Input
                    id="discountRate"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(formData.discountRate * 100)}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountRate: parseFloat(e.target.value) / 100 }))}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Discount percentage (e.g., 30 for 30%)
                  </p>
                </div>

                <div>
                  <Label htmlFor="processingRate">Processing Rate</Label>
                  <Input
                    id="processingRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={Math.round(formData.processingRate * 1000) / 10}
                    onChange={(e) => setFormData(prev => ({ ...prev, processingRate: parseFloat(e.target.value) / 100 }))}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Processing fee percentage (e.g., 4.5 for 4.5%)
                  </p>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Higher priority overrides lower priority
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active Configuration</Label>
              </div>
            </div>
          </div>

          {/* Middle: Preview and Price Range */}
          <div className="w-1/3 p-6 border-r overflow-y-auto max-h-[65vh]">
            <h3 className="text-lg font-semibold mb-4">Preview & Analysis</h3>
            
            {/* Bundle Information */}
            {pricingData && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Bundle Information</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Requested:</strong> {pricingData.duration} days</p>
                  <p><strong>eSIM Go Bundle:</strong> {pricingData.bundleName}</p>
                  <p><strong>eSIM Go Price:</strong> {formatCurrency(pricingData.cost + pricingData.costPlus)}</p>
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="space-y-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>eSIM Go Cost:</span>
                  <span>{formatCurrency(pricingData?.cost || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Our Markup:</span>
                  <span>{formatCurrency(pricingData?.costPlus || 0)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Cost:</span>
                  <span>{pricingData ? formatCurrency(pricingData.totalCost) : '$0.00'}</span>
                </div>
                
                {/* Show unused days discount if applicable */}
                {pricingData && pricingData.bundleName.includes('days') && (
                  <div className="flex justify-between text-orange-600">
                    <span>Unused Days Discount:</span>
                    <span>-{formatCurrency((pricingData.cost + pricingData.costPlus) * 0.1)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Customer Discount ({formatPercentage(formData.discountRate)}):</span>
                  <span className="text-green-600">-{formatCurrency(previewDiscountValue)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Price After Discount:</span>
                  <span className="text-blue-600">{formatCurrency(previewPriceAfterDiscount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing ({formatPercentage(formData.processingRate)}):</span>
                  <span className="text-yellow-600">-{formatCurrency(previewProcessingCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Revenue After Processing:</span>
                  <span>{formatCurrency(previewRevenueAfterProcessing)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Final Revenue (Profit):</span>
                  <span className="text-green-600">{formatCurrency(previewFinalRevenue)}</span>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Price Range Analysis */}
            <div className="space-y-4">
              <div>
                <Label>Pricing Boundaries</Label>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Break-even:</span>
                      <Badge variant="destructive">{formatCurrency(previewCost + previewCostPlus + previewProcessingCost)}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Current:</span>
                      <Badge variant="secondary">
                        {formatCurrency(previewPriceAfterDiscount)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Max Recommended:</span>
                      <Badge variant="outline">{formatCurrency(priceRange[1])}</Badge>
                    </div>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Profit Margin:</strong> {formatCurrency(previewFinalRevenue)} 
                      ({previewFinalRevenue > 0 ? '+' : ''}{((previewFinalRevenue / (previewCost + previewCostPlus)) * 100).toFixed(1)}%)
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Minimum profitable price: {formatCurrency(previewCost + previewCostPlus + previewProcessingCost + 0.01)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Price Simulator */}
          <div className="w-1/3 p-6 overflow-y-auto max-h-[65vh]">
            <h3 className="text-lg font-semibold mb-4">Price Simulator</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="simulatorDays">Days</Label>
                <Input
                  id="simulatorDays"
                  type="number"
                  min="1"
                  max="365"
                  value={simulatorDays}
                  onChange={(e) => setSimulatorDays(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Simulate pricing for any number of days
                </p>
              </div>

              {/* Simulated Pricing Breakdown */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Simulated Pricing</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Days Requested:</span>
                    <Badge variant="outline">{simulatorDays}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Bundle Used:</span>
                    <span>UL essential {Math.max(simulatorDays, 7)} days</span>
                  </div>
                  {simulatorDays < 7 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Unused Days:</span>
                      <span>{7 - simulatorDays} days</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span>eSIM Go Cost:</span>
                    <span>{formatCurrency(pricingData?.cost || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Our Markup ({Math.round((formData.costSplitPercent / (1 - formData.costSplitPercent)) * 100)}%):</span>
                    <span>{formatCurrency(pricingData?.costPlus || 0)}</span>
                  </div>
                  {simulatorDays < 7 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Unused Days Discount:</span>
                      <span>-{formatCurrency(((7 - simulatorDays) / 7) * (pricingData?.totalCost || 0) * 0.1)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Customer Discount ({formatPercentage(formData.discountRate)}):</span>
                    <span className="text-green-600">-{formatCurrency((pricingData?.totalCost || 0) * formData.discountRate)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium text-lg">
                    <span>Final Price:</span>
                    <span className="text-blue-600">
                      {formatCurrency(
                        ((pricingData?.totalCost || 0) * 
                        (1 - (simulatorDays < 7 ? ((7 - simulatorDays) / 7) * 0.1 : 0))) * 
                        (1 - formData.discountRate)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Price per day:</span>
                    <span>
                      {formatCurrency(
                        (((pricingData?.totalCost || 0) * 
                        (1 - (simulatorDays < 7 ? ((7 - simulatorDays) / 7) * 0.1 : 0))) * 
                        (1 - formData.discountRate)) / simulatorDays
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Day Buttons */}
              <div>
                <Label>Quick Select</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[3, 5, 7, 10, 14, 21, 30].map((days) => (
                    <Button
                      key={days}
                      variant={simulatorDays === days ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSimulatorDays(days)}
                    >
                      {days}d
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};