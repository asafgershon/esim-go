"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EnhancedLoginForm } from "@/components/enhanced-login-form";
import { Button } from "@workspace/ui";
import { User as UserIcon, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface EnhancedLoginModalProps {
  redirectTo?: string;
  trigger?: "button" | "avatar" | "custom";
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
  className?: string;
}

export function EnhancedLoginModal({
  redirectTo = "/profile",
  trigger = "avatar",
  size = "md",
  children,
  className,
}: EnhancedLoginModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent SSR issues
  }

  // If user is already authenticated, don't show login
  if (isAuthenticated) {
    return null;
  }

  const handleLoginSuccess = () => {
    setIsOpen(false);
    // Small delay to allow modal to close smoothly
    setTimeout(() => {
      router.push(redirectTo);
    }, 100);
  };

  const getModalSize = () => {
    switch (size) {
      case "sm":
        return "max-w-[360px]";
      case "lg":
        return "max-w-[600px]";
      default:
        return "max-w-[480px]";
    }
  };

  const getTriggerButton = () => {
    if (children) {
      return children;
    }

    switch (trigger) {
      case "button":
        return (
          <Button
            variant="default"
            className={cn("", className)}
            disabled={isLoading}
          >
            <UserIcon className="h-4 w-4 ml-2" />
            התחבר
          </Button>
        );
      case "avatar":
      default:
        return (
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "rounded-full flex items-center justify-center",
              className
            )}
            disabled={isLoading}
          >
            <UserIcon className="h-5 w-5" />
          </Button>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal>
      <DialogTrigger asChild>{getTriggerButton()}</DialogTrigger>
      <DialogContent
        className={cn(
          "w-full p-0 border-none bg-transparent shadow-none",
          getModalSize()
        )}
      >
        <div className="bg-background rounded-xl border shadow-lg overflow-hidden">
          {/* Custom header with close button */}
          <div className="flex justify-end p-4 pb-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Login form */}
          <div className="px-6 pb-6">
            <EnhancedLoginForm
              onSuccess={handleLoginSuccess}
              redirectTo={redirectTo}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Convenience components for common use cases
export function LoginButton({
  className,
  redirectTo = "/profile",
}: {
  className?: string;
  redirectTo?: string;
} & React.ComponentProps<typeof Button>) {
  return (
    <EnhancedLoginModal
      trigger="button"
      redirectTo={redirectTo}
      className={className}
    />
  );
}

export function LoginAvatar({
  className,
  redirectTo = "/profile",
}: {
  className?: string;
  redirectTo?: string;
}) {
  return (
    <EnhancedLoginModal
      trigger="avatar"
      redirectTo={redirectTo}
      className={className}
    />
  );
}

// Login modal that can be triggered programmatically
export function useLoginModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openLogin = () => setIsOpen(true);
  const closeLogin = () => setIsOpen(false);

  const LoginModalComponent = ({
    redirectTo = "/profile",
    onSuccess,
  }: {
    redirectTo?: string;
    onSuccess?: () => void;
  }) => {
    const handleSuccess = () => {
      closeLogin();
      onSuccess?.();
    };

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen} modal>
        <DialogContent className="max-w-[480px] w-full p-0 border-none bg-transparent shadow-none">
          <div className="bg-background rounded-xl border shadow-lg overflow-hidden">
            <div className="flex justify-end p-4 pb-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={closeLogin}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="px-6 pb-6">
              <EnhancedLoginForm
                onSuccess={handleSuccess}
                redirectTo={redirectTo}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return {
    openLogin,
    closeLogin,
    isOpen,
    LoginModal: LoginModalComponent,
  };
}
