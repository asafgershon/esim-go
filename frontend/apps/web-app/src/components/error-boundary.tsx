"use client";

import React from "react";
import { Button, Card } from "@workspace/ui";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
  goHome: () => void;
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError, goHome }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4">
          אופס! משהו השתבש
        </h1>
        
        <p className="text-muted-foreground mb-6">
          התרחשה שגיאה במערכת. אנא נסה שוב או חזור לעמוד הבית.
        </p>
        
        {error && process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-mono text-red-800 dark:text-red-200 break-all">
              {error.message}
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <Button onClick={resetError} className="w-full" variant="outline">
            <RefreshCw className="h-4 w-4 ml-2" />
            נסה שוב
          </Button>
          
          <Button onClick={goHome} className="w-full">
            <Home className="h-4 w-4 ml-2" />
            חזור לעמוד הבית
          </Button>
        </div>
      </Card>
    </div>
  );
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console and potentially to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // In production, you could send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: reportError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  goHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          goHome={this.goHome}
        />
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler() {
  const router = useRouter();

  const handleError = React.useCallback((error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);
    
    // You could integrate with error reporting service here
    // Example: reportError(error, { context });
  }, []);

  const navigateHome = React.useCallback(() => {
    router.push('/');
  }, [router]);

  const retry = React.useCallback((retryFn: () => void) => {
    try {
      retryFn();
    } catch (error) {
      handleError(error as Error, 'retry');
    }
  }, [handleError]);

  return {
    handleError,
    navigateHome,
    retry,
  };
}

export default ErrorBoundary;