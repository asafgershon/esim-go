import { getSupabaseClient } from '../supabase';
import { createLogger } from '@hiilo/utils';
import { Database } from '@hiilo/supabase';

const logger = createLogger({
  name: 'coupon-loader',
  level: 'info',
});

// Type definitions based on database schema
// export type CouponRow = Database['public']['Tables']['coupons']['Row'];
export type CouponRow = any;
// export type CouponUsageLogRow = Database['public']['Tables']['coupon_usage_logs']['Row'];
export type CouponUsageLogRow = any;
// export type CorporateEmailDomainRow = Database['public']['Tables']['corporate_email_domains']['Row'];
export type CorporateEmailDomainRow = any;

/**
 * Cache for frequently accessed coupon data
 */
const couponCache = new Map<string, { coupon: CouponRow; timestamp: number }>();
const corporateDomainsCache = new Map<string, { domains: CorporateEmailDomainRow[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load a coupon by its code from the database
 */
export async function loadCouponByCode(couponCode: string): Promise<CouponRow | null> {
  try {
    const code = couponCode.toUpperCase().trim();
    
    // Check cache first
    const cached = couponCache.get(code);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      logger.debug(`Coupon ${code} found in cache`);
      return cached.coupon;
    }

    logger.debug(`Loading coupon ${code} from database`);
    const supabase = getSupabaseClient();
    
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - coupon doesn't exist
        logger.debug(`Coupon ${code} not found`);
        return null;
      }
      logger.error('Error loading coupon:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }

    // Validate coupon is still valid
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      logger.debug(`Coupon ${code} not yet valid`);
      return null;
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      logger.debug(`Coupon ${code} expired`);
      return null;
    }

    // Cache the result
    couponCache.set(code, { coupon, timestamp: Date.now() });
    
    logger.debug(`Successfully loaded coupon ${code}`);
    return coupon;
  } catch (error) {
    logger.error(`Failed to load coupon ${couponCode}:`, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Check coupon usage count for a specific user
 */
export async function getCouponUsageCount(couponId: string, userId?: string): Promise<{
  totalUsage: number;
  userUsage: number;
}> {
  try {
    const supabase = getSupabaseClient();

    // Get total usage count
    const { count: totalUsage, error: totalError } = await supabase
      .from('coupon_usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', couponId);

    if (totalError) {
      logger.error('Error getting total coupon usage:', totalError);
      throw totalError;
    }

    let userUsage = 0;
    if (userId) {
      const { count: userCount, error: userError } = await supabase
        .from('coupon_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', couponId)
        .eq('user_id', userId);

      if (userError) {
        logger.error('Error getting user coupon usage:', userError);
        throw userError;
      }

      userUsage = userCount || 0;
    }

    logger.debug(`Coupon ${couponId} usage - Total: ${totalUsage}, User: ${userUsage}`);
    return {
      totalUsage: totalUsage || 0,
      userUsage,
    };
  } catch (error) {
    logger.error(`Failed to get coupon usage for ${couponId}:`, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Log coupon usage when a coupon is applied
 */
export async function logCouponUsage(params: {
  couponId: string;
  userId: string;
  originalAmount: number;
  discountAmount: number;
  discountedAmount: number;
  orderId?: string;
}): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('coupon_usage_logs')
      .insert({
        coupon_id: params.couponId,
        user_id: params.userId,
        original_amount: params.originalAmount,
        discount_amount: params.discountAmount,
        discounted_amount: params.discountedAmount,
        order_id: params.orderId,
      });

    if (error) {
      logger.error('Error logging coupon usage:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }

    logger.info(`Logged coupon usage for coupon ${params.couponId} by user ${params.userId}`);
  } catch (error) {
    logger.error('Failed to log coupon usage:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Load corporate email domains from database
 */
export async function loadCorporateEmailDomains(): Promise<CorporateEmailDomainRow[]> {
  try {
    // Check cache first
    const cached = corporateDomainsCache.get('all');
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      logger.debug('Corporate domains found in cache');
      return cached.domains;
    }

    logger.debug('Loading corporate email domains from database');
    const supabase = getSupabaseClient();
    
    const { data: domains, error } = await supabase
      .from('corporate_email_domains')
      .select('*')
      .eq('is_active', true)
      .order('discount_percentage', { ascending: false }); // Higher discounts first

    if (error) {
      logger.error('Error loading corporate email domains:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }

    // Cache the result
    corporateDomainsCache.set('all', { domains: domains || [], timestamp: Date.now() });
    
    logger.debug(`Successfully loaded ${domains?.length || 0} corporate email domains`);
    return domains || [];
  } catch (error) {
    logger.error('Failed to load corporate email domains:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Find corporate email domain by domain name
 */
export async function findCorporateEmailDomain(domain: string): Promise<CorporateEmailDomainRow | null> {
  try {
    const normalizedDomain = domain.toLowerCase().trim();
    const domains = await loadCorporateEmailDomains();
    
    const matchingDomain = domains.find(d => d.domain.toLowerCase() === normalizedDomain);
    
    if (matchingDomain) {
      logger.debug(`Found corporate discount for domain ${domain}: ${matchingDomain.discount_percentage}%`);
    } else {
      logger.debug(`No corporate discount found for domain ${domain}`);
    }
    
    return matchingDomain || null;
  } catch (error) {
    logger.error(`Failed to find corporate email domain ${domain}:`, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Clear all caches - useful for testing or when data is updated
 */
export function clearCouponCaches(): void {
  couponCache.clear();
  corporateDomainsCache.clear();
  logger.info('Coupon and corporate domain caches cleared');
}

/**
 * Validate coupon against bundle and region restrictions
 */
export function validateCouponApplicability(
  coupon: CouponRow,
  bundleId?: string,
  region?: string,
  country?: string
): { isValid: boolean; reason?: string } {
  // Check bundle restrictions
  if (coupon.allowed_bundle_ids && coupon.allowed_bundle_ids.length > 0) {
    if (!bundleId || !coupon.allowed_bundle_ids.includes(bundleId)) {
      return {
        isValid: false,
        reason: 'Coupon not valid for selected bundle'
      };
    }
  }

  // Check region restrictions
  if (coupon.allowed_regions && coupon.allowed_regions.length > 0) {
    const targetRegion = region || country;
    if (!targetRegion) {
      return {
        isValid: false,
        reason: 'Cannot validate coupon region restrictions'
      };
    }

    const isRegionAllowed = coupon.allowed_regions.some((allowedRegion: string) =>
      targetRegion.toLowerCase().includes(allowedRegion.toLowerCase()) ||
      allowedRegion.toLowerCase().includes(targetRegion.toLowerCase())
    );

    if (!isRegionAllowed) {
      return {
        isValid: false,
        reason: 'Coupon not valid for selected region'
      };
    }
  }

  return { isValid: true };
}