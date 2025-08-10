import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { QrCode, Mail } from "lucide-react";

export interface DeliveryOption {
  id: "QR" | "EMAIL";
  name: string;
  description: string;
  icon: typeof QrCode | typeof Mail;
  recommended: boolean;
}

export interface UseDeliveryMethodReturn {
  // State
  selectedMethod: "QR" | "EMAIL";
  email: string;
  showCustomEmail: boolean;
  
  // Computed values
  hasUserEmail: boolean;
  isPhoneAuth: boolean;
  isDeliveryValid: boolean;
  effectiveEmail: string | undefined;
  userEmail: string | undefined;
  
  // Actions
  setSelectedMethod: (method: "QR" | "EMAIL") => void;
  setEmail: (email: string) => void;
  toggleCustomEmail: (checked: boolean) => void;
  
  // Configuration
  deliveryOptions: DeliveryOption[];
}

export const useDeliveryMethod = (
  initialMethod: "QR" | "EMAIL" = "QR",
  initialEmail: string = ""
): UseDeliveryMethodReturn => {
  const { user } = useAuth();
  
  // State
  const [selectedMethod, setSelectedMethod] = useState<"QR" | "EMAIL">(initialMethod);
  const [email, setEmail] = useState(initialEmail);
  const [showCustomEmail, setShowCustomEmail] = useState(false);
  
  // Computed values
  const hasUserEmail = Boolean(user?.email && !user.email.includes('@phone.esim-go.com'));
  const isPhoneAuth = Boolean(user?.email?.includes('@phone.esim-go.com'));
  const userEmail = hasUserEmail ? user?.email : undefined;
  
  // Set default email from user if available
  useEffect(() => {
    if (hasUserEmail && !email && user?.email) {
      setEmail(user.email);
    }
  }, [hasUserEmail, user?.email, email]);
  
  // Validation logic
  const isDeliveryValid = selectedMethod === "QR" || 
    (selectedMethod === "EMAIL" && (isPhoneAuth || email.length > 3));
  
  // Calculate effective email for delivery
  const effectiveEmail = selectedMethod === "EMAIL" && email ? email : undefined;
  
  // Actions
  const toggleCustomEmail = useCallback((checked: boolean) => {
    setShowCustomEmail(checked);
    if (!checked && hasUserEmail && user?.email) {
      setEmail(user.email);
    }
  }, [hasUserEmail, user]);
  
  // Delivery options configuration
  const deliveryOptions: DeliveryOption[] = [
    {
      id: "QR",
      name: "QR Code",
      description: "הפעלה מיידית באמצעות QR Code",
      icon: QrCode,
      recommended: true,
    },
    {
      id: "EMAIL",
      name: "משלוח למייל",
      description: "קבלת eSIM באמצעות מייל",
      icon: Mail,
      recommended: false,
    },
  ];
  
  return {
    // State
    selectedMethod,
    email,
    showCustomEmail,
    
    // Computed values
    hasUserEmail,
    isPhoneAuth,
    isDeliveryValid,
    effectiveEmail,
    userEmail,
    
    // Actions
    setSelectedMethod,
    setEmail,
    toggleCustomEmail,
    
    // Configuration
    deliveryOptions,
  };
};