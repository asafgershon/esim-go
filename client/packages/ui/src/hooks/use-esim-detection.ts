'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import isMobile from 'is-mobile';

export interface ESIMDetectionResult {
  isSupported: boolean;
  confidence: number;
  methods: DetectionMethod[];
  loading: boolean;
  error: Error | null;
  start: () => void;
}

export interface DetectionMethod {
  name: string;
  result: boolean;
  confidence: number;
}

export interface DetectionConfig {
  enablePerformanceTest?: boolean;
  enableCanvasFingerprint?: boolean;
  enableWebGLDetection?: boolean;
  confidenceThreshold?: number;
  cacheDuration?: number;
  autoStart?: boolean;
  delay?: number;
}

// Reserved for future use: database of known eSIM devices
// interface ESIMDatabase {
//   apple: {
//     iphone: string[];
//     ipad: string[];
//   };
//   samsung: {
//     models: string[];
//   };
//   google: {
//     models: string[];
//   };
// }

// eSIM capable device database (reserved for future use)
// const esimDatabase: ESIMDatabase = {
//   apple: {
//     // iPhone models with eSIM (XS/XR 2018+)
//     iphone: ['iPhone14,6', 'iPhone14,2', 'iPhone14,3', 'iPhone14,7',
//              'iPhone15,2', 'iPhone16,1', 'iPhone17,1'],
//     ipad: ['iPad13,1', 'iPad14,3', 'iPad15,3']
//   },
//   samsung: {
//     // Galaxy S20+ series, Note 20+, Z Fold/Flip series
//     models: ['SM-S931', 'SM-S928', 'SM-S926', 'SM-S921', 'SM-G998',
//              'SM-F956', 'SM-A546']
//   },
//   google: {
//     // Pixel 2 and newer
//     models: ['Pixel 2', 'Pixel 3', 'Pixel 4', 'Pixel 5', 'Pixel 6',
//             'Pixel 7', 'Pixel 8', 'Pixel 9']
//   }
// };

// Screen resolution patterns for known eSIM devices
const ESIM_DEVICE_PATTERNS = {
  iPhone: [
    { width: 390, height: 844, pixelRatio: 3, models: ['iPhone 14', 'iPhone 13'] },
    { width: 428, height: 926, pixelRatio: 3, models: ['iPhone 14 Plus'] },
    { width: 393, height: 852, pixelRatio: 3, models: ['iPhone 14 Pro'] }
  ],
  Android: [
    { width: 393, height: 851, pixelRatio: 2.75, models: ['Pixel 6', 'Pixel 7'] },
    { width: 412, height: 915, pixelRatio: 3.5, models: ['Galaxy S22'] }
  ]
};

// GPU patterns for high-end devices more likely to have eSIM
const ESIM_GPU_PATTERNS = [
  /Apple GPU/i,
  /Adreno \(TM\) 6[7-9]\d/i, // High-end Qualcomm
  /Mali-G\d+/i // Samsung Exynos
];

// Polyfill for requestIdleCallback
const requestIdleCallbackPolyfill = (callback: IdleRequestCallback, options?: IdleRequestOptions) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  // Fallback to setTimeout
  const start = Date.now();
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
    } as IdleDeadline);
  }, 1) as unknown as number;
};

const cancelIdleCallbackPolyfill = (handle: number) => {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    return window.cancelIdleCallback(handle);
  }
  return clearTimeout(handle);
};

// New detection method using is-mobile library
const detectMobileDeviceType = (): DetectionMethod => {
  if (typeof navigator === 'undefined') {
    return { name: 'mobileDeviceType', result: false, confidence: 0 };
  }

  const isMobileDevice = isMobile();
  const isTablet = isMobile({ tablet: true });
  
  // Higher confidence for tablets as they're more likely to have eSIM
  if (isTablet) {
    return {
      name: 'mobileDeviceType',
      result: true,
      confidence: 0.6
    };
  }
  
  if (isMobileDevice) {
    return {
      name: 'mobileDeviceType',
      result: true,
      confidence: 0.4
    };
  }

  return {
    name: 'mobileDeviceType',
    result: false,
    confidence: 0.1
  };
};

// Detection functions
const detectByScreenPattern = (): DetectionMethod => {
  if (typeof window === 'undefined') {
    return { name: 'screenPattern', result: false, confidence: 0 };
  }

  const { width, height } = screen;
  const pixelRatio = window.devicePixelRatio;

  const matches = Object.values(ESIM_DEVICE_PATTERNS)
    .flat()
    .filter(pattern => 
      Math.abs(pattern.width - width) <= 10 &&
      Math.abs(pattern.height - height) <= 10 &&
      Math.abs(pattern.pixelRatio - pixelRatio) <= 0.1
    );

  return {
    name: 'screenPattern',
    result: matches.length > 0,
    confidence: matches.length > 0 ? 0.7 : 0.1
  };
};

