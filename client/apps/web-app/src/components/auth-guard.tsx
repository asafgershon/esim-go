"use client";

import { EnhancedLoginForm } from "@/components/enhanced-login-form";
import { ErrorDisplay } from "@/components/error-display";
import { useAuth } from "@/hooks/useAuth";
import { ErrorType } from "@/lib/error-types";
import { Card } from "@workspace/ui";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ onLogin: () => void }>;
  redirectTo?: string;
  showLoginForm?: boolean;
  requireAuth?: boolean;
}

// Default fallback component
function DefaultAuthFallback({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30" dir="rtl">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-primary/10 p-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4">
          נדרשת התחברות
        </h1>
        
        <p className="text-muted-foreground mb-8">
          אנא התחבר כדי לגשת לתוכן זה
        </p>
        
        <EnhancedLoginForm onSuccess={onLogin} />
      </Card>
    </div>
  );
}

// Loading skeleton for auth check
function AuthLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        
        {/* Content skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function AuthGuard({
  children,
  fallback: FallbackComponent = DefaultAuthFallback,
  redirectTo,
  showLoginForm = true,
  requireAuth = true,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, error } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle successful login
  const handleLoginSuccess = () => {
    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.refresh(); // Refresh current page
    }
  };

  // Show loading skeleton during auth check
  if (!mounted || isLoading) {
    return <AuthLoadingSkeleton />;
  }

  // Show error if auth check failed
  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <ErrorDisplay
            error={{
              type: ErrorType.AUTH_INVALID,
              message: error,
              retryable: true,
              actionRequired: 'login',
            }}
            onLogin={handleLoginSuccess}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  // If auth is not required, always show children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If user is authenticated, show protected content
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // User is not authenticated, show login
  if (showLoginForm) {
    return <FallbackComponent onLogin={handleLoginSuccess} />;
  }

  // Redirect to login page (fallback)
  if (typeof window !== 'undefined') {
    const loginUrl = redirectTo || '/login';
    router.push(loginUrl);
  }

  return <AuthLoadingSkeleton />;
}

// Higher-order component for page-level protection
export function withAuthGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    fallback?: React.ComponentType<{ onLogin: () => void }>;
    redirectTo?: string;
    showLoginForm?: boolean;
  }
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const WithAuthGuardComponent = (props: P) => {
    return (
      <AuthGuard {...options}>
        <WrappedComponent {...props} />
      </AuthGuard>
    );
  };
  
  WithAuthGuardComponent.displayName = `withAuthGuard(${displayName})`;
  
  return WithAuthGuardComponent;
}

// Conditional auth wrapper - only shows auth if needed
export function ConditionalAuth({
  children,
  when,
  fallback,
}: {
  children: React.ReactNode;
  when: boolean;
  fallback?: React.ComponentType<{ onLogin: () => void }>;
}) {
  // If condition is not met, show children without auth check
  if (!when) {
    return <>{children}</>;
  }

  // If condition is met, apply auth guard
  return (
    <AuthGuard fallback={fallback} requireAuth={true}>
      {children}
    </AuthGuard>
  );
}

// Hook for programmatic auth checks
export function useAuthGuard() {
  const { isAuthenticated, isLoading, error } = useAuth();
  const router = useRouter();

  const requireAuth = (redirectTo?: string) => {
    if (isLoading) return false;
    
    if (!isAuthenticated) {
      const loginUrl = redirectTo || '/login';
      router.push(loginUrl);
      return false;
    }
    
    return true;
  };

  const checkAuth = () => ({
    isAuthenticated,
    isLoading,
    error,
    canAccess: isAuthenticated && !error,
  });

  return {
    requireAuth,
    checkAuth,
    isAuthenticated,
    isLoading,
    error,
  };
}