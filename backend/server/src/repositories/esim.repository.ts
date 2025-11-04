import { GraphQLError } from 'graphql';
import { z } from 'zod';
import type { Database } from '../../src/types/database.types';
import { BaseSupabaseRepository } from './base-supabase.repository';

// Zod enum for eSIM status
export const EsimStatusEnum = z.string().min(1);
export type EsimStatus = z.infer<typeof EsimStatusEnum>;

type EsimRow = Database['public']['Tables']['esims']['Row'];
type EsimInsert = Database['public']['Tables']['esims']['Insert'];
type EsimUpdate = Database['public']['Tables']['esims']['Update'];

export class ESIMRepository extends BaseSupabaseRepository<
  EsimRow,
  EsimInsert,
  EsimUpdate
> {
  constructor() {
    super('esims');
  }

  protected async validateInsert(data: EsimInsert): Promise<void> {
    if (data.status) {
      this.validateStatus(data.status);
    }
  }

  protected async validateUpdate(data: EsimUpdate): Promise<void> {
    if (data.status) {
      this.validateStatus(data.status);
    }
  }

  private validateStatus(status: string) {
    try {
      EsimStatusEnum.parse(status);
    } catch (err) {
      throw new GraphQLError(
        `Invalid eSIM status: ${(err as Error).message}`,
        { extensions: { code: 'INVALID_ESIM_STATUS' } }
      );
    }
  }

  async create(esimData: EsimInsert): Promise<EsimRow> {
    const dataWithDefaults = {
      ...esimData,
      assigned_date: esimData.assigned_date || new Date().toISOString(),
      last_action: esimData.last_action || 'ASSIGNED',
      action_date: esimData.action_date || new Date().toISOString(),
    };
    return super.create(dataWithDefaults);
  }

  async getByICCID(iccid: string): Promise<EsimRow | null> {
    const { data: esim, error } = await this.supabase
      .from('esims')
      .select('*')
      .eq('iccid', iccid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      this.handleError(error, 'fetching eSIM by ICCID');
    }

    return esim;
  }

  async getByOrderId(orderId: string): Promise<EsimRow[]> {
    const { data: esims, error } = await this.supabase
      .from('esims')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'fetching eSIMs by order ID');
    }

    return esims || [];
  }

  async getByUserId(userId: string, filters?: {
    status?: EsimRow['status'];
     limit?: number;
     offset?: number;
  }): Promise<EsimRow[]> {
    let query = this.supabase
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
      this.handleError(error, 'fetching user eSIMs');
    }

    return esims || [];
  }

  async updateStatus(id: string, status: EsimRow['status'], action?: string): Promise<EsimRow> {
    this.validateStatus(status);

    const updates: EsimUpdate = {
      status,
      action_date: new Date().toISOString(),
    };

    if (action) {
      updates.last_action = action;
    }

    return this.update(id, updates);
  }

  async updateByICCID(iccid: string, updates: EsimUpdate): Promise<EsimRow> {
    await this.validateUpdate(updates);
    const { data: updatedESIM, error } = await this.supabase
      .from('esims')
      .update(updates)
      .eq('iccid', iccid)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'updating eSIM by ICCID');
    }

    return updatedESIM;
  }

  async markActive(id: string): Promise<EsimRow> {
    return this.updateStatus(id, 'ACTIVE', 'INSTALLED');
  }

  async markSuspended(id: string): Promise<EsimRow> {
    return this.updateStatus(id, 'SUSPENDED', 'SUSPENDED');
  }

  async markRestored(id: string): Promise<EsimRow> {
    return this.updateStatus(id, 'ACTIVE', 'RESTORED');
  }

  async markCancelled(id: string): Promise<EsimRow> {
    return this.updateStatus(id, 'CANCELLED', 'CANCELLED');
  }

  async markExpired(id: string): Promise<EsimRow> {
    return this.updateStatus(id, 'EXPIRED', 'EXPIRED');
  }

  async getESIMsWithOrders(userId: string): Promise<any[]> {
    const { data: esims, error } = await this.supabase
      .from('esims')
      .select(`
        *,
        esim_orders (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'fetching eSIMs with orders');
    }

    return esims || [];
  }

  async getESIMsWithBundles(userId: string): Promise<any[]> {
    const { data: esims, error } = await this.supabase
      .from('esims')
      .select(`
        *,
        esim_bundles (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'fetching eSIMs with bundles');
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
    const { data: summary, error } = await this.supabase
      .from('esims')
      .select('status')
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'fetching eSIM status summary');
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
    status: EsimRow['status'],
    action?: string
  ): Promise<EsimRow[]> {
    this.validateStatus(status);
    const updates: EsimUpdate = {
      status,
      action_date: new Date().toISOString(),
    };

    if (action) {
      updates.last_action = action;
    }

    const { data: updatedESIMs, error } = await this.supabase
      .from('esims')
      .update(updates)
      .in('iccid', iccids)
      .select();

    if (error) {
      this.handleError(error, 'bulk updating eSIMs');
    }

    return updatedESIMs || [];
  }
}