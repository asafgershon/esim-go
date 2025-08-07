"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface BackgroundSectionProps {
  children?: React.ReactNode;
}

export function BackgroundSection({ children }: BackgroundSectionProps) {
  const desktopSvgRef = useRef<SVGSVGElement>(null);
  const mobileSvgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Desktop animations
    if (desktopSvgRef.current) {
      const shapes = desktopSvgRef.current.querySelectorAll("path");

      // Initial setup - make shapes invisible
      gsap.set(shapes, { opacity: 0, scale: 0.8 });

      // Create timeline for desktop
      const tl = gsap.timeline();

      // Animate shapes in sequence
      tl.to(shapes[0], {
        duration: 2,
        opacity: 1,
        scale: 1,
        ease: "back.out(1.7)",
        delay: 0.2,
      })
        .to(
          shapes[1],
          {
            duration: 2,
            opacity: 1,
            scale: 1,
            ease: "back.out(1.7)",
          },
          "-=1.5"
        )
        .to(
          shapes[2],
          {
            duration: 2,
            opacity: 1,
            scale: 1,
            ease: "back.out(1.7)",
          },
          "-=1.5"
        )
        .to(
          shapes[3],
          {
            duration: 2,
            opacity: 1,
            scale: 1,
            ease: "back.out(1.7)",
          },
          "-=1.5"
        );

      // Continuous floating animation
      shapes.forEach((shape, index) => {
        gsap.to(shape, {
          duration: 4 + index,
          rotation: index % 2 === 0 ? 5 : -5,
          transformOrigin: "center center",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.5,
        });

        gsap.to(shape, {
          duration: 6 + index * 0.5,
          x: index % 2 === 0 ? 10 : -10,
          y: index % 2 === 0 ? -5 : 5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.3,
        });
      });
    }

    // Mobile animations
    if (mobileSvgRef.current) {
      const shapes = mobileSvgRef.current.querySelectorAll("path");

      gsap.set(shapes, { opacity: 0, scale: 0.9 });

      const mobileTl = gsap.timeline();

      // Stagger animation for mobile
      mobileTl.to(shapes, {
        duration: 1.5,
        opacity: 1,
        scale: 1,
        ease: "back.out(1.2)",
        stagger: 0.2,
        delay: 0.1,
      });

      // Subtle floating for mobile (less intense)
      shapes.forEach((shape, index) => {
        gsap.to(shape, {
          duration: 5 + index * 0.5,
          rotation: index % 2 === 0 ? 2 : -2,
          transformOrigin: "center center",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.4,
        });

        gsap.to(shape, {
          duration: 4 + index * 0.3,
          x: index % 2 === 0 ? 5 : -5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.2,
        });
      });
    }

    const currentRef = desktopSvgRef.current || mobileSvgRef.current;
    // Cleanup function
    return () => {
      gsap.killTweensOf(currentRef?.querySelectorAll("path") || []);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden rounded-[100px] sm:rounded-[50px]">
      {/* Desktop SVG Background - Hidden on mobile */}
      <svg
        ref={desktopSvgRef}
        className="absolute inset-0 w-full h-full hidden md:block"
        viewBox="0 0 1920 1863"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="1920" height="1863" fill="var(--color-brand-dark)" />

        {/* Top-left green organic shape */}
        <path
          d="M-68.7062 639.274L-551.595 89.1725L343.419 -696.493L826.308 -146.392C611.394 -124.363 499.483 -46.7144 436.942 20.5699C302.37 165.342 331.747 331.587 170.817 492.822C88.2288 575.552 -4.79709 617.219 -68.7062 639.274Z"
          fill="url(#greenGradient)"
          style={{ transformOrigin: "400px 300px" }}
        />

        {/* Top-left purple organic shape */}
        <path
          d="M-105.755 555.988L-530.063 50.6729L294.269 -647.663L718.577 -142.348C524.133 -125.566 421.492 -56.8942 363.63 3.11915C239.127 132.247 262.153 283.239 113.513 426.887C37.232 500.593 -47.6078 536.957 -105.755 555.988Z"
          fill="url(#purpleGradient)"
          style={{ transformOrigin: "350px 250px" }}
        />

        {/* Bottom-right green organic shape */}
        <path
          d="M2032.53 1131.51L2515.41 1681.62L1620.4 2467.28L1137.51 1917.18C1352.43 1895.15 1464.34 1817.5 1526.88 1750.22C1661.45 1605.45 1632.07 1439.2 1793 1277.97C1875.59 1195.24 1968.62 1153.57 2032.53 1131.51Z"
          fill="url(#greenGradient2)"
          style={{ transformOrigin: "1500px 1500px" }}
        />

        {/* Bottom-right purple organic shape */}
        <path
          d="M2069.57 1214.8L2493.88 1720.12L1669.55 2418.45L1245.24 1913.14C1439.69 1896.35 1542.33 1827.68 1600.19 1767.67C1724.69 1638.54 1701.67 1487.55 1850.31 1343.9C1926.59 1270.2 2011.43 1233.83 2069.57 1214.8Z"
          fill="url(#purpleGradient2)"
          style={{ transformOrigin: "1550px 1550px" }}
        />

        {/* Gradients */}
        <defs>
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
              stopOpacity="0.95"
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
              stopOpacity="0.7"
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
              stopOpacity="0.7"
            />
          </linearGradient>
          <radialGradient id="mobilePurple1" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor="var(--color-brand-purple)"
              stopOpacity="0.8"
            />
            <stop
              offset="100%"
              stopColor="var(--color-brand-purple)"
              stopOpacity="0.6"
            />
          </radialGradient>
          <radialGradient id="mobilePurple2" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor="var(--color-brand-purple)"
              stopOpacity="0.8"
            />
            <stop
              offset="100%"
              stopColor="var(--color-brand-purple)"
              stopOpacity="0.6"
            />
          </radialGradient>
        </defs>
      </svg>

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center pt-20 md:pt-20">
        {children}
      </div>
    </div>
  );
}
