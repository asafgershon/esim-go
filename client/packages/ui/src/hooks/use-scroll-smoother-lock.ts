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
 * useScrollSmootherLock - Manages scroll locking for modals/drawers
 * 
 * Works with ScrollSmoother when available, falls back to native body lock.
 * Handles iOS-specific issues like rubber band scrolling and position preservation.
 * 
 * @param options - Configuration options
 * @param options.autoLock - Automatically lock scroll when true
 * @param options.preserveScrollPosition - Maintain scroll position on iOS (default: true)
 * @param options.preventTouchMove - Block touch scrolling on iOS (default: true)
 * 
 * @returns Object with scroll control methods and state
 * @returns returns.lockScroll - Function to lock scrolling
 * @returns returns.unlockScroll - Function to unlock scrolling  
 * @returns returns.isLocked - Current lock state
 * 
 * @example
 * ```tsx
 * // Auto-lock when modal is open
 * const { lockScroll, unlockScroll } = useScrollSmootherLock({
 *   autoLock: isModalOpen,
 *   preserveScrollPosition: true
 * });
 * 
 * // Manual control
 * const { lockScroll, unlockScroll } = useScrollSmootherLock();
 * 
 * const handleOpenModal = () => {
 *   lockScroll();
 *   setModalOpen(true);
 * };
 * ```
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
 * useScrollLock - Simple scroll lock hook for ScrollSmoother context
 * 
 * Simpler version of useScrollSmootherLock that only works within
 * ScrollProvider context. Use this when you know ScrollSmoother is available.
 * 
 * @param autoLock - Automatically lock scroll when true (default: false)
 * 
 * @returns Object with scroll control methods and state
 * @returns returns.lockScroll - Function to lock scrolling
 * @returns returns.unlockScroll - Function to unlock scrolling
 * @returns returns.isLocked - Current lock state from context
 * 
 * @throws Error if used outside of ScrollProvider
 * 
 * @example
 * ```tsx
 * // Inside a component wrapped with ScrollProvider
 * const { lockScroll, unlockScroll, isLocked } = useScrollLock(isDrawerOpen);
 * 
 * console.log('Scroll is locked:', isLocked);
 * ```
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