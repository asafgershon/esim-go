import { BaseSupabaseRepository } from '../base-supabase.repository';
import { GraphQLError } from 'graphql';

export interface ProcessingFeeConfigurationRow {
  id: string;
  israeli_cards_rate: number;
  foreign_cards_rate: number;
  premium_diners_rate: number;
  premium_amex_rate: number;
  bit_payment_rate: number;
  fixed_fee_nis: number;
  fixed_fee_foreign: number;
  monthly_fixed_cost: number;
  bank_withdrawal_fee: number;
  monthly_minimum_fee: number;
  setup_cost: number;
  three_d_secure_fee: number;
  chargeback_fee: number;
  cancellation_fee: number;
  invoice_service_fee: number;
  apple_google_pay_fee: number;
  is_active: boolean;
  effective_from: string;
  effective_to?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  notes?: string;
}

export interface ProcessingFeeConfigurationInsert {
  israeli_cards_rate: number;
  foreign_cards_rate: number;
  premium_diners_rate: number;
  premium_amex_rate: number;
  bit_payment_rate: number;
  fixed_fee_nis: number;
  fixed_fee_foreign: number;
  monthly_fixed_cost: number;
  bank_withdrawal_fee: number;
  monthly_minimum_fee: number;
  setup_cost: number;
  three_d_secure_fee: number;
  chargeback_fee: number;
  cancellation_fee: number;
  invoice_service_fee: number;
  apple_google_pay_fee: number;
  is_active: boolean;
  effective_from: string;
  effective_to?: string;
  created_by: string;
  notes?: string;
}

export interface ProcessingFeeConfigurationUpdate {
  israeli_cards_rate?: number;
  foreign_cards_rate?: number;
  premium_diners_rate?: number;
  premium_amex_rate?: number;
  bit_payment_rate?: number;
  fixed_fee_nis?: number;
  fixed_fee_foreign?: number;
  monthly_fixed_cost?: number;
  bank_withdrawal_fee?: number;
  monthly_minimum_fee?: number;
  setup_cost?: number;
  three_d_secure_fee?: number;
  chargeback_fee?: number;
  cancellation_fee?: number;
  invoice_service_fee?: number;
  apple_google_pay_fee?: number;
  is_active?: boolean;
  effective_from?: string;
  effective_to?: string;
  notes?: string;
  updated_at?: string;
}

export class ProcessingFeeRepository extends BaseSupabaseRepository<
  ProcessingFeeConfigurationRow,
  ProcessingFeeConfigurationInsert,
  ProcessingFeeConfigurationUpdate
