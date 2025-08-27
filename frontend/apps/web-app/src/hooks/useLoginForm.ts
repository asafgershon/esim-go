import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePhoneOTP } from "./usePhoneOTP";
import { useAppleSignIn } from "./useAppleSignIn";
import { useGoogleSignIn } from "./useGoogleSignIn";
import {
  phoneFormSchema,
  otpFormSchema,
  formatPhoneNumber,
  type PhoneFormData,
  type OTPFormData,
} from "@/lib/validation/auth-schemas";
import { SignInResponse } from "@/lib/types";

interface UseLoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export interface SocialUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface UseLoginFormReturn {
  // Form instances
  phoneForm: ReturnType<typeof useForm<PhoneFormData>>;
  otpForm: ReturnType<typeof useForm<OTPFormData>>;
  
  // State
  error: string | null;
  isLoading: boolean;
  otp: string;
  showPhoneHelper: boolean;
  resendCooldown: number;
  
  // OTP hook state
  step: "phone" | "otp";
  phoneNumber: string;
  otpLoading: boolean;
  
  // Social sign-in loading states
  appleLoading: boolean;
  googleLoading: boolean;
  
  // Handlers
  handlePhoneSubmit: (data: PhoneFormData) => Promise<void>;
  handleOTPSubmit: (data: OTPFormData) => Promise<void>;
  handleResendOTP: () => Promise<void>;
  handleSocialSignIn: (provider: "apple" | "google") => Promise<SocialUserData | void>;
  handleBackToPhone: () => void;
  handlePhoneInputChange: (value: string) => void;
  handleOTPChange: (value: string) => void;
  
  // State setters
  setShowPhoneHelper: (show: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLoginForm = ({
  onSuccess,
  redirectTo = "/profile",
}: UseLoginFormProps = {}): UseLoginFormReturn => {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPhoneHelper, setShowPhoneHelper] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);

  // Hooks
  const { signInWithApple, loading: appleLoading } = useAppleSignIn();
  const { signInWithGoogle, loading: googleLoading } = useGoogleSignIn();
  const {
    loading: otpLoading,
    step,
    phoneNumber,
    sendOTP,
    verifyOTP,
    resetFlow,
  } = usePhoneOTP();

  // Forms with Zod validation
  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: {
      phoneNumber: "",
      rememberMe: true,
    },
    mode: "onChange",
  });

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      otp: "",
    },
    mode: "onChange",
  });

  // Phone input change handler with formatting
  const handlePhoneInputChange = useCallback((value: string) => {
    const formatted = formatPhoneNumber(value);
    phoneForm.setValue("phoneNumber", formatted, { 
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [phoneForm]);

  // OTP input change handler
  const handleOTPChange = useCallback((value: string) => {
    setOtp(value);
    otpForm.setValue("otp", value, { 
      shouldValidate: true,
      shouldDirty: true,
    });
    // Reset auto-submit flag when user changes OTP
    if (value.length < 6) {
      setHasAutoSubmitted(false);
    }
  }, [otpForm]);

  // Phone form submission
  const handlePhoneSubmit = useCallback(async (data: PhoneFormData) => {
    try {
      setError(null);

      const result = await sendOTP(data.phoneNumber);

      if (result.success) {
        setResendCooldown(60); // 60 second cooldown
        
        // Save preference if remember me is checked
        if (data.rememberMe) {
          localStorage.setItem("rememberLogin", "true");
          localStorage.setItem("lastPhoneNumber", data.phoneNumber);
        } else {
          localStorage.removeItem("rememberLogin");
          localStorage.removeItem("lastPhoneNumber");
        }
      } else {
        setError(result.error || "שליחת קוד האימות נכשלה");
      }
    } catch (err) {
      console.error("Phone submit error:", err);
      setError("שגיאה בשליחת קוד האימות");
    }
  }, [sendOTP]);

  // OTP form submission
  const handleOTPSubmit = useCallback(async (data: OTPFormData) => {
    try {
      setError(null);

      const result = await verifyOTP(data.otp);

      if (result.success) {
        // Clear any pending errors
        setError(null);

        // Success callback
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = redirectTo;
        }
      } else {
        setError(result.error || "קוד האימות שגוי");
        setOtp("");
        otpForm.setValue("otp", "");
      }
    } catch (err) {
      console.error("OTP submit error:", err);
      setError("שגיאה באימות הקוד");
    }
  }, [onSuccess, otpForm, redirectTo, verifyOTP]);

  // Resend OTP
  const handleResendOTP = useCallback(async () => {
    if (resendCooldown > 0) return;

    try {
      setError(null);
      const result = await sendOTP(phoneNumber);

      if (result.success) {
        setResendCooldown(60);
      } else {
        setError(result.error || "שליחת קוד חוזרת נכשלה");
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError("שגיאה בשליחת קוד חוזרת");
    }
  }, [phoneNumber, resendCooldown, sendOTP]);

  // Social sign-in
  const handleSocialSignIn = useCallback(async (provider: "apple" | "google"): Promise<SocialUserData | void> => {
    try {
      setIsLoading(true);
      setError(null);

      let result: SignInResponse;
      try {
        result = provider === "apple" 
          ? await signInWithApple(false)
          : await signInWithGoogle(false);
      } catch (signInError) {
        result = { success: false, error: (signInError as Error).message };
      }

      if (result && result.success) {
        // Extract user data from the result
        const userData: SocialUserData = result.user || {};
        
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = redirectTo;
        }
        
        // Return the user data
        return userData;
      } else {
        const errorMessage = provider === "apple"
          ? "התחברות עם Apple נכשלה"
          : "התחברות עם Google נכשלה";
        
        if (result?.error && !result.error.includes("dismissed") && !result.error.includes("skipped")) {
          setError(`${errorMessage}: ${result.error}`);
        }
      }
    } catch (error) {
      const errorMessage = provider === "apple"
        ? "התחברות עם Apple נכשלה"
        : "התחברות עם Google נכשלה";
      setError(`${errorMessage}: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, redirectTo, signInWithApple, signInWithGoogle]);

  // Back to phone step
  const handleBackToPhone = useCallback(() => {
    resetFlow();
    setOtp("");
    setError(null);
    setResendCooldown(0);
    setHasAutoSubmitted(false);
    otpForm.reset();
    phoneForm.clearErrors();
  }, [otpForm, phoneForm, resetFlow]);

  // Auto-submit OTP when complete
  useEffect(() => {
    if (otp.length === 6 && !otpLoading && !error && !hasAutoSubmitted && otpForm.formState.isValid) {
      setHasAutoSubmitted(true);
      handleOTPSubmit({ otp });
    }
  }, [handleOTPSubmit, otp, otpLoading, error, hasAutoSubmitted, otpForm.formState.isValid]);

  // Resend cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Load remembered phone number
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rememberLogin = localStorage.getItem("rememberLogin") === "true";
      const lastPhone = localStorage.getItem("lastPhoneNumber");

      if (rememberLogin && lastPhone) {
        const formatted = formatPhoneNumber(lastPhone);
        phoneForm.setValue("phoneNumber", formatted);
        phoneForm.setValue("rememberMe", true);
      }
    }
  }, [phoneForm]);

  return {
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
  };
};