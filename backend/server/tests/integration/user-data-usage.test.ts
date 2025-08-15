import { describe, it, expect, beforeEach } from 'bun:test';
import { createTestClient } from '../utils/test-client';
import { gql } from 'graphql-tag';
import { supabaseAdmin } from '../../src/context/supabase-auth';

describe('User Data Usage Display - Money Path', () => {
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
    
    // Seed test data - user has an active eSIM with usage
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
      status: 'ACTIVE',
      qr_code_url: 'https://example.com/qr/esim-123',
    });
  });

  it('should display current data usage for active eSIM', async () => {
    const GET_ACTIVE_ESIM_USAGE = gql`
      query GetActiveESIMUsage {
        myESIMs {
          id
          status
          usage {
            totalUsed
            totalRemaining
            activeBundles {
              name
              state
              dataUsed
              dataRemaining
              startDate
              endDate
            }
          }
          bundles {
            state
            dataUsed
            dataRemaining
            startDate
            endDate
          }
        }
      }
    `;

    // Mock eSIM Go API response for usage data
    // In real test, this would be mocked at the datasource level
    const mockUsageData = {
      totalUsed: 256, // MB
      totalRemaining: 768, // MB
      activeBundles: [{
        name: 'UK 1GB Bundle',
        state: 'ACTIVE',
        dataUsed: 256,
        dataRemaining: 768,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }]
    };

    const { data, errors } = await testClient.query({
      query: GET_ACTIVE_ESIM_USAGE,
    });

    // User MUST be able to see their data usage
    expect(errors).toBeUndefined();
    expect(data.myESIMs).toHaveLength(1);
    
    const esim = data.myESIMs[0];
    expect(esim.status).toBe('ACTIVE');
    
    // Critical usage information must be present
    expect(esim.usage).toBeDefined();
    expect(esim.usage.totalUsed).toBeGreaterThanOrEqual(0);
    expect(esim.usage.totalRemaining).toBeGreaterThanOrEqual(0);
    
    // Active bundle information must be available
    expect(esim.usage.activeBundles).toBeDefined();
    expect(esim.usage.activeBundles.length).toBeGreaterThan(0);
    
    const activeBundle = esim.usage.activeBundles[0];
    expect(activeBundle.state).toBe('ACTIVE');
    expect(activeBundle.dataUsed).toBeGreaterThanOrEqual(0);
    expect(activeBundle.dataRemaining).toBeGreaterThanOrEqual(0);
  });
});