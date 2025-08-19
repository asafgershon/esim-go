"use client";

import React from "react";
import { Drawer } from "vaul";
import { useScrollSmootherLock } from "../hooks/use-scroll-smoother-lock";

export interface ScrollAwareDrawerProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Whether to preserve scroll position on iOS */
  preserveScrollPosition?: boolean;
  /** Whether to prevent touch move events on iOS */
  preventTouchMove?: boolean;
}

/**
 * Drawer component that automatically locks scrolling when open.
 * Works with ScrollSmoother if available, falls back to standard body lock.
 * 
 * For additional Drawer.Root props, use the vaul Drawer.Root component directly
 * with the useScrollSmootherLock hook.
 */
export function ScrollAwareDrawer({
  children,
  open,
  onOpenChange,
  preserveScrollPosition = true,
  preventTouchMove = true,
}: ScrollAwareDrawerProps) {
  // Use the scroll lock hook with auto-lock based on open state
  useScrollSmootherLock({
    autoLock: open,
    preserveScrollPosition,
    preventTouchMove,
  });

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Drawer.Root>
  );
}

// Export all Drawer sub-components for easy use
export const ScrollAwareDrawerPortal = Drawer.Portal;
export const ScrollAwareDrawerOverlay = Drawer.Overlay;
export const ScrollAwareDrawerContent = Drawer.Content;
export const ScrollAwareDrawerTitle = Drawer.Title;
export const ScrollAwareDrawerDescription = Drawer.Description;
export const ScrollAwareDrawerClose = Drawer.Close;
export const ScrollAwareDrawerTrigger = Drawer.Trigger;