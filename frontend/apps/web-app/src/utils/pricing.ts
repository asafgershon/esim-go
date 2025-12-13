export interface SimplePricingCalculation {
  upperPackagePrice: number;
  totalDiscount: number;
  unusedDays: number;
  finalPriceBeforeRounding: number;
}

export interface SimplePricingDiscount {
  code: string;
  amount: number;
  originalPrice: number;
}

export interface SimplePricingResult {
  finalPrice: number;
  provider: string;
  bundleName: string;
  requestedDays: number;
  calculation: SimplePricingCalculation;
  discount? : SimplePricingDiscount;
}