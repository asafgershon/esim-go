import { GraphQLError } from 'graphql';

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
      const emailContent = this.generateEmailContent(deliveryData);
      const subject = `Your eSIM is Ready - ${deliveryData.planName}`;

      // In a real implementation, you might want to attach the QR code as an image
      const result = await this.emailService.sendEmail(
        email,
        subject,
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

  private generateEmailContent(deliveryData: ESIMDeliveryData): {
    html: string;
    text: string;
  } {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your eSIM is Ready</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .qr-section { text-align: center; margin: 20px 0; }
          .qr-code { max-width: 200px; border: 1px solid #ddd; }
          .instructions { background-color: #e9ecef; padding: 15px; border-radius: 5px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your eSIM is Ready!</h1>
            <p>Plan: ${deliveryData.planName}</p>
          </div>
          
          <div class="content">
            <p>Hello ${deliveryData.customerName},</p>
            
            <p>Your eSIM has been successfully provisioned and is ready for use. Here are your activation details:</p>
            
            <div class="qr-section">
              <h3>Installation QR Code</h3>
              <img src="${deliveryData.qrCode}" alt="eSIM QR Code" class="qr-code">
              <p><strong>ICCID:</strong> ${deliveryData.iccid}</p>
              ${deliveryData.activationCode ? `<p><strong>Activation Code:</strong> ${deliveryData.activationCode}</p>` : ''}
            </div>
            
            <div class="instructions">
              <h3>Installation Instructions</h3>
              <pre>${deliveryData.instructions}</pre>
            </div>
            
            <p><strong>Order Reference:</strong> ${deliveryData.orderReference}</p>
            
            <p>If you need assistance, please contact our support team.</p>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing eSIM Go!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Your eSIM is Ready!

Plan: ${deliveryData.planName}
ICCID: ${deliveryData.iccid}
${deliveryData.activationCode ? `Activation Code: ${deliveryData.activationCode}` : ''}

Installation Instructions:
${deliveryData.instructions}

Order Reference: ${deliveryData.orderReference}

QR Code: ${deliveryData.qrCode}

Thank you for choosing eSIM Go!
    `;

    return { html, text };
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