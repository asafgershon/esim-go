"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(Draggable, InertiaPlugin);
}

export interface UseHorizontalScrollOptions {
  /** Custom padding for bounds calculation (default: 32px) */
  padding?: number;
  /** Edge resistance for dragging (default: 0.85) */
  edgeResistance?: number;
  /** Enable inertia for dragging (default: true) */
  inertia?: boolean;
  /** Mouse wheel scroll speed multiplier (default: 2) */
  wheelSpeed?: number;
  /** Animation duration for wheel scrolling (default: 0.5) */
  animationDuration?: number;
  /** Animation easing (default: "power2.out") */
  animationEase?: string;
  /** Start from right position for RTL (default: true) */
  startFromRight?: boolean;
  /** Progress bar color (default: "#00E095") */
  progressColor?: string;
  /** Progress track background color (default: "rgba(255, 255, 255, 0.1)") */
  progressTrackColor?: string;
  /** Inertia settings for mobile momentum scrolling */
  inertiaSettings?: {
    /** Velocity multiplier (default: 1.8) */
    velocityScale?: number;
    /** Minimum duration (default: 0.5) */
    minDuration?: number;
    /** Maximum duration (default: 3) */
    maxDuration?: number;
    /** Resistance factor (default: 1000) */
    resistance?: number;
    /** End resistance for natural deceleration (default: 0.98) */
    endResistance?: number;
  };
}

export interface UseHorizontalScrollReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  progressRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Custom hook for GSAP-powered horizontal scrolling with dragging, wheel support, and progress indicator
 * Perfect for carousels, galleries, and horizontal lists
 */
