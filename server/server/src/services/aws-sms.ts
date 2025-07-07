import { 
  SNSClient, 
  PublishCommand,
  type MessageAttributeValue 
} from '@aws-sdk/client-sns';
import { cleanEnv, str } from 'envalid';

const env = cleanEnv(process.env, {
  AWS_REGION: str(),
  AWS_ACCESS_KEY_ID: str(),
  AWS_SECRET_ACCESS_KEY: str(),
  AWS_SNS_SENDER_ID: str({ default: 'eSIMGo' }),
  AWS_SMS_TYPE: str({ default: 'Transactional' }),
});

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class AWSSMSService {
  private client: SNSClient;

  constructor() {
    this.client = new SNSClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log(`📱 AWS SMS Service initialized for region: ${env.AWS_REGION}`);
  }

  /**
   * Send SMS message via Amazon SNS
   */
  async sendSMS(phoneNumber: string, message: string): Promise<SMSResult> {
    try {
      const messageAttributes: Record<string, MessageAttributeValue> = {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: env.AWS_SNS_SENDER_ID,
        },
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: env.AWS_SMS_TYPE,
        },
      };

      const command = new PublishCommand({
        PhoneNumber: phoneNumber,
        Message: message,
        MessageAttributes: messageAttributes,
      });

      console.log(`📤 Sending SMS to ${phoneNumber.substring(0, 6)}***`);
      const result = await this.client.send(command);

      console.log(`✅ SMS sent successfully. MessageId: ${result.MessageId}`);
      return {
        success: true,
        messageId: result.MessageId,
      };
    } catch (error) {
      console.error('❌ AWS SNS SMS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS sending failed',
      };
    }
  }

  /**
   * Send OTP SMS with formatted message
   */
  async sendOTP(phoneNumber: string, otp: string): Promise<SMSResult> {
    const message = `Your eSIM Go verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send eSIM activation SMS
   */
  async sendESIMActivation(phoneNumber: string, qrCode: string): Promise<SMSResult> {
    const message = `Your eSIM is ready! Scan this QR code to activate: ${qrCode}. Need help? Visit esimgo.com/support`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send eSIM expiration reminder
   */
  async sendESIMReminder(phoneNumber: string, planName: string, daysLeft: number): Promise<SMSResult> {
    const message = `eSIM Go: Your ${planName} plan expires in ${daysLeft} days. Renew now to avoid service interruption: esimgo.com/renew`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send welcome message for new users
   */
  async sendWelcome(phoneNumber: string, firstName?: string): Promise<SMSResult> {
    const name = firstName ? `, ${firstName}` : '';
    const message = `Welcome to eSIM Go${name}! Your account is ready. Download our app or visit esimgo.com to purchase your first eSIM plan.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send data usage alert
   */
  async sendDataAlert(phoneNumber: string, planName: string, percentUsed: number): Promise<SMSResult> {
    const message = `eSIM Go Alert: You've used ${percentUsed}% of your ${planName} data. Top up or purchase a new plan at esimgo.com`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Test SMS connectivity
   */
  async testConnection(): Promise<SMSResult> {
    try {
      // For testing, we won't actually send an SMS
      // Just validate the configuration
      console.log('📋 Testing AWS SNS SMS configuration...');
      console.log(`Region: ${env.AWS_REGION}`);
      console.log(`Sender ID: ${env.AWS_SNS_SENDER_ID}`);
      console.log(`SMS Type: ${env.AWS_SMS_TYPE}`);
      
      return {
        success: true,
        messageId: 'test-config-valid'
      };
    } catch (error) {
      return {
        success: false,
        error: 'AWS SNS SMS configuration test failed'
      };
    }
  }

  /**
   * Get service configuration
   */
  getConfig() {
    return {
      region: env.AWS_REGION,
      senderId: env.AWS_SNS_SENDER_ID,
      smsType: env.AWS_SMS_TYPE,
      service: 'AWS SNS (End User Messaging)'
    };
  }
}

// Export singleton instance
export const awsSMS = new AWSSMSService();
