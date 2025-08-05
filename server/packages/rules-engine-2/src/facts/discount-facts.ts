import { Almanac } from "json-rules-engine";
import { createLogger } from "@hiilo/utils/src/logger";
import { 
  loadCouponByCode, 
  getCouponUsageCount, 
  findCorporateEmailDomain, 
  validateCouponApplicability,
  type CouponRow,
  type CorporateEmailDomainRow 
} from '../loaders/coupon-loader';
import { Database } from '../generated/database.types';

const logger = createLogger({
  name: "discount-facts",
  level: "info",
});

/**
 * User segment classification for targeting discounts
 */
export type UserSegment = 'new' | 'returning' | 'vip' | 'inactive';

/**
 * Time-based discount periods
 */
export type DiscountPeriod = 'early-bird' | 'peak-hours' | 'weekend' | 'holiday' | 'end-of-month';

/**
 * Geographic market tiers for regional pricing
 */
export type MarketTier = 'premium' | 'standard' | 'emerging';

/**
 * Coupon code validation result
 */
export interface CouponValidation {
  isValid: boolean;
  couponId?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minSpend?: number;
  maxDiscount?: number;
  validUntil?: Date;
  usageLimit?: number;
  totalUsageCount?: number;
  userUsageCount?: number;
  applicableBundles?: string[];
  applicableRegions?: string[];
  corporateDomain?: string;
  code: string;
  description?: string;
}

/**
 * User purchase history for behavioral targeting
 */
export interface UserPurchaseHistory {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastPurchaseDate?: Date;
  daysSinceLastPurchase?: number;
  frequentBundleTypes: string[];
  frequentRegions: string[];
  isFirstTimeBuyer: boolean;
}

/**
 * Time-based discount context
 */
export interface TimeContext {
  currentHour: number;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  dayOfMonth: number;
  isWeekend: boolean;
  isEarlyBird: boolean; // 6AM - 10AM
  isPeakHours: boolean; // 12PM - 8PM
  isLateNight: boolean; // 10PM - 6AM
  isEndOfMonth: boolean; // last 3 days of month
  isHoliday: boolean;
  seasonalPeriod: 'spring' | 'summer' | 'fall' | 'winter';
}

/**
 * Bundle quantity and volume discounts
 */
export interface VolumeDiscountTier {
  minQuantity: number;
  maxQuantity?: number;
  discountPercentage: number;
  description: string;
}

/**
 * Email domain discount eligibility
 */
export interface EmailDomainDiscount {
  isEligible: boolean;
  domain: string;
  discountType: 'percentage';
  discountValue: number;
  maxDiscount?: number;
  minSpend?: number;
}

// ============ FACTS IMPLEMENTATION ============

/**
 * Get user segment based on purchase history and behavior
 */
export const userSegment = async (
  params: { userId?: string },
  almanac: Almanac
): Promise<UserSegment> => {
  try {
    if (!params.userId) {
      return 'new'; // Anonymous users are considered new
    }

    const purchaseHistory = await almanac.factValue<UserPurchaseHistory>('userPurchaseHistory');
    
    if (!purchaseHistory || purchaseHistory.isFirstTimeBuyer) {
      return 'new';
    }

    // VIP criteria: 5+ orders OR $500+ total spent OR $100+ average order
    if (purchaseHistory.totalOrders >= 5 || 
        purchaseHistory.totalSpent >= 500 || 
        purchaseHistory.averageOrderValue >= 100) {
      return 'vip';
    }

    // Inactive: no purchase in 90+ days
    if (purchaseHistory.daysSinceLastPurchase && purchaseHistory.daysSinceLastPurchase > 90) {
      return 'inactive';
    }

    return 'returning';
  } catch (error) {
    logger.warn('Error determining user segment', { error, userId: params.userId });
    return 'new';
  }
};

/**
 * Get user purchase history
 */
export const userPurchaseHistory = async (
  params: { userId?: string },
  almanac: Almanac
): Promise<UserPurchaseHistory> => {
  try {
    if (!params.userId) {
      return {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        frequentBundleTypes: [],
        frequentRegions: [],
        isFirstTimeBuyer: true,
      };
    }

    // In a real implementation, this would query the database
    // For now, return mock data based on patterns we might expect
    const mockHistory: UserPurchaseHistory = {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      frequentBundleTypes: [],
      frequentRegions: [],
      isFirstTimeBuyer: true,
    };

    return mockHistory;
  } catch (error) {
    logger.warn('Error fetching user purchase history', { error, userId: params.userId });
    return {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      frequentBundleTypes: [],
      frequentRegions: [],
      isFirstTimeBuyer: true,
    };
  }
};

/**
 * Validate coupon code and return discount details - Database integrated version
 */