> {
  constructor() {
    super('processing_fee_configurations');
  }

  protected async validateInsert(data: ProcessingFeeConfigurationInsert): Promise<void> {
    if (data.israeli_cards_rate < 0 || data.israeli_cards_rate > 1) {
      throw new GraphQLError('Israeli cards rate must be between 0 and 1', {
        extensions: { code: 'INVALID_RATE' },
      });
    }

    if (data.foreign_cards_rate < 0 || data.foreign_cards_rate > 1) {
      throw new GraphQLError('Foreign cards rate must be between 0 and 1', {
        extensions: { code: 'INVALID_RATE' },
      });
    }

    if (new Date(data.effective_from) < new Date()) {
      console.warn('Processing fee configuration has effective_from date in the past');
    }

    if (data.effective_to && new Date(data.effective_to) <= new Date(data.effective_from)) {
      throw new GraphQLError('Effective to date must be after effective from date', {
        extensions: { code: 'INVALID_DATE_RANGE' },
      });
    }
  }

  protected async validateUpdate(data: ProcessingFeeConfigurationUpdate): Promise<void> {
    if (data.israeli_cards_rate !== undefined && (data.israeli_cards_rate < 0 || data.israeli_cards_rate > 1)) {
      throw new GraphQLError('Israeli cards rate must be between 0 and 1', {
        extensions: { code: 'INVALID_RATE' },
      });
    }

    if (data.foreign_cards_rate !== undefined && (data.foreign_cards_rate < 0 || data.foreign_cards_rate > 1)) {
      throw new GraphQLError('Foreign cards rate must be between 0 and 1', {
        extensions: { code: 'INVALID_RATE' },
      });
    }

    if (data.effective_from && data.effective_to && new Date(data.effective_to) <= new Date(data.effective_from)) {
      throw new GraphQLError('Effective to date must be after effective from date', {
        extensions: { code: 'INVALID_DATE_RANGE' },
      });
    }
  }

  /**
   * Get the currently active processing fee configuration
   */
  async getCurrentActive(): Promise<ProcessingFeeConfigurationRow | null> {
    const now = new Date().toISOString();
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .lte('effective_from', now)
      .or(`effective_to.is.null,effective_to.gte.${now}`)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No active configuration found
      }
      this.handleError(error, 'fetching current active processing fee configuration');
    }

    return data as ProcessingFeeConfigurationRow;
  }

  /**
   * Get all processing fee configurations with pagination
   */
  async getAll(
    limit: number = 10,
    offset: number = 0,
    includeInactive: boolean = false
  ): Promise<ProcessingFeeConfigurationRow[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .order('effective_from', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      this.handleError(error, 'fetching processing fee configurations');
    }

    return data as ProcessingFeeConfigurationRow[];
  }

  /**
   * Create a new processing fee configuration
   * Automatically deactivates any existing active configuration
   */
  async create(insertData: ProcessingFeeConfigurationInsert): Promise<ProcessingFeeConfigurationRow> {
    await this.validateInsert(insertData);

    // Start a transaction to deactivate existing active configuration and create new one
    try {
      // First, deactivate any existing active configuration
      if (insertData.is_active) {
        await this.deactivateAllActive();
      }

      // Then create the new configuration
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'creating processing fee configuration');
      }

      return data as ProcessingFeeConfigurationRow;
    } catch (error) {
      console.error('Error creating processing fee configuration:', error);
      throw error;
    }
  }

  /**
   * Update an existing configuration by creating a new version and deactivating the old one
   * This maintains a full audit trail of changes
   */
  async update(id: string, updates: ProcessingFeeConfigurationUpdate): Promise<ProcessingFeeConfigurationRow> {
    await this.validateUpdate(updates);

    // Get the existing configuration
    const existing = await this.getById(id);
    if (!existing) {
      throw new GraphQLError('Processing fee configuration not found', {
        extensions: { code: 'CONFIGURATION_NOT_FOUND' },
      });
    }

    // Create a new configuration with updated values
    const newConfiguration: ProcessingFeeConfigurationInsert = {
      israeli_cards_rate: updates.israeli_cards_rate ?? existing.israeli_cards_rate,
      foreign_cards_rate: updates.foreign_cards_rate ?? existing.foreign_cards_rate,
      premium_diners_rate: updates.premium_diners_rate ?? existing.premium_diners_rate,
      premium_amex_rate: updates.premium_amex_rate ?? existing.premium_amex_rate,
      bit_payment_rate: updates.bit_payment_rate ?? existing.bit_payment_rate,
      fixed_fee_nis: updates.fixed_fee_nis ?? existing.fixed_fee_nis,
      fixed_fee_foreign: updates.fixed_fee_foreign ?? existing.fixed_fee_foreign,
      monthly_fixed_cost: updates.monthly_fixed_cost ?? existing.monthly_fixed_cost,
      bank_withdrawal_fee: updates.bank_withdrawal_fee ?? existing.bank_withdrawal_fee,
      monthly_minimum_fee: updates.monthly_minimum_fee ?? existing.monthly_minimum_fee,
      setup_cost: updates.setup_cost ?? existing.setup_cost,
      three_d_secure_fee: updates.three_d_secure_fee ?? existing.three_d_secure_fee,
      chargeback_fee: updates.chargeback_fee ?? existing.chargeback_fee,
      cancellation_fee: updates.cancellation_fee ?? existing.cancellation_fee,
      invoice_service_fee: updates.invoice_service_fee ?? existing.invoice_service_fee,
      apple_google_pay_fee: updates.apple_google_pay_fee ?? existing.apple_google_pay_fee,
      is_active: updates.is_active ?? existing.is_active,
      effective_from: updates.effective_from ?? new Date().toISOString(),
      effective_to: updates.effective_to,
      created_by: existing.created_by, // Keep original creator
      notes: updates.notes ?? existing.notes,
    };

    try {
      // Deactivate the old configuration
      await this.deactivate(id);

      // Create the new configuration
      return await this.create(newConfiguration);
    } catch (error) {
      console.error('Error updating processing fee configuration:', error);
      throw error;
    }
  }

  /**
   * Deactivate a processing fee configuration
   */
  async deactivate(id: string): Promise<ProcessingFeeConfigurationRow> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        is_active: false,
        effective_to: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'deactivating processing fee configuration');
    }

    return data as ProcessingFeeConfigurationRow;
  }

  /**
   * Deactivate all currently active configurations
   * Used internally when creating a new active configuration
   */
  private async deactivateAllActive(): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({
        is_active: false,
        effective_to: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('is_active', true);

    if (error) {
      this.handleError(error, 'deactivating all active processing fee configurations');
    }
  }

  /**
   * Get processing rate for a specific payment method
   * This is the main method used by the pricing service
   */
  async getProcessingRate(paymentMethod: 'israeli_card' | 'foreign_card' | 'bit' | 'amex' | 'diners' = 'israeli_card'): Promise<number> {
    const activeConfig = await this.getCurrentActive();
    
    if (!activeConfig) {
      // Fallback to default rate if no active configuration
      console.warn('No active processing fee configuration found, using default rate');
      return 0.045; // Default 4.5%
    }

    switch (paymentMethod) {
      case 'israeli_card':
        return activeConfig.israeli_cards_rate;
      case 'foreign_card':
        return activeConfig.foreign_cards_rate;
      case 'bit':
        return activeConfig.bit_payment_rate;
      case 'amex':
        return activeConfig.foreign_cards_rate + activeConfig.premium_amex_rate;
      case 'diners':
        return activeConfig.foreign_cards_rate + activeConfig.premium_diners_rate;
      default:
        return activeConfig.israeli_cards_rate;
    }
  }
}