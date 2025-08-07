"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { ScrollSmoother } from "gsap/ScrollSmoother";

export interface ScrollContextValue {
  smootherRef: React.MutableRefObject<ScrollSmoother | null> | null;
  isScrollLocked: boolean;
  lockScroll: () => void;
  unlockScroll: () => void;
  scrollTo: (target: string | number | HTMLElement, options?: ScrollToOptions) => void;
}

export interface ScrollToOptions {
  offset?: number;
  duration?: number;
  ease?: string;
  onComplete?: () => void;
}

const ScrollContext = createContext<ScrollContextValue | undefined>(undefined);

export interface ScrollProviderProps {
  children: React.ReactNode;
  smootherRef: React.MutableRefObject<ScrollSmoother | null>;
  scrollTo: (target: string | number | HTMLElement, options?: ScrollToOptions) => void;
}

export function ScrollProvider({ children, smootherRef, scrollTo }: ScrollProviderProps) {
  const [isScrollLocked, setIsScrollLocked] = useState(false);

  const lockScroll = useCallback(() => {
    if (smootherRef.current) {
      // Pause ScrollSmoother
      smootherRef.current.paused(true);
      // Also prevent native scroll as backup
      document.body.style.overflow = "hidden";
      setIsScrollLocked(true);
    }
  }, [smootherRef]);

  const unlockScroll = useCallback(() => {
    if (smootherRef.current) {
      // Resume ScrollSmoother
      smootherRef.current.paused(false);
      // Restore native scroll
      document.body.style.overflow = "";
      setIsScrollLocked(false);
    }
  }, [smootherRef]);

  const value: ScrollContextValue = {
    smootherRef,
    isScrollLocked,
    lockScroll,
    unlockScroll,
    scrollTo,
  };

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
}

export function useScrollContext() {
  const context = useContext(ScrollContext);
  if (context === undefined) {
    throw new Error("useScrollContext must be used within a ScrollProvider");
  }
  return context;
}

// Optional: Hook to check if we're in a scroll context
export function useHasScrollContext() {
  const context = useContext(ScrollContext);
  return context !== undefined;
}