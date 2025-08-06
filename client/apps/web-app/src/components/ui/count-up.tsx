"use client";

import { Suspense, lazy } from "react";
import type { CountUpProps } from "react-countup";

const CountUpComponent = lazy(() => import("react-countup"));

interface CountUpWrapperProps extends CountUpProps {
  fallback?: React.ReactNode;
}

export function CountUp({ fallback, ...props }: CountUpWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      <CountUpComponent {...props} />
    </Suspense>
  );
}
