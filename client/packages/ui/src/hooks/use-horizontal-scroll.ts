"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Draggable } from "gsap/Draggable";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, Draggable);
}

export interface UseHorizontalScrollOptions {
  /** Custom padding for bounds calculation (default: 32px) */
  padding?: number;
  /** Edge resistance for dragging (default: 0.85) */
  edgeResistance?: number;
  /** Enable inertia for dragging (default: true) */
  inertia?: boolean;
  /** Mouse wheel scroll speed multiplier (default: 1) */
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
}

export interface UseHorizontalScrollReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  progressRef: React.RefObject<HTMLDivElement>;
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
    wheelSpeed = 1,
    animationDuration = 0.5,
    animationEase = "power2.out",
    startFromRight = true,
    progressColor = "#00E095",
    progressTrackColor = "rgba(255, 255, 255, 0.1)",
  } = options;

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
    gsap.set(progressRef.current, {
      scaleX: 0,
      transformOrigin: "left center",
    });

    // Create draggable
    const draggable = Draggable.create(content, {
      type: "x",
      bounds: { minX: bounds, maxX: 0 },
      inertia,
      edgeResistance,
      onDrag: updateProgress,
      onThrowUpdate: updateProgress,
      cursor: "grab",
      activeCursor: "grabbing",
    })[0];

    // Update progress bar
    function updateProgress() {
      if (!progressRef.current || bounds >= 0) return;
      
      const progress = Math.abs(draggable.x / bounds);
      gsap.set(progressRef.current, {
        scaleX: progress,
        transformOrigin: "left center",
      });
    }

    // Mouse wheel support
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        const delta = e.deltaX * wheelSpeed;
        const newX = draggable.x - delta;
        const clampedX = Math.max(bounds, Math.min(0, newX));
        
        gsap.to(content, {
          x: clampedX,
          duration: animationDuration,
          ease: animationEase,
          onUpdate: () => {
            draggable.update();
            updateProgress();
          },
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    // Handle resize
    const handleResize = () => {
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

    // Touch support for mobile
    let touchStartX = 0;
    let startX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      startX = draggable.x;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchX = e.touches[0].clientX;
      const diff = touchX - touchStartX;
      const newX = startX + diff;
      const clampedX = Math.max(bounds, Math.min(0, newX));
      
      gsap.set(content, { x: clampedX });
      draggable.update();
      updateProgress();
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Initial progress update
    updateProgress();

    // Cleanup
    return () => {
      draggable.kill();
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
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
    progressColor,
    progressTrackColor,
  ]);

  return {
    containerRef,
    contentRef,
    progressRef,
  };
}