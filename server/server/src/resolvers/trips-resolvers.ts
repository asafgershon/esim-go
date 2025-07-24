import { GraphQLError } from 'graphql';
import type { Context } from '../context/types';
import type { Resolvers } from '../types';
import { getUserRole, supabaseAdmin } from '../context/supabase-auth';
import type { CreateTripInput, UpdateTripInput } from '../repositories/trip.repository';
import { createLogger } from '../lib/logger';

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
            countries: countryIds.map(id => ({
              iso: id,
            } as any)),
            region: trip.region_id,
            countryIds: countryIds,
            __typename: "Trip",
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
            region: trip.region_id,
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
            region: trip.region_id,
            __typename: "Trip",
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

    // Package Assignment
    assignPackageToUser: async (_, { userId, planId }, context: Context) => {
      const logger = createLogger({ component: "trips-resolvers" });
      
      try {
        // Get the plan details from database
        const { data: planData, error: planError } = await supabaseAdmin
          .from("catalog_bundles")
          .select("*")
          .eq("esim_go_name", planId)
          .single();

        if (planError || !planData) {
          return {
            success: false,
            error: "Package not found",
            assignment: null,
          };
        }

        // Get the user to assign to
        const { data: userData, error: userError } = await supabaseAdmin
          .from("profiles")
          .select("id, first_name, last_name")
          .eq("id", userId)
          .single();

        if (userError || !userData) {
          return {
            success: false,
            error: "User not found",
            assignment: null,
          };
        }

        // Create the assignment
        const { data: assignment, error: assignmentError } = await supabaseAdmin
          .from("package_assignments")
          .insert({
            user_id: userId,
            data_plan_id: planId,
            assigned_by: context.auth.user!.id,
            plan_snapshot: {
              name: planData.esim_go_name,
              description: planData.description,
              region: "Unknown",
              duration: planData.duration,
              price: planData.price_cents ? planData.price_cents / 100 : 0,
              currency: planData.currency || "USD",
              isUnlimited: planData.unlimited || false,
              bundleGroup: planData.bundle_group,
              countries: Array.isArray(planData.countries) ? planData.countries : [],
            },
            status: "ASSIGNED",
          })
          .select()
          .single();

        if (assignmentError) {
          logger.error("Error creating assignment", assignmentError as Error, {
            userId,
            planId,
            operationType: "package-assignment",
          });
          return {
            success: false,
            error: "Failed to create assignment",
            assignment: null,
          };
        }

        // Return the assignment with resolved user and plan data
        return {
          success: true,
          error: null,
          assignment: {
            id: assignment.id,
            user: {
              id: userData.id,
              email: "", // Not available in profiles table
              firstName: userData.first_name || "",
              lastName: userData.last_name || "",
              phoneNumber: null, // Not available in profiles table
              role: "USER", // Default role
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              orderCount: 0, // Will be resolved by field resolver
            },
            dataPlan: {
              id: planId,
              name: planData.esim_go_name,
              description: planData.description,
              region: "Unknown",
              duration: planData.duration,
              price: planData.price_cents ? planData.price_cents / 100 : 0,
              currency: planData.currency || "USD",
              isUnlimited: planData.unlimited || false,
              bundleGroup: planData.bundle_group,
              availableQuantity: 1, // Default value
              countries: Array.isArray(planData.countries) ? planData.countries : [],
            },
            bundleId: planId,
            bundleName: planData.esim_go_name,
            assignedAt: assignment.assigned_at || new Date().toISOString(),
            assignedBy: {
              id: assignment.assigned_by,
              email: "",
              firstName: "",
              lastName: "",
              phoneNumber: null,
              role: "ADMIN",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              orderCount: 0,
            },
            status: assignment.status as any,
            createdAt: assignment.created_at || new Date().toISOString(),
            updatedAt: assignment.updated_at || new Date().toISOString(),
          },
        };
      } catch (error: any) {
        logger.error("Error in assignPackageToUser", error as Error, {
          userId,
          planId,
          operationType: "package-assignment",
        });

        return {
          success: false,
          error: error.message || "Failed to assign package to user",
          assignment: null,
        };
      }
    },
  },
};