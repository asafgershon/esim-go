"use client";

import React from "react";
import Image from "next/image";

export function BackgroundSection() {
  return (
    <div className="relative w-full">
      {/* Desktop Background - hidden on mobile */}
      <div className="hidden md:block relative w-full">
        <Image
          src="/images/bgs/desktop-mid.svg"
          alt="Background decoration"
          width={1920}
          height={1863}
          className="w-full h-auto"
          priority
        />
        
        {/* Logo positioned on desktop background */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
          <Image
            src="/images/logos/logo-rounded-textsvg.svg"
            alt="Logo"
            width={320}
            height={320}
            className="w-[320px] h-[320px]"
            priority
          />
        </div>
      </div>
      
      {/* Mobile Background - visible only on mobile */}
      <div className="block md:hidden relative w-full">
        <Image
          src="/images/bgs/mobile-mid.svg"
          alt="Background decoration"
          width={415}
          height={1787}
          className="w-full h-auto"
          priority
        />
        
        {/* Logo positioned on mobile background */}
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
          <Image
            src="/images/logos/logo-rounded-textsvg.svg"
            alt="Logo"
            width={160}
            height={160}
            className="w-[160px] h-[160px]"
            priority
          />
        </div>
      </div>
    </div>
  );
}