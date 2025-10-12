// Path: src/repositories/coupon.repository.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";

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
    if (!userId) {
      throw new Error("User must be authenticated to apply a coupon.");
    }

    // 👇 **FIX:** The parameter names now match the database function's expected signature.
    // I'm assuming 'sessionId' is used as the '_order_id' for this operation.
    const { data, error } = await this.db.rpc("apply_coupon_to_checkout", {
      _order_id: sessionId,
      _coupon_code: couponCode,
      _user_id: userId,
    });

    if (error) {
      // The database function should raise an exception with a clear message
      // which will be caught here.
      throw new Error(error.message);
    }

    // The database function should return the new pricing details
    return data as { finalPrice: number; discounts: any[] };
  }
}