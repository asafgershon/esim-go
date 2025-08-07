"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { ScrollSmoother } from "gsap/ScrollSmoother";

/**
 * ScrollContextValue - The shape of the scroll context
 * 
 * Provides centralized scroll management for the application.
 * Integrates with GSAP ScrollSmoother for smooth scrolling effects.
 */
export interface ScrollContextValue {
  /** Reference to the ScrollSmoother instance */
  smootherRef: React.MutableRefObject<ScrollSmoother | null> | null;
  /** Current scroll lock state */
  isScrollLocked: boolean;
  /** Lock scrolling (pauses ScrollSmoother and prevents native scroll) */
  lockScroll: () => void;
  /** Unlock scrolling (resumes ScrollSmoother and restores native scroll) */
  unlockScroll: () => void;
  /** Scroll to a target element, selector, or position */
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

/**
 * ScrollProvider - Provides scroll context to child components
 * 
 * Manages scroll locking state and provides methods to control scrolling.
 * Works with GSAP ScrollSmoother for smooth scrolling effects.
 * 
 * @param children - React children to wrap with scroll context
 * @param smootherRef - Reference to the ScrollSmoother instance
 * @param scrollTo - Function to scroll to a target
 * 
 * @example
 * ```tsx
 * <ScrollProvider smootherRef={smootherRef} scrollTo={scrollTo}>
 *   <App />
 * </ScrollProvider>
 * ```
 */
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

/**
 * useScrollContext - Hook to access scroll context
 * 
 * Provides access to scroll management functions and state.
 * Must be used within a ScrollProvider.
 * 
 * @returns ScrollContextValue with scroll control methods
 * @throws Error if used outside of ScrollProvider
 * 
 * @example
 * ```tsx
 * const { lockScroll, unlockScroll, scrollTo } = useScrollContext();
 * 
 * // Lock scrolling when modal opens
 * useEffect(() => {
 *   if (isModalOpen) {
 *     lockScroll();
 *     return () => unlockScroll();
 *   }
 * }, [isModalOpen]);
 * ```
 */
export function useScrollContext() {
  const context = useContext(ScrollContext);
  if (context === undefined) {
    throw new Error("useScrollContext must be used within a ScrollProvider");
  }
  return context;
}

/**
 * useHasScrollContext - Check if scroll context is available
 * 
 * Useful for components that need to work both with and without
 * ScrollProvider. Returns true if within a ScrollProvider.
 * 
 * @returns boolean indicating if scroll context is available
 * 
 * @example
 * ```tsx
 * const hasScrollContext = useHasScrollContext();
 * const scrollContext = hasScrollContext ? useScrollContext() : null;
 * 
 * if (scrollContext) {
 *   scrollContext.scrollTo('#section');
 * } else {
 *   // Fallback to native scrolling
 *   window.scrollTo(0, 100);
 * }
 * ```
 */
export function useHasScrollContext() {
  const context = useContext(ScrollContext);
  return context !== undefined;
}