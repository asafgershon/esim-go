"use client";

import React from "react";
import Image from "next/image";

interface BackgroundSectionProps {
  children: React.ReactNode;
}

export function BackgroundSection({ children }: BackgroundSectionProps) {
  return (
    <div className="relative w-full">
      {/* Desktop Background - hidden on mobile */}
      <div className="hidden md:flex relative w-full flex-col">
        <Image
          src="/images/bgs/desktop-mid.svg"
          alt="Background decoration"
          width={1920}
          height={1863}
          className="w-full h-auto absolute inset-0"
          priority
        />
        
        {/* Content container */}
        <div className="relative z-10 flex flex-col items-center pt-20">
          {children}
        </div>
      </div>
      
      {/* Mobile Background - visible only on mobile */}
      <div className="flex md:hidden relative w-full flex-col">
        <Image
          src="/images/bgs/mobile-mid.svg"
          alt="Background decoration"
          width={415}
          height={1787}
          className="w-full h-auto absolute inset-0"
          priority
        />
        
        {/* Content container */}
        <div className="relative z-10 flex flex-col items-center pt-10">
          {children}
        </div>
      </div>
    </div>
  );
}