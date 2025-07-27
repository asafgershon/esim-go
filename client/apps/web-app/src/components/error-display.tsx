"use client";

import React from "react";
import { Button, Card } from "@workspace/ui";
import { AlertTriangle, RefreshCw, Home, LogIn, ExternalLink, ArrowRight } from "lucide-react";
import { AppError, ErrorType, getErrorDisplay } from "@/lib/error-types";

interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
  onGoHome?: () => void;
  onLogin?: () => void;
  className?: string;
  compact?: boolean;
}

export function ErrorDisplay({
  error,
  onRetry,
  onGoHome,
  onLogin,
  className = "",
  compact = false,
}: ErrorDisplayProps) {
  const { title, message, actionText, retryable, actionRequired } = getErrorDisplay(error);

  const handlePrimaryAction = () => {
    switch (actionRequired) {
      case 'login':
        onLogin?.();
        break;
      case 'retry':
        onRetry?.();
        break;
      case 'go_home':
        onGoHome?.();
        break;
      case 'refresh':
        window.location.reload();
        break;
      case 'contact_support':
        // Could open a support chat or redirect to support page
        window.open('mailto:support@hiiilo.com', '_blank');
        break;
      default:
        onRetry?.();
    }
  };

  const getPrimaryActionIcon = () => {
    switch (actionRequired) {
      case 'login':
        return <LogIn className="h-4 w-4 ml-2" />;
      case 'go_home':
        return <Home className="h-4 w-4 ml-2" />;
      case 'contact_support':
        return <ExternalLink className="h-4 w-4 ml-2" />;
      default:
        return <RefreshCw className="h-4 w-4 ml-2" />;
    }
  };

  if (compact) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`} dir="rtl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
              {title}
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
              {message}
            </p>
          </div>
          {(retryable || actionRequired) && (
            <Button
              onClick={handlePrimaryAction}
              size="sm"
              variant="outline"
              className="flex-shrink-0 border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800"
            >
              {getPrimaryActionIcon()}
              {actionText || 'נסה שוב'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={`p-6 text-center ${className}`} dir="rtl">
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
      </div>
      
      <h2 className="text-xl font-semibold text-foreground mb-3">
        {title}
      </h2>
      
      <p className="text-muted-foreground mb-6 whitespace-pre-wrap">
        {message}
      </p>
      
      {/* Error code for debugging */}
      {error.code && process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-4 text-left">
          <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
            Error Code: {error.code}
          </p>
        </div>
      )}
      
      <div className="space-y-3">
        {/* Primary action button */}
        {(retryable || actionRequired) && (
          <Button onClick={handlePrimaryAction} className="w-full">
            {getPrimaryActionIcon()}
            {actionText || 'נסה שוב'}
          </Button>
        )}
        
        {/* Secondary action: Go home */}
        {actionRequired !== 'go_home' && onGoHome && (
          <Button onClick={onGoHome} variant="outline" className="w-full">
            <ArrowRight className="h-4 w-4 ml-2" />
            חזור לעמוד הבית
          </Button>
        )}
        
        {/* Retry button if primary action is not retry */}
        {actionRequired && actionRequired !== 'retry' && retryable && onRetry && (
          <Button onClick={onRetry} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 ml-2" />
            נסה שוב
          </Button>
        )}
      </div>
    </Card>
  );
}

// Specific error display components for common scenarios
export function NetworkErrorDisplay({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorDisplay
      error={{
        type: ErrorType.NETWORK_ERROR,
        message: 'לא הצלחנו להתחבר לשרת. אנא בדוק את החיבור לאינטרנט ונסה שוב.',
        retryable: true,
        actionRequired: 'retry',
      }}
      onRetry={onRetry}
      compact
    />
  );
}

export function AuthRequiredDisplay({ onLogin }: { onLogin: () => void }) {
  return (
    <ErrorDisplay
      error={{
        type: ErrorType.AUTH_REQUIRED,
        message: 'אנא התחבר כדי להמשיך בתהליך הרכישה.',
        retryable: false,
        actionRequired: 'login',
      }}
      onLogin={onLogin}
    />
  );
}

export function BundleNotFoundDisplay({ country, onSelectOther }: { country?: string; onSelectOther: () => void }) {
  return (
    <ErrorDisplay
      error={{
        type: ErrorType.BUNDLE_NOT_FOUND,
        message: country 
          ? `לא נמצאו חבילות זמינות עבור ${country}. אנא בחר יעד אחר.`
          : 'לא נמצאו חבילות זמינות עבור היעד הנבחר. אנא בחר יעד אחר.',
        retryable: false,
      }}
      onRetry={onSelectOther}
    />
  );
}