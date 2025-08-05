import { DistinctDuration } from '../types/bundle-types';
import { createClient } from '@supabase/supabase-js';

export class BundleRepository {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!, 
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Retrieve distinct bundle durations
   * @returns Promise resolving to an array of distinct durations
   */
  async getDistinctDurations(): Promise<DistinctDuration[]> {
    const { data, error } = await this.supabase.rpc('get_distinct_durations');

    if (error) {
      console.error('Error fetching distinct durations:', error);
      throw new Error('Failed to retrieve bundle durations');
    }

    return data as DistinctDuration[];
  }
}