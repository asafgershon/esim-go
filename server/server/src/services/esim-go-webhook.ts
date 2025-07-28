import { supabaseAdmin } from "../context/supabase-auth";
import { GraphQLError } from "graphql";
import crypto from "crypto";
import { cleanEnv, str } from 'envalid';

const env = cleanEnv(process.env, {
  ESIM_GO_WEBHOOK_SECRET: str({ desc: 'The secret for the eSIM Go webhook' }),
});

/**
 * Verify webhook signature from eSIM Go
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Handle eSIM Go webhook events
 */
export async function handleESIMGoWebhook(
  body: any,
  signature?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Verify webhook signature if provided
    const webhookSecret = env.ESIM_GO_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(
        JSON.stringify(body),
        signature,
        webhookSecret
      );
      
      if (!isValid) {
        throw new GraphQLError('Invalid webhook signature', {
          extensions: { code: 'INVALID_SIGNATURE' },
        });
      }
    }

    // Handle different webhook events
    switch (body.event) {
      case 'order.completed':
        await handleOrderCompleted(body.data);
        break;
        
      case 'esim.assigned':
        await handleESIMAssigned(body.data);
        break;
        
      case 'esim.activated':
        await handleESIMActivated(body.data);
        break;
        
      case 'bundle.activated':
        await handleBundleActivated(body.data);
        break;
        
      case 'bundle.expired':
        await handleBundleExpired(body.data);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${body.event}`);
    }

    return {
      success: true,
      message: `Webhook event ${body.event} processed successfully`,
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    throw error;
  }
}

/**
 * Handle order completion - create eSIMs in database
 */
async function handleOrderCompleted(data: any) {
  const { order_reference, esims } = data;
  
  // Get order from database
  const { data: dbOrder } = await supabaseAdmin
    .from('esim_orders')
    .select('*')
    .eq('reference', order_reference)
    .single();
    
  if (!dbOrder) {
    console.error(`Order not found: ${order_reference}`);
    return;
  }

  // Update order status
  await supabaseAdmin
    .from('esim_orders')
    .update({ status: 'COMPLETED' })
    .eq('id', dbOrder.id);

  // Create eSIMs in database
  for (const esim of esims) {
    const { error } = await supabaseAdmin
      .from('esims')
      .insert({
        user_id: dbOrder.user_id,
        order_id: dbOrder.id,
        iccid: esim.iccid,
        customer_ref: esim.customer_ref,
        qr_code_url: esim.qr_code,
        status: esim.status || 'ASSIGNED',
        assigned_date: esim.assigned_date || new Date().toISOString(),
      });
      
    if (error) {
      console.error(`Error creating eSIM ${esim.iccid}:`, error);
    }
  }
}

/**
 * Handle eSIM assignment
 */
async function handleESIMAssigned(data: any) {
  const { iccid, qr_code, assigned_date } = data;
  
  await supabaseAdmin
    .from('esims')
    .update({
      qr_code_url: qr_code,
      status: 'ASSIGNED',
      assigned_date,
      last_action: 'ASSIGNED',
      action_date: assigned_date,
    })
    .eq('iccid', iccid);
}

/**
 * Handle eSIM activation
 */
async function handleESIMActivated(data: any) {
  const { iccid, activated_date } = data;
  
  await supabaseAdmin
    .from('esims')
    .update({
      status: 'ACTIVE',
      last_action: 'INSTALLED',
      action_date: activated_date,
    })
    .eq('iccid', iccid);
}

/**
 * Handle bundle activation
 */
async function handleBundleActivated(data: any) {
  const { iccid, bundle_name, start_date, end_date } = data;
  
  // Get eSIM from database
  const { data: dbESIM } = await supabaseAdmin
    .from('esims')
    .select('*, esim_orders!inner(*)')
    .eq('iccid', iccid)
    .single();
    
  if (!dbESIM) {
    console.error(`eSIM not found: ${iccid}`);
    return;
  }

  // Check if bundle already exists
  const { data: existingBundle } = await supabaseAdmin
    .from('esim_bundles')
    .select('id')
    .eq('esim_id', dbESIM.id)
    .eq('name', bundle_name)
    .single();

  if (existingBundle) {
    // Update existing bundle
    await supabaseAdmin
      .from('esim_bundles')
      .update({
        state: 'ACTIVE',
        start_date,
        end_date,
      })
      .eq('id', existingBundle.id);
  } else {
    // Create new bundle
    await supabaseAdmin
      .from('esim_bundles')
      .insert({
        esim_id: dbESIM.id,
        data_plan_id: dbESIM.esim_orders.data_plan_id || '',
        name: bundle_name,
        state: 'ACTIVE',
        start_date,
        end_date,
        remaining_data: null, // Unlimited
        used_data: 0,
      });
  }
}

/**
 * Handle bundle expiration
 */
async function handleBundleExpired(data: any) {
  const { iccid, bundle_name } = data;
  
  // Get eSIM from database
  const { data: dbESIM } = await supabaseAdmin
    .from('esims')
    .select('id')
    .eq('iccid', iccid)
    .single();
    
  if (!dbESIM) {
    console.error(`eSIM not found: ${iccid}`);
    return;
  }

  // Update bundle state
  await supabaseAdmin
    .from('esim_bundles')
    .update({ state: 'EXPIRED' })
    .eq('esim_id', dbESIM.id)
    .eq('name', bundle_name);
}