export function useHorizontalScroll(
  options: UseHorizontalScrollOptions = {}
): UseHorizontalScrollReturn {
  const {
    padding = 32,
    edgeResistance = 0.85,
    inertia = true,
    wheelSpeed = 2,
    animationDuration = 0.5,
    animationEase = "power2.out",
    startFromRight = true,
    inertiaSettings = {},
  } = options;

  const {
    velocityScale = 1.8,
    minDuration = 0.5,
    maxDuration = 3,
    resistance = 1000,
    endResistance = 0.98,
  } = inertiaSettings;

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !containerRef.current ||
      !contentRef.current ||
      !progressRef.current
    ) {
      return;
    }

    const container = containerRef.current;
    const content = contentRef.current;
    const progressBar = progressRef.current;

    // Calculate scroll bounds
    const updateBounds = () => {
      const containerWidth = container.offsetWidth;
      const contentWidth = content.scrollWidth;
      return Math.min(0, containerWidth - contentWidth - padding);
    };

    let bounds = updateBounds();
    
    // Set initial position based on RTL preference
    const initialPosition = startFromRight ? bounds : 0;
    gsap.set(content, { x: initialPosition });
    
    // Initialize progress bar
    gsap.set(progressBar, {
      scaleX: 0,
      transformOrigin: "left center",
    });

    // Create draggable with enhanced inertia for mobile
    const draggable = Draggable.create(content, {
      type: "x",
      bounds: { minX: bounds, maxX: 0 },
      inertia: inertia ? {
        x: {
          min: bounds,
          max: 0,
          resistance,
          minDuration,
          maxDuration,
          velocity: "auto",
          end: (endValue: number) => {
            // Snap to bounds if needed
            return Math.max(bounds, Math.min(0, endValue));
          }
        }
      } : false,
      edgeResistance,
      onDrag: updateProgress,
      onThrowUpdate: updateProgress,
      onThrowComplete: updateProgress,
      cursor: "grab",
      activeCursor: "grabbing",
      allowNativeTouchScrolling: false,
      zIndexBoost: false,
      dragClickables: false,
    })[0];

    // Update progress bar
    function updateProgress() {
      if (!progressBar || bounds >= 0 || !draggable) return;
      
      const progress = Math.abs(draggable.x / bounds);
      gsap.set(progressBar, {
        scaleX: progress,
        transformOrigin: "left center",
      });
    }

    // Mouse wheel support
    const handleWheel = (e: WheelEvent) => {
      if (!draggable) return;
      
      // Support both horizontal and vertical scrolling
      // Use deltaY for vertical scroll (more common on desktop)
      // Use deltaX for horizontal scroll (trackpad gestures)
      const deltaX = e.deltaX;
      const deltaY = e.deltaY;
      
      // If there's no significant scroll, return
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;
      
      // Prefer horizontal scroll, but use vertical if horizontal is minimal
      const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
      
      e.preventDefault();
      const scrollDelta = delta * wheelSpeed;
      const newX = draggable.x - scrollDelta;
      const clampedX = Math.max(bounds, Math.min(0, newX));
      
      gsap.to(content, {
        x: clampedX,
        duration: animationDuration,
        ease: animationEase,
        onUpdate: () => {
          if (draggable) {
            draggable.update();
            updateProgress();
          }
        },
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    // Handle resize
    const handleResize = () => {
      if (!draggable) return;
      
      bounds = updateBounds();
      draggable.applyBounds({ minX: bounds, maxX: 0 });
      
      // Ensure content doesn't go out of bounds after resize
      if (draggable.x < bounds) {
        gsap.set(content, { x: bounds });
        draggable.update();
      }
      
      updateProgress();
    };

    window.addEventListener("resize", handleResize);

    // Enhanced touch support with velocity tracking for momentum
    let touchStartX = 0;
    let touchStartTime = 0;
    let lastTouchX = 0;
    let lastTouchTime = 0;
    let velocityX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (!draggable || !e.touches[0]) return;
      
      // Let Draggable handle the touch if it's enabled
      if (inertia) {
        return;
      }
      
      touchStartX = e.touches[0].clientX;
      touchStartTime = Date.now();
      lastTouchX = touchStartX;
      lastTouchTime = touchStartTime;
      velocityX = 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!draggable || !e.touches[0] || inertia) return;
      
      const currentX = e.touches[0].clientX;
      const currentTime = Date.now();
      const timeDelta = currentTime - lastTouchTime;
      
      if (timeDelta > 0) {
        velocityX = (currentX - lastTouchX) / timeDelta;
      }
      
      const diff = currentX - touchStartX;
      const newX = draggable.x + diff;
      const clampedX = Math.max(bounds, Math.min(0, newX));
      
      gsap.set(content, { x: clampedX });
      draggable.update();
      updateProgress();
      
      lastTouchX = currentX;
      lastTouchTime = currentTime;
    };

    const handleTouchEnd = () => {
      if (!draggable || inertia) return;
      
      // Apply momentum based on velocity
      if (Math.abs(velocityX) > 0.1) {
        const momentum = velocityX * velocityScale * 100;
        const targetX = draggable.x + momentum;
        const clampedTarget = Math.max(bounds, Math.min(0, targetX));
        
        gsap.to(content, {
          x: clampedTarget,
          duration: minDuration + (Math.min(Math.abs(momentum) / 500, maxDuration - minDuration)),
          ease: "power2.out",
          onUpdate: () => {
            if (draggable) {
              draggable.update();
              updateProgress();
            }
          },
        });
      }
    };

    // Only add custom touch handlers if inertia is disabled
    if (!inertia) {
      container.addEventListener("touchstart", handleTouchStart, { passive: true });
      container.addEventListener("touchmove", handleTouchMove, { passive: true });
      container.addEventListener("touchend", handleTouchEnd, { passive: true });
    }

    // Initial progress update
    updateProgress();

    // Cleanup
    return () => {
      if (draggable) {
        draggable.kill();
      }
      container.removeEventListener("wheel", handleWheel);
      if (!inertia) {
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchmove", handleTouchMove);
        container.removeEventListener("touchend", handleTouchEnd);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [
    padding,
    edgeResistance,
    inertia,
    wheelSpeed,
    animationDuration,
    animationEase,
    startFromRight,
    velocityScale,
    minDuration,
    maxDuration,
    resistance,
    endResistance,
  ]);

  return {
    containerRef,
    contentRef,
    progressRef,
  };
}