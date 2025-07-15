import type { EmailService } from './delivery-service';

export class MockEmailService implements EmailService {
  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    attachments?: any[]
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    // Mock email sending - in production, replace with real email service
    console.log('Mock Email Service: Sending email');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML Content Length:', htmlContent.length);
    
    if (attachments) {
      console.log('Attachments:', attachments.length);
    }

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock successful email sending
    return {
      success: true,
      messageId: `mock_email_${Date.now()}`,
    };
  }
}