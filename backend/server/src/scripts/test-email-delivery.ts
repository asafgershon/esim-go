#!/usr/bin/env bun
/**
 * Test script for email delivery functionality
 * Usage: bun run src/scripts/test-email-delivery.ts [email]
 */

import { createDeliveryService, type ESIMDeliveryData } from '../services/delivery';
import { generateInstallationLinks } from '../utils/esim.utils';
import { createLogger } from '../lib/logger';

const logger = createLogger({ component: 'test-email-delivery' });

async function testEmailDelivery(email?: string) {
  const testEmail = email || process.argv[2] || 'test@example.com';
  
  logger.info('Starting email delivery test', { 
    email: testEmail,
    emailMode: process.env.EMAIL_MODE || 'mock',
    operationType: 'test-start'
  });

  try {
    // Create delivery service
    const deliveryService = createDeliveryService();
    
    // Generate test eSIM data
    const testData: ESIMDeliveryData = {
      esimId: 'test-esim-123',
      iccid: '89000000000000000001',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?data=LPA%3A1%24mock.esim-go.com%24TEST-ACTIVATION-123&size=400x400',
      activationCode: 'TEST-ACTIVATION-123',
      smdpAddress: 'mock.esim-go.com',
      matchingId: 'TEST-MATCHING-123',
      instructions: `Test Installation Instructions:
1. Go to Settings > Cellular > Add eSIM
2. Select "Use QR Code" 
3. Scan the QR code or enter details manually
4. Follow the on-screen instructions to complete setup`,
      planName: 'Test eSIM Plan - 10GB/30 Days',
      customerName: 'Test Customer',
      orderReference: 'TEST-ORDER-123',
    };
    
    // Test installation links generation
    const installationLinks = generateInstallationLinks({
      smDpAddress: testData.smdpAddress!,
      activationCode: testData.matchingId!,
      confirmationCode: null
    });
    
    logger.info('Generated installation links', {
      universalLink: installationLinks.universalLink,
      lpaScheme: installationLinks.lpaScheme,
      operationType: 'links-generated'
    });
    
    // Send test email
    const result = await deliveryService.deliverESIM(testData, {
      type: 'EMAIL',
      email: testEmail,
    });
    
    if (result.success) {
      logger.info('✅ Email delivery test successful', {
        email: testEmail,
        messageId: result.messageId,
        deliveredVia: result.deliveredVia,
        operationType: 'test-success'
      });
      
      console.log(`
✅ Email Delivery Test Successful!
---------------------------------
Email sent to: ${testEmail}
Message ID: ${result.messageId}
Delivery Method: ${result.deliveredVia.join(', ')}

Next steps:
1. Check your email inbox for the test message
2. Verify the email formatting looks correct
3. Test the QR code and activation links
4. For SES mode, check AWS SES console for delivery status
`);
    } else {
      logger.error('❌ Email delivery test failed', undefined, {
        email: testEmail,
        error: result.error,
        operationType: 'test-failed'
      });
      
      console.error(`
❌ Email Delivery Test Failed!
-----------------------------
Error: ${result.error}

Troubleshooting:
1. Check EMAIL_MODE environment variable (current: ${process.env.EMAIL_MODE || 'mock'})
2. For SES mode, verify AWS credentials are configured
3. For SES mode, ensure sender email is verified in SES
4. Check logs for detailed error information
`);
      process.exit(1);
    }
  } catch (error) {
    logger.error('Test script error', error as Error, {
      operationType: 'test-error'
    });
    
    console.error('❌ Test script error:', error);
    process.exit(1);
  }
}

// Run the test
testEmailDelivery().catch(console.error);