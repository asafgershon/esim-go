'use client';
import { useState, useEffect, useRef } from 'react';

export interface ESIMDetectionResult {
  isSupported: boolean;
  confidence: number;
  methods: DetectionMethod[];
  loading: boolean;
  error: Error | null;
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
}

interface ESIMDatabase {
  apple: {
    iphone: string[];
    ipad: string[];
  };
  samsung: {
    models: string[];
  };
  google: {
    models: string[];
  };
}

// eSIM capable device database
const esimDatabase: ESIMDatabase = {
  apple: {
    // iPhone models with eSIM (XS/XR 2018+)
    iphone: ['iPhone14,6', 'iPhone14,2', 'iPhone14,3', 'iPhone14,7',
             'iPhone15,2', 'iPhone16,1', 'iPhone17,1'],
    ipad: ['iPad13,1', 'iPad14,3', 'iPad15,3']
  },
  samsung: {
    // Galaxy S20+ series, Note 20+, Z Fold/Flip series
    models: ['SM-S931', 'SM-S928', 'SM-S926', 'SM-S921', 'SM-G998',
             'SM-F956', 'SM-A546']
  },
  google: {
    // Pixel 2 and newer
    models: ['Pixel 2', 'Pixel 3', 'Pixel 4', 'Pixel 5', 'Pixel 6',
            'Pixel 7', 'Pixel 8', 'Pixel 9']
  }
};


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

  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  
  if (isIOS) {
    const iosVersion = userAgent.match(/OS (\d+)_(\d+)/);
    const supportsWebESIM = iosVersion && 
      parseFloat(`${iosVersion[1]}.${iosVersion[2]}`) >= 17.5;
    
    return {
      name: 'platformBehavior',
      result: !!supportsWebESIM,
      confidence: supportsWebESIM ? 0.8 : 0.2
    };
  }

  return {
    name: 'platformBehavior',
    result: false,
    confidence: 0.1
  };
};

const calculateConfidence = (methods: DetectionMethod[]): number => {
  const weights: Record<string, number> = {
    screenPattern: 0.3,
    canvasFingerprint: 0.25,
    webglFingerprint: 0.25,
    performanceProfile: 0.1,
    platformBehavior: 0.1
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
  const [result, setResult] = useState<ESIMDetectionResult>({
    isSupported: false,
    confidence: 0,
    methods: [],
    loading: true,
    error: null
  });

  // Use ref to store abort controller
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Create new abort controller for this effect
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const runDetection = async () => {
      try {
        setResult(prev => ({ ...prev, loading: true, error: null }));

        const methods: DetectionMethod[] = [];

        // Run detection methods
        const screenResult = detectByScreenPattern();
        methods.push(screenResult);

        if (config.enableCanvasFingerprint && !abortController.signal.aborted) {
          const canvasResult = generateCanvasFingerprint();
          if (canvasResult) methods.push(canvasResult);
        }

        if (config.enableWebGLDetection && !abortController.signal.aborted) {
          const webglResult = getWebGLFingerprint();
          if (webglResult) methods.push(webglResult);
        }

        if (config.enablePerformanceTest && !abortController.signal.aborted) {
          const perfResult = await detectPerformanceCharacteristics();
          methods.push(perfResult);
        }

        const platformResult = detectPlatformBehavior();
        methods.push(platformResult);

        // Check if aborted before setting results
        if (abortController.signal.aborted) {
          return;
        }

        // Calculate weighted confidence score
        const totalConfidence = calculateConfidence(methods);
        const isSupported = totalConfidence >= 
          (config.confidenceThreshold || 0.6);

        setResult({
          isSupported,
          confidence: totalConfidence,
          methods,
          loading: false,
          error: null
        });
      } catch (error) {
        if (!abortController.signal.aborted) {
          setResult(prev => ({
            ...prev,
            loading: false,
            error: error as Error
          }));
        }
      }
    };

    runDetection();

    // Cleanup function
    return () => {
      abortController.abort();
      abortControllerRef.current = null;
    };
  }, [
    config.enablePerformanceTest,
    config.enableCanvasFingerprint,
    config.enableWebGLDetection,
    config.confidenceThreshold
  ]);

  return result;
}

// Export utility functions for testing
export const detectionUtils = {
  detectByScreenPattern,
  generateCanvasFingerprint,
  getWebGLFingerprint,
  detectPerformanceCharacteristics,
  detectPlatformBehavior,
  calculateConfidence
};