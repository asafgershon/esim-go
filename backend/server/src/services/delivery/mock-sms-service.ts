import type { SMSService } from './delivery-service';
import { createLogger } from '../../lib/logger';

export class MockSMSService implements SMSService {
  private logger = createLogger({ component: 'MockSMSService' });
  async sendSMS(
    to: string,
    message: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    // Mock SMS sending - in production, replace with real SMS service (Twilio, etc.)
    this.logger.info('Mock SMS Service: Sending SMS', {
      to,
      messageLength: message.length,
      operationType: 'mock-sms'
    });

    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock successful SMS sending
    return {
      success: true,
      messageId: `mock_sms_${Date.now()}`,
    };
  }
}