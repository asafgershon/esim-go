"use client";

import { GalleryVerticalEnd } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAppleSignIn } from "@/hooks/useAppleSignIn";
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { usePhoneOTP } from "@/hooks/usePhoneOTP";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  
  const { signInWithApple, loading: appleLoading } = useAppleSignIn();
  const { signInWithGoogle, loading: googleLoading } = useGoogleSignIn();
  const { loading: otpLoading, step, phoneNumber, sendOTP, verifyOTP, resetFlow } = usePhoneOTP();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!phoneInput.trim()) {
      setError("Please enter your phone number");
      return;
    }
    
    const result = await sendOTP(phoneInput);
    
    if (!result.success) {
      setError(result.error || "Failed to send OTP");
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    
    const result = await verifyOTP(otp);
    
    if (result.success) {
      window.location.href = "/dashboard";
    } else {
      setError(result.error || "Invalid OTP");
      setOtp("");
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithApple();

      if (result.success) {
        window.location.href = "/dashboard";
      } else {
        setError("Apple Sign-In failed: " + result.error);
      }
    } catch (error) {
      setError("Apple Sign-In failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithGoogle();

      if (result.success) {
        window.location.href = "/dashboard";
      } else {
        setError("Google Sign-In failed: " + result.error);
      }
    } catch (error) {
      setError("Google Sign-In failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    resetFlow();
    setOtp("");
    setError("");
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <a
            href="#"
            className="flex flex-col items-center gap-2 font-medium"
          >
            <div className="flex size-8 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-6" />
            </div>
            <span className="sr-only">eSIM Go</span>
          </a>
          <h1 className="text-xl font-bold">Welcome to eSIM Go</h1>
          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <a href="#" className="underline underline-offset-4">
              Sign up
            </a>
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit}>
              <div className="grid gap-3">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  required
                />
                <div className="text-xs text-muted-foreground">
                  We&apos;ll send you a 6-digit code to verify your number
                </div>
              </div>
              {error && (
                <div className="text-sm text-red-500 mt-2">{error}</div>
              )}
              <Button 
                type="submit" 
                className="w-full mt-4"
                disabled={otpLoading}
              >
                {otpLoading ? "Sending..." : "Send Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit}>
              <div className="grid gap-3">
                <Label htmlFor="otp">Enter 6-digit code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Code sent to {phoneNumber}
                </div>
              </div>
              {error && (
                <div className="text-sm text-red-500 mt-2 text-center">{error}</div>
              )}
              <div className="grid gap-2 mt-4">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={otpLoading || otp.length !== 6}
                >
                  {otpLoading ? "Verifying..." : "Verify Code"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleBackToPhone}
                  disabled={otpLoading}
                >
                  Back to Phone Number
                </Button>
              </div>
            </form>
          )}
        </div>
        
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or
          </span>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <Button
            variant="outline"
            type="button"
            onClick={handleAppleSignIn}
            disabled={isLoading || appleLoading || otpLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                fill="currentColor"
              />
            </svg>
            {appleLoading ? "Signing in..." : "Continue with Apple"}
          </Button>
          <Button 
            variant="outline" 
            type="button" 
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading || googleLoading || otpLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </Button>
        </div>
      </div>
      
      <div className="text-muted-foreground text-center text-xs text-balance">
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </a>
        .
      </div>
    </div>
  );
}
