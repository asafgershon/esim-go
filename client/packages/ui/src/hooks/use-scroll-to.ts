"use client";

import * as React from "react";
import type { SmoothScrollHandle, ScrollToOptions } from "../components/smooth-scroll-container";

export interface UseScrollToOptions {
  /** Reference to the SmoothScrollContainer */
  scrollContainerRef?: React.RefObject<SmoothScrollHandle | null>;
  /** Default offset for all scroll operations */
  defaultOffset?: number;
  /** Default duration for scroll animations */
  defaultDuration?: number;
  /** Use native scrolling as fallback when SmoothScrollContainer is not available */
  fallbackToNative?: boolean;
  /** Header height for offset calculations */
  headerHeight?: number;
}

export interface ScrollToFunction {
  (target: string | number | HTMLElement, options?: ScrollToOptions): void;
}

export interface UseScrollToReturn {
  scrollTo: ScrollToFunction;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  scrollToHash: (hash: string) => void;
  handleLinkClick: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
}

/**
 * Hook for smooth scrolling navigation
 * Works with SmoothScrollContainer or falls back to native scrolling
 */
export function useScrollTo({
  scrollContainerRef,
  defaultOffset = -64,
  defaultDuration = 1,
  fallbackToNative = true,
  headerHeight = 64,
}: UseScrollToOptions = {}): UseScrollToReturn {
  
  // Native scroll fallback
  const nativeScrollTo = React.useCallback(
    (target: string | number | HTMLElement, options?: ScrollToOptions) => {
      const mergedOptions = {
        offset: defaultOffset,
        duration: defaultDuration,
        ...options,
      };

      let element: HTMLElement | null = null;
      let scrollPosition = 0;

      if (typeof target === "string") {
        if (target.startsWith("#")) {
          element = document.querySelector(target);
          if (element) {
            const rect = element.getBoundingClientRect();
            scrollPosition = rect.top + window.pageYOffset + mergedOptions.offset;
          }
        } else if (target === "top") {
          scrollPosition = 0;
        } else if (target === "bottom") {
          scrollPosition = document.documentElement.scrollHeight;
        }
      } else if (typeof target === "number") {
        scrollPosition = target;
      } else if (target instanceof HTMLElement) {
        element = target;
        const rect = element.getBoundingClientRect();
        scrollPosition = rect.top + window.pageYOffset + mergedOptions.offset;
      }

      // Perform the scroll
      window.scrollTo({
        top: scrollPosition,
        behavior: mergedOptions.duration === 0 ? "instant" : "smooth",
      });

      // Update URL for hash targets
      if (typeof target === "string" && target.startsWith("#")) {
        window.history.pushState(null, "", target);
      }

      // Handle focus for accessibility
      if (element) {
        element.setAttribute("tabindex", "-1");
        element.focus();
        setTimeout(() => {
          element.removeAttribute("tabindex");
        }, 100);
      }

      // Call onComplete callback
      if (mergedOptions.onComplete) {
        // Approximate the duration
        setTimeout(mergedOptions.onComplete, mergedOptions.duration * 1000);
      }
    },
    [defaultOffset, defaultDuration]
  );

  // Main scroll function
  const scrollTo = React.useCallback<ScrollToFunction>(
    (target, options) => {
      // Try to use SmoothScrollContainer if available
      if (scrollContainerRef?.current) {
        scrollContainerRef.current.scrollTo(target, options);
      } else if (fallbackToNative) {
        // Fallback to native scrolling
        nativeScrollTo(target, options);
      }
    },
    [scrollContainerRef, fallbackToNative, nativeScrollTo]
  );

  // Scroll to top
  const scrollToTop = React.useCallback(() => {
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollToTop();
    } else if (fallbackToNative) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [scrollContainerRef, fallbackToNative]);

  // Scroll to bottom
  const scrollToBottom = React.useCallback(() => {
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollToBottom();
    } else if (fallbackToNative) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [scrollContainerRef, fallbackToNative]);

  // Scroll to hash
  const scrollToHash = React.useCallback(
    (hash: string) => {
      if (!hash.startsWith("#")) {
        hash = `#${hash}`;
      }
      scrollTo(hash);
    },
    [scrollTo]
  );

  // Handle link clicks with hash navigation
  const handleLinkClick = React.useCallback(
    (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      const target = e.currentTarget;
      const href = target.getAttribute("href") || target.dataset.href;

      if (href && href.startsWith("#")) {
        e.preventDefault();
        scrollToHash(href);
      }
    },
    [scrollToHash]
  );

  // Handle browser back/forward navigation
  React.useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      if (hash) {
        scrollToHash(hash);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [scrollToHash]);

  return {
    scrollTo,
    scrollToTop,
    scrollToBottom,
    scrollToHash,
    handleLinkClick,
  };
}