const generateCanvasFingerprint = (): DetectionMethod | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    
    if (!gl) return null;

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? 
      gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';

    // Check for known eSIM device GPU patterns
    const isESIMCapable = ESIM_GPU_PATTERNS.some(pattern =>
      pattern.test(renderer)
    );

    return {
      name: 'canvasFingerprint',
      result: isESIMCapable,
      confidence: isESIMCapable ? 0.75 : 0.25
    };
  } catch {
    return null;
  }
};

const getWebGLFingerprint = (): DetectionMethod | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    
    if (!gl) return { 
      name: 'webglFingerprint',
      result: false,
      confidence: 0
    };

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? 
      gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';

    const isESIMCapable = ESIM_GPU_PATTERNS.some(pattern =>
      pattern.test(renderer)
    );

    return {
      name: 'webglFingerprint',
      result: isESIMCapable,
      confidence: isESIMCapable ? 0.75 : 0.25
    };
  } catch {
    return null;
  }
};

const detectPerformanceCharacteristics = async (): Promise<DetectionMethod> => {
  if (typeof performance === 'undefined') {
    return { name: 'performanceProfile', result: false, confidence: 0 };
  }

  const startTime = performance.now();
  
  // CPU-intensive task
  let result = 0;
  for (let i = 0; i < 100000; i++) {
    result += Math.random() * Math.sin(i) * Math.cos(i);
  }

  const jsExecutionTime = performance.now() - startTime;
  
  // High-performance devices more likely to have eSIM
  const isHighPerformance = jsExecutionTime < 5;

  return {
    name: 'performanceProfile',
    result: isHighPerformance,
    confidence: isHighPerformance ? 0.6 : 0.3
  };
};

const detectPlatformBehavior = (): DetectionMethod => {
  if (typeof navigator === 'undefined') {
    return { name: 'platformBehavior', result: false, confidence: 0 };
  }

  // Use is-mobile for basic mobile detection
  const isMobileDevice = isMobile();
  
  if (!isMobileDevice) {
    return {
      name: 'platformBehavior',
      result: false,
      confidence: 0.1
    };
  }

  // Mobile device detected, now check for eSIM capabilities
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  
  if (isIOS) {
    // Check iOS version for web eSIM activation support
    const iosVersion = userAgent.match(/OS (\d+)_(\d+)/);
    const supportsWebESIM = iosVersion && 
      parseFloat(`${iosVersion[1]}.${iosVersion[2]}`) >= 17.5;
    
    return {
      name: 'platformBehavior',
      result: !!supportsWebESIM,
      confidence: supportsWebESIM ? 0.9 : 0.3 // Higher confidence with is-mobile
    };
  }

  // Check for known Android eSIM-capable devices
  const androidESIMPatterns = [
    /Pixel [2-9]/i,
    /Pixel \d{2}/i, // Pixel 10+
    /SM-[SG]9[0-9]{2}/i, // Samsung Galaxy S9xx series
    /SM-[SG]2[0-9]{2}/i, // Samsung Galaxy S20+ series
    /SM-F9[0-9]{2}/i, // Samsung Galaxy Fold series
    /SM-F7[0-9]{2}/i, // Samsung Galaxy Flip series
  ];

  const hasAndroidESIM = androidESIMPatterns.some(pattern => pattern.test(userAgent));

  return {
    name: 'platformBehavior',
    result: hasAndroidESIM,
    confidence: hasAndroidESIM ? 0.7 : 0.2
  };
};

const calculateConfidence = (methods: DetectionMethod[]): number => {
  const weights: Record<string, number> = {
    screenPattern: 0.25,
    canvasFingerprint: 0.2,
    webglFingerprint: 0.2,
    performanceProfile: 0.1,
    platformBehavior: 0.15, // Increased weight due to is-mobile integration
    mobileDeviceType: 0.1
  };

  // Weighted average calculation
  let weightedSum = 0;
  let totalWeight = 0;

  methods.forEach(method => {
    const weight = weights[method.name] || 0.1;
    weightedSum += method.confidence * weight * 
      (method.result ? 1 : 0.3);
    totalWeight += weight;
  });

  return Math.min(weightedSum / totalWeight, 1.0);
};

