"use client";

import { ReactNode } from "react";
import { BundleSelectorProvider } from "@/contexts/bundle-selector-context";

export interface BundleSelectorRootProps {
  children: ReactNode;
}

/**
 * BundleSelectorRoot component - provides bundle selector context to children
 * 
 * This component wraps children with the BundleSelectorProvider to make bundle selection
 * utilities available throughout the component tree without prop drilling.
 * 
 * @example
 * ```tsx
 * <BundleSelectorRoot>
 *   <BundleSelector />
 * </BundleSelectorRoot>
 * ```
 */
export function BundleSelectorRoot({ children }: BundleSelectorRootProps) {
  return (
    <BundleSelectorProvider>
      {children}
    </BundleSelectorProvider>
  );
}