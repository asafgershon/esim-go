// Export all services from a single entry point
export { awsSMS, AWSSMSService } from './aws-sms';
export { otpService, OTPService } from './otp-service';

export type { SMSResult } from './aws-sms';
export type { OTPRecord, OTPSendResult, OTPVerifyResult } from './otp-service';
