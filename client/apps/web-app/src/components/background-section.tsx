"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@workspace/ui";

export function BackgroundSection() {
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
          {/* Logo container */}
          <div className="flex justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Image
                src="/images/logos/logo-rounded-textsvg.svg"
                alt="Logo"
                width={320}
                height={320}
                className="w-[320px] h-[320px]"
                priority
              />
            </motion.div>
          </div>
          
          {/* Text container */}
          <div className="flex flex-col items-center mt-8 gap-4">
            {/* Highlight */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white" dir="rtl">
                כן, כנראה שהמכשיר שלך תומך..
              </h2>
            </div>
            
            {/* Text */}
            <div className="text-center max-w-2xl px-4">
              <p className="text-lg text-white/90" dir="rtl">
                רוב המכשירים בישראל תומכים ב־eSIM. לבדיקה ודאית לגבי המכשיר שברשותכם לחצו כאן ובדקו תוך שניות אם אתם מוכנים לגלישה.
              </p>
            </div>
            
            {/* Check Button */}
            <div className="mt-4">
              <Button 
                variant="primary-brand"
                size="lg"
                // Brand purple background, white text, dark border - no shadow
                className="bg-[#535FC8] hover:bg-[#535FC8]/90 text-white w-[220px] border border-[#0A232E] outline-none shadow-none"
              >
                לחצו לבדיקה
              </Button>
            </div>
          </div>
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
          {/* Logo container */}
          <div className="flex justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Image
                src="/images/logos/logo-rounded-textsvg.svg"
                alt="Logo"
                width={160}
                height={160}
                className="w-[160px] h-[160px]"
                priority
              />
            </motion.div>
          </div>
          
          {/* Text container */}
          <div className="flex flex-col items-center mt-6 gap-3">
            {/* Highlight */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white" dir="rtl">
                כן, כנראה שהמכשיר שלך תומך..
              </h2>
            </div>
            
            {/* Text */}
            <div className="text-center max-w-sm px-4">
              <p className="text-base text-white/90" dir="rtl">
                רוב המכשירים בישראל תומכים ב־eSIM. לבדיקה ודאית לגבי המכשיר שברשותכם לחצו כאן ובדקו תוך שניות אם אתם מוכנים לגלישה.
              </p>
            </div>
            
            {/* Check Button */}
            <div className="mt-3">
              <Button 
                variant="primary-brand"
                size="lg"
                // Brand purple background, white text, dark border - no shadow
                className="bg-[#535FC8] hover:bg-[#535FC8]/90 text-white w-[220px] border border-[#0A232E] outline-none shadow-none"
              >
                לחצו לבדיקה
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}