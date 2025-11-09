"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export function AnimatedHeaderLogo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [phase, setPhase] = useState<"video" | "image">("video");
  const plays = useRef(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handleEnded = () => {
      plays.current += 1;
      if (plays.current < 2) {
        v.play(); // מנגן פעם שנייה
      } else {
        setPhase("image"); // אחרי פעמיים – תציג תמונה
      }
    };

    v.addEventListener("ended", handleEnded);
    v.play();

    return () => v.removeEventListener("ended", handleEnded);
  }, []);

  return (
    <>
      {phase === "video" && (
        <video
          ref={videoRef}
          src="/videos/loading.mp4"
          className="h-20 w-auto"
          preload="auto"
          playsInline
          muted
        />
      )}

      {phase === "image" && (
        <Image
          src="/images/logos/logo-header.svg"
          alt="Logo"
          width={120}
          height={40}
          className="h-10 w-auto"
        />
      )}
    </>
  );
}
