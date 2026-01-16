"use client";

import { gql, useQuery } from "@apollo/client";
import { useSearchParams } from 'next/navigation';
import { useMemo } from "react";
import { useCountries } from "@/hooks/useCountries";
// ⚠️ הנתיב הזה עדיין מוגזם, אבל נשארתי איתו כרגע:
import { type SimplePricingResult } from "../../utils/pricing";

export interface Discount {
  name: string;
  amount: number;
}

export interface CheckoutBundle {
  id: string;
  price: number;
  numOfDays: number;
  country: {
    iso: string;
    name: string;
    nameHebrew?: string | null;
  } | null;
  completed: boolean;
  // (We add these as optional to satisfy other components temporarily).
  currency?: string;
  dataAmount?: string;
  discounts?: Discount[];
  pricePerDay?: number;
  speed?: string[];
  numOfEsims: number;
}

// 👇 AND ADD EXPORT HERE
export interface CheckoutData {
  id: string;
  bundle: CheckoutBundle;
  auth: { completed: boolean };
  delivery: { completed: boolean };
  payment: { completed: boolean };
  numOfEsims?: number;
}

export interface CheckoutData {
  id: string;
  bundle: CheckoutBundle;
  auth: { completed: boolean };
  delivery: { completed: boolean };
  payment: { completed: boolean };
}

// 1. זו השאילתה החדשה ששולפת את הסשן מהשרת
const GET_SESSION_QUERY = gql(`
  query GetCheckoutSessionByToken($token: String!) {
    getCheckoutSession(token: $token) {
      success
      error
      session {
        id
        token
        pricing # <-- כאן נמצא האובייקט SimplePricingResult
        metadata # <-- כאן נמצא ה-countryId
      }
    }
  }
`);

export const useCheckout = () => {
  // 2. שלוף את הטוקן מה-URL
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // 3. בצע שאילתה (Query) כדי לשלוף את הסשן שיצרנו בשרת
  const { data, loading, error } = useQuery(GET_SESSION_QUERY, {
    variables: { token: token || "" },
    skip: !token, // דלג אם אין טוקן
  });

  // 4. שלוף את רשימת המדינות (כדי שנוכל להוסיף את שם המדינה)
  const { countries } = useCountries();

  // 5. בנה את אובייקט ה-checkout שהקומפוננטה צריכה
  const checkout = useMemo(() => {
    const session = data?.getCheckoutSession?.session;

    console.log("[CLIENT] GraphQL raw session:", session);
    console.log("[CLIENT] GraphQL raw metadata:", session?.metadata);
    console.log("[CLIENT] GraphQL raw pricing:", session?.pricing);
    if (!session) {
      return undefined; // ⬅️⬅️ תיקון 2: החזר undefined במקום null
    }

    // 🛡️ CRITICAL FIX: Validate pricing exists and has required fields
    const pricing = session.pricing as SimplePricingResult;

    if (!pricing) {
      console.error("[CLIENT] ❌ Session has no pricing data!", {
        sessionId: session.id
      });
      return undefined;
    }

    if (typeof pricing.finalPrice !== 'number' || pricing.finalPrice <= 0) {
      console.error("[CLIENT] ❌ Invalid or missing finalPrice!", {
        sessionId: session.id,
        pricing
      });
      return undefined;
    }

    if (!pricing.requestedDays || pricing.requestedDays <= 0) {
      console.error("[CLIENT] ❌ Invalid requestedDays!", {
        sessionId: session.id,
        pricing
      });
      return undefined;
    }

    // שלוף את קוד המדינה מה-metadata
    const countryIso = session.metadata?.countries?.[0];

    // מצא את אובייקט המדינה המלא
    const country = countries.find(c => c.iso === countryIso);

    return {
      id: session.id,
      bundle: {
        id: pricing.bundleName || 'unknown',
        price: pricing.finalPrice,
        numOfDays: pricing.requestedDays,
        country: country ? {
          iso: country.iso,
          name: country.name,
          nameHebrew: country.nameHebrew
        } : null,
        completed: false,
        currency: "USD",
        dataAmount: "Unlimited",
        discounts: [],
        pricePerDay: 0,
        speed: [],
        numOfEsims: session.metadata?.numOfEsims ?? 1,
      },
      auth: { completed: false },
      delivery: { completed: false },
      payment: { completed: false }
    };
  }, [data, countries]);

  return {
    checkout,
    loading,
    error: error || (!checkout && !loading ? new Error("Invalid session data") : null),
    refreshCheckout: () => { },
  };
};