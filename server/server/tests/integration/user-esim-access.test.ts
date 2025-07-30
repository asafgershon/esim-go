import { describe, it, expect, beforeEach } from 'bun:test';
import { createTestClient } from '../utils/test-client';
import { gql } from 'graphql-tag';
import { supabaseAdmin } from '../../src/context/supabase-auth';

describe('User eSIM Access - Money Path', () => {
  let testClient: any;
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Create authenticated test user
    const { data: user } = await supabaseAdmin.auth.admin.createUser({
      email: 'test@example.com',
      password: 'password123',
      email_confirm: true,
    });
    userId = user.user.id;
    
    // Get auth token
    const { data: session } = await supabaseAdmin.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });
    authToken = session.session.access_token;
    
    testClient = createTestClient(authToken);
    
    // Seed test data - user has purchased an eSIM
    await supabaseAdmin.from('esim_orders').insert({
      id: 'order-123',
      user_id: userId,
      reference: 'REF-123',
      status: 'COMPLETED',
      data_plan_id: 'plan-uk-1gb',
      quantity: 1,
      total_price: 10,
      esim_go_order_ref: 'esimgo-order-123',
    });
    
    await supabaseAdmin.from('esims').insert({
      id: 'esim-123',
      user_id: userId,
      order_id: 'order-123',
      iccid: '89000000000000001234',
      status: 'ASSIGNED',
      qr_code_url: 'https://example.com/qr/esim-123',
      smdp_address: 'example.esimgo.com',
      matching_id: 'ABC123',
    });
  });

  it('should allow authenticated user to retrieve their purchased eSIMs', async () => {
    const GET_MY_ESIMS = gql`
      query GetMyESIMs {
        myESIMs {
          id
          iccid
          qrCode
          status
          smdpAddress
          matchingId
          order {
            id
            reference
            totalPrice
          }
        }
      }
    `;

    const { data, errors } = await testClient.query({
      query: GET_MY_ESIMS,
    });

    // User MUST be able to access their purchased eSIM
    expect(errors).toBeUndefined();
    expect(data.myESIMs).toHaveLength(1);
    
    const esim = data.myESIMs[0];
    expect(esim.id).toBe('esim-123');
    expect(esim.qrCode).toBe('https://example.com/qr/esim-123');
    expect(esim.status).toBe('ASSIGNED');
    expect(esim.smdpAddress).toBe('example.esimgo.com');
    expect(esim.matchingId).toBe('ABC123');
    expect(esim.order.totalPrice).toBe(10);
  });
});