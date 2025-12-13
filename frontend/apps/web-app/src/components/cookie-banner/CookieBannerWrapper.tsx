'use client';

import React, { useState, useEffect } from 'react';
import { 
  CookieBanner, 
  CookieSettingsModal, 
  getCookieConsent, 
  updateCookieConsent,
  type CookiePreferences 
} from './CookieBanner';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function CookieBannerWrapper() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false
  });

  useEffect(() => {
    // Check for existing consent
    const consent = getCookieConsent();
    if (!consent) {
      setShowBanner(true);
    } else {
      setPreferences(consent);
      initializeTrackingScripts(consent);
    }

    // Listen for consent updates from other tabs
    const handleConsentUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<CookiePreferences>;
      setPreferences(customEvent.detail);
      setShowBanner(false);
      initializeTrackingScripts(customEvent.detail);
    };

    window.addEventListener('cookieConsentUpdate', handleConsentUpdate);
    return () => {
      window.removeEventListener('cookieConsentUpdate', handleConsentUpdate);
    };
  }, []);

  const initializeTrackingScripts = (prefs: CookiePreferences) => {
    // Initialize Google Analytics
    if (prefs.analytics && process.env.NEXT_PUBLIC_GA_ID) {
      if (!window.gtag) {
        const script = document.createElement('script');
        script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
        script.async = true;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function() {
          window.dataLayer?.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
          anonymize_ip: true,
          cookie_flags: 'SameSite=None;Secure'
        });
      }
    } else if (!prefs.analytics && window.gtag) {
      // Disable Google Analytics
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
        'send_page_view': false
      });
      // Clear GA cookies
      document.cookie.split(';').forEach(cookie => {
        if (cookie.trim().startsWith('_ga')) {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
        }
      });
    }

    // Initialize Facebook Pixel
    if (prefs.marketing && process.env.NEXT_PUBLIC_FB_PIXEL_ID) {
      if (!window.fbq) {
        const script = document.createElement('script');
        script.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
        `;
        document.head.appendChild(script);

        //window.fbq('init', process.env.NEXT_PUBLIC_FB_PIXEL_ID);
        //window.fbq('track', 'PageView');
      }
    } else if (!prefs.marketing && window.fbq) {
      // Clear Facebook cookies
      document.cookie.split(';').forEach(cookie => {
        if (cookie.trim().startsWith('_fb')) {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
        }
      });
    }

    // Handle functional cookies (e.g., chat widgets, embedded content)
    if (prefs.functional) {
      // Initialize any functional scripts here
      // Example: Intercom, Drift, YouTube embeds with cookies, etc.
    }
  };

  const handleAcceptAll = () => {
    const newPreferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    
    updateCookieConsent(newPreferences);
    setPreferences(newPreferences);
    setShowBanner(false);
    initializeTrackingScripts(newPreferences);
  };

  const handleRejectAll = () => {
    const newPreferences: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    
    updateCookieConsent(newPreferences);
    setPreferences(newPreferences);
    setShowBanner(false);
    initializeTrackingScripts(newPreferences);
  };

  const handleManageSettings = () => {
    setShowSettings(true);
  };

  const handleClose = () => {
    // Closing without accepting means rejecting non-essential cookies
    handleRejectAll();
  };

  const handleSaveSettings = (newPreferences: CookiePreferences) => {
    updateCookieConsent(newPreferences);
    setPreferences(newPreferences);
    setShowBanner(false);
    initializeTrackingScripts(newPreferences);
  };

  return (
    <>
      <CookieBanner
        isVisible={showBanner}
        onAcceptAll={handleAcceptAll}
        onRejectAll={handleRejectAll}
        onManageSettings={handleManageSettings}
        onClose={handleClose}
      />
      <CookieSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
        currentPreferences={preferences}
      />
    </>
  );
}