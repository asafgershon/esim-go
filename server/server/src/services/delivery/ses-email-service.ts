import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import type { EmailService } from './delivery-service';
import { createLogger } from '../../lib/logger';
import { cleanEnv, str } from 'envalid';
import { retryWithBackoff, isRetryableError } from '../../utils/retry.utils';

const env = cleanEnv(process.env, {
  AWS_REGION: str({ 
    desc: 'AWS region for SES', 
    default: 'us-east-1' 
  }),
  AWS_ACCESS_KEY_ID: str({ 
    desc: 'AWS access key ID',
    default: ''
  }),
  AWS_SECRET_ACCESS_KEY: str({ 
    desc: 'AWS secret access key',
    default: ''
  }),
  SES_FROM_EMAIL: str({ 
    desc: 'From email address for SES', 
    default: 'noreply@esim-go.com' 
  }),
  SES_CONFIGURATION_SET: str({ 
    desc: 'SES configuration set for tracking', 
    default: '' 
  }),
});

export class SESEmailService implements EmailService {
  private sesClient: SESClient;
  private logger = createLogger({ component: 'SESEmailService' });
  private fromEmail: string;
  private configurationSet?: string;

  constructor() {
    // Initialize SES client with credentials
    this.sesClient = new SESClient({
      region: env.AWS_REGION,
      credentials: env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      } : undefined, // Use default credentials chain if not provided
    });
    
    this.fromEmail = env.SES_FROM_EMAIL;
    this.configurationSet = env.SES_CONFIGURATION_SET || undefined;
  }

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
    try {
      // Extract plain text from HTML for text version
      const textContent = this.extractTextFromHtml(htmlContent);

      // Prepare email parameters
      const params: SendEmailCommandInput = {
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlContent,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textContent,
              Charset: 'UTF-8',
            },
          },
        },
        // Add configuration set if provided (for tracking)
        ...(this.configurationSet && { ConfigurationSetName: this.configurationSet }),
      };

      // Send the email with retry logic
      const response = await retryWithBackoff(
        async () => {
          const command = new SendEmailCommand(params);
          return await this.sesClient.send(command);
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 5000,
          retryableErrors: (error) => {
            // Don't retry validation errors
            if (error.name === 'MessageRejected' || 
                error.name === 'MailFromDomainNotVerified' ||
                error.name === 'ConfigurationSetDoesNotExist') {
              return false;
            }
            return isRetryableError(error);
          }
        }
      );

      this.logger.info('Email sent successfully via SES', {
        to,
        subject,
        messageId: response.MessageId,
        operationType: 'ses-email-send',
      });

      return {
        success: true,
        messageId: response.MessageId,
      };
    } catch (error: any) {
      this.logger.error('Failed to send email via SES', error, {
        to,
        subject,
        errorCode: error.Code,
        errorType: error.name,
        operationType: 'ses-email-send',
      });

      // Handle specific SES errors
      let errorMessage = 'Failed to send email';
      
      if (error.name === 'MessageRejected') {
        errorMessage = 'Email was rejected by SES';
      } else if (error.name === 'MailFromDomainNotVerified') {
        errorMessage = 'From email domain is not verified in SES';
      } else if (error.name === 'ConfigurationSetDoesNotExist') {
        errorMessage = 'SES configuration set does not exist';
      } else if (error.name === 'Throttling') {
        errorMessage = 'SES rate limit exceeded';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Extract plain text from HTML content
   * This is a simple implementation - in production, consider using a library like html-to-text
   */
  private extractTextFromHtml(html: string): string {
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, ' ');
    // Replace multiple spaces with single space
    text = text.replace(/\s+/g, ' ');
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    // Trim whitespace
    return text.trim();
  }

  /**
   * Verify email address with SES (useful for checking if email is verified in sandbox mode)
   */
  async verifyEmailIdentity(email: string): Promise<boolean> {
    try {
      const { VerifyEmailIdentityCommand } = await import('@aws-sdk/client-ses');
      const command = new VerifyEmailIdentityCommand({
        EmailAddress: email,
      });
      
      await this.sesClient.send(command);
      
      this.logger.info('Email verification request sent', {
        email,
        operationType: 'ses-verify-email',
      });
      
      return true;
    } catch (error) {
      this.logger.error('Failed to verify email identity', error, {
        email,
        operationType: 'ses-verify-email',
      });
      
      return false;
    }
  }
}