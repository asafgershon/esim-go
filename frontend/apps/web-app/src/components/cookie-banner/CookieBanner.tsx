'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@workspace/ui/components/button";
import { X } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp?: number;
}

interface CookieBannerProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onManageSettings: () => void;
  onClose: () => void;
  isVisible: boolean;
}

export function CookieBanner({
  onAcceptAll,
  onRejectAll,
  onManageSettings,
  onClose,
  isVisible
}: CookieBannerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-white-brand border-t-2 border-dark-brand",
        "shadow-[0_-4px_20px_rgba(10,35,46,0.1)]",
        "transform transition-transform duration-300 ease-in-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
      dir="rtl"
    >
      <div className="container mx-auto max-w-7xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-dark-brand hover:text-dark-brand/80 transition-colors"
          aria-label="סגור"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 ml-8 md:ml-12">
            <p className="text-dark-brand text-sm leading-relaxed">
            כדי לייעל, האתר עושה שימוש ב-"Cookies" ("עוגיות") ו/או בטכנולוגיות דומות ליצירת מידע אודותיך וכן למטרות אנליטיות, כמו גם למטרה מהותית להבנת הצרכים שלך ופרסונליזציה, למטרות שיווק וניתוח התנהגותך באתר, למידע נוסף ניתן ללחוץ כאן,{' '} 
              <button
                onClick={onManageSettings}
                className="text-purple-brand hover:text-purple-brand/80 underline transition-colors"
              >
                במדיניות הפרטיות
              </button>
              .
            </p>
          </div>
          
          <div className="flex gap-3 flex-shrink-0">
            <Button
              onClick={onRejectAll}
              variant="brand-secondary"
              size="default"
            >
              דחה הכל
            </Button>
            <Button
              onClick={onManageSettings}
              variant="brand-secondary"
              size="default"
            >
              הגדרות
            </Button>
            <Button
              onClick={onAcceptAll}
              variant="brand-primary"
              size="default"
              emphasized
            >
              קבל הכל
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CookieSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: CookiePreferences) => void;
  currentPreferences: CookiePreferences;
}

export function CookieSettingsModal({
  isOpen,
  onClose,
  onSave,
  currentPreferences
}: CookieSettingsModalProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>(currentPreferences);

  useEffect(() => {
    setPreferences(currentPreferences);
  }, [currentPreferences]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof CookiePreferences) => {
    if (key === 'necessary' || key === 'timestamp') return; // Can't toggle necessary cookies or timestamp
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    onSave(preferences);
    onClose();
  };

  const cookieCategories = [
    {
      key: 'necessary' as const,
      title: 'עוגיות הכרחיות',
      description: 'עוגיות אלו הכרחיות לתפקוד האתר ואינן ניתנות לכיבוי. הן מאפשרות ניווט באתר ושימוש בתכונות בסיסיות.',
      locked: true
    },
    {
      key: 'analytics' as const,
      title: 'עוגיות אנליטיקה',
      description: 'עוגיות אלו עוזרות לנו להבין כיצד משתמשים מתקשרים עם האתר שלנו על ידי איסוף ודיווח מידע באופן אנונימי.',
      locked: false
    },
    {
      key: 'marketing' as const,
      title: 'עוגיות שיווק',
      description: 'עוגיות אלו משמשות להצגת פרסומות רלוונטיות יותר עבורך. הן עשויות להיות מוגדרות על ידינו או על ידי ספקים צד שלישי.',
      locked: false
    },
    {
      key: 'functional' as const,
      title: 'עוגיות פונקציונליות',
      description: 'עוגיות אלו מאפשרות לאתר לספק פונקציונליות משופרת והתאמה אישית. הן עשויות להיות מוגדרות על ידינו או על ידי ספקים צד שלישי.',
      locked: false
    }
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-2xl"
        dir="rtl"
      >
        <div className="bg-white-brand border-2 border-dark-brand rounded-lg shadow-2xl">
          <div className="border-b border-dark-brand p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-dark-brand">הגדרות עוגיות</h2>
              <button
                onClick={onClose}
                className="text-dark-brand hover:text-dark-brand/80 transition-colors"
                aria-label="סגור"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-dark-brand/70">
              בחר אילו עוגיות תרצה לאפשר. תוכל לשנות הגדרות אלו בכל עת.
            </p>
          </div>
          
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-6">
              {cookieCategories.map((category) => (
                <div key={category.key} className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-dark-brand mb-1">
                        {category.title}
                      </h3>
                      <p className="text-sm text-dark-brand/70">
                        {category.description}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences[category.key] as boolean}
                          onChange={() => handleToggle(category.key)}
                          disabled={category.locked}
                          className="sr-only peer"
                        />
                        <div className={cn(
                          "w-11 h-6 rounded-full transition-colors",
                          "peer-focus:ring-4 peer-focus:ring-purple-brand/20",
                          category.locked
                            ? "bg-dark-brand/50 cursor-not-allowed"
                            : "bg-gray-300 peer-checked:bg-purple-brand cursor-pointer"
                        )}>
                          <div className={cn(
                            "absolute top-[2px] right-[2px] bg-white-brand rounded-full h-5 w-5",
                            "transition-transform",
                            preferences[category.key] ? "translate-x-[-20px]" : "translate-x-0"
                          )} />
                        </div>
                      </label>
                      {category.locked && (
                        <span className="mr-2 text-xs text-dark-brand/50">
                          תמיד פעיל
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t border-dark-brand p-6">
            <div className="flex gap-3 justify-end">
              <Button
                onClick={onClose}
                variant="brand-secondary"
                size="default"
              >
                ביטול
              </Button>
              <Button
                onClick={handleSave}
                variant="brand-primary"
                size="default"
                emphasized
              >
                שמור הגדרות
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Utility functions
export function getCookieConsent(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('cookie-consent');
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    const expiryDays = 365;
    const expiryTime = expiryDays * 24 * 60 * 60 * 1000;
    
    // Check if consent has expired
    if (parsed.timestamp && Date.now() - parsed.timestamp > expiryTime) {
      localStorage.removeItem('cookie-consent');
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
}

export function updateCookieConsent(preferences: CookiePreferences): void {
  if (typeof window === 'undefined') return;
  
  const consentData = {
    ...preferences,
    timestamp: Date.now()
  };
  
  localStorage.setItem('cookie-consent', JSON.stringify(consentData));
  
  // Dispatch custom event for cross-tab sync
  window.dispatchEvent(new CustomEvent('cookieConsentUpdate', {
    detail: consentData
  }));
}