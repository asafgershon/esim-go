import { BaseSupabaseRepository } from './base-supabase.repository';
import { supabaseAdmin } from '../context/supabase-auth';
import { GraphQLError } from 'graphql';
import type { Database } from '../database.types';

type TripRow = Database['public']['Tables']['trips']['Row'];
type TripInsert = Database['public']['Tables']['trips']['Insert'];
type TripUpdate = Database['public']['Tables']['trips']['Update'];

export interface CreateTripInput {
  name: string;
  title: string;
  description: string;
  bundleName: string;
}

export interface UpdateTripInput {
  id: string;
  name: string;
  title: string;
  description: string;
  bundleName: string;
}

export class TripRepository extends BaseSupabaseRepository<TripRow, TripInsert, TripUpdate> {
  constructor() {
    super('trips');
  }

  async getAllTrips(): Promise<TripRow[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new GraphQLError(`Failed to fetch trips: ${error.message}`, {
          extensions: { code: 'FETCH_TRIPS_FAILED' },
        });
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching trips:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to fetch trips', {
        extensions: { code: 'INTERNAL_ERROR' },
      });
    }
  }

  async createTrip(input: CreateTripInput, userId: string): Promise<TripRow> {
    try {
      // Get bundle details from catalog to populate region and countries
      const { data: bundleData, error: bundleError } = await supabaseAdmin
        .from('catalog_bundles')
        .select('region, countries')
        .eq('esim_go_name', input.bundleName)
        .single();

      if (bundleError || !bundleData) {
        throw new GraphQLError(`Bundle not found: ${input.bundleName}`, {
          extensions: { code: 'BUNDLE_NOT_FOUND' },
        });
      }

      const { data, error } = await supabaseAdmin
        .from('trips')
        .insert({
          name: input.name,
          title: input.title,
          description: input.description,
          bundle_name: input.bundleName,
          region_id: bundleData.region || '',
          country_ids: bundleData.countries || [],
          created_by: userId,
        })
        .select()
        .single();

      if (error) {
        throw new GraphQLError(`Failed to create trip: ${error.message}`, {
          extensions: { code: 'CREATE_TRIP_FAILED' },
        });
      }

      return data;
    } catch (error) {
      console.error('Error creating trip:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to create trip', {
        extensions: { code: 'INTERNAL_ERROR' },
      });
    }
  }

  async updateTrip(input: UpdateTripInput, userId: string): Promise<TripRow> {
    try {
      // Get bundle details from catalog to populate region and countries
      const { data: bundleData, error: bundleError } = await supabaseAdmin
        .from('catalog_bundles')
        .select('region, countries')
        .eq('esim_go_name', input.bundleName)
        .single();

      if (bundleError || !bundleData) {
        throw new GraphQLError(`Bundle not found: ${input.bundleName}`, {
          extensions: { code: 'BUNDLE_NOT_FOUND' },
        });
      }

      const { data, error } = await supabaseAdmin
        .from('trips')
        .update({
          name: input.name,
          title: input.title,
          description: input.description,
          bundle_name: input.bundleName,
          region_id: bundleData.region || '',
          country_ids: bundleData.countries || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        throw new GraphQLError(`Failed to update trip: ${error.message}`, {
          extensions: { code: 'UPDATE_TRIP_FAILED' },
        });
      }

      if (!data) {
        throw new GraphQLError('Trip not found', {
          extensions: { code: 'TRIP_NOT_FOUND' },
        });
      }

      return data;
    } catch (error) {
      console.error('Error updating trip:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to update trip', {
        extensions: { code: 'INTERNAL_ERROR' },
      });
    }
  }

  async deleteTrip(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('trips')
        .delete()
        .eq('id', id);

      if (error) {
        throw new GraphQLError(`Failed to delete trip: ${error.message}`, {
          extensions: { code: 'DELETE_TRIP_FAILED' },
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting trip:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      return {
        success: false,
        error: 'Failed to delete trip',
      };
    }
  }

  async getTripById(id: string): Promise<TripRow | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('trips')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new GraphQLError(`Failed to get trip: ${error.message}`, {
          extensions: { code: 'GET_TRIP_FAILED' },
        });
      }

      return data;
    } catch (error) {
      console.error('Error getting trip by ID:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to get trip', {
        extensions: { code: 'INTERNAL_ERROR' },
      });
    }
  }
}