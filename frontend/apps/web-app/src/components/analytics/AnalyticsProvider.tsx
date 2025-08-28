'use client';

import React, { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCookieConsent } from '../../hooks/useCookieConsent';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { canUseAnalytics, canUseMarketing } = useCookieConsent();

  useEffect(() => {
    if (!canUseAnalytics && !canUseMarketing) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    // Track page view with Google Analytics
    if (canUseAnalytics && window.gtag && process.env.NEXT_PUBLIC_GA_ID) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: url,
      });
    }

    // Track page view with Facebook Pixel
    if (canUseMarketing && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [pathname, searchParams, canUseAnalytics, canUseMarketing]);

  return <>{children}</>;
}

// Utility functions for custom event tracking
export const trackEvent = {
  // Google Analytics events
  ga: (action: string, category: string, label?: string, value?: number) => {
    if (window.gtag && process.env.NEXT_PUBLIC_GA_ID) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  },

  // Facebook Pixel events
  fb: (eventName: string, parameters?: Record<string, any>) => {
    if (window.fbq) {
      window.fbq('track', eventName, parameters);
    }
  },

  // Combined tracking for common e-commerce events
  purchase: (value: number, currency: string = 'ILS', items?: any[]) => {
    // GA4 E-commerce
    if (window.gtag && process.env.NEXT_PUBLIC_GA_ID) {
      window.gtag('event', 'purchase', {
        value: value,
        currency: currency,
        items: items,
      });
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        value: value,
        currency: currency,
        contents: items,
      });
    }
  },

  addToCart: (value: number, currency: string = 'ILS', itemId?: string) => {
    // GA4
    if (window.gtag && process.env.NEXT_PUBLIC_GA_ID) {
      window.gtag('event', 'add_to_cart', {
        value: value,
        currency: currency,
        items: itemId ? [{ item_id: itemId }] : undefined,
      });
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'AddToCart', {
        value: value,
        currency: currency,
        content_ids: itemId ? [itemId] : undefined,
      });
    }
  },

  search: (searchTerm: string) => {
    // GA4
    if (window.gtag && process.env.NEXT_PUBLIC_GA_ID) {
      window.gtag('event', 'search', {
        search_term: searchTerm,
      });
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'Search', {
        search_string: searchTerm,
      });
    }
  },

  viewContent: (contentId: string, contentType: string, value?: number) => {
    // GA4
    if (window.gtag && process.env.NEXT_PUBLIC_GA_ID) {
      window.gtag('event', 'view_item', {
        content_id: contentId,
        content_type: contentType,
        value: value,
      });
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: [contentId],
        content_type: contentType,
        value: value,
      });
    }
  },
};