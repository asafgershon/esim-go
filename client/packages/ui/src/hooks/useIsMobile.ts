import { useEffect, useState } from "react";

export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= breakpoint);
    
    // Initial check
    check();
    
    // Add event listener
    window.addEventListener("resize", check);
    
    // Cleanup
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  
  return isMobile;
}