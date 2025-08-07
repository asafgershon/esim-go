"use client";

import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { cn } from "../lib/utils";
import { ScrollProvider, type ScrollToOptions as ContextScrollToOptions } from "../contexts/scroll-context";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin);
}

export interface SmoothScrollContainerProps {
  children: React.ReactNode;
  /** Scroll speed multiplier (0.5 = half speed, 2 = double speed) */
  speed?: number;
  /** Smoothness level (higher = smoother, 0 = disabled) */
  smooth?: number;
  /** Enable parallax effects via data attributes */
  effects?: boolean;
  /** Account for fixed header */
  fixedHeader?: boolean;
  /** Header height in pixels */
  headerHeight?: number;
  /** Custom wrapper ID */
  wrapperId?: string;
  /** Custom content ID */
  contentId?: string;
  /** Additional className for the wrapper */
  className?: string;
  /** Normalize scroll across devices */
  normalizeScroll?: boolean;
  /** Ignore mobile resize events */
  ignoreMobileResize?: boolean;
}

export interface SmoothScrollHandle {
  scrollTo: (target: string | number | HTMLElement, options?: ScrollToOptions) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  refresh: () => void;
  getVelocity: () => number;
  paused: (value?: boolean) => boolean | undefined;
}

export interface ScrollToOptions {
  offset?: number;
  duration?: number;
  ease?: string;
  onComplete?: () => void;
}

const SmoothScrollContainer = React.forwardRef<
  SmoothScrollHandle,
  SmoothScrollContainerProps
