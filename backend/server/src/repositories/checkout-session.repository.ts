import { GraphQLError } from 'graphql';
import { z } from 'zod';
import type { Database, Json } from '../types/database.types';
import { BaseSupabaseRepository } from './base-supabase.repository';

type CheckoutSessionRow =
  Database['public']['Tables']['checkout_sessions']['Row'];
type CheckoutSessionInsert =
  Database['public']['Tables']['checkout_sessions']['Insert'];
type CheckoutSessionUpdate =
  Database['public']['Tables']['checkout_sessions']['Update'];

// Define your Zod schemas
export const CheckoutSessionStepsSchema = z.object({
  authentication: z
    .object({
      completed: z.boolean(),
      completedAt: z.string().optional(),
      userId: z.string().optional(),
    })
    .optional(),
  delivery: z
    .object({
      completed: z.boolean(),
      completedAt: z.string().optional(),
      method: z.enum(['EMAIL', 'SMS', 'BOTH', 'QR']).optional(),
      email: z.string().optional(),
      phoneNumber: z.string().optional(),
    })
    .optional(),
  payment: z
    .object({
      completed: z.boolean(),
      completedAt: z.string().optional(),
      paymentMethodId: z.string().optional(),
      paymentMethodType: z.string().optional(),
      paymentIntentId: z.string().optional(),
      processing: z.boolean().optional(),
      processedAt: z.string().optional(),
      readyForPayment: z.boolean().optional(),
    })
    .optional(),
});
export type CheckoutSessionSteps = z.infer<typeof CheckoutSessionStepsSchema>;

export interface CheckoutSessionPricing {
  subtotal: number;
  taxes: number;
  fees: number;
  total: number;
  currency: string;
}

export interface CheckoutSessionPlanSnapshot {
  id: string;
  name: string;
  duration: number;
  price: number;
  discount: number;
  currency: string;
  countries: string[];
}

export class CheckoutSessionRepository extends BaseSupabaseRepository<
  CheckoutSessionRow,
  CheckoutSessionInsert,
  CheckoutSessionUpdate
> {
  constructor() {
    super('checkout_sessions');
  }

  protected async validateInsert(data: CheckoutSessionInsert): Promise<void> {
    if (data.steps) {
      this.validateSteps(data.steps);
    }
  }

  protected async validateUpdate(data: CheckoutSessionUpdate): Promise<void> {
    if (data.steps) {
      this.validateSteps(data.steps);
    }
  }

  private validateSteps(steps: Json) {
    try {
      CheckoutSessionStepsSchema.parse(steps);
    } catch (err) {
      throw new GraphQLError(
        `Invalid steps structure: ${(err as Error).message}`,
        { extensions: { code: 'INVALID_STEPS' } }
      );
    }
  }

  async getByTokenHash(tokenHash: string): Promise<CheckoutSessionRow | null> {
    const { data: session, error } = await this.supabase
      .from('checkout_sessions')
      .select('*')
      .eq('token_hash', tokenHash)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      this.handleError(error, 'fetching checkout session by token');
    }

    if (session?.steps) {
      this.validateSteps(session.steps);
    }

    return session;
  }

  async markCompleted(id: string, metadata: any): Promise<CheckoutSessionRow> {
    return this.update(id, {
      payment_status: 'SUCCEEDED',
      metadata,
      order_id: metadata.orderId,
    });
  }

  async updateTokenHash(id: string, tokenHash: string): Promise<void> {
    const { error } = await this.supabase
      .from('checkout_sessions')
      .update({ token_hash: tokenHash })
      .eq('id', id);

    if (error) {
      this.handleError(error, 'updating token hash');
    }
  }

  async updatePaymentProcessing(
    id: string,
    paymentIntentId: string,
    updatedSteps: CheckoutSessionSteps
  ): Promise<CheckoutSessionRow> {
    return this.update(id, {
      steps: updatedSteps as Json,
      payment_intent_id: paymentIntentId,
      payment_status: 'PROCESSING',
    });
  }

  async updatePaymentFailed(id: string, errorMessage?: string): Promise<CheckoutSessionRow> {
    return this.update(id, {
      payment_status: 'FAILED',
      metadata: errorMessage ? { error: errorMessage } : undefined,
    });
  }

  async isExpired(session: CheckoutSessionRow): Promise<boolean> {
    return new Date(session.expires_at) <= new Date();
  }

  async deleteExpired(): Promise<number> {
    const { count, error } = await this.supabase
      .from('checkout_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      this.handleError(error, 'deleting expired sessions');
    }

    return count || 0;
  }

  async findByPaymentIntent(paymentIntentId: string): Promise<CheckoutSessionRow | null> {
    const { data: session, error } = await this.supabase
      .from('checkout_sessions')
      .select('*')
      .eq('payment_intent_id', paymentIntentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      this.handleError(error, 'fetching checkout session by payment intent');
    }

    if (session?.steps) {
      this.validateSteps(session.steps);
    }

    return session;
  }

  async findExpired(): Promise<CheckoutSessionRow[]> {
    const { data: sessions, error } = await this.supabase
      .from('checkout_sessions')
      .select('*')
      .lt('expires_at', new Date().toISOString())
      .not('payment_status', 'eq', 'SUCCEEDED');

    if (error) {
      this.handleError(error, 'fetching expired sessions');
    }

    return sessions || [];
  }

  async withTransaction<T>(
    operation: (trx: any) => Promise<T>
  ): Promise<T> {
    // Supabase doesn't support transactions directly via the client SDK
    // For now, we'll execute the operation directly
    // In production, you might want to use raw SQL with BEGIN/COMMIT/ROLLBACK
    // or use a different approach for atomic operations
    return operation(this.supabase);
  }
}