export const couponValidation = async (
  params: { couponCode?: string, userId?: string },
  almanac: Almanac
): Promise<CouponValidation | null> => {
  try {
    if (!params.couponCode) {
      return null;
    }

    const code = params.couponCode.trim();
    
    // Load coupon from database
    const coupon = await loadCouponByCode(code);
    if (!coupon) {
      logger.debug(`Coupon ${code} not found in database`);
      return getInvalidCoupon(code);
    }

    // Get current context for validation
    const selectedBundle = await almanac.factValue<any>('selectedBundle');
    const country = await almanac.factValue<string>('country');
    const region = await almanac.factValue<string>('region');
    
    // Validate coupon applicability (bundle and region restrictions)
    const applicabilityCheck = validateCouponApplicability(
      coupon,
      selectedBundle?.id,
      region,
      country
    );
    
    if (!applicabilityCheck.isValid) {
      logger.debug(`Coupon ${code} validation failed: ${applicabilityCheck.reason}`);
      return getInvalidCoupon(code);
    }

    // Check usage limits
    const usageData = await getCouponUsageCount(coupon.id, params.userId);
    
    // Check total usage limit
    if (coupon.max_total_usage && usageData.totalUsage >= coupon.max_total_usage) {
      logger.debug(`Coupon ${code} exceeded total usage limit`);
      return getInvalidCoupon(code);
    }
    
    // Check per-user usage limit
    if (coupon.max_per_user && params.userId && usageData.userUsage >= coupon.max_per_user) {
      logger.debug(`Coupon ${code} exceeded per-user usage limit for user ${params.userId}`);
      return getInvalidCoupon(code);
    }

    // Map database coupon to our interface
    const validation: CouponValidation = {
      isValid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.coupon_type,
      discountValue: coupon.value,
      minSpend: coupon.min_spend || undefined,
      maxDiscount: coupon.max_discount || undefined,
      validUntil: coupon.valid_until ? new Date(coupon.valid_until) : undefined,
      usageLimit: coupon.max_total_usage || undefined,
      totalUsageCount: usageData.totalUsage,
      userUsageCount: usageData.userUsage,
      applicableBundles: coupon.allowed_bundle_ids || undefined,
      applicableRegions: coupon.allowed_regions || undefined,
      corporateDomain: coupon.corporate_domain || undefined,
      description: coupon.description || undefined,
    };

    logger.debug(`Coupon ${code} validated successfully`, {
      discountType: validation.discountType,
      discountValue: validation.discountValue,
      totalUsage: validation.totalUsageCount,
      userUsage: validation.userUsageCount,
    });

    return validation;

  } catch (error) {
    logger.warn('Error validating coupon', { error, couponCode: params.couponCode });
    return null;
  }
};

/**
 * Get current time context for time-based discounts
 */
export const timeContext = async (
  _params: Record<string, any>,
  _almanac: Almanac
): Promise<TimeContext> => {
  try {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();
    const month = now.getMonth();
    const daysInMonth = new Date(now.getFullYear(), month + 1, 0).getDate();

    // Define seasonal periods (Northern Hemisphere)
    let seasonalPeriod: TimeContext['seasonalPeriod'];
    if (month >= 2 && month <= 4) seasonalPeriod = 'spring';
    else if (month >= 5 && month <= 7) seasonalPeriod = 'summer';
    else if (month >= 8 && month <= 10) seasonalPeriod = 'fall';
    else seasonalPeriod = 'winter';

    // Define holiday periods (simplified)
    const holidayDates = [
      { month: 11, day: 25 }, // Christmas
      { month: 0, day: 1 },   // New Year
      { month: 6, day: 4 },   // July 4th
      // Add more holidays as needed
    ];
    
    const isHoliday = holidayDates.some(holiday => 
      holiday.month === month && 
      Math.abs(holiday.day - dayOfMonth) <= 1 // Holiday +/- 1 day
    );

    return {
      currentHour: hour,
      dayOfWeek,
      dayOfMonth,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isEarlyBird: hour >= 6 && hour < 10,
      isPeakHours: hour >= 12 && hour < 20,
      isLateNight: hour >= 22 || hour < 6,
      isEndOfMonth: dayOfMonth > daysInMonth - 3,
      isHoliday,
      seasonalPeriod,
    };
  } catch (error) {
    logger.warn('Error getting time context', { error });
    return {
      currentHour: 12,
      dayOfWeek: 1,
      dayOfMonth: 15,
      isWeekend: false,
      isEarlyBird: false,
      isPeakHours: true,
      isLateNight: false,
      isEndOfMonth: false,
      isHoliday: false,
      seasonalPeriod: 'summer',
    };
  }
};

/**
 * Get market tier based on country/region
 */
