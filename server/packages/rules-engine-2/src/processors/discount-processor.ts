import { Event, Almanac } from "json-rules-engine";
import { createLogger } from "@hiilo/utils/src/logger";
import { DiscountEventSchema } from "../blocks/discount";
import type { CouponValidation, VolumeDiscountTier } from "../facts/discount-facts";
import { logCouponUsage } from "../loaders/coupon-loader";

const logger = createLogger({
  name: "discount-processor",
  level: "info",
});

export interface DiscountProcessorResult {
  change: number;
  newPrice: number;
  description: string;
  details: {
    discountType: 'percentage' | 'fixed_amount' | 'bundle-specific';
    originalPercentage?: number;
    actualPercentage?: number;
    maxDiscountApplied?: boolean;
    minSpendMet?: boolean;
    couponCode?: string;
    couponId?: string;
    volumeTier?: VolumeDiscountTier;
    usageLogged?: boolean;
    [key: string]: any;
  };
}

/**
 * Process discount events with comprehensive business logic
 */
export async function processDiscountEvents(
  events: Event[],
  currentPrice: number,
  almanac: Almanac
): Promise<DiscountProcessorResult> {
  try {
    if (events.length === 0) {
      return {
        change: 0,
        newPrice: currentPrice,
        description: "No discount applied",
        details: {
          discountType: 'percentage',
        },
      };
    }

    // Take the highest priority discount (first event in sorted array)
    const discountEvent = events[0];
    const parsedEvent = DiscountEventSchema.parse(discountEvent);
    const { params } = parsedEvent;

    logger.debug("Processing discount event", {
      ruleId: params.ruleId,
      ruleName: params.ruleName,
      discountType: params.discountType,
      discountValue: params.discountValue,
      currentPrice,
    });

    // Handle different discount types
    switch (params.discountType) {
      case 'percentage':
        return await processPercentageDiscount(params, currentPrice, almanac);
      
      case 'fixed_amount':
        return await processFixedAmountDiscount(params, currentPrice, almanac);
      
      case 'bundle-specific':
        return await processBundleSpecificDiscount(params, currentPrice, almanac);
      
      default:
        logger.warn("Unknown discount type", { discountType: params.discountType });
        return {
          change: 0,
          newPrice: currentPrice,
          description: `Unknown discount type: ${params.discountType}`,
          details: {
            discountType: 'percentage',
          },
        };
    }

  } catch (error) {
    logger.error("Error processing discount events", { error, eventsCount: events.length });
    return {
      change: 0,
      newPrice: currentPrice,
      description: "Error processing discount",
      details: {
        discountType: 'percentage',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Process percentage-based discounts
 */
async function processPercentageDiscount(
  params: any,
  currentPrice: number,
  almanac: Almanac
): Promise<DiscountProcessorResult> {
  let discountPercentage = params.discountValue;
  let description = params.ruleName || 'Percentage discount';
  const details: any = {
    discountType: 'percentage',
    originalPercentage: discountPercentage,
  };

  // Handle coupon-based discounts
  if (params.ruleId === 'coupon-discount-001') {
    const couponValidation = await almanac.factValue<CouponValidation>('couponValidation');
    if (couponValidation && couponValidation.isValid) {
      discountPercentage = couponValidation.discountValue;
      description = `Coupon ${couponValidation.code} applied`;
      details.couponCode = couponValidation.code;
      details.couponId = couponValidation.couponId;
      details.minSpend = couponValidation.minSpend;
      details.maxDiscount = couponValidation.maxDiscount;
      
      // Check minimum spend requirement
      if (couponValidation.minSpend && currentPrice < couponValidation.minSpend) {
        details.minSpendMet = false;
        return {
          change: 0,
          newPrice: currentPrice,
          description: `Coupon requires minimum spend of $${couponValidation.minSpend}`,
          details,
        };
      }
      details.minSpendMet = true;
    }
  }

  // Handle volume discounts with quantity-based percentage
  if (params.ruleId === 'volume-discount-001') {
    const quantity = await almanac.factValue<number>('quantity') || 1;
    const volumeTiers = await almanac.factValue<VolumeDiscountTier[]>('volumeDiscountTiers') || [];
    
    // Find applicable tier
    const applicableTier = volumeTiers.find(tier => 
      quantity >= tier.minQuantity && 
      (!tier.maxQuantity || quantity <= tier.maxQuantity)
    );
    
    if (applicableTier) {
      discountPercentage = applicableTier.discountPercentage;
      description = applicableTier.description;
      details.volumeTier = applicableTier;
      details.quantity = quantity;
    }
  }

  // Calculate discount amount
  let discountAmount = currentPrice * (discountPercentage / 100);
  
  // Apply maximum discount cap if specified
  if (params.maxDiscount && discountAmount > params.maxDiscount) {
    discountAmount = params.maxDiscount;
    details.maxDiscountApplied = true;
    details.actualPercentage = (discountAmount / currentPrice) * 100;
  } else {
    details.actualPercentage = discountPercentage;
  }

  const newPrice = Math.max(0, currentPrice - discountAmount);

  // Log coupon usage if this is a coupon-based discount
  if (params.ruleId === 'coupon-discount-001' && details.couponId && discountAmount > 0) {
    try {
      const userId = await almanac.factValue<string>('userId');
      if (userId) {
        await logCouponUsage({
          couponId: details.couponId,
          userId,
          originalAmount: currentPrice,
          discountAmount,
          discountedAmount: newPrice,
        });
        details.usageLogged = true;
        logger.info(`Logged coupon usage for ${details.couponCode}`, {
          couponId: details.couponId,
          userId,
          discountAmount,
        });
      }
    } catch (error) {
      logger.warn('Failed to log coupon usage', { error, couponCode: details.couponCode });
      details.usageLogged = false;
    }
  }

  return {
    change: -discountAmount,
    newPrice,
    description: `${description}: ${details.actualPercentage.toFixed(1)}% off`,
    details,
  };
}

/**
 * Process fixed amount discounts
 */
async function processFixedAmountDiscount(
  params: any,
  currentPrice: number,
  almanac: Almanac
): Promise<DiscountProcessorResult> {
  let discountAmount = params.discountValue;
  let description = params.ruleName || 'Fixed amount discount';
  const details: any = {
    discountType: 'fixed_amount',
    originalAmount: discountAmount,
  };

  // Handle coupon-based fixed discounts
  if (params.ruleId === 'coupon-discount-001') {
    const couponValidation = await almanac.factValue<CouponValidation>('couponValidation');
    if (couponValidation && couponValidation.isValid) {
      discountAmount = couponValidation.discountValue;
      description = `Coupon ${couponValidation.code} applied`;
      details.couponCode = couponValidation.code;
      details.couponId = couponValidation.couponId;
      details.minSpend = couponValidation.minSpend;
      
      // Check minimum spend requirement
      if (couponValidation.minSpend && currentPrice < couponValidation.minSpend) {
        details.minSpendMet = false;
        return {
          change: 0,
          newPrice: currentPrice,
          description: `Coupon requires minimum spend of $${couponValidation.minSpend}`,
          details,
        };
      }
      details.minSpendMet = true;
    }
  }

  // Ensure discount doesn't exceed current price
  discountAmount = Math.min(discountAmount, currentPrice);
  const newPrice = currentPrice - discountAmount;

  // Log coupon usage if this is a coupon-based discount
  if (params.ruleId === 'coupon-discount-001' && details.couponId && discountAmount > 0) {
    try {
      const userId = await almanac.factValue<string>('userId');
      if (userId) {
        await logCouponUsage({
          couponId: details.couponId,
          userId,
          originalAmount: currentPrice,
          discountAmount,
          discountedAmount: newPrice,
        });
        details.usageLogged = true;
        logger.info(`Logged coupon usage for ${details.couponCode}`, {
          couponId: details.couponId,
          userId,
          discountAmount,
        });
      }
    } catch (error) {
      logger.warn('Failed to log coupon usage', { error, couponCode: details.couponCode });
      details.usageLogged = false;
    }
  }

  return {
    change: -discountAmount,
    newPrice,
    description: `${description}: $${discountAmount.toFixed(2)} off`,
    details,
  };
}

/**
 * Process bundle-specific discounts with complex logic
 */
async function processBundleSpecificDiscount(
  params: any,
  currentPrice: number,
  almanac: Almanac
): Promise<DiscountProcessorResult> {
  const description = params.ruleName || 'Bundle-specific discount';
  const details: any = {
    discountType: 'bundle-specific',
  };

  // Get bundle context
  const selectedBundle = await almanac.factValue<any>('selectedBundle');
  const requestedDays = await almanac.factValue<number>('requestedValidityDays');
  const unusedDays = await almanac.factValue<number>('unusedDays');

  if (!selectedBundle) {
    return {
      change: 0,
      newPrice: currentPrice,
      description: "No bundle selected for bundle-specific discount",
      details,
    };
  }

  let discountAmount = 0;
  let discountDescription = description;

  // Long stay discount - progressive discount based on duration
  if (params.ruleId === 'long-stay-discount-001' && requestedDays >= 15) {
    let longStayPercentage = 18; // Base percentage
    
    // Progressive discount: more days = higher discount
    if (requestedDays >= 30) longStayPercentage = 25;
    else if (requestedDays >= 21) longStayPercentage = 22;
    
    discountAmount = currentPrice * (longStayPercentage / 100);
    discountDescription = `Long stay discount: ${longStayPercentage}% off for ${requestedDays} days`;
    details.progressiveDiscount = true;
    details.dayTier = requestedDays >= 30 ? '30+' : requestedDays >= 21 ? '21-29' : '15-20';
  }
  
  // Unlimited data discount with bundle type consideration
  else if (params.ruleId === 'unlimited-data-discount-001' && selectedBundle.is_unlimited) {
    let unlimitedPercentage = 8; // Base percentage
    
    // Higher discount for premium unlimited bundles
    if (selectedBundle.group_name?.includes('Plus')) {
      unlimitedPercentage = 12;
    } else if (selectedBundle.group_name?.includes('Essential')) {
      unlimitedPercentage = 10;
    }
    
    discountAmount = currentPrice * (unlimitedPercentage / 100);
    discountDescription = `Unlimited data discount: ${unlimitedPercentage}% off`;
    details.bundleType = selectedBundle.group_name;
    details.tieredDiscount = true;
  }
  
  // Premium bundle discount
  else if (params.ruleId === 'premium-bundle-discount-001' && 
           selectedBundle.group_name?.includes('Plus')) {
    const premiumPercentage = 12;
    discountAmount = currentPrice * (premiumPercentage / 100);
    discountDescription = `Premium bundle discount: ${premiumPercentage}% off`;
    details.bundleType = selectedBundle.group_name;
  }
  
  // Default percentage discount
  else {
    const defaultPercentage = params.discountValue;
    discountAmount = currentPrice * (defaultPercentage / 100);
    discountDescription = `${description}: ${defaultPercentage}% off`;
  }

  const newPrice = Math.max(0, currentPrice - discountAmount);

  return {
    change: -discountAmount,
    newPrice,
    description: discountDescription,
    details: {
      ...details,
      selectedBundle: {
        name: selectedBundle.group_name,
        isUnlimited: selectedBundle.is_unlimited,
        validityDays: selectedBundle.validity_in_days,
      },
      requestedDays,
      unusedDays,
    },
  };
}