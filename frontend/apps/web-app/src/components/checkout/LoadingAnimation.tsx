"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export function AnimatedHeaderLogo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [finished, setFinished] = useState(false);
  const plays = useRef(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handleEnded = () => {
      plays.current += 1;
      if (plays.current < 2) {
        v.play();
      } else {
        setFinished(true);
      }
    };

    v.addEventListener("ended", handleEnded);
    v.play();

    return () => v.removeEventListener("ended", handleEnded);
  }, []);

  return (
      <div className="relative h-20 w-[240px] overflow-hidden flex items-center justify-center">
      
      {/* ✅ VIDEO */}
      <video
        ref={videoRef}
        src="/videos/loading.mp4"
        className={`absolute inset-0 h-full w-auto transition-opacity duration-700 ${
          finished ? "opacity-0" : "opacity-100"
        }`}
        preload="auto"
        playsInline
        muted
      />

      {/* ✅ IMAGE */}
      <Image
        src="/images/logos/logo-header.svg"
        alt="Logo"
        width={120}
        height={40}
        className={`absolute inset-0 h-full w-auto transition-opacity duration-700 ${
          finished ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
