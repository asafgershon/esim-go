"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { cn } from "@workspace/ui";

interface BackgroundSectionProps {
  children?: React.ReactNode;
  className?: string;
}

export function BackgroundSection({
  children,
  className,
}: BackgroundSectionProps) {
  const desktopSvgRef = useRef<SVGSVGElement>(null);
  const mobileSvgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const animationContextRef = useRef<gsap.Context | null>(null);

  // Use IntersectionObserver to detect when section is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Animate only when visible
  useEffect(() => {
    if (!isVisible) {
      // Kill all animations when not visible
      if (animationContextRef.current) {
        animationContextRef.current.kill();
        animationContextRef.current = null;
      }
      return;
    }

    const desktopSvg = desktopSvgRef.current;
    const mobileSvg = mobileSvgRef.current;

    if (!desktopSvg || !mobileSvg) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      // Just show the shapes without animation
      gsap.set(
        [
          ...desktopSvg.querySelectorAll("path"),
          ...mobileSvg.querySelectorAll("path"),
        ],
        {
          opacity: 1,
          scale: 1,
        }
      );
      return;
    }

    // Create GSAP context for better cleanup
    animationContextRef.current = gsap.context(() => {
      // Desktop animations with reduced complexity
      const isMobile = window.innerWidth < 768;

      if (desktopSvg && !isMobile) {
        const shapes = desktopSvg.querySelectorAll("path");

        // Add will-change for GPU acceleration
        shapes.forEach((shape) => {
          (shape as SVGElement).style.willChange = "transform, opacity";
        });

        // Initial setup - make shapes invisible
        gsap.set(shapes, { opacity: 0, scale: 0.9 });

        // Simplified entrance animation
        gsap.to(shapes, {
          duration: 1.5,
          opacity: 1,
          scale: 1,
          ease: "power2.out",
          stagger: 0.2,
        });

        // Reduced floating animation (only 2 shapes for performance)
        shapes.forEach((shape, index) => {
          if (index < 2) {
            // Only animate first 2 shapes
            gsap.to(shape, {
              duration: 8 + index * 2,
              rotation: index % 2 === 0 ? 3 : -3,
              transformOrigin: "center center",
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              delay: index * 0.5,
            });
          }
        });
      }

      // Mobile animations - very minimal for performance
      if (mobileSvg && isMobile) {
        const shapes = mobileSvg.querySelectorAll("path");

        // Add will-change for GPU acceleration
        shapes.forEach((shape) => {
          (shape as SVGElement).style.willChange = "transform, opacity";
        });

        gsap.set(shapes, { opacity: 0, scale: 0.95 });

        // Simple fade in only
        gsap.to(shapes, {
          duration: 1,
          opacity: 0.9, // Slightly transparent for performance
          scale: 1,
          ease: "power2.out",
          stagger: 0.15,
        });

        // Minimal floating for only the first shape
        if (shapes[0]) {
          gsap.to(shapes[0], {
            duration: 10,
            rotation: 1,
            transformOrigin: "center center",
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        }
      }
    });

    // Cleanup function
    return () => {
      if (animationContextRef.current) {
        animationContextRef.current.revert();
        animationContextRef.current = null;
      }

      // Remove will-change to free up memory
      const allShapes = [
        ...(desktopSvg?.querySelectorAll("path") || []),
        ...(mobileSvg?.querySelectorAll("path") || []),
      ];
      allShapes.forEach((shape) => {
        (shape as SVGElement).style.willChange = "auto";
      });
    };
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "mx-auto w-full relative min-h-screen overflow-hidden rounded-[50px] md:rounded-[100px]"
      )}
    >
      {/* Desktop SVG Background - Hidden on mobile */}
      <svg
        ref={desktopSvgRef}
        className="absolute inset-0 w-full h-full sm:hidden md:block"
        viewBox="0 0 1920 1863"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="1920" height="1863" fill="var(--color-brand-dark)" />

        {/* Top-left green organic shape - moved 200px right, 100px down */}
        <path
          d="M131.294 739.274L-351.594 189.173L543.419 -596.493L1026.31 -46.3917C811.394 -24.3625 699.483 53.2856 636.942 120.57C502.37 265.342 531.748 431.587 370.818 592.822C288.229 675.552 195.203 717.219 131.294 739.274Z"
          fill="url(#greenGradient)"
          style={{ transformOrigin: "600px 400px" }}
        />

        {/* Top-left purple organic shape - moved 200px right, 100px down */}
        <path
          d="M94.245 655.988L-330.062 150.673L494.269 -547.663L918.577 -42.3478C724.133 -25.5658 621.492 43.1058 563.63 103.119C439.127 232.247 462.153 383.239 313.513 526.887C237.232 600.593 152.392 636.957 94.245 655.988Z"
          fill="url(#purpleGradient)"
          style={{ transformOrigin: "550px 350px" }}
        />

        {/* Bottom-right green organic shape - moved 200px left, 100px up */}
        <path
          d="M1832.53 1031.51L2315.41 1581.62L1420.4 2367.28L937.51 1817.18C1152.43 1795.15 1264.34 1717.5 1326.88 1650.22C1461.45 1505.45 1432.07 1339.2 1593 1177.97C1675.59 1095.24 1768.62 1053.57 1832.53 1031.51Z"
          fill="url(#greenGradient2)"
          style={{ transformOrigin: "1300px 1400px" }}
        />

        {/* Bottom-right purple organic shape - moved 200px left, 100px up */}
        <path
          d="M1869.57 1114.8L2293.88 1620.12L1469.55 2318.45L1045.24 1813.14C1239.69 1796.35 1342.33 1727.68 1400.19 1667.67C1524.69 1538.54 1501.67 1387.55 1650.31 1243.9C1726.59 1170.2 1811.43 1133.83 1869.57 1114.8Z"
          fill="url(#purpleGradient2)"
          style={{ transformOrigin: "1350px 1450px" }}
        />

        {/* Gradients */}
        <defs>
          <clipPath id="clip0_121_5098">
            <rect width="1920" height="1863" rx="100" fill="white" />
          </clipPath>
          <linearGradient
            id="greenGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--color-brand-green)" />
            <stop
              offset="100%"
              stopColor="var(--color-brand-green)"
              stopOpacity="0.95"
            />
          </linearGradient>
          <linearGradient
            id="greenGradient2"
            x1="100%"
            y1="100%"
            x2="0%"
            y2="0%"
          >
            <stop offset="0%" stopColor="var(--color-brand-green)" />
            <stop
              offset="100%"
              stopColor="var(--color-brand-green)"
              stopOpacity="1"
            />
          </linearGradient>
          <radialGradient id="purpleGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-brand-purple)" />
            <stop
              offset="100%"
              stopColor="var(--color-brand-purple)"
              stopOpacity="0.96"
            />
          </radialGradient>
          <radialGradient id="purpleGradient2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-brand-purple)" />
            <stop
              offset="100%"
              stopColor="var(--color-brand-purple)"
              stopOpacity="0.96"
            />
          </radialGradient>
        </defs>
      </svg>

      {/* Mobile SVG Background - Visible only on mobile */}
      <svg
        ref={mobileSvgRef}
        className="absolute inset-0 w-full h-full md:hidden block"
        viewBox="0 0 415 465"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="415" height="465" fill="var(--color-brand-dark)" />

        <path
          d="M543 -8.46252L435.079 -282.573L-129.532 -143.88L-21.6116 130.23C43.3875 62.8346 105.265 41.2798 149.964 34.1223C246.142 18.7197 308.947 62.5627 418.926 41.7098C475.36 31.0051 517.105 8.407 543 -8.46252Z"
          fill="url(#mobileGreen1)"
          style={{ transformOrigin: "200px 100px" }}
        />

        <path
          d="M533 -32.7584L425.079 -306.869L-139.532 -168.176L-31.6116 105.935C33.3875 38.5387 95.2648 16.9839 139.964 9.82639C236.142 -5.57622 298.947 38.2668 408.926 17.4139C465.36 6.70918 507.105 -15.8889 533 -32.7584Z"
          fill="url(#mobilePurple1)"
          style={{ transformOrigin: "180px 80px" }}
        />

        <path
          d="M-139.532 471.593L-31.6115 745.704L533 607.011L425.079 332.9C360.08 400.296 298.203 421.851 253.504 429.009C157.326 444.411 94.5204 400.568 -15.4578 421.421C-71.8918 432.126 -113.637 454.724 -139.532 471.593Z"
          fill="url(#mobileGreen2)"
          style={{ transformOrigin: "200px 400px" }}
        />

        <path
          d="M-129.532 495.889L-21.6115 770L543 631.307L435.079 357.196C370.08 424.592 308.203 446.147 263.504 453.304C167.326 468.707 104.52 424.864 -5.4578 445.717C-61.8918 456.422 -103.637 479.20 -129.532 495.889Z"
          fill="url(#mobilePurple2)"
          style={{ transformOrigin: "220px 420px" }}
        />

        <defs>
          <linearGradient id="mobileGreen1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              stopColor="var(--color-brand-green)"
              stopOpacity="0.9"
            />
            <stop
              offset="100%"
              stopColor="var(--color-brand-green)"
              stopOpacity="1"
            />
          </linearGradient>
          <linearGradient id="mobileGreen2" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop
              offset="0%"
              stopColor="var(--color-brand-green)"
              stopOpacity="0.9"
            />
            <stop
              offset="100%"
              stopColor="var(--color-brand-green)"
              stopOpacity="1"
            />
          </linearGradient>
          <radialGradient id="mobilePurple1" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor="var(--color-brand-purple)"
              stopOpacity="1"
            />
            <stop
              offset="100%"
              stopColor="var(--color-brand-purple)"
              stopOpacity="1"
            />
          </radialGradient>
          <radialGradient id="mobilePurple2" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor="var(--color-brand-purple)"
              stopOpacity="1"
            />
            <stop
              offset="100%"
              stopColor="var(--color-brand-purple)"
              stopOpacity="1"
            />
          </radialGradient>
        </defs>
      </svg>

      {/* Content container */}
      <div
        className={cn("relative z-10 flex flex-col items-center", className)}
      >
        {children}
      </div>
    </div>
  );
}
