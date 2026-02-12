import { z } from "zod";

// Hebrew error messages for better UX
const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: "כתובת אימייל נדרשת",
  EMAIL_INVALID: "אנא הזן כתובת אימייל תקינה",
  OTP_REQUIRED: "קוד אימות נדרש",
  OTP_INVALID: "קוד אימות חייב להכיל 6 ספרות",
  OTP_DIGITS_ONLY: "קוד אימות חייב להכיל מספרים בלבד",
} as const;

/**
 * Phone number validation schema (now validates email)
 */
export const phoneNumberSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED)
  .email(VALIDATION_MESSAGES.EMAIL_INVALID)
  .transform((value) => value.trim().toLowerCase());

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
  rememberMe: z.boolean(),
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