>(
  (
    {
      children,
      speed = 1,
      smooth = 1,
      effects = true,
      fixedHeader = true,
      headerHeight = 64,
      wrapperId = "smooth-wrapper",
      contentId = "smooth-content",
      className,
      normalizeScroll = true,
      ignoreMobileResize = true,
    },
    ref
  ) => {
    const smootherRef = React.useRef<ScrollSmoother | null>(null);
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);

    // Initialize ScrollSmoother
    React.useLayoutEffect(() => {
      if (typeof window === "undefined") return;

      // Create context for ScrollSmoother
      const ctx = gsap.context(() => {
        smootherRef.current = ScrollSmoother.create({
          wrapper: `#${wrapperId}`,
          content: `#${contentId}`,
          smooth: smooth,
          smoothTouch: 0.1, // Subtle smoothing on touch devices
          effects: effects,
          normalizeScroll: normalizeScroll,
          ignoreMobileResize: ignoreMobileResize,
          speed: speed,
        });
      });

      // Refresh on window resize
      const handleResize = () => {
        ScrollTrigger.refresh();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        ctx.revert();
        smootherRef.current = null;
      };
    }, [
      speed,
      smooth,
      effects,
      wrapperId,
      contentId,
      normalizeScroll,
      ignoreMobileResize,
    ]);

    // Expose methods via ref
    React.useImperativeHandle(
      ref,
      () => ({
        scrollTo: (target, options) => {
          if (!smootherRef.current) return;

          const defaultOptions = {
            offset: fixedHeader ? -headerHeight : 0,
            duration: 1,
            ease: "power2.inOut",
          };

          const mergedOptions = { ...defaultOptions, ...options };

          // Handle different target types
          let targetElement: HTMLElement | null = null;
          let targetSelector: string = "";

          if (typeof target === "string" && target.startsWith("#")) {
            targetSelector = target;
            const element = document.querySelector(target);
            if (element) {
              targetElement = element as HTMLElement;
            }
          } else if (target instanceof HTMLElement) {
            targetElement = target;
          }

          // ScrollSmoother uses its internal method for scrolling
          if (targetElement || targetSelector) {
            const elem = targetElement || document.querySelector(targetSelector);
            if (elem) {
              // Use ScrollTrigger to get the proper scroll position
              const st = ScrollTrigger.create({
                trigger: elem,
                start: `top top`,
              });
              
              const targetPosition = st.start + mergedOptions.offset;
              
              // Clean up the temporary ScrollTrigger
              st.kill();
              
              // Animate to the target position
              gsap.to(smootherRef.current, {
                scrollTop: targetPosition,
                duration: mergedOptions.duration,
                ease: mergedOptions.ease,
                onComplete: mergedOptions.onComplete,
              });
            }
          } else if (typeof target === "number") {
            gsap.to(smootherRef.current, {
              scrollTop: target,
              duration: mergedOptions.duration,
              ease: mergedOptions.ease,
              onComplete: mergedOptions.onComplete,
            });
          }

          // Update URL for hash targets
          if (typeof target === "string" && target.startsWith("#")) {
            window.history.pushState(null, "", target);
          }

          // Handle focus for accessibility
          if (targetElement) {
            setTimeout(() => {
              targetElement.setAttribute("tabindex", "-1");
              targetElement.focus();
              setTimeout(() => {
                targetElement.removeAttribute("tabindex");
              }, 100);
            }, mergedOptions.duration * 1000);
          }
        },
        scrollToTop: () => {
          smootherRef.current?.scrollTop(0);
        },
        scrollToBottom: () => {
          smootherRef.current?.scrollTo("bottom");
        },
        refresh: () => {
          ScrollTrigger.refresh();
        },
        getVelocity: () => {
          return smootherRef.current?.getVelocity() || 0;
        },
        paused: (value) => {
          if (value !== undefined) {
            smootherRef.current?.paused(value);
            return value;
          }
          return smootherRef.current?.paused() || false;
        },
      }),
      [fixedHeader, headerHeight]
    );

    // Handle initial hash navigation
    React.useEffect(() => {
      if (typeof window === "undefined") return;

      const hash = window.location.hash;
      if (hash && smootherRef.current) {
        // Delay to ensure content is rendered
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            // Use scrollTo with smooth disabled for instant scroll
            smootherRef.current?.scrollTo(element as HTMLElement, false);
          }
        }, 100);
      }
    }, [fixedHeader, headerHeight]);

    // Create scrollTo function for the provider
    const scrollToForProvider = React.useCallback(
      (target: string | number | HTMLElement, options?: ContextScrollToOptions) => {
        if (!smootherRef.current) return;

        const defaultOptions = {
          offset: fixedHeader ? -headerHeight : 0,
          duration: 1,
          ease: "power2.inOut",
        };

        const mergedOptions = { ...defaultOptions, ...options };

        // Handle different target types
        let targetElement: HTMLElement | null = null;
        let targetSelector: string = "";

        if (typeof target === "string" && target.startsWith("#")) {
          targetSelector = target;
          const element = document.querySelector(target);
          if (element) {
            targetElement = element as HTMLElement;
          }
        } else if (target instanceof HTMLElement) {
          targetElement = target;
        }

        // ScrollSmoother uses its internal method for scrolling
        if (targetElement || targetSelector) {
          const elem = targetElement || document.querySelector(targetSelector);
          if (elem) {
            gsap.to(window, {
              duration: mergedOptions.duration,
              scrollTo: {
                y: elem,
                offsetY: -mergedOptions.offset,
              },
              ease: mergedOptions.ease,
              onComplete: mergedOptions.onComplete,
            });
          }
        } else if (typeof target === "number") {
          gsap.to(window, {
            duration: mergedOptions.duration,
            scrollTo: target + mergedOptions.offset,
            ease: mergedOptions.ease,
            onComplete: mergedOptions.onComplete,
          });
        }
      },
      [fixedHeader, headerHeight]
    );

    return (
      <ScrollProvider smootherRef={smootherRef} scrollTo={scrollToForProvider}>
        <div
          id={wrapperId}
          ref={wrapperRef}
          className={cn("fixed inset-0 overflow-hidden", className)}
        >
          <div id={contentId} ref={contentRef}>
            {children}
          </div>
        </div>
      </ScrollProvider>
    );
  }
);

SmoothScrollContainer.displayName = "SmoothScrollContainer";

export { SmoothScrollContainer };