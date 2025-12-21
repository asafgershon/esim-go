"use client";

import { cn } from "@workspace/ui";
import { motion } from "framer-motion";
import Image from "next/image";

interface LogoRoundedProps {
  className?: string;
}

export function LogoRounded({ className }: LogoRoundedProps) {
  return (
    <>
      {/* Logo container - Desktop */}
      <div className={cn("hidden md:flex justify-center relative h-[320px] w-[320px]", className)}>
        <Image
          src="/images/logos/logo-rounded-center.svg"
          alt="Logo"
          width={160}
          height={160}
          className="w-[160px] h-[160px] max-w-[160px] max-h-[160px] absolute top-[80px] left-[80px]"
          priority
        />
        <motion.div
          animate={{ rotate: 360 }}
          className="absolute top-0 left-0"
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Image
            src="/images/logos/logo-rounded-text.svg"
            alt="Logo"
            width={320}
            height={320}
            className="w-[320px] h-[320px] max-w-[320px] max-h-[320px]"
            priority
          />
        </motion.div>
      </div>

      {/* Logo container - Mobile */}
      {/* <div className={cn("flex md:hidden justify-center relative h-[160px] w-[160px]", className)}>
        <Image
          src="/images/logos/logo-rounded-center.svg"
          alt="Logo"
          width={80}
          height={80}
          className="w-[80px] h-[80px] max-w-[80px] max-h-[80px] absolute top-[40px] left-[40px]"
          priority
        />
        <motion.div
          animate={{ rotate: 360 }}
          className="absolute top-0 left-0"
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Image
            src="/images/logos/logo-rounded-text.svg"
            alt="Logo"
            width={160}
            height={160}
            className="w-[160px] h-[160px] max-w-[160px] max-h-[160px]"
            priority
          />
        </motion.div>
      </div> */}
    </>
  );
}
