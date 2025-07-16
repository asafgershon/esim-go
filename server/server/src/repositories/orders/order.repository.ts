import { supabaseAdmin } from '../../context/supabase-auth';
import type { Database } from '../../database.types';
import { GraphQLError } from 'graphql';
import { z } from 'zod';
import { BaseSupabaseRepository } from '../base-supabase.repository';
import type { ESIMGoOrder } from '../../datasources/esim-go';

type OrderRow = Database['public']['Tables']['esim_orders']['Row'];
type OrderInsert = Database['public']['Tables']['esim_orders']['Insert'];
type OrderUpdate = Database['public']['Tables']['esim_orders']['Update'];

// Zod enum for OrderStatus
export const OrderStatusEnum = z.enum([
  'COMPLETED',
  'PROCESSING',
  'FAILED',
  'CANCELLED',
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export class OrderRepository extends BaseSupabaseRepository<
  OrderRow,
  OrderInsert,
  OrderUpdate
> {
  constructor() {
    super('esim_orders');
  }

  protected async validateInsert(data: OrderInsert): Promise<void> {
    if (data.status) {
      this.validateStatus(data.status);
    }
  }

  protected async validateUpdate(data: OrderUpdate): Promise<void> {
    if (data.status) {
      this.validateStatus(data.status);
    }
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

  async getByReference(reference: string): Promise<OrderRow | null> {
    const { data: order, error } = await this.supabase
      .from('esim_orders')
      .select('*')
      .eq('reference', reference)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      this.handleError(error, 'fetching order by reference');
    }

    return order;
  }

  async getByUserId(userId: string, filters?: {
    status?: OrderRow['status'];
     limit?: number;
     offset?: number;
  }): Promise<OrderRow[]> {
    let query = this.supabase
      .from('esim_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data: orders, error } = await query;

    if (error) {
      this.handleError(error, 'fetching user orders');
    }

    return orders || [];
  }

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

  async getOrdersWithESIMs(userId: string): Promise<any[]> {
    const { data: orders, error } = await this.supabase
      .from('esim_orders')
      .select(`
        *,
        esims (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'fetching orders with eSIMs');
    }

    return orders || [];
  }

  async getOrderWithESIMs(orderId: string): Promise<OrderRow & { esims: Database['public']['Tables']['esims']['Row'][] } | null> {
    const { data: order, error } = await this.supabase
      .from('esim_orders')
      .select(`
        *,
        esims (*)
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      this.handleError(error, 'fetching order with eSIMs');
    }

    return order;
  }

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

    if (error) {
      this.handleError(error, 'fetching order summary');
    }

    const orders = summary || [];
    return {
      total: orders.length,
      completed: orders.filter(o => o.status === 'COMPLETED').length,
      processing: orders.filter(o => o.status === 'PROCESSING').length,
      failed: orders.filter(o => o.status === 'FAILED').length,
    };
  }
}