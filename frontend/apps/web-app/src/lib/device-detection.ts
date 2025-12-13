import React from 'react';

export interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isMacOS: boolean;
  shouldShowAppleSignIn: boolean;
  shouldShowGoogleOneTap: boolean;
}

export function getDeviceInfo(): DeviceInfo {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isSafari: false,
      isChrome: false,
      isMacOS: false,
      shouldShowAppleSignIn: false,
      shouldShowGoogleOneTap: false,
    };
  }

  const userAgent = navigator.userAgent;
  const platform = navigator.platform;

  // Detect iOS devices
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
    (platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Detect Android devices
  const isAndroid = /Android/.test(userAgent);

  // Detect Safari browser
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent) && !/Chromium/.test(userAgent);

  // Detect Chrome browser
  const isChrome = /Chrome/.test(userAgent) && !/Chromium/.test(userAgent) && !/Edg/.test(userAgent);

  // Detect macOS
  const isMacOS = platform === 'MacIntel' && navigator.maxTouchPoints === 0;

  // Determine when to show Apple Sign In native prompts
  // Show for iPhone users or Safari on macOS
  const shouldShowAppleSignIn = isIOS || (isMacOS && isSafari);

  // Determine when to show Google One Tap
  // Show for Android users or Chrome on any platform (but not when Apple Sign In should be shown)
  const shouldShowGoogleOneTap = (isAndroid || isChrome) && !shouldShowAppleSignIn;

  return {
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isMacOS,
    shouldShowAppleSignIn,
    shouldShowGoogleOneTap,
  };
}

export function isAppleSignInSupported(): boolean {
   const w = window as any;
  return typeof window !== 'undefined' && 
    'AppleID' in w && 
    !!w.AppleID && 
    !!w.AppleID.auth;
}

export function isGoogleSignInSupported(): boolean {
  return typeof window !== 'undefined' && 
    'google' in window && 
    !!window.google && 
    !!window.google.accounts && 
    !!window.google.accounts.id;
}

// Hook for React components
export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo>(() => getDeviceInfo());

  React.useEffect(() => {
    // Update device info when window is available (for SSR)
    setDeviceInfo(getDeviceInfo());
  }, []);

  return deviceInfo;
} 