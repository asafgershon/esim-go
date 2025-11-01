import { GraphQLError } from 'graphql';
import { z } from 'zod';
import type { Database } from '../types/database.types';
import { BaseSupabaseRepository } from './base-supabase.repository';
import type { PricingBreakdown } from '../types';

type OrderRow = Database['public']['Tables']['esim_orders']['Row'];
type OrderInsert = Database['public']['Tables']['esim_orders']['Insert'];
type OrderUpdate = Database['public']['Tables']['esim_orders']['Update'];

// ---------------------------------------------
// ENUMS
// ---------------------------------------------
export const OrderStatusEnum = z.enum([
  'COMPLETED',
  'PROCESSING',
  'FAILED',
  'CANCELLED',
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

// ---------------------------------------------
// MAIN CLASS
// ---------------------------------------------
export class OrderRepository extends BaseSupabaseRepository<
  OrderRow,
  OrderInsert,
  OrderUpdate
> {
  constructor() {
    super('esim_orders');
  }

  // --------------------------
  // Validation helpers
  // --------------------------
  protected async validateInsert(data: OrderInsert): Promise<void> {
    if (data.status) this.validateStatus(data.status);
  }

  protected async validateUpdate(data: OrderUpdate): Promise<void> {
    if (data.status) this.validateStatus(data.status);
  }

  private validateStatus(status: string) {
    try {
      OrderStatusEnum.parse(status);
    } catch (err) {
      throw new GraphQLError(
        `Invalid order status: ${(err as Error).message}`,
        { extensions: { code: 'INVALID_ORDER_STATUS' } }
      );
    }
  }

  // --------------------------
  // Basic CRUD / Fetchers
  // --------------------------
  async getByReference(reference: string): Promise<OrderRow | null> {
    const { data: order, error } = await this.supabase
      .from('esim_orders')
      .select('*')
      .eq('reference', reference)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      this.handleError(error, 'fetching order by reference');
    }

    return order;
  }

  async getByUserId(
    userId: string,
    filters?: { status?: OrderRow['status']; limit?: number; offset?: number }
  ): Promise<OrderRow[]> {
    let query = this.supabase
      .from('esim_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset)
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1
      );

    const { data: orders, error } = await query;
    if (error) this.handleError(error, 'fetching user orders');

    return orders || [];
  }

  // --------------------------
  // Status updates
  // --------------------------
  async updateStatus(id: string, status: OrderRow['status']): Promise<OrderRow> {
    this.validateStatus(status);
    return this.update(id, { status });
  }

  async updateESIMGoReference(id: string, esimGoOrderRef: string): Promise<OrderRow> {
    return this.update(id, { esim_go_order_ref: esimGoOrderRef });
  }

  async markCompleted(id: string): Promise<OrderRow> {
    return this.updateStatus(id, 'COMPLETED');
  }

  async markFailed(id: string): Promise<OrderRow> {
    return this.updateStatus(id, 'FAILED');
  }

  async markCancelled(id: string): Promise<OrderRow> {
    return this.updateStatus(id, 'CANCELLED');
  }

  // --------------------------
  // Join helpers
  // --------------------------
  async getOrdersWithESIMs(userId: string): Promise<any[]> {
    const { data: orders, error } = await this.supabase
      .from('esim_orders')
      .select(`
        *,
        esims (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) this.handleError(error, 'fetching orders with eSIMs');
    return orders || [];
  }

  async getOrderWithESIMs(
    orderId: string
  ): Promise<(OrderRow & { esims: Database['public']['Tables']['esims']['Row'][] }) | null> {
    const { data: order, error } = await this.supabase
      .from('esim_orders')
      .select(`
        *,
        esims (
          id,
          iccid,
          qr_code_url,
          status,
          customer_ref,
          assigned_date,
          last_action,
          action_date,
          created_at,
          updated_at,
          user_id,
          order_id,
          activation_code,
          smdp_address,
          matching_id
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      this.handleError(error, 'fetching order with eSIMs');
    }

    return order;
  }

  // --------------------------
  // Stats / summaries
  // --------------------------
  async getOrderSummary(userId: string): Promise<{
    total: number;
    completed: number;
    processing: number;
    failed: number;
  }> {
    const { data: summary, error } = await this.supabase
      .from('esim_orders')
      .select('status')
      .eq('user_id', userId);

    if (error) this.handleError(error, 'fetching order summary');

    const orders = summary || [];
    return {
      total: orders.length,
      completed: orders.filter((o) => o.status === 'COMPLETED').length,
      processing: orders.filter((o) => o.status === 'PROCESSING').length,
      failed: orders.filter((o) => o.status === 'FAILED').length,
    };
  }

  // --------------------------
  // Pricing logic
  // --------------------------
  async createOrderWithPricing(
    orderData: Omit<OrderInsert, 'id' | 'created_at' | 'updated_at'>,
    pricingBreakdown: PricingBreakdown
  ): Promise<OrderRow> {
    const orderWithPricing = {
      ...orderData,
      pricing_breakdown: pricingBreakdown,
      total_price: pricingBreakdown.priceAfterDiscount,
    };

    return this.create(orderWithPricing);
  }

  async updateOrderPricing(
    id: string,
    pricingBreakdown: PricingBreakdown
  ): Promise<OrderRow> {
    return this.update(id, {
      pricing_breakdown: pricingBreakdown,
      total_price: pricingBreakdown.priceAfterDiscount,
    });
  }

  async getOrderWithPricing(
    id: string
  ): Promise<(OrderRow & { pricingBreakdown: PricingBreakdown }) | null> {
    const order = await this.getById(id);
    if (!order) return null;
    return {
      ...order,
      pricingBreakdown: order.pricing_breakdown as PricingBreakdown,
    };
  }

  // --------------------------
  // ✅ Create from session
  // --------------------------
  async createFromSession(
    session: any,
    easycardTransactionId: string
  ): Promise<OrderRow> {
    const orderData: OrderInsert = {
      user_id: session.auth?.userId || null,
      reference: easycardTransactionId,
      status: 'PROCESSING',
      data_plan_id: session.bundle?.externalId || null,
      quantity: 1,
      total_price: session.pricing?.finalPrice || 0,
      plan_data: session.bundle || {},
      pricing_breakdown: session.pricing || {},
    };

    const { data, error } = await this.supabase
      .from('esim_orders')
      .insert(orderData)
      .select()
      .single();

    if (error) this.handleError(error, 'creating order from session');
    return data;
  }
}
