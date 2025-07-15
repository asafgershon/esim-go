import { DeliveryService } from './delivery-service';
import { MockEmailService } from './mock-email-service';
import { MockSMSService } from './mock-sms-service';

export { DeliveryService } from './delivery-service';
export { MockEmailService } from './mock-email-service';
export { MockSMSService } from './mock-sms-service';
export type {
  DeliveryMethod,
  ESIMDeliveryData,
  DeliveryResult,
  EmailService,
  SMSService,
} from './delivery-service';

// Factory function to create delivery service with mock implementations
export function createDeliveryService(): DeliveryService {
  const emailService = new MockEmailService();
  const smsService = new MockSMSService();
  
  return new DeliveryService(emailService, smsService);
}