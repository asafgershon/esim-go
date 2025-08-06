"use client";

import { ErrorDisplay } from "@/components/error-display";
import { useLoginForm } from "@/hooks/useLoginForm";
import { ErrorType } from "@/lib/error-types";
import { cn } from "@/lib/utils";
import { formatPhoneForDisplay } from "@/lib/validation/auth-schemas";
import {
  Button,
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Label,
} from "@workspace/ui";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Smartphone } from "lucide-react";
import { useEffect } from "react";

interface LoginFormProps extends React.ComponentProps<"div"> {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function LoginForm({
  className,
  onSuccess,
  redirectTo = "/profile",
  ...props
}: LoginFormProps) {
  const {
    // Form instances
    phoneForm,
    otpForm,
    
    // State
    error,
    isLoading,
    otp,
    showPhoneHelper,
    resendCooldown,
    
    // OTP hook state
    step,
    phoneNumber,
    otpLoading,
    
    // Social sign-in loading states
    appleLoading,
    googleLoading,
    
    // Handlers
    handlePhoneSubmit,
    handleOTPSubmit,
    handleResendOTP,
    handleSocialSignIn,
    handleBackToPhone,
    handlePhoneInputChange,
    handleOTPChange,
    
    // State setters
    setShowPhoneHelper,
    setError,
  } = useLoginForm({ onSuccess, redirectTo });

  // Auto-clear error when user starts typing
  useEffect(() => {
    const subscription = phoneForm.watch(() => {
      if (error) setError(null);
    });
    return () => subscription.unsubscribe();
  }, [error, phoneForm, setError]);

  return (
    <div className={cn("flex flex-col gap-6", className)} dir="rtl" {...props}>
      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          {step === "phone" ? "התחברות לחשבון" : "אימות מספר טלפון"}
        </h1>
        <p className="text-balance text-muted-foreground mt-2">
          {step === "phone"
            ? "בחר את דרך ההתחברות המועדפת עליך"
            : `הזנו את הקוד שנשלח ל-${formatPhoneForDisplay(phoneNumber)}`}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorDisplay
          error={{
            type: ErrorType.AUTH_INVALID,
            message: error,
            retryable: true,
          }}
          onRetry={() => setError(null)}
          compact
        />
      )}

      {/* Phone Number Step */}
      {step === "phone" && (
        <div className="grid gap-6">
          <form
            onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-right">
                מספר טלפון
              </Label>
              <Input
                id="phone"
                placeholder="+972 50-123-4567"
                type="tel"
                dir="ltr"
                {...phoneForm.register("phoneNumber")}
                onChange={(e) => handlePhoneInputChange(e.target.value)}
                onFocus={() => setShowPhoneHelper(true)}
                onBlur={() => setTimeout(() => setShowPhoneHelper(false), 200)}
                autoComplete="tel"
                disabled={otpLoading}
                className={
                  (phoneForm.formState.errors.phoneNumber
                    ? "border-destructive"
                    : "") + " text-left"
                }
              />

              {/* Phone number helper */}
              {showPhoneHelper && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  <p>דוגמאות תקינות:</p>
                  <p>• +972-50-123-4567</p>
                  <p>• 050-123-4567</p>
                  <p>• +1-555-123-4567</p>
                </div>
              )}

              {phoneForm.formState.errors.phoneNumber && (
                <p className="text-sm text-destructive text-right">
                  {phoneForm.formState.errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center space-x-2 space-x-reverse gap-1">
              <Checkbox
                id="rememberMe"
                checked={phoneForm.watch("rememberMe")}
                onCheckedChange={(checked) =>
                  phoneForm.setValue("rememberMe", !!checked)
                }
              />
              <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
                זכור אותי במכשיר זה
              </Label>
            </div>

            <Button
              type="submit"
              disabled={otpLoading || !phoneForm.formState.isValid}
              className="w-full"
            >
              {otpLoading ? "שולח..." : "שלח קוד אימות"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="bg-background text-muted-foreground relative z-10 px-4">
              או
            </span>
          </div>

          {/* Social Sign-In */}
          <div className="grid gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => handleSocialSignIn("apple")}
              disabled={isLoading || appleLoading || otpLoading}
              className="w-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="ml-2 h-5 w-5"
              >
                <path
                  d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                  fill="currentColor"
                />
              </svg>
              {appleLoading ? "מתחבר..." : "המשך עם Apple"}
            </Button>

            <Button
              variant="outline"
              type="button"
              onClick={() => handleSocialSignIn("google")}
              disabled={isLoading || googleLoading || otpLoading}
              className="w-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="ml-2 h-5 w-5"
              >
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              {googleLoading ? "מתחבר..." : "המשך עם Google"}
            </Button>
          </div>
        </div>
      )}

      {/* OTP Verification Step */}
      {step === "otp" && (
        <div className="grid gap-6" dir="ltr">
          <form
            onSubmit={otpForm.handleSubmit(handleOTPSubmit)}
            className="grid gap-6"
          >
            {/* OTP Input */}
            <div className="flex justify-center" dir="ltr">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={handleOTPChange}
                disabled={otpLoading}
                dir="ltr"
                className="gap-2"
              >
                <InputOTPGroup className="gap-1" dir="ltr">
                  <InputOTPSlot index={0} className="border-2 border-brand-dark bg-white w-[28px] rounded-md" />
                  <InputOTPSlot index={1} className="border-2 border-brand-dark bg-white w-[28px] rounded-md" />
                  <InputOTPSlot index={2} className="border-2 border-brand-dark bg-white w-[28px] rounded-md" />
                  <InputOTPSlot index={3} className="border-2 border-brand-dark bg-white w-[28px] rounded-md" />
                  <InputOTPSlot index={4} className="border-2 border-brand-dark bg-white w-[28px] rounded-md" />
                  <InputOTPSlot index={5} className="border-2 border-brand-dark bg-white w-[28px] rounded-md" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Auto-submit message */}
            {otp.length === 6 && (
              <p className="text-xs text-center text-muted-foreground">
                מאמת אוטומטית...
              </p>
            )}


            {otpForm.formState.errors.otp && (
              <p className="text-sm text-destructive text-center">
                {otpForm.formState.errors.otp.message}
              </p>
            )}

            {/* Resend Code */}
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || otpLoading}
                className="text-sm"
              >
                {resendCooldown > 0
                  ? `שלח שוב בעוד ${resendCooldown} שניות`
                  : "שלח קוד חדש"}
              </Button>
            </div>

            {/* Back Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleBackToPhone}
              disabled={otpLoading}
            >
              חזור למספר הטלפון
            </Button>
          </form>
        </div>
      )}

      {/* Terms */}
      <div className="text-muted-foreground text-center text-xs text-balance">
        על ידי המשך, אתה מסכים ל
        <a
          href="/docs/terms.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-primary mx-1"
        >
          תנאי השימוש
        </a>
        ו
        <a
          href="/docs/privacy.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-primary mx-1"
        >
          מדיניות הפרטיות
        </a>
        שלנו.
      </div>
    </div>
  );
}
