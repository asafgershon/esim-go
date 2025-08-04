"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface LogoRoundedProps {
  className?: string;
}

export function LogoRounded({ className }: LogoRoundedProps) {
  return (
    <>
      {/* Logo container - Desktop */}
      <div className="hidden md:flex justify-center">
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
            className="w-[320px] h-[320px]"
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
            className="w-[160px] h-[160px]"
            priority
          />
        </motion.div>
      </div>
    </>
  );
}