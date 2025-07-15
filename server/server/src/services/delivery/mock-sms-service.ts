import type { SMSService } from './delivery-service';

export class MockSMSService implements SMSService {
  async sendSMS(
    to: string,
    message: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    // Mock SMS sending - in production, replace with real SMS service (Twilio, etc.)
    console.log('Mock SMS Service: Sending SMS');
    console.log('To:', to);
    console.log('Message:', message);

    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock successful SMS sending
    return {
      success: true,
      messageId: `mock_sms_${Date.now()}`,
    };
  }
}