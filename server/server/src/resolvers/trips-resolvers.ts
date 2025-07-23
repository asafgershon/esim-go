import { GraphQLError } from 'graphql';
import type { Context } from '../context/types';
import type { Resolvers } from '../types';
import { getUserRole } from '../context/supabase-auth';
import type { CreateTripInput, UpdateTripInput } from '../repositories/trip.repository';

export const tripsResolvers: Resolvers = {
  Query: {
    trips: async (_, __, context: Context) => {
      try {
        const trips = await context.repositories.trips.getAllTrips();
        
        // Convert database format to GraphQL format
        return trips.map(trip => {
          // Ensure country_ids is an array (parse from JSON if needed)
          const countryIds = Array.isArray(trip.country_ids) ? trip.country_ids : [];

          return {
            id: trip.id,
            name: trip.name,
            description: trip.description,
            regionId: trip.region_id,
            countryIds: countryIds as any,
            countries: [],
            createdAt: trip.created_at || new Date().toISOString(),
            updatedAt: trip.updated_at || new Date().toISOString(),
            createdBy: trip.created_by,
          };
        });
      } catch (error) {
        console.error('Error fetching trips in resolver:', error);
        throw new GraphQLError('Failed to fetch trips', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },
  },

  Mutation: {
    createTrip: async (_, { input }, context: Context) => {
      try {
        // Additional validation: ensure current user is admin
        const currentUserRole = getUserRole(context.auth.supabaseUser);
        if (currentUserRole !== 'ADMIN') {
          throw new GraphQLError('Only administrators can create trips', {
            extensions: { code: 'INSUFFICIENT_PERMISSIONS' },
          });
        }

        const userId = context.auth.user?.id;
        if (!userId) {
          throw new GraphQLError('User not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // Validate country codes exist
        const validCountries = await context.dataSources.countries.getCountries();
        const validCountryCodes = validCountries.map(c => c.iso);
        const invalidCountries = input.countryIds.filter(id => !validCountryCodes.includes(id));
        
        if (invalidCountries.length > 0) {
          throw new GraphQLError(`Invalid country codes: ${invalidCountries.join(', ')}`, {
            extensions: { code: 'INVALID_COUNTRY_CODES' },
          });
        }

        const createInput: CreateTripInput = {
          name: input.name,
          description: input.description,
          regionId: input.regionId,
          countryIds: input.countryIds,
        };

        const trip = await context.repositories.trips.createTrip(createInput, userId);

        return {
          success: true,
          error: null,
          trip: {
            id: trip.id,
            name: trip.name,
            description: trip.description,
            regionId: trip.region_id,
            countryIds: Array.isArray(trip.country_ids) ? trip.country_ids : [] as any,
            countries: [],
            createdAt: trip.created_at || new Date().toISOString(),
            updatedAt: trip.updated_at || new Date().toISOString(),
            createdBy: trip.created_by,
          },
        };
      } catch (error) {
        console.error('Error creating trip:', error);
        if (error instanceof GraphQLError) {
          return {
            success: false,
            error: error.message,
            trip: null,
          };
        }
        return {
          success: false,
          error: 'Failed to create trip',
          trip: null,
        };
      }
    },

    updateTrip: async (_, { input }, context: Context) => {
      try {
        // Additional validation: ensure current user is admin
        const currentUserRole = getUserRole(context.auth.supabaseUser);
        if (currentUserRole !== 'ADMIN') {
          throw new GraphQLError('Only administrators can update trips', {
            extensions: { code: 'INSUFFICIENT_PERMISSIONS' },
          });
        }

        const userId = context.auth.user?.id;
        if (!userId) {
          throw new GraphQLError('User not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // Validate country codes exist
        const validCountries = await context.dataSources.countries.getCountries();
        const validCountryCodes = validCountries.map(c => c.iso);
        const invalidCountries = input.countryIds.filter(id => !validCountryCodes.includes(id));
        
        if (invalidCountries.length > 0) {
          throw new GraphQLError(`Invalid country codes: ${invalidCountries.join(', ')}`, {
            extensions: { code: 'INVALID_COUNTRY_CODES' },
          });
        }

        const updateInput: UpdateTripInput = {
          id: input.id,
          name: input.name,
          description: input.description,
          regionId: input.regionId,
          countryIds: input.countryIds,
        };

        const trip = await context.repositories.trips.updateTrip(updateInput, userId);

        return {
          success: true,
          error: null,
          trip: {
            id: trip.id,
            name: trip.name,
            description: trip.description,
            regionId: trip.region_id,
            countryIds: Array.isArray(trip.country_ids) ? trip.country_ids : [] as any,
            countries: [],
            createdAt: trip.created_at || new Date().toISOString(),
            updatedAt: trip.updated_at || new Date().toISOString(),
            createdBy: trip.created_by,
          },
        };
      } catch (error) {
        console.error('Error updating trip:', error);
        if (error instanceof GraphQLError) {
          return {
            success: false,
            error: error.message,
            trip: null,
          };
        }
        return {
          success: false,
          error: 'Failed to update trip',
          trip: null,
        };
      }
    },

    deleteTrip: async (_, { id }, context: Context) => {
      try {
        // Additional validation: ensure current user is admin
        const currentUserRole = getUserRole(context.auth.supabaseUser);
        if (currentUserRole !== 'ADMIN') {
          throw new GraphQLError('Only administrators can delete trips', {
            extensions: { code: 'INSUFFICIENT_PERMISSIONS' },
          });
        }

        const result = await context.repositories.trips.deleteTrip(id);

        return {
          success: result.success,
          error: result.error || null,
        };
      } catch (error) {
        console.error('Error deleting trip:', error);
        if (error instanceof GraphQLError) {
          return {
            success: false,
            error: error.message,
          };
        }
        return {
          success: false,
          error: 'Failed to delete trip',
        };
      }
    },
  },
};