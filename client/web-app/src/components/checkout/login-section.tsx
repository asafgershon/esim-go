"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAppleSignIn } from "@/hooks/useAppleSignIn";
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { usePhoneOTP } from "@/hooks/usePhoneOTP";
import { useAuth } from "@/hooks/useAuth";
import { User, Apple, Mail, CheckCircle, LogOut } from "lucide-react";

export function LoginSection() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  
  const { user, isAuthenticated, isLoading, signOut, refreshAuth } = useAuth();
  const { signInWithApple, loading: appleLoading } = useAppleSignIn();
  const { signInWithGoogle, loading: googleLoading } = useGoogleSignIn();
  const { loading: otpLoading, step, phoneNumber, sendOTP, verifyOTP, resetFlow } = usePhoneOTP();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!phoneInput.trim()) {
      setError("אנא הכנס את מספר הטלפון שלך");
      return;
    }
    
    const result = await sendOTP(phoneInput);
    
    if (!result.success) {
      setError(result.error || "שליחת הקוד נכשלה");
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (otp.length !== 6) {
      setError("אנא הכנס את הקוד המלא בן 6 הספרות");
      return;
    }
    
    const result = await verifyOTP(otp);
    
    if (!result.success) {
      setError(result.error || "קוד לא תקין");
    } else {
      // Refresh auth state after successful login
      refreshAuth();
    }
  };

  const handleAppleSignIn = async () => {
    setError("");
    try {
      const result = await signInWithApple(false); // false for manual trigger
      
      if (result.success) {
        // Refresh auth state after successful login
        refreshAuth();
      } else {
        setError(result.error || "התחברות עם Apple נכשלה");
      }
    } catch (error) {
      setError("התחברות עם Apple נכשלה: " + (error as Error).message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const result = await signInWithGoogle(false); // false for manual trigger
      
      if (result.success) {
        // Refresh auth state after successful login
        refreshAuth();
      } else {
        setError(result.error || "התחברות עם Google נכשלה");
      }
    } catch (error) {
      setError("התחברות עם Google נכשלה: " + (error as Error).message);
    }
  };

  const handleBackToPhone = () => {
    resetFlow();
    setOtp("");
    setError("");
  };

  if (isLoading) {
    return (
      <Card className="p-6" dir="rtl">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">טוען...</h2>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (isAuthenticated && user) {
    // Format phone number for Israeli numbers
    const formatPhoneNumber = (phoneNumber: string) => {
      try {
        // Remove any non-digit characters first
        const cleaned = phoneNumber.replace(/\D/g, '');
        
        // Israeli phone numbers
        if (cleaned.startsWith('972') && cleaned.length === 12) {
          // International format: +972-XX-XXX-XXXX
          return `+972-${cleaned.slice(3, 5)}-${cleaned.slice(5, 8)}-${cleaned.slice(8, 12)}`;
        } else if (cleaned.startsWith('0') && cleaned.length === 10) {
          // Local format: 0XX-XXX-XXXX
          return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
        } else if (cleaned.length === 9 && !cleaned.startsWith('0')) {
          // Missing leading zero: XX-XXX-XXXX -> 0XX-XXX-XXXX
          return `0${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5, 9)}`;
        }
        
        return phoneNumber; // Return original if formatting fails
      } catch {
        return phoneNumber; // Return original if formatting fails
      }
    };

          return (
        <Card className="p-6" dir="rtl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-semibold">מחובר</h2>
            </div>
            
            <Button
              onClick={signOut}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex-1">
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {user.email || (user.phoneNumber && formatPhoneNumber(user.phoneNumber))}
              </p>
            </div>
          </div>
        </Card>
      );
  }

  return (
    <Card className="p-6" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">התחבר כדי להמשיך</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {step === "phone" && (
        <div className="space-y-4">
          {/* Social Login Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              variant="outline"
              className="w-full h-11"
            >
              <Mail className="mr-2 h-4 w-4" />
              {googleLoading ? "מתחבר..." : "המשך עם Google"}
            </Button>
            
            <Button
              onClick={handleAppleSignIn}
              disabled={appleLoading}
              variant="outline"
              className="w-full h-11"
            >
              <Apple className="mr-2 h-4 w-4" />
              {appleLoading ? "מתחבר..." : "המשך עם Apple"}
            </Button>
          </div>

                      <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  או המשך עם טלפון
                </span>
              </div>
            </div>

          {/* Phone Number Input */}
                      <form onSubmit={handlePhoneSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="phone">מספר טלפון</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="050-123-4567"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  disabled={otpLoading}
                />
              </div>
              
              <Button
                type="submit"
                disabled={otpLoading || !phoneInput.trim()}
                className="w-full"
              >
                {otpLoading ? "שולח..." : "שלח קוד"}
              </Button>
            </form>
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              הכנס את הקוד בן 6 הספרות שנשלח ל
            </p>
            <p className="font-medium">{phoneNumber}</p>
          </div>

          <form onSubmit={handleOTPSubmit} className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                value={otp}
                onChange={setOtp}
                maxLength={6}
                disabled={otpLoading}
              >
                <InputOTPGroup dir="ltr">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              type="submit"
              disabled={otpLoading || otp.length !== 6}
              className="w-full"
            >
              {otpLoading ? "מאמת..." : "אמת קוד"}
            </Button>
          </form>

                      <div className="text-center">
                              <Button
                  variant="ghost"
                  onClick={handleBackToPhone}
                  disabled={otpLoading}
                  className="text-sm"
                >
                  חזור למספר טלפון →
                </Button>
            </div>
        </div>
      )}
    </Card>
  );
} 