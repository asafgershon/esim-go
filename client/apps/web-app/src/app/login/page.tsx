"use client";

import { useRouter } from "next/navigation";
import { EnhancedLoginForm } from "@/components/enhanced-login-form";
import { Button } from "@workspace/ui";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.push("/profile");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-[480px]">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              חזרה לדף הבית
            </Button>
          </Link>
        </div>
        
        <div className="bg-white rounded-xl border shadow-lg p-6">
          <EnhancedLoginForm
            onSuccess={handleLoginSuccess}
            redirectTo="/profile"
          />
        </div>
      </div>
    </div>
  );
}