"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface ImageWithFallbackProps extends Omit<ImageProps, 'src'> {
  src: string;
  fallbackSrc: string;
}

export function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isError, setIsError] = useState(false);

  return (
    <Image
      {...props}
      src={isError ? fallbackSrc : imgSrc}
      alt={alt}
      onError={() => {
        if (!isError) {
          setIsError(true);
          setImgSrc(fallbackSrc);
        }
      }}
      onLoad={() => {
        // Reset error state if image loads successfully
        if (isError && imgSrc === src) {
          setIsError(false);
        }
      }}
    />
  );
}