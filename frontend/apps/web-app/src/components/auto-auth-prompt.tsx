"use client";

import { useEffect, useState, useCallback } from 'react';
import { useDeviceInfo } from '@/lib/device-detection';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import { useAuth } from '@/hooks/useAuth';

interface AutoAuthPromptProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function AutoAuthPrompt({ 
  onSuccess, 
  onError, 
  disabled = false 
}: AutoAuthPromptProps) {
  const [hasTriggered, setHasTriggered] = useState(false);
  const deviceInfo = useDeviceInfo();
  const { signInWithGoogle } = useGoogleSignIn();
  const { isAuthenticated, isLoading: authLoading } = useAuth();


  const handleGoogleOneTap = useCallback(async () => {
    try {
      const result = await signInWithGoogle(true); // true for auto prompt
      if (result.success) {
        onSuccess?.();
      } else {
        throw new Error(result.error || "Google Sign-In failed");
      }
    } catch (error) {
      throw error;
    }
  }, [signInWithGoogle, onSuccess]);

  const triggerAutoAuth = useCallback(async () => {
    if (hasTriggered) return;

    setHasTriggered(true);

    try {
      if (deviceInfo.shouldShowGoogleOneTap) {
        await handleGoogleOneTap();
      }
    } catch (error) {
      // Silently handle errors for auto prompts
      console.log("Auto auth prompt error:", error);
      if (onError) {
        onError(
          error instanceof Error ? error.message : "Authentication failed"
        );
      }
    }
  }, [
    hasTriggered,
    deviceInfo.shouldShowGoogleOneTap,
    handleGoogleOneTap,
    onError,
  ]);

  useEffect(() => {
    // console.log("useEffect", {
    //   isAuthenticated,
    //   authLoading,
    //   disabled,
    //   hasTriggered,
    //   deviceInfo,
    //   triggerAutoAuth,
    // });
    // Don't show if user is already authenticated or auth is loading
    if (isAuthenticated || authLoading || disabled || hasTriggered) {
      return;
    }

    // Small delay to ensure scripts are loaded
    const timer = setTimeout(() => {
      // triggerAutoAuth();
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    isAuthenticated,
    authLoading,
    disabled,
    hasTriggered,
    deviceInfo,
    triggerAutoAuth,
  ]);

  // Early return if user is already authenticated
  if (isAuthenticated && !authLoading) {
    return null;
  }

  // This component doesn't render anything visible - it just triggers auto auth
  return null;
}

// Hook version for programmatic use
export function useAutoAuth() {
  const deviceInfo = useDeviceInfo();
  const { signInWithGoogle } = useGoogleSignIn();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  console.log("deviceInfo", deviceInfo, "isAuthenticated", isAuthenticated, "authLoading", authLoading);
  const triggerAutoAuth = async (): Promise<boolean> => {
    if (isAuthenticated) return false;

    try {
      if (deviceInfo.shouldShowGoogleOneTap) {
        const result = await signInWithGoogle(true);
        return result.success;
      }
    } catch (error) {
      console.log("Auto auth error:", error);
    }

    return false;
  };

  return {
    triggerAutoAuth,
    canTriggerAutoAuth: !isAuthenticated && !authLoading && deviceInfo.shouldShowGoogleOneTap,
    deviceInfo,
  };
}
