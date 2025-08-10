"use client";

import { LoginForm } from "@/components/login-form";
import { X } from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface LoginModalWrapperProps {
  onLoginSuccess?: () => void;
}

export function LoginModalWrapper({ onLoginSuccess }: LoginModalWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [showLogin, setShowLogin] = useQueryState(
    "showLogin",
    parseAsBoolean.withDefault(false)
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLoginSuccess = () => {
    // Call the parent's callback to handle navigation
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const handleClose = () => {
    setShowLogin(null); // This removes the query param
  };

  // Don't render on server
  if (!mounted) {
    return null;
  }

  // Render modal using portal to ensure it's on top
  if (showLogin) {
    const modalContent = (
      <div className="fixed inset-0 flex items-center justify-center" style={{ position: 'fixed' }}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50" 
          onClick={handleClose}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        />
        
        {/* Modal Content */}
        <div className="relative w-full max-w-[480px] bg-white rounded-xl border shadow-lg p-6 m-4" style={{ backgroundColor: 'white', position: 'relative', zIndex: 100000 }}>
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          {/* Login form */}
          <LoginForm
            onSuccess={handleLoginSuccess}
            redirectTo="/profile"
          />
        </div>
      </div>
    );

    // Use portal to render at document body
    return createPortal(modalContent, document.body);
  }

  return null;
}