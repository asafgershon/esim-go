"use client";

import { Button } from "@workspace/ui";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  message = "משהו השתבש. נסו שוב מאוחר יותר.", 
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
      </div>
      
      <h3 className="text-lg font-medium text-red-900 mb-2">שגיאה בטעינת הנתונים</h3>
      <p className="text-sm text-red-700 mb-4">{message}</p>
      
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          נסה שוב
        </Button>
      )}
    </div>
  );
}