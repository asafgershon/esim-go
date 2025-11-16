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
  // -----------------------------
  // 1. שליפת הסשן (חובה לשתי השיטות)
  // -----------------------------
  const { data: session, error: sessionError } = await this.db
    .from("checkout_sessions")
    .select("pricing, steps")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error("Checkout session not found.");
  }

const currentPricing = session.pricing as unknown as SimplePricingResult;
const steps = session.steps as unknown as {
  bundle?: {
    countryId?: string;
    numOfDays?: number;
  };
};

const bundle = steps.bundle;
  if (!bundle) {
    throw new Error("חסר מידע על החבילה בסשן.");
  }

  const countryId = bundle.countryId;     // לדוגמה: "AL"
  const numOfDays = bundle.numOfDays;     // לדוגמה: 1

  // -----------------------------
  // 2. רשימת הקופונים האוטומטיים
  // -----------------------------
  const AUTO_COUPONS: Record<
    string,
    { country: string; days: number; discountPercent: number }
  > = {
    it5: { country: "IT", days: 5, discountPercent: 10 },
    us10: { country: "US", days: 10, discountPercent: 10 },
    gr7: { country: "GR", days: 7, discountPercent: 10 },
    th14: { country: "TH", days: 14, discountPercent: 10 },
    ae5: { country: "AE", days: 5, discountPercent: 10 },
    br12: { country: "BR", days: 12, discountPercent: 10 },
    ca10: { country: "CA", days: 10, discountPercent: 10 },
    cn10: { country: "CN", days: 10, discountPercent: 10 },
  };

  const raw = couponCode.trim().toLowerCase();
  const auto = AUTO_COUPONS[raw];

  // -----------------------------
  // 3. בדיקה אם זה קופון אוטומטי
  // -----------------------------
  if (auto) {
    const matchesCountry = countryId?.toUpperCase() === auto.country;
    const matchesDays = Number(numOfDays) === auto.days;

    if (matchesCountry && matchesDays) {
      // -----------------------------
      // 3A. התאמה מלאה → הפעלת הנחה
      // -----------------------------
      const priceBefore = currentPricing.finalPrice;
      const discountAmount = priceBefore * (auto.discountPercent / 100);
      const newFinalPrice = priceBefore - discountAmount;

      const updatedPricing: SimplePricingResult = {
        ...currentPricing,
        finalPrice: newFinalPrice,
        discount: {
          code: raw.toUpperCase(),
          amount: discountAmount,
          originalPrice: priceBefore,
        },
      };

      const { data: updated, error: updateError } = await this.db
        .from("checkout_sessions")
        .update({ pricing: updatedPricing as any })
        .eq("id", sessionId)
        .select("*")
        .single();

      if (updateError) {
        throw new Error("Failed to update auto coupon pricing.");
      }

      return updated;
    }

    // אם הקופון אוטומטי אבל לא מתאים → ממשיכים רגיל
  }

  // -------------------------------------------------------
  // 4. לוגיקה רגילה של DB — אם לא קופון אוטומטי או לא מתאים
  // -------------------------------------------------------

  const { data: coupon, error: couponError } = await this.db
    .from("coupons")
    .select("*")
    .eq("code", couponCode)
    .single();

  if (couponError || !coupon) {
    throw new Error("קוד קופון לא נמצא או לא חוקי.");
  }

  if (!coupon.is_active) throw new Error("הקופון אינו פעיל.");
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    throw new Error("פג תוקף הקופון.");
  }

  // המשך החישוב הרגיל...
  // (חישוב אחוז/סכום, עדכון DB, החזרת session)
  // שמור כמו בגירסה שלך
  // ----------------------------
  
  const priceBefore = currentPricing.finalPrice;
  let discountAmount = 0;

  if (coupon.coupon_type === "percentage") {
    discountAmount = priceBefore * (Number(coupon.value) / 100);
  } else if (coupon.coupon_type === "fixed_amount") {
    discountAmount = Number(coupon.value);
  }

  const newFinal = priceBefore - discountAmount;

  const updatedPricingFinal: SimplePricingResult = {
    ...currentPricing,
    finalPrice: newFinal,
    discount: {
      code: coupon.code,
      amount: discountAmount,
      originalPrice: priceBefore,
    },
  };

  const { data: updatedSessionData, error: updateError } = await this.db
    .from("checkout_sessions")
    .update({ pricing: updatedPricingFinal as any })
    .eq("id", sessionId)
    .select("*")
    .single();

  if (updateError) {
    throw new Error(`Failed to update session: ${updateError.message}`);
  }

  return updatedSessionData;
}
}