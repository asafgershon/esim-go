import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useESIMDetection, detectionUtils } from './use-esim-detection';
import '@testing-library/jest-dom';

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
    // Setup mocks
    Object.defineProperty(window, 'screen', {
      value: mockScreen,
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(window, 'devicePixelRatio', {
      value: mockWindow.devicePixelRatio,
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(navigator, 'userAgent', {
      value: mockNavigator.userAgent,
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(performance, 'now', {
      value: mockPerformance.now,
      writable: true,
      configurable: true
    });

    // Mock canvas context
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
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
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

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const webglMethod = result.current.methods.find(m => m.name === 'webglFingerprint');
    expect(webglMethod).toBeDefined();
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

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const perfMethod = result.current.methods.find(m => m.name === 'performanceProfile');
    expect(perfMethod).toBeDefined();
    expect(perfMethod?.result).toBe(true);
  });

  it('should return low confidence for non-eSIM devices', async () => {
    // Mock non-eSIM device
    Object.defineProperty(window, 'screen', {
      value: { width: 360, height: 640 },
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(navigator, 'userAgent', {
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
    HTMLCanvasElement.prototype.getContext = vi.fn(() => {
      throw new Error('WebGL not supported');
    });

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
    Object.defineProperty(window, 'screen', {
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
    Object.defineProperty(window, 'screen', {
      value: { width: 393, height: 851 },
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 2.75,
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36',
      writable: true,
      configurable: true
    });

    HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
      if (type === 'webgl') {
        return {
          getExtension: vi.fn(() => ({ UNMASKED_RENDERER_WEBGL: 37446 })),
          getParameter: vi.fn(() => 'Adreno (TM) 670')
        } as any;
      }
      return null;
    }) as any;

    const { result } = renderHook(() => useESIMDetection({
      enableWebGLDetection: true
    }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isSupported).toBe(true);
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

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

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