/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useESIMDetection, detectionUtils } from './use-esim-detection';
import '@testing-library/jest-dom';

// Setup DOM environment for tests
beforeAll(async () => {
  if (typeof document === 'undefined') {
    const { GlobalRegistrator } = await import('@happy-dom/global-registrator');
    GlobalRegistrator.register();
  }
});

// Mock window properties
const mockScreen = {
  width: 390,
  height: 844
};

const mockWindow = {
  devicePixelRatio: 3
};

// Mock navigator
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15'
};

// Mock performance
const mockPerformance = {
  now: vi.fn()
};

describe('useESIMDetection', () => {
  beforeEach(() => {
    // Use fake timers
    vi.useFakeTimers();
    
    // Mock requestIdleCallback to execute immediately
    global.requestIdleCallback = vi.fn((callback) => {
      // Execute callback immediately in next tick
      const handle = setTimeout(() => {
        callback({
          didTimeout: false,
          timeRemaining: () => 50
        } as IdleDeadline);
      }, 0);
      return handle as any;
    });
    
    global.cancelIdleCallback = vi.fn((handle) => {
      clearTimeout(handle);
    });

    // Setup mocks
    Object.defineProperty(global, 'screen', {
      value: mockScreen,
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(global, 'devicePixelRatio', {
      value: mockWindow.devicePixelRatio,
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(global.navigator, 'userAgent', {
      value: mockNavigator.userAgent,
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(global.performance, 'now', {
      value: mockPerformance.now,
      writable: true,
      configurable: true
    });

    // Mock canvas context if HTMLCanvasElement exists
    if (typeof HTMLCanvasElement !== 'undefined') {
      HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
      if (type === 'webgl') {
        return {
          getExtension: vi.fn((name) => {
            if (name === 'WEBGL_debug_renderer_info') {
              return { UNMASKED_RENDERER_WEBGL: 37446 };
            }
            return null;
          }),
          getParameter: vi.fn((param) => {
            if (param === 37446) {
              return 'Apple GPU';
            }
            return null;
          })
        } as any;
      }
      return null;
    }) as any;
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should complete detection and stop loading', async () => {
    const { result } = renderHook(() => useESIMDetection());

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // After loading, should have results
    expect(result.current.methods.length).toBeGreaterThan(0);
    expect(typeof result.current.confidence).toBe('number');
    expect(typeof result.current.isSupported).toBe('boolean');
    expect(typeof result.current.start).toBe('function');
  });

  it('should detect eSIM support on iPhone with correct screen pattern', async () => {
    const { result } = renderHook(() => useESIMDetection());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isSupported).toBe(true);
    expect(result.current.confidence).toBeGreaterThan(0.6);
    expect(result.current.methods.some(m => m.name === 'screenPattern')).toBe(true);
    expect(result.current.methods.some(m => m.name === 'platformBehavior')).toBe(true);
  });

  it('should detect eSIM support with WebGL fingerprinting', async () => {
    const { result } = renderHook(() => useESIMDetection({
      enableWebGLDetection: true
    }));

    // Advance timers to trigger requestIdleCallback
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Advance timers for deferred operations
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Wait for heavy operations to complete via requestIdleCallback
    await waitFor(() => {
      const webglMethod = result.current.methods.find(m => m.name === 'webglFingerprint');
      expect(webglMethod).toBeDefined();
    });

    const webglMethod = result.current.methods.find(m => m.name === 'webglFingerprint');
    expect(webglMethod?.result).toBe(true);
    expect(webglMethod?.confidence).toBeGreaterThan(0.5);
  });

  it('should handle performance test for high-end devices', async () => {
    // Mock performance.now to return values that indicate high performance
    let callCount = 0;
    mockPerformance.now.mockImplementation(() => {
      if (callCount === 0) {
        callCount++;
        return 0;
      }
      return 3; // 3ms execution time indicates high performance
    });

    const { result } = renderHook(() => useESIMDetection({
      enablePerformanceTest: true
    }));

    // Advance timers to trigger initial detection
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Advance timers for performance test (runs after 100ms)
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    // Performance test should now be complete
    await waitFor(() => {
      const perfMethod = result.current.methods.find(m => m.name === 'performanceProfile');
      expect(perfMethod).toBeDefined();
    });

    const perfMethod = result.current.methods.find(m => m.name === 'performanceProfile');
    expect(perfMethod?.result).toBe(true);
  });

  it('should return low confidence for non-eSIM devices', async () => {
    // Mock non-eSIM device
    Object.defineProperty(global, 'screen', {
      value: { width: 360, height: 640 },
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
      writable: true,
      configurable: true
    });

    const { result } = renderHook(() => useESIMDetection());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isSupported).toBe(false);
    expect(result.current.confidence).toBeLessThan(0.6);
  });

  it('should handle canvas context errors gracefully', async () => {
    if (typeof HTMLCanvasElement !== 'undefined') {
      HTMLCanvasElement.prototype.getContext = vi.fn(() => {
        throw new Error('WebGL not supported');
      });
    }

    const { result } = renderHook(() => useESIMDetection({
      enableCanvasFingerprint: true
    }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(null);
    const canvasMethod = result.current.methods.find(m => m.name === 'canvasFingerprint');
    expect(canvasMethod).toBeUndefined();
  });

  it('should respect confidence threshold configuration', async () => {
    Object.defineProperty(global, 'screen', {
      value: { width: 375, height: 667 }, // Older iPhone
      writable: true,
      configurable: true
    });

    const { result } = renderHook(() => useESIMDetection({
      confidenceThreshold: 0.8
    }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isSupported).toBe(false);
    expect(result.current.confidence).toBeLessThan(0.8);
  });

  it('should detect Android devices with eSIM support', async () => {
    Object.defineProperty(global, 'screen', {
      value: { width: 393, height: 851 },
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(global, 'devicePixelRatio', {
      value: 2.75,
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36',
      writable: true,
      configurable: true
    });

    if (typeof HTMLCanvasElement !== 'undefined') {
      HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
        if (type === 'webgl') {
          return {
            getExtension: vi.fn(() => ({ UNMASKED_RENDERER_WEBGL: 37446 })),
            getParameter: vi.fn(() => 'Adreno (TM) 670')
          } as any;
        }
        return null;
      }) as any;
    }

    const { result } = renderHook(() => useESIMDetection({
      enableWebGLDetection: true
    }));

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Wait for WebGL detection to complete
    await waitFor(() => {
      const webglMethod = result.current.methods.find(m => m.name === 'webglFingerprint');
      expect(webglMethod).toBeDefined();
    }, { timeout: 2000 });

    const screenMethod = result.current.methods.find(m => m.name === 'screenPattern');
    expect(screenMethod?.result).toBe(true);
  });

  it('should run all detection methods when all options are enabled', async () => {
    mockPerformance.now.mockReturnValueOnce(0).mockReturnValueOnce(4);

    const { result } = renderHook(() => useESIMDetection({
      enablePerformanceTest: true,
      enableCanvasFingerprint: true,
      enableWebGLDetection: true
    }));

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Wait for deferred operations (canvas and webgl) to complete
    await waitFor(() => {
      const methodNames = result.current.methods.map(m => m.name);
      expect(methodNames).toContain('canvasFingerprint');
      expect(methodNames).toContain('webglFingerprint');
    }, { timeout: 2000 });

    // Wait for performance test to complete
    await waitFor(() => {
      const methodNames = result.current.methods.map(m => m.name);
      expect(methodNames).toContain('performanceProfile');
    }, { timeout: 2000 });

    const methodNames = result.current.methods.map(m => m.name);
    expect(methodNames).toContain('screenPattern');
    expect(methodNames).toContain('canvasFingerprint');
    expect(methodNames).toContain('webglFingerprint');
    expect(methodNames).toContain('performanceProfile');
    expect(methodNames).toContain('platformBehavior');
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useESIMDetection());
    expect(() => unmount()).not.toThrow();
  });

  it('should not start automatically when autoStart is false', async () => {
    const { result } = renderHook(() => useESIMDetection({ autoStart: false }));

    // Should not be loading
    expect(result.current.loading).toBe(false);
    expect(result.current.methods).toEqual([]);

    // Start manually with act wrapper
    act(() => {
      result.current.start();
    });

    // Now should have results
    await waitFor(() => {
      expect(result.current.methods.length).toBeGreaterThan(0);
    });
  });

  it('should delay start when delay is specified', async () => {
    const startTime = Date.now();
    const delay = 100;
    
    const { result } = renderHook(() => useESIMDetection({ delay }));

    // Should be loading initially
    expect(result.current.loading).toBe(true);

    // Wait for detection to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeGreaterThanOrEqual(delay);
  });

  it('should use progressive enhancement for heavy operations', async () => {
    const { result } = renderHook(() => useESIMDetection({
      enableWebGLDetection: true,
      enableCanvasFingerprint: true
    }));

    // Should get initial results quickly
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 200 });

    // Initial results should only have lightweight methods
    expect(result.current.methods.some(m => m.name === 'screenPattern')).toBe(true);
    expect(result.current.methods.some(m => m.name === 'platformBehavior')).toBe(true);

    // Initially should not have heavy methods
    expect(result.current.methods.some(m => m.name === 'webglFingerprint')).toBe(false);
    expect(result.current.methods.some(m => m.name === 'canvasFingerprint')).toBe(false);

    // Wait for heavy operations to complete
    await waitFor(() => {
      expect(result.current.methods.some(m => m.name === 'webglFingerprint')).toBe(true);
      expect(result.current.methods.some(m => m.name === 'canvasFingerprint')).toBe(true);
    }, { timeout: 2000 });
  });

  it('should allow manual restart of detection', async () => {
    const { result } = renderHook(() => useESIMDetection());

    // Wait for initial detection
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialMethods = result.current.methods.length;

    // Manually restart with act wrapper
    act(() => {
      result.current.start();
    });

    // Should still have results (not reset immediately)
    expect(result.current.methods.length).toBe(initialMethods);
  });
});

describe('detectionUtils', () => {
  it('should calculate weighted confidence correctly', () => {
    const methods = [
      { name: 'screenPattern', result: true, confidence: 0.7 },
      { name: 'platformBehavior', result: false, confidence: 0.2 }
    ];
    
    const confidence = detectionUtils.calculateConfidence(methods);
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  it('should handle missing WebGL support', () => {
    const result = detectionUtils.getWebGLFingerprint();
    
    if (result) {
      expect(result.name).toBe('webglFingerprint');
      expect(typeof result.result).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
    }
  });

  it('should detect screen patterns correctly', () => {
    const result = detectionUtils.detectByScreenPattern();
    
    expect(result.name).toBe('screenPattern');
    expect(typeof result.result).toBe('boolean');
    expect(typeof result.confidence).toBe('number');
  });

  it('should detect platform behavior', () => {
    const result = detectionUtils.detectPlatformBehavior();
    
    expect(result.name).toBe('platformBehavior');
    expect(typeof result.result).toBe('boolean');
    expect(typeof result.confidence).toBe('number');
  });
});