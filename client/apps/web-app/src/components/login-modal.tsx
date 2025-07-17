"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { Button } from "@workspace/ui";
import { User as UserIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@workspace/ui/components/dialog";

interface LoginModalProps {
  redirectTo?: string;
}

export function LoginModal({ redirectTo = "/profile" }: LoginModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Custom LoginForm wrapper that handles successful login
  const LoginFormWithRedirect = () => {
    const handleLoginSuccess = () => {
      setIsOpen(false);
      router.push(redirectTo);
    };

    return (
      <div className="w-full max-w-sm">
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full flex items-center justify-center"
        >
          <UserIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[420px] w-auto">
        <LoginFormWithRedirect />
      </DialogContent>
    </Dialog>
  );
}