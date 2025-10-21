import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";
// ודא שהנתיב לטיפוס של מנוע התמחור נכון
import type { SimplePricingResult } from "../../../packages/rules-engine-2/src/simple-pricer/simple-pricer";

export class CouponRepository {
  private db: SupabaseClient<Database>;

  constructor(db: SupabaseClient<Database>) {
    this.db = db;
  }

  async applyCoupon({
    sessionId,
    couponCode,
    userId,
  }: {
    sessionId: string;
    couponCode: string;
    userId: string | undefined;
  }) {
    console.log(`[COUPON] ניסיון להחיל קופון ${couponCode} על סשן ${sessionId}`);

    // 1. שליפת הקופון
    const { data: coupon, error: couponError } = await this.db
      .from("coupons")
      .select("*")
      .eq("code", couponCode)
      .single();

    if (couponError || !coupon) {
      console.warn("[COUPON] Error: Coupon not found.", couponError);
      throw new Error("קוד קופון לא נמצא או לא חוקי.");
    }

    // 2. ולידציה של הקופון
    if (!coupon.is_active) {
      throw new Error("הקופון אינו פעיל.");
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      throw new Error("פג תוקף הקופון.");
    }

    // 3. (אופציונלי) ולידציה פר-משתמש
    if (userId && coupon.max_per_user && coupon.max_per_user > 0) {
      // TODO: ...
      console.log(`[COUPON] מדלג על בדיקת max_per_user (עדיין לא מומש)`);
    }

    // 4. שליפת הסשן הנוכחי
    const { data: session, error: sessionError } = await this.db
      .from("checkout_sessions")
      .select("pricing, metadata")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      console.error("[COUPON] Error: Session not found.", sessionError);
      throw new Error("Checkout session not found.");
    }

    // ✅ תיקון 1: המרה בטוחה מ-Json
    const currentPricing = session.pricing as unknown as SimplePricingResult;
    if (!currentPricing || typeof currentPricing.finalPrice !== "number") {
      throw new Error("נתוני התמחור בסשן לא חוקיים.");
    }
    
    // 5. בדיקת האם קופון כבר הופעל
    const currentFinalPrice = currentPricing.finalPrice;
    
    // ✅ תיקון 2: השתמשנו ב-? (optional chaining) כי 'discount' אופציונלי
    if (currentPricing.discount?.code === coupon.code) {
        throw new Error("קופון זה כבר הופעל.");
    }
    const priceBeforeDiscounts = currentPricing.discount?.originalPrice || currentFinalPrice;


    // 6. בדיקת מינימום רכישה
    if (coupon.min_spend && priceBeforeDiscounts < Number(coupon.min_spend)) {
      throw new Error(`סכום רכישה מינימלי (${coupon.min_spend}$) לא הושג.`);
    }

    // 7. חישוב ההנחה
    let discountAmount = 0;
    
    // ✅ תיקון 3: שימוש באותיות קטנות עבור סוגי הקופונים
    if (coupon.coupon_type === 'percentage') {
      discountAmount = priceBeforeDiscounts * (Number(coupon.value) / 100);
    } else if (coupon.coupon_type === 'fixed_amount') {
      discountAmount = Number(coupon.value);
    } else {
      throw new Error(`סוג קופון לא נתמך: ${coupon.coupon_type}`);
    }

    // 8. החלת הגבלות
    if (coupon.max_discount && discountAmount > Number(coupon.max_discount)) {
      discountAmount = Number(coupon.max_discount);
    }
    if (discountAmount > priceBeforeDiscounts) {
      discountAmount = priceBeforeDiscounts;
    }

    const newFinalPrice = priceBeforeDiscounts - discountAmount;

    // 9. עדכון הסשן ב-DB
    // ✅ תיקון 4: הטיפוס 'SimplePricingResult' כולל עכשיו את 'discount'
    const updatedPricing: SimplePricingResult = {
      ...currentPricing,
      finalPrice: newFinalPrice,
      discount: {
        code: coupon.code,
        amount: discountAmount,
        originalPrice: priceBeforeDiscounts,
      },
    };

    const { data: updatedSessionData, error: updateError } = await this.db
      .from("checkout_sessions")
      // ✅ תיקון 5: המרה ל-any כדי לרצות את טיפוס ה-Json של Supabase
      .update({ pricing: updatedPricing as any }) 
      .eq("id", sessionId)
      .select("*")
      .single();

    if (updateError) {
      console.error("[COUPON] Error: Failed to update session.", updateError);
      throw new Error(`Failed to update session: ${updateError.message}`);
    }
    
    console.log(`[COUPON] Success! Price updated from $${priceBeforeDiscounts} to $${newFinalPrice}`);

    // 10. (אופציונלי) רישום השימוש בקופון
    // ...

    // 11. החזרת הסשן המעודכן
    return updatedSessionData;
  }
}