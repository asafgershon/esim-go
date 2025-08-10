import { GraphQLError } from 'graphql';
import { generateESIMEmailTemplate } from './email-templates';

export interface DeliveryMethod {
  type: 'EMAIL' | 'SMS' | 'BOTH';
  email?: string;
  phoneNumber?: string;
}

export interface ESIMDeliveryData {
  esimId: string;
  iccid: string;
  qrCode: string;
  activationCode?: string;
  activationUrl?: string;
  smdpAddress?: string;
  matchingId?: string;
  instructions: string;
  planName: string;
  customerName: string;
  orderReference: string;
}

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  deliveredVia: ('EMAIL' | 'SMS')[];
  error?: string;
}

export interface EmailService {
  sendEmail(to: string, subject: string, htmlContent: string, attachments?: any[]): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

export interface SMSService {
  sendSMS(to: string, message: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

export class DeliveryService {
  constructor(
    private emailService?: EmailService,
    private smsService?: SMSService
  ) {}

  async deliverESIM(
    deliveryData: ESIMDeliveryData,
    deliveryMethod: DeliveryMethod
  ): Promise<DeliveryResult> {
    const result: DeliveryResult = {
      success: false,
      deliveredVia: [],
    };

    try {
      if (deliveryMethod.type === 'EMAIL' || deliveryMethod.type === 'BOTH') {
        if (!deliveryMethod.email) {
          throw new Error('Email address is required for email delivery');
        }
        
        const emailResult = await this.deliverViaEmail(deliveryData, deliveryMethod.email);
        if (emailResult.success) {
          result.deliveredVia.push('EMAIL');
          result.messageId = emailResult.messageId;
        } else {
          result.error = emailResult.error;
        }
      }

      if (deliveryMethod.type === 'SMS' || deliveryMethod.type === 'BOTH') {
        if (!deliveryMethod.phoneNumber) {
          throw new Error('Phone number is required for SMS delivery');
        }
        
        const smsResult = await this.deliverViaSMS(deliveryData, deliveryMethod.phoneNumber);
        if (smsResult.success) {
          result.deliveredVia.push('SMS');
          if (!result.messageId) {
            result.messageId = smsResult.messageId;
          }
        } else {
          if (!result.error) {
            result.error = smsResult.error;
          }
        }
      }

      result.success = result.deliveredVia.length > 0;
      return result;
    } catch (error: any) {
      console.error('Delivery service error:', error);
      return {
        success: false,
        deliveredVia: [],
        error: error.message || 'Failed to deliver eSIM',
      };
    }
  }

  private async deliverViaEmail(
    deliveryData: ESIMDeliveryData,
    email: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.emailService) {
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    try {
      const emailContent = await generateESIMEmailTemplate(deliveryData);

      // Send email with both HTML and text versions
      const result = await this.emailService.sendEmail(
        email,
        emailContent.subject,
        emailContent.html
      );

      console.log('Email delivery result:', result);
      return result;
    } catch (error: any) {
      console.error('Email delivery error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  private async deliverViaSMS(
    deliveryData: ESIMDeliveryData,
    phoneNumber: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.smsService) {
      return {
        success: false,
        error: 'SMS service not configured',
      };
    }

    try {
      const smsContent = this.generateSMSContent(deliveryData);
      const result = await this.smsService.sendSMS(phoneNumber, smsContent);

      console.log('SMS delivery result:', result);
      return result;
    } catch (error: any) {
      console.error('SMS delivery error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }
  }


  private generateSMSContent(deliveryData: ESIMDeliveryData): string {
    return `Your eSIM (${deliveryData.planName}) is ready! 

ICCID: ${deliveryData.iccid}
${deliveryData.activationCode ? `Code: ${deliveryData.activationCode}` : ''}

Install: ${deliveryData.qrCode}

Order: ${deliveryData.orderReference}

Questions? Contact support.`;
  }
}