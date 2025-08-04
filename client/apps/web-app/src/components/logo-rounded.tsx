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
      <div className={cn("hidden md:flex justify-center", className)}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Image
            src="/images/logos/logo-rounded-textsvg.svg"
            alt="Logo"
            width={320}
            height={320}
            className="w-[320px] h-[320px] max-w-[320px] max-h-[320px]"
            priority
          />
        </motion.div>
      </div>

      {/* Logo container - Mobile */}
      <div className="flex md:hidden justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Image
            src="/images/logos/logo-rounded-textsvg.svg"
            alt="Logo"
            width={160}
            height={160}
            className="w-[160px] h-[160px] max-w-[160px] max-h-[160px]"
            priority
          />
        </motion.div>
      </div>
    </>
  );
}