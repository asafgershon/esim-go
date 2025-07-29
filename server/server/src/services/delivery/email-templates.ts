import type { ESIMDeliveryData } from './delivery-service';
import { generateInstallationLinks } from '../../utils/esim.utils';

interface EmailTemplateData extends ESIMDeliveryData {
  installationLinks?: {
    universalLink: string;
    lpaScheme: string;
    manual: {
      smDpAddress: string;
      activationCode: string;
      confirmationCode: string | null;
    };
    qrCodeData: string;
  };
}

export function generateESIMEmailTemplate(data: EmailTemplateData): {
  html: string;
  text: string;
} {
  // Generate installation links if we have the necessary data
  const installationLinks = data.installationLinks || 
    (data.activationCode && data.smdpAddress ? generateInstallationLinks({
      smDpAddress: data.smdpAddress,
      activationCode: data.activationCode,
      confirmationCode: null
    }) : null);

  const html = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your eSIM is Ready - ${data.planName}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    /* Main styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f4f4f4;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    
    /* Mobile styles */
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; max-width: 100% !important; }
      .content { padding: 20px !important; }
      .button { width: 100% !important; max-width: 300px !important; }
      .qr-code { width: 200px !important; height: 200px !important; }
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body { background-color: #1a1a1a !important; }
      .email-body { background-color: #1a1a1a !important; }
      .content-box { background-color: #2d2d2d !important; color: #ffffff !important; }
      .text-muted { color: #cccccc !important; }
      .activation-box { background-color: #3d3d3d !important; border-color: #4d4d4d !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  <div class="email-body" style="background-color: #f4f4f4; padding: 20px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <table class="container" role="presentation" cellpadding="0" cellspacing="0" width="600" style="margin: 0 auto;">
            <!-- Header -->
            <tr>
              <td>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #4F46E5; border-radius: 12px 12px 0 0;">
                  <tr>
                    <td class="content" style="padding: 40px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Your eSIM is Ready!</h1>
                      <p style="margin: 10px 0 0; color: #E0E7FF; font-size: 18px;">${data.planName}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Main Content -->
            <tr>
              <td>
                <table class="content-box" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 0 0 12px 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td class="content" style="padding: 40px;">
                      <!-- Greeting -->
                      <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">
                        Hello ${data.customerName},
                      </p>
                      <p style="margin: 0 0 30px; font-size: 16px; color: #374151;">
                        Your eSIM has been successfully provisioned and is ready to use. Follow the instructions below to install it on your device.
                      </p>
                      
                      <!-- Order Details -->
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                        <tr>
                          <td style="padding: 15px; background-color: #F9FAFB; border-radius: 8px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                              <tr>
                                <td style="color: #6B7280; font-size: 14px;">Order Reference:</td>
                                <td style="text-align: right; color: #374151; font-size: 14px; font-weight: 600;">${data.orderReference}</td>
                              </tr>
                              <tr>
                                <td style="color: #6B7280; font-size: 14px; padding-top: 8px;">ICCID:</td>
                                <td style="text-align: right; color: #374151; font-size: 14px; font-family: monospace; padding-top: 8px;">${data.iccid}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Installation Methods -->
                      <h2 style="margin: 0 0 20px; font-size: 20px; color: #1F2937; font-weight: 600;">Choose Your Installation Method</h2>
                      
                      ${installationLinks ? `
                      <!-- Method 1: Direct Installation (iOS 17.4+) -->
                      <div style="margin-bottom: 25px; padding: 20px; background-color: #EEF2FF; border-radius: 8px; border: 1px solid #C7D2FE;">
                        <h3 style="margin: 0 0 10px; font-size: 16px; color: #4F46E5;">
                          <span style="background-color: #4F46E5; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px;">RECOMMENDED</span>
                          One-Click Installation (iOS 17.4+)
                        </h3>
                        <p style="margin: 0 0 15px; font-size: 14px; color: #6B7280;">
                          If you're on iPhone with iOS 17.4 or later, tap the button below to install directly:
                        </p>
                        <table role="presentation" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="background-color: #4F46E5; border-radius: 6px;">
                              <a href="${installationLinks.universalLink}" 
                                 style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500;">
                                Install eSIM Now
                              </a>
                            </td>
                          </tr>
                        </table>
                      </div>
                      ` : ''}
                      
                      <!-- Method 2: QR Code -->
                      <div style="margin-bottom: 25px; padding: 20px; background-color: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB;">
                        <h3 style="margin: 0 0 10px; font-size: 16px; color: #1F2937;">Scan QR Code</h3>
                        <p style="margin: 0 0 15px; font-size: 14px; color: #6B7280;">
                          Open your device settings and scan this QR code:
                        </p>
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td align="center">
                              <img src="${data.qrCode}" 
                                   alt="eSIM QR Code" 
                                   class="qr-code"
                                   style="width: 250px; height: 250px; border: 2px solid #E5E7EB; border-radius: 8px; background-color: white; padding: 10px;" />
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 15px 0 0; font-size: 12px; color: #9CA3AF; text-align: center;">
                          <strong>iOS:</strong> Settings → Cellular → Add eSIM → Use QR Code<br>
                          <strong>Android:</strong> Settings → Network → Mobile → Add → Scan QR
                        </p>
                      </div>
                      
                      ${installationLinks ? `
                      <!-- Method 3: Manual Installation -->
                      <div class="activation-box" style="margin-bottom: 25px; padding: 20px; background-color: #FFFBEB; border-radius: 8px; border: 1px solid #FEF3C7;">
                        <h3 style="margin: 0 0 10px; font-size: 16px; color: #92400E;">Manual Installation</h3>
                        <p style="margin: 0 0 15px; font-size: 14px; color: #92400E;">
                          If the above methods don't work, enter these details manually:
                        </p>
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FEF3C7; border-radius: 6px; padding: 15px;">
                          <tr>
                            <td>
                              <p style="margin: 0 0 8px; font-size: 12px; color: #92400E; font-weight: 600;">SM-DP+ Address:</p>
                              <p style="margin: 0 0 15px; font-size: 14px; color: #78350F; font-family: monospace; word-break: break-all;">
                                ${installationLinks.manual.smDpAddress}
                              </p>
                              
                              <p style="margin: 0 0 8px; font-size: 12px; color: #92400E; font-weight: 600;">Activation Code:</p>
                              <p style="margin: 0; font-size: 14px; color: #78350F; font-family: monospace; word-break: break-all;">
                                ${installationLinks.manual.activationCode}
                              </p>
                              
                              ${installationLinks.manual.confirmationCode ? `
                              <p style="margin: 15px 0 8px; font-size: 12px; color: #92400E; font-weight: 600;">Confirmation Code:</p>
                              <p style="margin: 0; font-size: 14px; color: #78350F; font-family: monospace;">
                                ${installationLinks.manual.confirmationCode}
                              </p>
                              ` : ''}
                            </td>
                          </tr>
                        </table>
                      </div>
                      ` : ''}
                      
                      <!-- Support -->
                      <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #E5E7EB; text-align: center;">
                        <p style="margin: 0 0 10px; font-size: 14px; color: #6B7280;">
                          Need help? Contact our support team:
                        </p>
                        <p style="margin: 0; font-size: 14px;">
                          <a href="mailto:support@esim-go.com" style="color: #4F46E5; text-decoration: none;">support@esim-go.com</a>
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding: 20px; text-align: center;">
                <p class="text-muted" style="margin: 0; font-size: 12px; color: #9CA3AF;">
                  © 2024 eSIM Go. All rights reserved.
                </p>
                <p class="text-muted" style="margin: 5px 0 0; font-size: 12px; color: #9CA3AF;">
                  This email was sent to you because you purchased an eSIM plan.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

  const text = `
Your eSIM is Ready!

Hello ${data.customerName},

Your eSIM has been successfully provisioned and is ready to use. Here are your activation details:

Plan: ${data.planName}
Order Reference: ${data.orderReference}
ICCID: ${data.iccid}

INSTALLATION INSTRUCTIONS:
${installationLinks ? `
Option 1: One-Click Installation (iOS 17.4+)
Visit this link on your iPhone: ${installationLinks.universalLink}

Option 2: Scan QR Code` : 'Scan QR Code:'}
Open your device settings and scan the QR code from the email.
- iOS: Settings → Cellular → Add eSIM → Use QR Code
- Android: Settings → Network → Mobile → Add → Scan QR

${installationLinks ? `Option 3: Manual Installation
SM-DP+ Address: ${installationLinks.manual.smDpAddress}
Activation Code: ${installationLinks.manual.activationCode}
${installationLinks.manual.confirmationCode ? `Confirmation Code: ${installationLinks.manual.confirmationCode}` : ''}` : ''}

QR Code URL: ${data.qrCode}

Need help? Contact our support team at support@esim-go.com

Thank you for choosing eSIM Go!

© 2024 eSIM Go. All rights reserved.
`;

  return { html, text };
}