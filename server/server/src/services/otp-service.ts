import { awsSMS } from './aws-sms';

export interface OTPRecord {
  phoneNumber: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

export interface OTPSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  expiresAt?: Date;
}

export interface OTPVerifyResult {
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
}

export class OTPService {
  private otpStore = new Map<string, OTPRecord>();
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 3;
  private readonly RATE_LIMIT_MINUTES = 60;
  private readonly MAX_REQUESTS_PER_HOUR = 5;
  private requestCounts = new Map<string, { count: number; resetTime: Date }>();

  constructor() {
    // Clean up expired OTPs every 5 minutes
    setInterval(() => {
      this.cleanupExpiredOTPs();
    }, 5 * 60 * 1000);

    console.log('🔐 OTP Service initialized with AWS SNS SMS');
  }

  /**
   * Generate 6-digit OTP
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Check rate limiting for phone number
   */
  private checkRateLimit(phoneNumber: string): boolean {
    const now = new Date();
    const record = this.requestCounts.get(phoneNumber);

    if (!record || now > record.resetTime) {
      // Reset or initialize
      this.requestCounts.set(phoneNumber, {
        count: 1,
        resetTime: new Date(now.getTime() + this.RATE_LIMIT_MINUTES * 60000)
      });
      return true;
    }

    if (record.count >= this.MAX_REQUESTS_PER_HOUR) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(phoneNumber: string): Promise<OTPSendResult> {
    try {
      // Check rate limiting
      if (!this.checkRateLimit(phoneNumber)) {
        return {
          success: false,
          error: `Too many OTP requests. Please wait before requesting again.`
        };
      }

      // Generate new OTP
      const otp = this.generateOTP();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.OTP_EXPIRY_MINUTES * 60000);

      console.log(`🔐 Generating OTP for ${phoneNumber.substring(0, 6)}*** - Code: ${otp}`);

      // Store OTP
      this.otpStore.set(phoneNumber, {
        phoneNumber,
        otp,
        expiresAt,
        attempts: 0,
        createdAt: now
      });

      // Send via AWS SNS
      const result = await awsSMS.sendOTP(phoneNumber, otp);

      if (!result.success) {
        // Clean up failed OTP
        this.otpStore.delete(phoneNumber);
        return {
          success: false,
          error: result.error
        };
      }

      console.log(`✅ OTP sent successfully to ${phoneNumber.substring(0, 6)}***`);

      return {
        success: true,
        messageId: result.messageId,
        expiresAt
      };
    } catch (error) {
      console.error('❌ OTP send error:', error);
      return {
        success: false,
        error: 'Failed to send OTP'
      };
    }
  }

  /**
   * Verify OTP for phone number
   */
  verifyOTP(phoneNumber: string, inputOTP: string): OTPVerifyResult {
    const record = this.otpStore.get(phoneNumber);

    if (!record) {
      console.log(`❌ No OTP found for ${phoneNumber.substring(0, 6)}***`);
      return {
        success: false,
        error: 'No OTP found for this phone number. Please request a new code.'
      };
    }

    // Check expiry
    if (new Date() > record.expiresAt) {
      console.log(`⏰ OTP expired for ${phoneNumber.substring(0, 6)}***`);
      this.otpStore.delete(phoneNumber);
      return {
        success: false,
        error: 'OTP has expired. Please request a new code.'
      };
    }

    // Check attempts
    if (record.attempts >= this.MAX_ATTEMPTS) {
      console.log(`🚫 Too many attempts for ${phoneNumber.substring(0, 6)}***`);
      this.otpStore.delete(phoneNumber);
      return {
        success: false,
        error: 'Too many incorrect attempts. Please request a new OTP.'
      };
    }

    // Verify OTP
    if (record.otp !== inputOTP) {
      record.attempts++;
      const attemptsRemaining = this.MAX_ATTEMPTS - record.attempts;
      
      console.log(`❌ Invalid OTP for ${phoneNumber.substring(0, 6)}*** - ${attemptsRemaining} attempts remaining`);
      
      return {
        success: false,
        error: `Invalid OTP. ${attemptsRemaining} attempts remaining.`,
        attemptsRemaining
      };
    }

    // Success - clean up
    console.log(`✅ OTP verified successfully for ${phoneNumber.substring(0, 6)}***`);
    this.otpStore.delete(phoneNumber);
    
    return {
      success: true
    };
  }

  /**
   * Get OTP status for phone number (for debugging)
   */
  getOTPStatus(phoneNumber: string): {
    exists: boolean;
    expiresAt?: Date;
    attempts?: number;
    attemptsRemaining?: number;
  } {
    const record = this.otpStore.get(phoneNumber);
    
    if (!record) {
      return { exists: false };
    }

    return {
      exists: true,
      expiresAt: record.expiresAt,
      attempts: record.attempts,
      attemptsRemaining: this.MAX_ATTEMPTS - record.attempts
    };
  }

  /**
   * Clean up expired OTPs and rate limits
   */
  private cleanupExpiredOTPs() {
    const now = new Date();
    let cleanedOTPs = 0;
    let cleanedRateLimits = 0;

    // Clean expired OTPs
    for (const [phoneNumber, record] of this.otpStore.entries()) {
      if (now > record.expiresAt) {
        this.otpStore.delete(phoneNumber);
        cleanedOTPs++;
      }
    }

    // Clean expired rate limits
    for (const [phoneNumber, record] of this.requestCounts.entries()) {
      if (now > record.resetTime) {
        this.requestCounts.delete(phoneNumber);
        cleanedRateLimits++;
      }
    }

    if (cleanedOTPs > 0 || cleanedRateLimits > 0) {
      console.log(`🧹 Cleaned ${cleanedOTPs} expired OTPs and ${cleanedRateLimits} rate limits`);
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      activeOTPs: this.otpStore.size,
      activeRateLimits: this.requestCounts.size,
      config: {
        otpExpiryMinutes: this.OTP_EXPIRY_MINUTES,
        maxAttempts: this.MAX_ATTEMPTS,
        rateLimitMinutes: this.RATE_LIMIT_MINUTES,
        maxRequestsPerHour: this.MAX_REQUESTS_PER_HOUR
      }
    };
  }

  /**
   * Force cleanup for testing
   */
  forceCleanup() {
    this.cleanupExpiredOTPs();
  }
}

// Export singleton instance
export const otpService = new OTPService();
