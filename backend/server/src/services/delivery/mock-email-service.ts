import type { EmailService } from './delivery-service';
import { createLogger } from '../../lib/logger';

export class MockEmailService implements EmailService {
  private logger = createLogger({ component: 'MockEmailService' });
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
    this.logger.info('Mock Email Service: Sending email', {
      to,
      subject,
      htmlContentLength: htmlContent.length,
      attachmentCount: attachments?.length || 0,
      operationType: 'mock-email'
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock successful email sending
    return {
      success: true,
      messageId: `mock_email_${Date.now()}`,
    };
  }
}