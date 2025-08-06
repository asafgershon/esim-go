import { z } from "zod";

// Hebrew error messages for better UX
const VALIDATION_MESSAGES = {
  PHONE_REQUIRED: "מספר טלפון נדרש",
  PHONE_INVALID: "אנא הזן מספר טלפון תקין",
  PHONE_TOO_SHORT: "מספר הטלפון חייב להכיל לפחות 10 ספרות",
  OTP_REQUIRED: "קוד אימות נדרש",
  OTP_INVALID: "קוד אימות חייב להכיל 6 ספרות",
  OTP_DIGITS_ONLY: "קוד אימות חייב להכיל מספרים בלבד",
} as const;

/**
 * Clean phone number by removing all non-digit characters except +
 */
export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/[^\d+]/g, "");
};

/**
 * Validate if phone number has enough digits
 */
export const validatePhoneDigits = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length >= 10;
};

/**
 * Format phone number for display in OTP verification
 * Shows Israeli numbers without country code: 050-123-4567
 */
export const formatPhoneForDisplay = (value: string): string => {
  const cleaned = cleanPhoneNumber(value);
  
  // Remove +972 prefix for Israeli numbers
  if (cleaned.startsWith("+972")) {
    const rest = cleaned.slice(4);
    // Add back the 0 prefix and format
    return `0${rest}`.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }
  
  // If it's already in local format (05x)
  if (cleaned.startsWith("05")) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }
  
  // For other numbers, just return cleaned
  return cleaned;
};

/**
 * Format phone number for display
 * Converts Israeli mobile numbers and international numbers to a readable format
 */
export const formatPhoneNumber = (value: string): string => {
  const cleaned = cleanPhoneNumber(value);

  // If it starts with +972, format as Israeli number
  if (cleaned.startsWith("+972")) {
    const rest = cleaned.slice(4);
    if (rest.length <= 9) {
      return `+972 ${rest.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3")}`;
    }
    return cleaned;
  }

  // If it starts with 05, assume Israeli mobile and add +972
  if (cleaned.startsWith("05")) {
    return `+972 ${cleaned.slice(1).replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3")}`;
  }

  // For international numbers, return as is
  return cleaned;
};

/**
 * Phone number validation schema
 */
export const phoneNumberSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.PHONE_REQUIRED)
  .refine((value) => {
    const cleaned = cleanPhoneNumber(value);
    return /^\+?[\d\s\-\(\)]+$/.test(cleaned);
  }, {
    message: VALIDATION_MESSAGES.PHONE_INVALID,
  })
  .refine((value) => validatePhoneDigits(value), {
    message: VALIDATION_MESSAGES.PHONE_TOO_SHORT,
  })
  .transform((value) => cleanPhoneNumber(value));

/**
 * OTP validation schema
 */
export const otpSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.OTP_REQUIRED)
  .length(6, VALIDATION_MESSAGES.OTP_INVALID)
  .regex(/^\d{6}$/, VALIDATION_MESSAGES.OTP_DIGITS_ONLY);

/**
 * Phone form data schema
 */
export const phoneFormSchema = z.object({
  phoneNumber: phoneNumberSchema,
  rememberMe: z.boolean().default(true),
});

/**
 * OTP form data schema
 */
export const otpFormSchema = z.object({
  otp: otpSchema,
});

/**
 * Type definitions
 */
export type PhoneFormData = z.infer<typeof phoneFormSchema>;
export type OTPFormData = z.infer<typeof otpFormSchema>;