"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
  
  return (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p>מכין הזמנה...</p>
    </div>
  );
}