export const marketTier = async (
  _params: Record<string, any>,
  almanac: Almanac
): Promise<MarketTier> => {
  try {
    const country = await almanac.factValue<string>('country');
    const region = await almanac.factValue<string>('region');

    // Define market tiers (simplified categorization)
    const premiumMarkets = ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'CH', 'NO', 'DK'];
    const emergingMarkets = ['IN', 'BR', 'MX', 'ZA', 'EG', 'PH', 'VN', 'ID', 'NG', 'BD'];

    if (country && premiumMarkets.includes(country)) {
      return 'premium';
    }

    if (country && emergingMarkets.includes(country)) {
      return 'emerging';
    }

    // Check regional classifications
    if (region) {
      const premiumRegions = ['North America', 'Western Europe', 'Oceania'];
      const emergingRegions = ['South Asia', 'Southeast Asia', 'Africa', 'Latin America'];
      
      if (premiumRegions.some(r => region.includes(r))) {
        return 'premium';
      }
      
      if (emergingRegions.some(r => region.includes(r))) {
        return 'emerging';
      }
    }

    return 'standard';
  } catch (error) {
    logger.warn('Error determining market tier', { error });
    return 'standard';
  }
};

/**
 * Get applicable volume discount tiers
 */
export const volumeDiscountTiers = async (
  _params: Record<string, any>,
  _almanac: Almanac
): Promise<VolumeDiscountTier[]> => {
  try {
    // Define volume discount tiers
    const tiers: VolumeDiscountTier[] = [
      {
        minQuantity: 2,
        maxQuantity: 4,
        discountPercentage: 5,
        description: 'Buy 2-4 get 5% off each',
      },
      {
        minQuantity: 5,
        maxQuantity: 9,
        discountPercentage: 10,
        description: 'Buy 5-9 get 10% off each',
      },
      {
        minQuantity: 10,
        discountPercentage: 15,
        description: 'Buy 10+ get 15% off each',
      },
    ];

    return tiers;
  } catch (error) {
    logger.warn('Error getting volume discount tiers', { error });
    return [];
  }
};

/**
 * Check if bundle qualifies for bundle-specific discounts
 */
export const bundleDiscountEligibility = async (
  _params: Record<string, any>,
  almanac: Almanac
): Promise<{
  isUnlimitedDiscount: boolean;
  isLongStayDiscount: boolean;
  isRegionalDiscount: boolean;
  isPremiumBundleDiscount: boolean;
}> => {
  try {
    const selectedBundle = await almanac.factValue<any>('selectedBundle');
    const requestedDays = await almanac.factValue<number>('requestedValidityDays');
    const region = await almanac.factValue<string>('region');
    
    if (!selectedBundle) {
      return {
        isUnlimitedDiscount: false,
        isLongStayDiscount: false,
        isRegionalDiscount: false,
        isPremiumBundleDiscount: false,
      };
    }

    return {
      isUnlimitedDiscount: selectedBundle.is_unlimited || false,
      isLongStayDiscount: requestedDays >= 15,
      isRegionalDiscount: Boolean(region),
      isPremiumBundleDiscount: selectedBundle.group_name?.includes('Plus') || false,
    };
  } catch (error) {
    logger.warn('Error checking bundle discount eligibility', { error });
    return {
      isUnlimitedDiscount: false,
      isLongStayDiscount: false,
      isRegionalDiscount: false,
      isPremiumBundleDiscount: false,
    };
  }
};

/**
 * Check if email domain qualifies for corporate discount - Database integrated version
 */
export const emailDomainDiscount = async (
  params: { userEmail?: string },
  almanac: Almanac
): Promise<EmailDomainDiscount | null> => {
  try {
    if (!params.userEmail) {
      return null;
    }

    const email = params.userEmail.toLowerCase().trim();
    const domain = email.split('@')[1];
    
    if (!domain) {
      return null;
    }

    // Load corporate email domain configuration from database
    const corporateDomain = await findCorporateEmailDomain(domain);
    
    if (!corporateDomain) {
      logger.debug(`No corporate discount found for domain: ${domain}`);
      return {
        isEligible: false,
        domain,
        discountType: 'percentage',
        discountValue: 0,
      };
    }

    logger.debug(`Corporate discount found for domain ${domain}: ${corporateDomain.discount_percentage}%`, {
      domain,
      discountPercentage: corporateDomain.discount_percentage,
      maxDiscount: corporateDomain.max_discount,
      minSpend: corporateDomain.min_spend,
    });

    return {
      isEligible: true,
      domain,
      discountType: 'percentage',
      discountValue: corporateDomain.discount_percentage,
      maxDiscount: corporateDomain.max_discount || undefined,
      minSpend: corporateDomain.min_spend || undefined,
    };

  } catch (error) {
    logger.warn('Error checking email domain discount', { error, userEmail: params.userEmail });
    return null;
  }
};

// Helper function for invalid coupons
function getInvalidCoupon(code: string): CouponValidation {
  return {
    isValid: false,
    discountType: 'percentage',
    discountValue: 0,
    code,
  };
}