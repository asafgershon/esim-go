import { supabaseAdmin } from '../../context/supabase-auth';
import type { CheckoutSession } from '../../types';
import { GraphQLError } from 'graphql';

export interface CheckoutSessionSteps {
  authentication?: {
    completed: boolean;
    completedAt?: string;
    userId?: string;
  };
  delivery?: {
    completed: boolean;
    completedAt?: string;
    method?: 'EMAIL' | 'SMS' | 'BOTH';
    email?: string;
    phoneNumber?: string;
  };
  payment?: {
    completed: boolean;
    completedAt?: string;
    paymentMethodId?: string;
    paymentMethodType?: string;
    paymentIntentId?: string;
    processing?: boolean;
    processedAt?: string;
    readyForPayment?: boolean;
  };
}

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
  currency: string;
  countries: string[];
}

export interface CreateCheckoutSessionData {
  user_id?: string;
  plan_id: string;
  plan_snapshot: CheckoutSessionPlanSnapshot;
  pricing: CheckoutSessionPricing;
  steps: CheckoutSessionSteps;
  expires_at: string;
  token_hash?: string;
  payment_intent_id?: string;
  payment_status?: string;
  metadata?: any;
}

export interface UpdateCheckoutSessionData {
  steps?: CheckoutSessionSteps;
  token_hash?: string;
  payment_intent_id?: string;
  payment_status?: string;
  metadata?: any;
  user_id?: string;
}

export interface CheckoutSessionData {
  id: string;
  user_id?: string;
  plan_id: string;
  plan_snapshot: CheckoutSessionPlanSnapshot;
  pricing: CheckoutSessionPricing;
  steps: CheckoutSessionSteps;
  expires_at: string;
  token_hash?: string;
  payment_intent_id?: string;
  payment_status?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export class CheckoutSessionRepository {
  async create(sessionData: CreateCheckoutSessionData): Promise<CheckoutSessionData> {
    const { data: session, error } = await supabaseAdmin
      .from('checkout_sessions')
      .insert({
        user_id: sessionData.user_id || null,
        plan_id: sessionData.plan_id,
        plan_snapshot: sessionData.plan_snapshot,
        pricing: sessionData.pricing,
        steps: sessionData.steps,
        expires_at: sessionData.expires_at,
        token_hash: sessionData.token_hash,
        payment_intent_id: sessionData.payment_intent_id,
        payment_status: sessionData.payment_status,
        metadata: sessionData.metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating checkout session:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return session;
  }

  async getById(id: string): Promise<CheckoutSessionData | null> {
    const { data: session, error } = await supabaseAdmin
      .from('checkout_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Database error fetching checkout session:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return session;
  }

  async getByTokenHash(tokenHash: string): Promise<CheckoutSessionData | null> {
    const { data: session, error } = await supabaseAdmin
      .from('checkout_sessions')
      .select('*')
      .eq('token_hash', tokenHash)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Database error fetching checkout session by token:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return session;
  }

  async update(id: string, updates: UpdateCheckoutSessionData): Promise<CheckoutSessionData> {
    const { data: updatedSession, error } = await supabaseAdmin
      .from('checkout_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating checkout session:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return updatedSession;
  }

  async markCompleted(id: string, metadata: any): Promise<CheckoutSessionData> {
    return this.update(id, {
      payment_status: 'SUCCEEDED',
      metadata,
    });
  }

  async updateTokenHash(id: string, tokenHash: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('checkout_sessions')
      .update({ token_hash: tokenHash })
      .eq('id', id);

    if (error) {
      console.error('Database error updating token hash:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }
  }

  async updatePaymentProcessing(
    id: string,
    paymentIntentId: string,
    updatedSteps: CheckoutSessionSteps
  ): Promise<CheckoutSessionData> {
    return this.update(id, {
      steps: updatedSteps,
      payment_intent_id: paymentIntentId,
      payment_status: 'PROCESSING',
    });
  }

  async updatePaymentFailed(id: string, errorMessage?: string): Promise<CheckoutSessionData> {
    return this.update(id, {
      payment_status: 'FAILED',
      metadata: errorMessage ? { error: errorMessage } : undefined,
    });
  }

  async isExpired(session: CheckoutSessionData): Promise<boolean> {
    return new Date(session.expires_at) <= new Date();
  }

  async deleteExpired(): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('checkout_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Database error deleting expired sessions:', error);
      throw new GraphQLError(`Database error: ${error.message}`, {
        extensions: { code: 'DATABASE_ERROR' },
      });
    }

    return count || 0;
  }
}