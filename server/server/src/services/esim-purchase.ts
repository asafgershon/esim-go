import type { Context } from '../context/types';
import { createLogger } from '../lib/logger';
import { OrderRequestTypeEnum, BundleOrderTypeEnum } from '@esim-go/client';
import { cleanEnv, str } from 'envalid';

const env = cleanEnv(process.env, {
  ESIM_GO_MODE: str({ 
    desc: 'eSIM Go mode: mock or production', 
    default: 'mock',
    choices: ['mock', 'production']
  }),
});

const logger = createLogger({ component: 'esim-purchase' });

/**
 * Purchase and deliver eSIM after successful payment
 * Supports both mock mode (for testing) and production mode (real eSIM Go API)
 */
export async function purchaseAndDeliverESIM(
  orderId: string,
  bundleName: string,
  userId: string,
  email: string,
  context: Context
): Promise<void> {
  try {
    logger.info('Starting eSIM purchase', { 
      orderId, 
      bundleName, 
      userId,
      mode: env.ESIM_GO_MODE,
      operationType: 'esim-purchase' 
    });

    let esimData: {
      iccid: string;
      qrCode: string;
      activationCode: string;
      smdpAddress: string;
      matchingId: string;
      esimGoOrderRef?: string;
    };

    if (env.ESIM_GO_MODE === 'mock') {
      // Generate mock eSIM data for testing
      esimData = {
        iccid: `MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        qrCode: 'https://upload.wikimedia.org/wikipedia/commons/3/31/MM_QRcode.png',
        activationCode: `MOCK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        smdpAddress: 'mock.esim-go.com',
        matchingId: 'MOCK-MATCHING-ID',
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } else {
      // Real eSIM Go API call
      try {
        logger.info('Calling eSIM Go API to purchase bundle', {
          bundleName,
          operationType: 'esim-go-purchase'
        });

        const response = await context.services.esimGoClient.ordersApi.ordersPost({
          orderRequest: {
            type: OrderRequestTypeEnum.TRANSACTION,
            assign: true, // Auto-assign eSIM
            order: [{
              type: BundleOrderTypeEnum.BUNDLE,
              item: bundleName,
              quantity: 1,
            }]
          }
        });

        // Extract eSIM details from response
        const orderData = response.data?.order?.[0];
        const esimInfo = orderData?.esims?.[0];
        const iccid = esimInfo?.iccid;
        
        if (!iccid || !esimInfo) {
          throw new Error('No eSIM returned from eSIM Go API');
        }

        // Extract eSIM activation details from order response
        const matchingId = esimInfo.matchingId || '';
        const smdpAddress = esimInfo.smdpAddress || '';
        
        // Build LPA string for eSIM activation
        const lpaString = `LPA:1$${smdpAddress}$${matchingId}`;
        
        // Generate QR code URL using QR code generation service
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(lpaString)}&size=400x400`;

        esimData = {
          iccid,
          qrCode: qrCodeUrl,
          activationCode: matchingId, // The matching ID is the activation code
          smdpAddress,
          matchingId,
          esimGoOrderRef: response.data?.orderReference,
        };

        logger.info('eSIM purchased successfully from eSIM Go', {
          iccid,
          orderReference: esimData.esimGoOrderRef,
          operationType: 'esim-go-purchase-success'
        });

      } catch (error) {
        logger.error('eSIM Go API call failed', error as Error, {
          bundleName,
          operationType: 'esim-go-purchase-error'
        });
        throw error;
      }
    }

    // Save to esims table
    const esimRecord = await context.repositories.esims.create({
      user_id: userId,
      order_id: orderId,
      iccid: esimData.iccid,
      qr_code_url: esimData.qrCode,
      status: 'ASSIGNED',
      customer_ref: orderId,
      assigned_date: new Date().toISOString(),
      last_action: 'ASSIGNED',
      action_date: new Date().toISOString(),
      // Store activation details for later use
      matching_id: esimData.matchingId,
      smdp_address: esimData.smdpAddress,
      activation_code: esimData.activationCode,
    });

    // Update order status to COMPLETED
    await context.repositories.orders.updateStatus(orderId, 'COMPLETED');

    // Update order with eSIM Go reference if available
    if (esimData.esimGoOrderRef) {
      await context.repositories.orders.updateESIMGoReference(orderId, esimData.esimGoOrderRef);
    }

    // TODO: Send email with QR code (implement when email service is ready)
    logger.info('eSIM delivery email would be sent here', { 
      email, 
      qrCode: esimData.qrCode,
      operationType: 'email-delivery' 
    });

    logger.info('eSIM delivered successfully', { 
      orderId, 
      iccid: esimData.iccid,
      esimId: esimRecord.id,
      mode: env.ESIM_GO_MODE,
      operationType: 'esim-delivery-success' 
    });
  } catch (error) {
    // Log error but don't throw - we don't want to break the payment flow
    logger.error('eSIM delivery failed', error as Error, { 
      orderId,
      bundleName,
      mode: env.ESIM_GO_MODE,
      operationType: 'esim-delivery-error' 
    });
  }
}