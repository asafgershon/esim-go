import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";
import type { SimplePricingResult } from "../../../packages/rules-engine-2/src/simple-pricer/simple-pricer";

export class CouponRepository {
  private db: SupabaseClient<Database>;

  constructor(db: SupabaseClient<Database>) {
    this.db = db;
  }

  // ----------------------------------------------------
  // זיהוי יבשת לפי מדינת ISO
  // ----------------------------------------------------
  private getContinent(countryIso: string): string | undefined {
    const c = countryIso.toUpperCase();
    if (["IT", "FR", "ES", "DE", "NL", "SE", "NO", "FI", "GR", "AL", "UK", "IE"].includes(c))
      return "europe";
    if (["TH", "SG", "PH", "JP", "CN", "IN", "VN"].includes(c))
      return "asia";
    if (["US", "CA", "MX"].includes(c))
      return "northamerica";
    if (["BR", "AR", "CL"].includes(c))
      return "southamerica";
    if (["IL", "AE", "SA", "TR"].includes(c))
      return "middleeast";
    if (["ZA", "NG", "KE", "EG"].includes(c))
      return "africa";

    return undefined;
  }

  // ----------------------------------------------------
  // זיהוי יבשת מתוך שם החבילה (Europe+, EU+, Asia, North America …)
  // ----------------------------------------------------
  private detectContinentFromBundleName(bundleName: string): string | undefined {
    const name = bundleName.toLowerCase();

    if (name.includes("europe")) return "europe";
    if (name.includes("eu+")) return "europe";
    if (name.includes("europe+")) return "europe";

    if (name.includes("asia")) return "asia";
    if (name.includes("middle east") || name.includes("middle-east"))
      return "middleeast";

    if (name.includes("north america") || name.includes("north-america"))
      return "northamerica";

    if (name.includes("south america") || name.includes("south-america"))
      return "southamerica";

    if (name.includes("africa")) return "africa";

    return undefined;
  }

  // ----------------------------------------------------
  //  APPLY COUPON
  // ----------------------------------------------------
  async applyCoupon({
    sessionId,
    couponCode,
    userId,
  }: {
    sessionId: string;
    couponCode: string;
    userId: string | undefined;
  }) {
    // ----------------------------------------------------
    // 1) שליפת הסשן
    // ----------------------------------------------------
    const { data: session, error: sessionError } = await this.db
      .from("checkout_sessions")
      .select("pricing, metadata")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error("Checkout session not found.");
    }

    const pricing = session.pricing as unknown as SimplePricingResult;
    const metadata = session.metadata as any;

    const bundleName = pricing?.bundleName || "";

    const requestedDays: number = pricing?.requestedDays;

    if (!requestedDays) {
      throw new Error("Cannot determine number of days.");
    }

    // ------------------------------
    // מדינה מתוך metadata
    // ------------------------------
    const countryIso: string | undefined = metadata?.countries?.[0];

    // ------------------------------
    // יבשת מתוך המדינה
    // ------------------------------
    const continentFromCountry = countryIso
      ? this.getContinent(countryIso)
      : undefined;

    // ------------------------------
    // יבשת מתוך שם החבילה (Europe+ וכו')
    // ------------------------------
    const continentFromBundleName =
      this.detectContinentFromBundleName(bundleName);

    // ------------------------------
    // בניית קופוני התאמה
    // ------------------------------
    const normalized = couponCode.toLowerCase();

    const expectedCountryCode =
      countryIso && `${countryIso.toLowerCase()}${requestedDays}`;

    const expectedContinentCode =
      continentFromCountry &&
      `${continentFromCountry.toLowerCase()}${requestedDays}`;

    const expectedBundleContinentCode =
      continentFromBundleName &&
      `${continentFromBundleName.toLowerCase()}${requestedDays}`;

    // ----------------------------------------------------
    // 2) בדיקת קופון-יעד (ללא DB)
    // ----------------------------------------------------
    const isCountryMatch =
      expectedCountryCode &&
      normalized === expectedCountryCode.toLowerCase();

    const isContinentMatch =
      expectedContinentCode &&
      normalized === expectedContinentCode.toLowerCase();

    const isBundleContinentMatch =
      expectedBundleContinentCode &&
      normalized === expectedBundleContinentCode.toLowerCase();

    if (isCountryMatch || isContinentMatch || isBundleContinentMatch) {
      console.log("[COUPON] Auto-match:", {
        countryIso,
        continentFromCountry,
        bundleName,
        continentFromBundleName,
        requestedDays,
        couponCode,
      });

      const originalPrice = pricing.finalPrice;
      const discountAmount = Number((originalPrice * 0.1).toFixed(2));

      const updatedPricing: SimplePricingResult = {
        ...pricing,
        finalPrice: Number((originalPrice - discountAmount).toFixed(2)),
        discount: {
          code: couponCode.toUpperCase(),
          amount: discountAmount,
          originalPrice,
        },
      };

      const { data: updatedSession, error: updateErr } = await this.db
        .from("checkout_sessions")
        .update({ pricing: updatedPricing as any })
        .eq("id", sessionId)
        .select("*")
        .single();

      if (updateErr) {
        throw new Error("Failed to apply auto coupon.");
      }

      return updatedSession;
    }

    // ----------------------------------------------------
    // 3) אחרת → לוגיקת קופונים רגילים מה-DB
    // ----------------------------------------------------
    const { data: coupon, error: couponError } = await this.db
      .from("coupons")
      .select("*")
      .eq("code", couponCode)
      .single();

    if (couponError || !coupon) {
      throw new Error("קוד קופון לא נמצא או לא חוקי.");
    }

    if (!coupon.is_active) {
      throw new Error("הקופון אינו פעיל.");
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      throw new Error("פג תוקף הקופון.");
    }

    // ----------------------------------------------------
    // 4) חישוב הנחה רגיל
    // ----------------------------------------------------
    const originalPrice =
      pricing.discount?.originalPrice ?? pricing.finalPrice;

    let discountAmount = 0;

    if (coupon.coupon_type === "percentage") {
      discountAmount = originalPrice * (Number(coupon.value) / 100);
    } else if (coupon.coupon_type === "fixed_amount") {
      discountAmount = Number(coupon.value);
    } else {
      throw new Error("סוג קופון לא נתמך.");
    }

    if (coupon.max_discount && discountAmount > coupon.max_discount) {
      discountAmount = coupon.max_discount;
    }

    if (discountAmount > originalPrice) {
      discountAmount = originalPrice;
    }

    const updatedPricing: SimplePricingResult = {
      ...pricing,
      finalPrice: Number((originalPrice - discountAmount).toFixed(2)),
      discount: {
        code: coupon.code,
        amount: discountAmount,
        originalPrice,
      },
    };

    const { data: updatedRegular, error: updateRegularErr } = await this.db
      .from("checkout_sessions")
      .update({ pricing: updatedPricing as any })
      .eq("id", sessionId)
      .select("*")
      .single();

    if (updateRegularErr) {
      throw new Error("Failed to update session with regular coupon.");
    }

    return updatedRegular;
  }
}
