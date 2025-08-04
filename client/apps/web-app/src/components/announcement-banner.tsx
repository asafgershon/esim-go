"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const isDismissed = localStorage.getItem("announcement-banner-dismissed");
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage with timestamp
    localStorage.setItem("announcement-banner-dismissed", new Date().toISOString());
  };

  if (!isVisible) return null;

  return (
    <div className="relative bg-brand-dark text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center py-2 text-sm">
          {/* Desktop Content */}
          <div className="hidden md:flex items-center gap-1">
            <span>שירות 24/7 בעברית סכל סכום בחגים.</span>
            <Link 
              href="/support" 
              className="text-brand-green hover:text-brand-green/80 transition-colors font-semibold underline"
            >
              בני הבצבת, בני הפטחות
            </Link>
          </div>
          
          {/* Mobile Content */}
          <div className="flex md:hidden items-center gap-1 text-xs">
            <span>שירות 24/7 בעברית.</span>
            <Link 
              href="/support" 
              className="text-brand-green hover:text-brand-green/80 transition-colors font-semibold underline"
            >
              בני הפטחות
            </Link>
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
            aria-label="סגור הודעה"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}