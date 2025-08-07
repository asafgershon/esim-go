"use client";

import { useEffect, useRef } from "react";
import { useHasScrollContext, useScrollContext } from "../contexts/scroll-context";

export interface UseScrollSmootherLockOptions {
  /** Automatically lock scroll when component mounts or condition is true */
  autoLock?: boolean;
  /** Preserve scroll position on iOS devices */
  preserveScrollPosition?: boolean;
  /** Prevent touch move events on iOS */
  preventTouchMove?: boolean;
}

/**
 * Hook to lock/unlock scrolling when using ScrollSmoother.
 * Falls back to standard body scroll lock if not within ScrollSmoother context.
 */
export function useScrollSmootherLock(options: UseScrollSmootherLockOptions = {}) {
  const { autoLock = false, preserveScrollPosition = true, preventTouchMove = true } = options;
  
  const hasContext = useHasScrollContext();
  const context = hasContext ? useScrollContext() : null;
  const scrollPositionRef = useRef(0);
  const isLockedRef = useRef(false);

  // iOS detection
  const isIOS = typeof window !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Touch event handler for iOS
  const preventTouch = (e: TouchEvent) => {
    if (isLockedRef.current) {
      e.preventDefault();
    }
  };

  const lockScroll = () => {
    if (isLockedRef.current) return; // Already locked

    if (context) {
      // ScrollSmoother context available - use it
      context.lockScroll();
    } else {
      // Fallback to standard body lock
      if (isIOS && preserveScrollPosition) {
        scrollPositionRef.current = window.scrollY;
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollPositionRef.current}px`;
        document.body.style.width = "100%";
      }
      
      document.body.style.overflow = "hidden";
    }

    // Add touch prevention for iOS
    if (preventTouchMove && isIOS) {
      document.addEventListener("touchmove", preventTouch, { passive: false });
    }

    isLockedRef.current = true;
  };

  const unlockScroll = () => {
    if (!isLockedRef.current) return; // Not locked

    if (context) {
      // ScrollSmoother context available - use it
      context.unlockScroll();
    } else {
      // Fallback to standard body unlock
      document.body.style.overflow = "";
      
      if (isIOS && preserveScrollPosition) {
        const scrollY = Math.abs(parseInt(document.body.style.top || "0"));
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY || scrollPositionRef.current);
      }
    }

    // Remove touch prevention
    if (preventTouchMove && isIOS) {
      document.removeEventListener("touchmove", preventTouch);
    }

    isLockedRef.current = false;
  };

  // Auto-lock effect
  useEffect(() => {
    if (autoLock) {
      lockScroll();
      return () => {
        unlockScroll();
      };
    }
  }, [autoLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isLockedRef.current) {
        unlockScroll();
      }
    };
  }, []);

  return {
    lockScroll,
    unlockScroll,
    isLocked: isLockedRef.current,
  };
}

/**
 * Simple version that only works within ScrollSmoother context.
 * Throws error if used outside of ScrollProvider.
 */
export function useScrollLock(autoLock: boolean = false) {
  const { lockScroll, unlockScroll, isScrollLocked } = useScrollContext();

  useEffect(() => {
    if (autoLock) {
      lockScroll();
      return () => {
        unlockScroll();
      };
    }
  }, [autoLock, lockScroll, unlockScroll]);

  return {
    lockScroll,
    unlockScroll,
    isLocked: isScrollLocked,
  };
}