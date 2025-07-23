import { BaseSupabaseRepository } from './base-supabase.repository';
import { createLogger } from '../lib/logger';

const logger = createLogger({ component: 'HighDemandCountryRepository' });

export interface HighDemandCountryRow {
  id: string;
  country_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface HighDemandCountryInsert {
  country_id: string; // ISO country code (2 or 3 characters, e.g., 'US', 'GB', 'CYP')
  created_by: string;
}

export interface HighDemandCountryUpdate {
  updated_at?: string;
}

export class HighDemandCountryRepository extends BaseSupabaseRepository<
  HighDemandCountryRow,
  HighDemandCountryInsert,
  HighDemandCountryUpdate
> {
  constructor() {
    super('high_demand_countries');
  }

  protected async validateInsert(data: HighDemandCountryInsert): Promise<void> {
    if (!data.country_id || (data.country_id.length !== 2 && data.country_id.length !== 3)) {
      throw new Error('Country ID must be a valid ISO country code (2 or 3 characters)');
    }
    if (!data.created_by) {
      throw new Error('Created by user ID is required');
    }
  }

  /**
   * Get all high demand countries
   * @returns Array of country ISO codes that are marked as high demand
   */
  async getAllHighDemandCountries(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('country_id')
        .order('country_id');

      if (error) {
        this.handleError(error, 'fetching all high demand countries');
      }

      return (data || []).map((row: any) => row.country_id);
    } catch (error) {
      logger.error('Error fetching high demand countries', error as Error, {
        operationType: 'high-demand-countries-fetch'
      });
      throw error;
    }
  }

  /**
   * Check if a country is marked as high demand
   * @param countryId ISO country code
   * @returns True if the country is high demand
   */
  async isHighDemandCountry(countryId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('id')
        .eq('country_id', countryId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false; // Not found
        }
        this.handleError(error, `checking if country ${countryId} is high demand`);
      }

      return !!data;
    } catch (error) {
      logger.error('Error checking high demand status', error as Error, {
        countryId,
        operationType: 'high-demand-check'
      });
      throw error;
    }
  }

  /**
   * Add a country to high demand list
   * @param countryId ISO country code
   * @param createdBy User ID who is marking this country
   * @returns The created record
   */
  async addHighDemandCountry(countryId: string, createdBy: string): Promise<HighDemandCountryRow> {
    try {
      // Check if already exists to prevent duplicates
      const exists = await this.isHighDemandCountry(countryId);
      if (exists) {
        // Return existing record instead of throwing error
        const { data, error } = await this.supabase
          .from(this.tableName)
          .select('*')
          .eq('country_id', countryId)
          .single();

        if (error) {
          this.handleError(error, `fetching existing high demand country ${countryId}`);
        }

        return data as HighDemandCountryRow;
      }

      return await this.create({
        country_id: countryId,
        created_by: createdBy,
      });
    } catch (error) {
      logger.error('Error adding high demand country', error as Error, {
        countryId,
        createdBy,
        operationType: 'high-demand-add'
      });
      throw error;
    }
  }

  /**
   * Remove a country from high demand list
   * @param countryId ISO country code
   * @returns Success status and count of deleted records
   */
  async removeHighDemandCountry(countryId: string): Promise<{ success: boolean; count: number | null }> {
    try {
      const { count, error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('country_id', countryId);

      if (error) {
        this.handleError(error, `removing high demand country ${countryId}`);
      }

      return { success: !error, count };
    } catch (error) {
      logger.error('Error removing high demand country', error as Error, {
        countryId,
        operationType: 'high-demand-remove'
      });
      throw error;
    }
  }

  /**
   * Toggle high demand status for a country
   * @param countryId ISO country code
   * @param userId User ID who is toggling this status
   * @returns Object with success status and whether country is now high demand
   */
  async toggleHighDemandCountry(
    countryId: string, 
    userId: string
  ): Promise<{ success: boolean; isHighDemand: boolean; error?: string }> {
    try {
      const isCurrentlyHighDemand = await this.isHighDemandCountry(countryId);

      if (isCurrentlyHighDemand) {
        // Remove from high demand
        const result = await this.removeHighDemandCountry(countryId);
        return {
          success: result.success,
          isHighDemand: false,
        };
      } else {
        // Add to high demand
        await this.addHighDemandCountry(countryId, userId);
        return {
          success: true,
          isHighDemand: true,
        };
      }
    } catch (error) {
      logger.error('Error toggling high demand country', error as Error, {
        countryId,
        userId,
        operationType: 'high-demand-toggle'
      });
      return {
        success: false,
        isHighDemand: false,
        error: (error as Error).message,
      };
    }
  }
}