export function useESIMDetection(
  config: DetectionConfig = {}
): ESIMDetectionResult {
  const {
    enablePerformanceTest = false,
    enableCanvasFingerprint = false,
    enableWebGLDetection = false,
    confidenceThreshold = 0.6,
    autoStart = true,
    delay = 0
  } = config;

  const [result, setResult] = useState<Omit<ESIMDetectionResult, 'start'>>({
    isSupported: false,
    confidence: 0,
    methods: [],
    loading: autoStart,
    error: null
  });

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleCallbackRef = useRef<number | null>(null);
  const hasStartedRef = useRef(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (idleCallbackRef.current) {
      cancelIdleCallbackPolyfill(idleCallbackRef.current);
      idleCallbackRef.current = null;
    }
  }, []);

  const runDetection = useCallback(async () => {
    // Prevent multiple simultaneous detections
    if (hasStartedRef.current && result.loading) {
      return;
    }

    hasStartedRef.current = true;
    cleanup();

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setResult(prev => ({ ...prev, loading: true, error: null }));

      // Phase 1: Immediate lightweight detection
      const lightweightMethods: DetectionMethod[] = [];
      
      // These are very fast (<1ms total)
      const screenResult = detectByScreenPattern();
      const platformResult = detectPlatformBehavior();
      const mobileTypeResult = detectMobileDeviceType();
      
      lightweightMethods.push(screenResult, platformResult, mobileTypeResult);

      // Set initial results immediately
      const initialConfidence = calculateConfidence(lightweightMethods);
      const initialSupported = initialConfidence >= confidenceThreshold;

      if (!abortController.signal.aborted) {
        setResult({
          isSupported: initialSupported,
          confidence: initialConfidence,
          methods: lightweightMethods,
          loading: false,
          error: null
        });
      }

      // Phase 2: Heavy operations (deferred)
      const heavyOperations = enableCanvasFingerprint || enableWebGLDetection;
      
      if (heavyOperations && !abortController.signal.aborted) {
        idleCallbackRef.current = requestIdleCallbackPolyfill(() => {
          if (abortController.signal.aborted) return;

          const allMethods = [...lightweightMethods];

          // Canvas and WebGL operations
          if (enableCanvasFingerprint) {
            const canvasResult = generateCanvasFingerprint();
            if (canvasResult) allMethods.push(canvasResult);
          }

          if (enableWebGLDetection) {
            const webglResult = getWebGLFingerprint();
            if (webglResult) allMethods.push(webglResult);
          }

          const updatedConfidence = calculateConfidence(allMethods);
          const updatedSupported = updatedConfidence >= confidenceThreshold;

          if (!abortController.signal.aborted) {
            setResult({
              isSupported: updatedSupported,
              confidence: updatedConfidence,
              methods: allMethods,
              loading: false,
              error: null
            });
          }
        }, { timeout: 1000 }); // Give up after 1 second
      }

      // Phase 3: Performance test (optional, async)
      if (enablePerformanceTest && !abortController.signal.aborted) {
        // Run performance test after a small delay to not block initial results
        setTimeout(async () => {
          if (abortController.signal.aborted) return;

          const perfResult = await detectPerformanceCharacteristics();
          
          if (!abortController.signal.aborted) {
            setResult(prev => {
              const allMethods = [...prev.methods, perfResult];
              const finalConfidence = calculateConfidence(allMethods);
              const finalSupported = finalConfidence >= confidenceThreshold;

              return {
                isSupported: finalSupported,
                confidence: finalConfidence,
                methods: allMethods,
                loading: false,
                error: null
              };
            });
          }
        }, 100);
      }

    } catch (error) {
      if (!abortController.signal.aborted) {
        setResult(prev => ({
          ...prev,
          loading: false,
          error: error as Error
        }));
      }
    }
  }, [
    enablePerformanceTest,
    enableCanvasFingerprint,
    enableWebGLDetection,
    confidenceThreshold,
    result.loading
  ]);

  // Manual start function
  const start = useCallback(() => {
    hasStartedRef.current = false;
    runDetection();
  }, [runDetection]);

  // Auto-start effect
  useEffect(() => {
    if (autoStart && !hasStartedRef.current) {
      if (delay > 0) {
        timeoutRef.current = setTimeout(() => {
          runDetection();
        }, delay);
      } else {
        runDetection();
      }
    }

    return cleanup;
  }, [autoStart, delay, runDetection, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    ...result,
    start
  };
}

// Export utility functions for testing
export const detectionUtils = {
  detectByScreenPattern,
  generateCanvasFingerprint,
  getWebGLFingerprint,
  detectPerformanceCharacteristics,
  detectPlatformBehavior,
  detectMobileDeviceType,
  calculateConfidence
};