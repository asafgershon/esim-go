"use client";

import { X } from "lucide-react";
import { useState } from "react";

export function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="relative bg-brand-dark text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center py-2 text-sm">
          {/* Desktop Content */}
          <div className="hidden md:flex items-center gap-1">
            <span>שירות 24/7 בעברית סכל סכום בחגים.</span>
            <span className="text-brand-green font-semibold">
              בני הבצבת, בני הפטחות
            </span>
          </div>
          
          {/* Mobile Content */}
          <div className="flex md:hidden items-center gap-1 text-xs">
            <span>שירות 24/7 בעברית מכל מקום בעולם.</span>
            <span className="text-brand-green font-semibold">
              בלי הגבלות, בלי הפתעות
            </span>
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