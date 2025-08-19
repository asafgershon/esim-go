import { DeliveryService } from './delivery-service';
import { MockEmailService } from './mock-email-service';
import { MockSMSService } from './mock-sms-service';
import { SESEmailService } from './ses-email-service';
import { cleanEnv, str } from 'envalid';

export { DeliveryService } from './delivery-service';
export { MockEmailService } from './mock-email-service';
export { MockSMSService } from './mock-sms-service';
export { SESEmailService } from './ses-email-service';
export type {
  DeliveryMethod,
  ESIMDeliveryData,
  DeliveryResult,
  EmailService,
  SMSService,
} from './delivery-service';

const env = cleanEnv(process.env, {
  EMAIL_MODE: str({ 
    desc: 'Email service mode', 
    default: 'mock',
    choices: ['mock', 'ses']
  }),
});

// Factory function to create delivery service with appropriate implementations
export function createDeliveryService(): DeliveryService {
  // Choose email service based on environment
  const emailService = env.EMAIL_MODE === 'ses' 
    ? new SESEmailService() 
    : new MockEmailService();
    
  // Always use mock SMS for now
  const smsService = new MockSMSService();
  
  return new DeliveryService(emailService, smsService);
}