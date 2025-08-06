'use client';

import { useEffect, useState } from "react";

interface UseIsMobileOptions {
  breakpoint?: number;
  tablet?: boolean;
}

export function useIsMobile(options: UseIsMobileOptions | number = {}) {
  // Handle backward compatibility with number parameter
  const config = typeof options === 'number' 
    ? { breakpoint: options, tablet: false }
    : { breakpoint: 768, tablet: false, ...options };
    
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const check = () => {
      const width = window.innerWidth;
      if (config.tablet) {
        // Include tablets (up to 1024px) as mobile
        setIsMobile(width <= 1024);
      } else {
        // Original mobile-only behavior
        setIsMobile(width <= config.breakpoint);
      }
    };
    
    // Initial check
    check();
    
    // Add event listener
    window.addEventListener("resize", check);
    
    // Cleanup
    return () => window.removeEventListener("resize", check);
  }, [config.breakpoint, config.tablet]);
  
  return isMobile;
}