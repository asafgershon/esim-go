export const getDefaultConfig = (type: string): { [key: string]: any } => {
  switch (type) {
    case "discount":
      return {
        type: "percentage",
        value: 10,
        condition: "always",
        minDays: 7,
      };
    case "markup":
      return {
        markupType: "fixed",
        markupValue: 5,
        groupDurationConfigs: {}, // Will be populated based on groups and durations
      };
    case "fixed-price":
      return {
        basePrice: 0,
        currency: "USD",
      };
    case "processing-fee":
      return {
        paymentMethod: "card",
        feePercentage: 2.9,
        fixedFee: 0.3,
      };
    case "profit-constraint":
      return {
        value: 1.5, // Minimum profit in dollars - matches database
      };
    case "psychological-rounding":
      return {
        strategy: "charm",
        roundTo: 0.99,
      };
    case "region-rounding":
      return {
        region: "us",
        roundingRule: "nearest-dollar",
      };
    case "coupon":
      return {
        enableCoupons: true,
        enableCorporateDiscounts: true,
        activeCoupons: 0,
        corporateDomains: 0,
      };
    case "base-price":
      return {}; // No params needed - uses bundle price directly
    case "unused-days-discount":
      return {}; // No params needed - calculated dynamically
    case "provider-selection":
      return {
        preferredProvider: "MAYA",
        fallbackProvider: "ESIM_GO",
      };
    default:
      return {};
  }
};