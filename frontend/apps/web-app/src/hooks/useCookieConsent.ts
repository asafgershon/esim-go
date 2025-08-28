import { useState, useEffect } from 'react';
import { getCookieConsent, type CookiePreferences } from '../components/cookie-banner/CookieBanner';

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial consent
    const currentConsent = getCookieConsent();
    setConsent(currentConsent);
    setLoading(false);

    // Listen for consent updates
    const handleConsentUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<CookiePreferences>;
      setConsent(customEvent.detail);
    };

    // Listen for storage changes (for multi-tab support)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'cookie-consent') {
        if (event.newValue) {
          try {
            const newConsent = JSON.parse(event.newValue);
            setConsent(newConsent);
          } catch {
            // Invalid JSON, ignore
          }
        } else {
          // Consent was removed
          setConsent(null);
        }
      }
    };

    window.addEventListener('cookieConsentUpdate', handleConsentUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('cookieConsentUpdate', handleConsentUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    consent,
    loading,
    hasConsent: consent !== null,
    canUseAnalytics: consent?.analytics ?? false,
    canUseMarketing: consent?.marketing ?? false,
    canUseFunctional: consent?.functional ?? false
  };
}

// Re-export the CookiePreferences type for convenience
export type { CookiePreferences } from '../components/cookie-banner/CookieBanner';