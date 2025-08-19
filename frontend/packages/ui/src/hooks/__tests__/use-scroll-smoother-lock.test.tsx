import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { useScrollSmootherLock, useScrollLock } from "../use-scroll-smoother-lock";
import { ScrollProvider, type ScrollContextValue } from "../../contexts/scroll-context";

// Mock ScrollSmoother
const mockScrollSmoother = {
  paused: vi.fn((value?: boolean) => {
    if (value !== undefined) {
      return value;
    }
    return false;
  }),
};

// Mock context value
const mockContextValue: ScrollContextValue = {
  smootherRef: { current: mockScrollSmoother as any },
  isScrollLocked: false,
  lockScroll: vi.fn(),
  unlockScroll: vi.fn(),
  scrollTo: vi.fn(),
};

describe("useScrollSmootherLock", () => {
  let originalUserAgent: string;
  
  beforeEach(() => {
    originalUserAgent = navigator.userAgent;
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    Object.defineProperty(window, "scrollY", {
      value: 0,
      writable: true,
    });
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    Object.defineProperty(navigator, "userAgent", {
      value: originalUserAgent,
      writable: true,
    });
  });

  describe("without ScrollSmoother context", () => {
    it("should lock and unlock body scroll", () => {
      const { result } = renderHook(() => 
        useScrollSmootherLock({ autoLock: false })
      );
      
      expect(document.body.style.overflow).toBe("");
      
      act(() => result.current.lockScroll());
      expect(document.body.style.overflow).toBe("hidden");
      
      act(() => result.current.unlockScroll());
      expect(document.body.style.overflow).toBe("");
    });

    it("should auto-lock when autoLock is true", () => {
      renderHook(() => 
        useScrollSmootherLock({ autoLock: true })
      );
      
      expect(document.body.style.overflow).toBe("hidden");
    });

    it("should handle iOS-specific scroll position preservation", () => {
      // Mock iOS user agent
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        writable: true,
      });
      
      // Mock scroll position
      Object.defineProperty(window, "scrollY", {
        value: 100,
        writable: true,
      });
      
      const { result } = renderHook(() => 
        useScrollSmootherLock({ 
          autoLock: false,
          preserveScrollPosition: true 
        })
      );
      
      act(() => result.current.lockScroll());
      
      // Check iOS-specific styles
      expect(document.body.style.position).toBe("fixed");
      expect(document.body.style.top).toBe("-100px");
      expect(document.body.style.width).toBe("100%");
      
      // Mock scrollTo
      const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
      
      act(() => result.current.unlockScroll());
      
      // Check restoration
      expect(document.body.style.position).toBe("");
      expect(document.body.style.top).toBe("");
      expect(scrollToSpy).toHaveBeenCalledWith(0, 100);
      
      scrollToSpy.mockRestore();
    });

    it("should not apply iOS fixes on non-iOS devices", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        writable: true,
      });
      
      const { result } = renderHook(() => 
        useScrollSmootherLock({ 
          autoLock: false,
          preserveScrollPosition: true,
          preventTouchMove: true
        })
      );
      
      act(() => result.current.lockScroll());
      
      // Should not apply iOS-specific styles
      expect(document.body.style.position).not.toBe("fixed");
      expect(document.body.style.top).toBe("");
      expect(document.body.style.overflow).toBe("hidden");
    });

    it("should cleanup on unmount", () => {
      const { unmount } = renderHook(() => 
        useScrollSmootherLock({ autoLock: true })
      );
      
      expect(document.body.style.overflow).toBe("hidden");
      
      unmount();
      
      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("with ScrollSmoother context", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ScrollProvider
        smootherRef={mockContextValue.smootherRef!}
        scrollTo={mockContextValue.scrollTo}
      >
        {children}
      </ScrollProvider>
    );

    it("should use ScrollSmoother context when available", () => {
      const { result } = renderHook(
        () => useScrollSmootherLock({ autoLock: false }),
        { wrapper }
      );
      
      act(() => result.current.lockScroll());
      
      // Should call context lockScroll which pauses ScrollSmoother
      expect(mockScrollSmoother.paused).toHaveBeenCalledWith(true);
      expect(document.body.style.overflow).toBe("hidden");
      
      act(() => result.current.unlockScroll());
      
      // Should call context unlockScroll which resumes ScrollSmoother
      expect(mockScrollSmoother.paused).toHaveBeenCalledWith(false);
      expect(document.body.style.overflow).toBe("");
    });

    it("should auto-lock with context", () => {
      renderHook(
        () => useScrollSmootherLock({ autoLock: true }),
        { wrapper }
      );
      
      expect(mockScrollSmoother.paused).toHaveBeenCalledWith(true);
      expect(document.body.style.overflow).toBe("hidden");
    });
  });

  describe("useScrollLock (simple version)", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ScrollProvider
        smootherRef={mockContextValue.smootherRef!}
        scrollTo={mockContextValue.scrollTo}
      >
        {children}
      </ScrollProvider>
    );

    it("should work within ScrollProvider", () => {
      const { result } = renderHook(
        () => useScrollLock(false),
        { wrapper }
      );
      
      act(() => result.current.lockScroll());
      expect(mockScrollSmoother.paused).toHaveBeenCalledWith(true);
      
      act(() => result.current.unlockScroll());
      expect(mockScrollSmoother.paused).toHaveBeenCalledWith(false);
    });

    it("should auto-lock when true", () => {
      renderHook(
        () => useScrollLock(true),
        { wrapper }
      );
      
      expect(mockScrollSmoother.paused).toHaveBeenCalledWith(true);
    });

    it("should throw error when used outside ScrollProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useScrollLock(false));
      }).toThrow("useScrollContext must be used within a ScrollProvider");
      
      consoleSpy.mockRestore();
    });
  });

  describe("touch event prevention", () => {
    it("should prevent touch move events on iOS when enabled", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        writable: true,
      });
      
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
      
      const { result } = renderHook(() => 
        useScrollSmootherLock({ 
          autoLock: false,
          preventTouchMove: true 
        })
      );
      
      act(() => result.current.lockScroll());
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "touchmove",
        expect.any(Function),
        { passive: false }
      );
      
      act(() => result.current.unlockScroll());
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "touchmove",
        expect.any(Function)
      );
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it("should not add touch listeners on non-iOS devices", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        writable: true,
      });
      
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      
      const { result } = renderHook(() => 
        useScrollSmootherLock({ 
          autoLock: false,
          preventTouchMove: true 
        })
      );
      
      act(() => result.current.lockScroll());
      
      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        "touchmove",
        expect.any(Function),
        expect.any(Object)
      );
      
      addEventListenerSpy.mockRestore();
    });
  });
});