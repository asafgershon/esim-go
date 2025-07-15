import { supabaseAdmin } from '../../context/supabase-auth';
import type { Esim, EsimStatus } from '../../types';
import { GraphQLError } from 'graphql';

export interface CreateESIMData {
  user_id: string;
  order_id: string;
  iccid: string;
  customer_ref: string;
  qr_code_url: string;
  status: EsimStatus;
  assigned_date?: string;
  last_action?: string;
  action_date?: string;
}

export interface ESIMData {
  id: string;
  user_id: string;
  order_id: string;
  iccid: string;
  customer_ref: string;
  qr_code_url: string;
  status: EsimStatus;
  assigned_date?: string;
  last_action?: string;
  action_date?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateESIMData {
  status?: EsimStatus;
  last_action?: string;
  action_date?: string;
  qr_code_url?: string;
  customer_ref?: string;
}

export class ESIMRepository {
  async create(esimData: CreateESIMData): Promise<ESIMData> {
    const { data: esim, error } = await supabaseAdmin
      .from('esims')
      .insert({
        user_id: esimData.user_id,
        order_id: esimData.order_id,
        iccid: esimData.iccid,
        customer_ref: esimData.customer_ref,
        qr_code_url: esimData.qr_code_url,
        status: esimData.status,
        assigned_date: esimData.assigned_date || new Date().toISOString(),
        last_action: esimData.last_action || 'ASSIGNED',
        action_date: esimData.action_date || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating eSIM:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return esim;
  }

  async getById(id: string): Promise<ESIMData | null> {
    const { data: esim, error } = await supabaseAdmin
      .from('esims')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Database error fetching eSIM:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return esim;
  }

  async getByICCID(iccid: string): Promise<ESIMData | null> {
    const { data: esim, error } = await supabaseAdmin
      .from('esims')
      .select('*')
      .eq('iccid', iccid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Database error fetching eSIM by ICCID:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return esim;
  }

  async getByOrderId(orderId: string): Promise<ESIMData[]> {
    const { data: esims, error } = await supabaseAdmin
      .from('esims')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error fetching eSIMs by order ID:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return esims || [];
  }

  async getByUserId(userId: string, filters?: {
    status?: EsimStatus;
    limit?: number;
    offset?: number;
  }): Promise<ESIMData[]> {
    let query = supabaseAdmin
      .from('esims')
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

    const { data: esims, error } = await query;

    if (error) {
      console.error('Database error fetching user eSIMs:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return esims || [];
  }

  async updateStatus(id: string, status: EsimStatus, action?: string): Promise<ESIMData> {
    const updates: UpdateESIMData = {
      status,
      action_date: new Date().toISOString(),
    };

    if (action) {
      updates.last_action = action;
    }

    return this.update(id, updates);
  }

  async update(id: string, updates: UpdateESIMData): Promise<ESIMData> {
    const { data: updatedESIM, error } = await supabaseAdmin
      .from('esims')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating eSIM:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return updatedESIM;
  }

  async updateByICCID(iccid: string, updates: UpdateESIMData): Promise<ESIMData> {
    const { data: updatedESIM, error } = await supabaseAdmin
      .from('esims')
      .update(updates)
      .eq('iccid', iccid)
      .select()
      .single();

    if (error) {
      console.error('Database error updating eSIM by ICCID:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return updatedESIM;
  }

  async markActive(id: string): Promise<ESIMData> {
    return this.updateStatus(id, 'ACTIVE' as EsimStatus, 'INSTALLED');
  }

  async markSuspended(id: string): Promise<ESIMData> {
    return this.updateStatus(id, 'SUSPENDED' as EsimStatus, 'SUSPENDED');
  }

  async markRestored(id: string): Promise<ESIMData> {
    return this.updateStatus(id, 'ACTIVE' as EsimStatus, 'RESTORED');
  }

  async markCancelled(id: string): Promise<ESIMData> {
    return this.updateStatus(id, 'CANCELLED' as EsimStatus, 'CANCELLED');
  }

  async markExpired(id: string): Promise<ESIMData> {
    return this.updateStatus(id, 'EXPIRED' as EsimStatus, 'EXPIRED');
  }

  async getESIMsWithOrders(userId: string): Promise<any[]> {
    const { data: esims, error } = await supabaseAdmin
      .from('esims')
      .select(`
        *,
        esim_orders (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error fetching eSIMs with orders:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return esims || [];
  }

  async getESIMsWithBundles(userId: string): Promise<any[]> {
    const { data: esims, error } = await supabaseAdmin
      .from('esims')
      .select(`
        *,
        esim_bundles (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error fetching eSIMs with bundles:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return esims || [];
  }

  async getESIMStatusSummary(userId: string): Promise<{
    total: number;
    active: number;
    assigned: number;
    suspended: number;
    expired: number;
    cancelled: number;
  }> {
    const { data: summary, error } = await supabaseAdmin
      .from('esims')
      .select('status')
      .eq('user_id', userId);

    if (error) {
      console.error('Database error fetching eSIM status summary:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    const esims = summary || [];
    return {
      total: esims.length,
      active: esims.filter(e => e.status === 'ACTIVE').length,
      assigned: esims.filter(e => e.status === 'ASSIGNED').length,
      suspended: esims.filter(e => e.status === 'SUSPENDED').length,
      expired: esims.filter(e => e.status === 'EXPIRED').length,
      cancelled: esims.filter(e => e.status === 'CANCELLED').length,
    };
  }

  async bulkUpdateStatus(
    iccids: string[],
    status: EsimStatus,
    action?: string
  ): Promise<ESIMData[]> {
    const updates: UpdateESIMData = {
      status,
      action_date: new Date().toISOString(),
    };

    if (action) {
      updates.last_action = action;
    }

    const { data: updatedESIMs, error } = await supabaseAdmin
      .from('esims')
      .update(updates)
      .in('iccid', iccids)
      .select();

    if (error) {
      console.error('Database error bulk updating eSIMs:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return updatedESIMs || [];
  }
}