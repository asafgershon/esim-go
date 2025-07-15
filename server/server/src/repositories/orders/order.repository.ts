import { supabaseAdmin } from '../../context/supabase-auth';
import type { Order, OrderStatus } from '../../types';
import { GraphQLError } from 'graphql';

export interface CreateOrderData {
  user_id: string;
  reference: string;
  status: OrderStatus;
  plan_data?: any; // JSONB field for flexible plan storage
  quantity: number;
  total_price: number;
  esim_go_order_ref?: string;
}

export interface OrderData {
  id: string;
  user_id: string;
  reference: string;
  status: OrderStatus;
  data_plan_id?: string;
  plan_data?: any;
  quantity: number;
  total_price: number;
  esim_go_order_ref?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateOrderData {
  status?: OrderStatus;
  plan_data?: any;
  esim_go_order_ref?: string;
}

export class OrderRepository {
  async create(orderData: CreateOrderData): Promise<OrderData> {
    const { data: order, error } = await supabaseAdmin
      .from('esim_orders')
      .insert({
        user_id: orderData.user_id,
        reference: orderData.reference,
        status: orderData.status,
        plan_data: orderData.plan_data,
        quantity: orderData.quantity,
        total_price: orderData.total_price,
        esim_go_order_ref: orderData.esim_go_order_ref,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating order:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return order;
  }

  async getById(id: string): Promise<OrderData | null> {
    const { data: order, error } = await supabaseAdmin
      .from('esim_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Database error fetching order:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return order;
  }

  async getByReference(reference: string): Promise<OrderData | null> {
    const { data: order, error } = await supabaseAdmin
      .from('esim_orders')
      .select('*')
      .eq('reference', reference)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Database error fetching order by reference:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return order;
  }

  async getByUserId(userId: string, filters?: {
    status?: OrderStatus;
    limit?: number;
    offset?: number;
  }): Promise<OrderData[]> {
    let query = supabaseAdmin
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
      console.error('Database error fetching user orders:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return orders || [];
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderData> {
    const { data: updatedOrder, error } = await supabaseAdmin
      .from('esim_orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating order status:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return updatedOrder;
  }

  async update(id: string, updates: UpdateOrderData): Promise<OrderData> {
    const { data: updatedOrder, error } = await supabaseAdmin
      .from('esim_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating order:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return updatedOrder;
  }

  async updateESIMGoReference(id: string, esimGoOrderRef: string): Promise<OrderData> {
    return this.update(id, { esim_go_order_ref: esimGoOrderRef });
  }

  async markCompleted(id: string): Promise<OrderData> {
    return this.updateStatus(id, 'COMPLETED' as OrderStatus);
  }

  async markFailed(id: string): Promise<OrderData> {
    return this.updateStatus(id, 'FAILED' as OrderStatus);
  }

  async markCancelled(id: string): Promise<OrderData> {
    return this.updateStatus(id, 'CANCELLED' as OrderStatus);
  }

  async getOrdersWithESIMs(userId: string): Promise<any[]> {
    const { data: orders, error } = await supabaseAdmin
      .from('esim_orders')
      .select(`
        *,
        esims (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error fetching orders with eSIMs:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return orders || [];
  }

  async getOrderSummary(userId: string): Promise<{
    total: number;
    completed: number;
    processing: number;
    failed: number;
  }> {
    const { data: summary, error } = await supabaseAdmin
      .from('esim_orders')
      .select('status')
      .eq('user_id', userId);

    if (error) {
      console.error('Database error fetching order summary:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
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