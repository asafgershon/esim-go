import postmark from "postmark";
import crypto from "crypto";
import { createLogger } from "../lib/logger";

const logger = createLogger({
    component: "EmailOTPService",
    operationType: "service",
});

// Postmark client
const postmarkClient = new postmark.ServerClient(process.env.POSTMARK_TOKEN!);

// In-memory OTP store with TTL
interface OTPEntry {
    code: string;
    expiresAt: number;
    attempts: number;
}

const otpStore = new Map<string, OTPEntry>();

// Constants
const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const FROM_EMAIL = "office@hiiloworld.com";

/**
 * Generate a random 6-digit OTP
 */
function generateOTP(): string {
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0) % 1000000;
    return num.toString().padStart(OTP_LENGTH, "0");
}

/**
 * Clean up expired entries periodically
 */
function cleanupExpired() {
    const now = Date.now();
    for (const [email, entry] of otpStore.entries()) {
        if (now > entry.expiresAt) {
            otpStore.delete(email);
        }
    }
}

// Run cleanup every minute
setInterval(cleanupExpired, 60 * 1000);

/**
 * Send OTP to an email address via Postmark
 */
export async function sendEmailOTP(email: string) {
    try {
        const normalizedEmail = email.trim().toLowerCase();
        const code = generateOTP();

        // Store OTP with TTL
        otpStore.set(normalizedEmail, {
            code,
            expiresAt: Date.now() + OTP_TTL_MS,
            attempts: 0,
        });

        // Send via Postmark - plain text, no design
        await postmarkClient.sendEmail({
            From: FROM_EMAIL,
            To: normalizedEmail,
            Subject: `${code} - קוד אימות להתחברות`,
            TextBody: `קוד האימות שלך הוא: ${code}\n\nהקוד תקף ל-5 דקות.\n\nאם לא ביקשת קוד זה, התעלם מהודעה זו.`,
            HtmlBody: `<div dir="rtl" style="font-family: Arial, sans-serif; font-size: 16px;">
<p>קוד האימות שלך הוא:</p>
<h1 style="font-size: 32px; letter-spacing: 8px; margin: 20px 0;">${code}</h1>
<p>הקוד תקף ל-5 דקות.</p>
<p style="color: #888; font-size: 13px;">אם לא ביקשת קוד זה, התעלם מהודעה זו.</p>
</div>`,
            MessageStream: "transactional",
        });

        logger.info("OTP sent", { email: normalizedEmail });

        return {
            success: true,
            error: null,
            messageId: `otp-${Date.now()}`,
        };
    } catch (err) {
        logger.error("Failed to send OTP email", { error: err as Error, email });
        return {
            success: false,
            error: "שליחת קוד האימות נכשלה",
            messageId: null,
        };
    }
}

/**
 * Verify OTP for an email address
 */
export function verifyEmailOTP(
    email: string,
    code: string
): { valid: boolean; error?: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const entry = otpStore.get(normalizedEmail);

    if (!entry) {
        return { valid: false, error: "לא נמצא קוד אימות. נסה לשלוח שוב." };
    }

    if (Date.now() > entry.expiresAt) {
        otpStore.delete(normalizedEmail);
        return { valid: false, error: "פג תוקף הקוד. נסה לשלוח שוב." };
    }

    entry.attempts++;
    if (entry.attempts > MAX_ATTEMPTS) {
        otpStore.delete(normalizedEmail);
        return { valid: false, error: "יותר מדי ניסיונות. נסה לשלוח קוד חדש." };
    }

    if (entry.code !== code) {
        return { valid: false, error: "קוד שגוי" };
    }

    // Valid! Remove from store
    otpStore.delete(normalizedEmail);
    return { valid: true };
}
