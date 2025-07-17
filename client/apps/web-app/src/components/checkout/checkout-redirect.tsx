"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CheckoutSkeleton } from './checkout-skeleton';

interface CheckoutRedirectProps {
  token: string;
  numOfDays: string;
  countryId?: string;
  regionId?: string;
}

export function CheckoutRedirect({ token, numOfDays, countryId, regionId }: CheckoutRedirectProps) {
  const router = useRouter();
  
  useEffect(() => {
    const params = new URLSearchParams({
      token,
      numOfDays,
      ...(countryId && { countryId }),
      ...(regionId && { regionId }),
    });
    
    // Use replace to avoid adding to history
    router.replace(`/checkout?${params.toString()}`);
  }, [token, numOfDays, countryId, regionId, router]);
  
  return <CheckoutSkeleton />;
}