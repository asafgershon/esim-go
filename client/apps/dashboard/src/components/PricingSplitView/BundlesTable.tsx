import { Bundle, PaymentMethod, GetPaymentMethodsQuery } from "@/__generated__/graphql";
import { ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from "@workspace/ui";
import { Package, CreditCard, Smartphone } from "lucide-react";
import React, { useEffect, useState, createElement } from "react";
import { BundlesByCountryWithBundles } from "./types";
import { CustomerBundleCard } from "./CustomerBundleCard";
import { useLazyQuery, useQuery } from "@apollo/client";
import { CALCULATE_BATCH_ADMIN_PRICING, GET_PAYMENT_METHODS } from "../../lib/graphql/queries";

interface BundlesTableProps {
  country: BundlesByCountryWithBundles;
  loadingCountries: Set<string>;
  selectedBundle: Bundle | null;
  onBundleSelect: (bundle: Bundle) => void;
}

// Icon mapping for payment methods
const iconMap: Record<string, React.ComponentType<any>> = {
  'credit-card': CreditCard,
  'smartphone': Smartphone,
};

export const BundlesTable: React.FC<BundlesTableProps> = ({
  country,
  loadingCountries,
  selectedBundle,
  onBundleSelect,
}) => {
  const isCountryLoading = loadingCountries.has(country.country.iso);
  const [bundlesWithPricing, setBundlesWithPricing] = useState<Bundle[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PaymentMethod.IsraeliCard);
  
  const [calculateBatchPricing] = useLazyQuery(CALCULATE_BATCH_ADMIN_PRICING);
  const { data: paymentMethodsData } = useQuery<GetPaymentMethodsQuery>(GET_PAYMENT_METHODS);

  // Calculate pricing when bundles are loaded
  useEffect(() => {
    if (!country.bundles || country.bundles.length === 0) return;
    
    const calculatePricing = async () => {
      setPricingLoading(true);
      
      // Get unique durations from bundles
      const uniqueDurations = Array.from(new Set(
        country.bundles!.map(bundle => bundle.validityInDays).filter(days => days > 0)
      ));
      
      // Create pricing requests
      const requests = uniqueDurations.map(days => ({
        numOfDays: days,
        countryId: country.country.iso.toUpperCase(),
        paymentMethod: selectedPaymentMethod
      }));
      
      try {
        const result = await calculateBatchPricing({
          variables: { requests }
        });
        
        if (result.data?.calculateBatchPricing) {
          // Create a map of duration to pricing data
          const pricingMap = new Map();
          result.data.calculateBatchPricing.forEach((pricing: any) => {
            pricingMap.set(pricing.duration, pricing);
          });
          
          // Merge pricing data with bundles
          const bundlesWithPricing = country.bundles!.map(bundle => ({
            ...bundle,
            pricingBreakdown: pricingMap.get(bundle.validityInDays)
          }));
          
          setBundlesWithPricing(bundlesWithPricing);
        }
      } catch (error) {
        console.error('Error calculating pricing:', error);
        // Fallback to bundles without pricing
        setBundlesWithPricing(country.bundles!);
      } finally {
        setPricingLoading(false);
      }
    };
    
    calculatePricing();
  }, [country.bundles, country.country.iso, selectedPaymentMethod, calculateBatchPricing]);

  if (isCountryLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading bundles...</span>
      </div>
    );
  }

  if (!country.bundles || country.bundles.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-gray-500">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-lg">No bundles available</p>
          <p className="text-sm">This country has no pricing data available</p>
        </div>
      </div>
    );
  }

  // Show pricing loading state
  if (pricingLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Calculating pricing...</span>
      </div>
    );
  }

  // Use bundles with pricing if available, otherwise use original bundles
  const displayBundles = bundlesWithPricing.length > 0 ? bundlesWithPricing : country.bundles;
  const sortedBundles = [...displayBundles].sort(
    (a, b) => (a.validityInDays || 0) - (b.validityInDays || 0)
  );

  const paymentMethods = paymentMethodsData?.paymentMethods || [];
  const currentPaymentMethod = paymentMethods.find(pm => pm.value === selectedPaymentMethod);

  return (
    <div className="flex flex-col h-full">
      {/* Payment Method Selector */}
      {paymentMethods.length > 0 && (
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Payment Method Impact</h3>
              <p className="text-xs text-gray-500 mt-0.5">See how processing fees affect your profits</p>
            </div>
            <Select
              value={selectedPaymentMethod}
              onValueChange={(value) => setSelectedPaymentMethod(value as PaymentMethod)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.filter(method => method.isActive).map((method) => {
                  const Icon = method.icon ? iconMap[method.icon] || CreditCard : CreditCard;
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{method.label}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {(method.processingRate * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          {/* Current Payment Method Info */}
          {currentPaymentMethod && (
            <div className="mt-3 p-2 bg-white rounded-md border">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {currentPaymentMethod.icon && (
                    <span className="text-gray-500">
                      {createElement(iconMap[currentPaymentMethod.icon] || CreditCard, { className: "h-4 w-4" })}
                    </span>
                  )}
                  <span className="text-gray-700">{currentPaymentMethod.label}</span>
                </div>
                <span className="text-gray-500">{currentPaymentMethod.description}</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      <ScrollArea className="flex-1" showOnHover={true}>
        <div className="space-y-2 p-2">
          {sortedBundles.map((bundle, index) => (
            <CustomerBundleCard
              key={
                bundle.name
                  ? `${bundle.name}-${bundle.validityInDays}`
                  : `bundle-${index}`
              }
              bundle={bundle}
              isSelected={selectedBundle === bundle}
              onClick={() => onBundleSelect(bundle)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
