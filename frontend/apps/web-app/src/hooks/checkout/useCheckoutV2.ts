"use client";

import { gql, useQuery } from "@apollo/client"; 
import { useSearchParams } from 'next/navigation';
import { useMemo } from "react";
import { useCountries } from "@/hooks/useCountries";
// ⚠️ הנתיב הזה עדיין מוגזם, אבל נשארתי איתו כרגע:
import { type SimplePricingResult } from "../../../../../../backend/packages/rules-engine-2/src/simple-pricer/simple-pricer"; 

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
  // (We add these as optional to satisfy other components temporarily)
  currency?: string;
  dataAmount?: string;
  discounts?: Discount[];
  pricePerDay?: number;
  speed?: string[];
}

// 👇 AND ADD EXPORT HERE
export interface CheckoutData {
  id: string;
  bundle: CheckoutBundle;
  auth: { completed: boolean };
  delivery: { completed: boolean };
  payment: { completed: boolean };
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
    if (!session) {
      return undefined; // ⬅️⬅️ תיקון 2: החזר undefined במקום null
    }

    // ה-pricing כאן הוא האובייקט המלא מ-calculateSimplePrice
    const pricing = session.pricing as SimplePricingResult; 
    
    // שלוף את קוד המדינה מה-metadata
    const countryIso = session.metadata?.countries?.[0];
    
    // מצא את אובייקט המדינה המלא
    const country = countries.find(c => c.iso === countryIso);

    return {
      id: session.id,
      bundle: {
        id: pricing.bundleName,
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
        speed: []
      },
      auth: { completed: false },
      delivery: { completed: false },
      payment: { completed: false }
    };
  }, [data, countries]);

  return {
    checkout,
    loading,
    error,
    refreshCheckout: () => {}, 
  };
};