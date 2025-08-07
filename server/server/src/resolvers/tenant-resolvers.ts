import type { Context } from "../context/types";
import { createLogger } from "../lib/logger";
import type { Resolvers } from "../types";
import { GraphQLError } from "graphql";

const logger = createLogger({
  component: "TenantResolvers",
  operationType: "resolver",
});

/**
 * Helper function to check if the current user is a master tenant admin
 */
async function checkMasterTenantAccess(context: Context): Promise<boolean> {
  if (!context.auth.isAuthenticated || !context.auth.user) {
    return false;
  }
  
  const userId = context.auth.user.id;
  return await context.repositories.tenants.isUserMasterTenantAdmin(userId);
}

/**
 * Helper function to require master tenant access
 */
async function requireMasterTenantAccess(context: Context): Promise<void> {
  const isMaster = await checkMasterTenantAccess(context);
  if (!isMaster) {
    throw new GraphQLError("Master tenant access required", {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

export const tenantResolvers: Partial<Resolvers> = {
  Query: {
    /**
     * Get tenants for the current user
     * If user is master tenant admin, optionally returns all tenants
     */
    tenants: async (_, __, context: Context) => {
      try {
        // Check if user is authenticated
        if (!context.auth.isAuthenticated || !context.auth.user) {
          throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }

        const userId = context.auth.user.id;
        logger.info(`Fetching tenants for user ${userId}`);

        // Check if user is master tenant admin
        const isMaster = await checkMasterTenantAccess(context);
        
        let tenants;
        if (isMaster) {
          // Master tenant admins see all tenants by default
          logger.info(`User ${userId} is master tenant admin, fetching all tenants`);
          const result = await context.repositories.tenants.getAllTenantsForMaster();
          tenants = result.tenants;
        } else {
          // Regular users see only their assigned tenants
          tenants = await context.repositories.tenants.getUserTenants(userId);
        }

        // Transform to GraphQL schema format
        const formattedTenants = tenants.map((tenant) => ({
          slug: tenant.slug,
          name: tenant.name,
          imgUrl: tenant.imgUrl,
          tenantType: tenant.tenantType.toUpperCase(),
          createdAt: tenant.createdAt || "",
          updatedAt: tenant.updatedAt || "",
          userCount: tenant.userCount,
        }));

        logger.info(`Found ${formattedTenants.length} tenants for user ${userId}`);
        return formattedTenants;
      } catch (error) {
        logger.error("Failed to fetch user tenants", error);
        
        // Re-throw GraphQL errors as-is
        if (error instanceof GraphQLError) {
          throw error;
        }
        
        // Wrap other errors
        throw new GraphQLError("Failed to fetch tenants", {
          extensions: { 
            code: "INTERNAL_SERVER_ERROR",
            originalError: error instanceof Error ? error.message : String(error),
          },
        });
      }
    },

    /**
     * Get all tenants with filtering (master tenant only)
     */
    allTenants: async (_, { filter, pagination }, context: Context) => {
      try {
        // Check authentication
        if (!context.auth.isAuthenticated || !context.auth.user) {
          throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }

        // Require master tenant access
        await requireMasterTenantAccess(context);

        logger.info(`Fetching all tenants with filter: ${JSON.stringify(filter)}`);

        const result = await context.repositories.tenants.getAllTenantsForMaster({
          filter: filter ? {
            tenantType: filter.tenantType?.toLowerCase() as 'standard' | 'master',
            search: filter.search,
          } : undefined,
          pagination,
        });

        // Transform to GraphQL schema format
        const formattedTenants = result.tenants.map((tenant) => ({
          slug: tenant.slug,
          name: tenant.name,
          imgUrl: tenant.imgUrl,
          tenantType: tenant.tenantType.toUpperCase(),
          createdAt: tenant.createdAt || "",
          updatedAt: tenant.updatedAt || "",
          userCount: tenant.userCount,
        }));

        return {
          nodes: formattedTenants,
          totalCount: result.total,
          pageInfo: {
            hasNextPage: (pagination?.offset || 0) + formattedTenants.length < result.total,
            hasPreviousPage: (pagination?.offset || 0) > 0,
          },
        };
      } catch (error) {
        logger.error("Failed to fetch all tenants", error);
        
        if (error instanceof GraphQLError) {
          throw error;
        }
        
        throw new GraphQLError("Failed to fetch all tenants", {
          extensions: { 
            code: "INTERNAL_SERVER_ERROR",
            originalError: error instanceof Error ? error.message : String(error),
          },
        });
      }
    },

    /**
     * Get a single tenant by slug
     */
    tenant: async (_, { slug }, context: Context) => {
      try {
        // Check authentication
        if (!context.auth.isAuthenticated || !context.auth.user) {
          throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }

        const userId = context.auth.user.id;
        const isMaster = await checkMasterTenantAccess(context);
        
        // Check if user has access to this tenant
        if (!isMaster) {
          const userTenants = await context.repositories.tenants.getUserTenants(userId);
          const hasAccess = userTenants.some(t => t.slug === slug);
          
          if (!hasAccess) {
            throw new GraphQLError("Access denied to this tenant", {
              extensions: { code: "FORBIDDEN" },
            });
          }
        }

        const tenant = await context.repositories.tenants.getTenantBySlug(slug);
        
        if (!tenant) {
          return null;
        }

        // Get user count if master admin
        let userCount;
        if (isMaster) {
          const counts = await context.repositories.tenants['getTenantUserCounts']([slug]);
          userCount = counts.get(slug);
        }

        return {
          slug: tenant.slug,
          name: tenant.name,
          imgUrl: tenant.imgUrl,
          tenantType: tenant.tenantType.toUpperCase(),
          createdAt: tenant.createdAt || "",
          updatedAt: tenant.updatedAt || "",
          userCount,
        };
      } catch (error) {
        logger.error(`Failed to fetch tenant ${slug}`, error);
        
        if (error instanceof GraphQLError) {
          throw error;
        }
        
        throw new GraphQLError("Failed to fetch tenant", {
          extensions: { 
            code: "INTERNAL_SERVER_ERROR",
            originalError: error instanceof Error ? error.message : String(error),
          },
        });
      }
    },
  },

  // Field resolvers for optimized field-level fetching
  Tenant: {
    slug: (parent) => parent.slug,
    name: (parent) => parent.name,
    imgUrl: (parent) => parent.imgUrl,
    tenantType: (parent) => parent.tenantType,
    createdAt: (parent) => parent.createdAt,
    updatedAt: (parent) => parent.updatedAt,
    userCount: (parent) => parent.userCount,
  },

  Mutation: {
    /**
     * Create a new tenant (master tenant only)
     */
    createTenant: async (_, { input }, context: Context) => {
      try {
        // Check authentication
        if (!context.auth.isAuthenticated || !context.auth.user) {
          throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }

        // Require master tenant access
        await requireMasterTenantAccess(context);

        logger.info(`Creating new tenant: ${input.slug}`);

        const tenant = await context.repositories.tenants.createTenant({
          slug: input.slug,
          name: input.name,
          imgUrl: input.imgUrl,
          tenantType: input.tenantType?.toLowerCase() as 'standard' | 'master' || 'standard',
        });

        if (!tenant) {
          throw new GraphQLError("Failed to create tenant", {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          });
        }

        return {
          slug: tenant.slug,
          name: tenant.name,
          imgUrl: tenant.imgUrl,
          tenantType: tenant.tenantType.toUpperCase(),
          createdAt: tenant.createdAt || "",
          updatedAt: tenant.updatedAt || "",
        };
      } catch (error) {
        logger.error("Failed to create tenant", error);
        
        if (error instanceof GraphQLError) {
          throw error;
        }
        
        throw new GraphQLError("Failed to create tenant", {
          extensions: { 
            code: "INTERNAL_SERVER_ERROR",
            originalError: error instanceof Error ? error.message : String(error),
          },
        });
      }
    },

    /**
     * Update a tenant (master tenant only)
     */
    updateTenant: async (_, { slug, input }, context: Context) => {
      try {
        // Check authentication
        if (!context.auth.isAuthenticated || !context.auth.user) {
          throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }

        // Require master tenant access
        await requireMasterTenantAccess(context);

        logger.info(`Updating tenant: ${slug}`);

        const tenant = await context.repositories.tenants.updateTenant(slug, {
          name: input.name,
          imgUrl: input.imgUrl,
          tenantType: input.tenantType?.toLowerCase() as 'standard' | 'master',
        });

        if (!tenant) {
          throw new GraphQLError("Tenant not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        return {
          slug: tenant.slug,
          name: tenant.name,
          imgUrl: tenant.imgUrl,
          tenantType: tenant.tenantType.toUpperCase(),
          createdAt: tenant.createdAt || "",
          updatedAt: tenant.updatedAt || "",
        };
      } catch (error) {
        logger.error("Failed to update tenant", error);
        
        if (error instanceof GraphQLError) {
          throw error;
        }
        
        throw new GraphQLError("Failed to update tenant", {
          extensions: { 
            code: "INTERNAL_SERVER_ERROR",
            originalError: error instanceof Error ? error.message : String(error),
          },
        });
      }
    },

    /**
     * Delete a tenant (master tenant only)
     */
    deleteTenant: async (_, { slug }, context: Context) => {
      try {
        // Check authentication
        if (!context.auth.isAuthenticated || !context.auth.user) {
          throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }

        // Require master tenant access
        await requireMasterTenantAccess(context);

        // Don't allow deletion of master tenant
        const tenant = await context.repositories.tenants.getTenantBySlug(slug);
        if (tenant?.tenantType === 'master') {
          throw new GraphQLError("Cannot delete master tenant", {
            extensions: { code: "FORBIDDEN" },
          });
        }

        logger.info(`Deleting tenant: ${slug}`);

        const success = await context.repositories.tenants.deleteTenant(slug);

        if (!success) {
          throw new GraphQLError("Failed to delete tenant - it may have users assigned", {
            extensions: { code: "CONFLICT" },
          });
        }

        return {
          success: true,
          message: `Tenant ${slug} successfully deleted`,
        };
      } catch (error) {
        logger.error("Failed to delete tenant", error);
        
        if (error instanceof GraphQLError) {
          throw error;
        }
        
        throw new GraphQLError("Failed to delete tenant", {
          extensions: { 
            code: "INTERNAL_SERVER_ERROR",
            originalError: error instanceof Error ? error.message : String(error),
          },
        });
      }
    },

    /**
     * Assign a user to a tenant (master tenant only)
     */
    assignUserToTenant: async (_, { userId, tenantSlug, role }, context: Context) => {
      try {
        // Check authentication
        if (!context.auth.isAuthenticated || !context.auth.user) {
          throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }

        // Require master tenant access
        await requireMasterTenantAccess(context);

        logger.info(`Assigning user ${userId} to tenant ${tenantSlug}`);

        const success = await context.repositories.tenants.addUserToTenant(
          userId,
          tenantSlug,
          role
        );

        if (!success) {
          throw new GraphQLError("Failed to assign user to tenant", {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          });
        }

        return {
          success: true,
          message: `User ${userId} successfully assigned to tenant ${tenantSlug}`,
        };
      } catch (error) {
        logger.error("Failed to assign user to tenant", error);
        
        if (error instanceof GraphQLError) {
          throw error;
        }
        
        throw new GraphQLError("Failed to assign user to tenant", {
          extensions: { 
            code: "INTERNAL_SERVER_ERROR",
            originalError: error instanceof Error ? error.message : String(error),
          },
        });
      }
    },

    /**
     * Remove a user from a tenant (master tenant only)
     */
    removeUserFromTenant: async (_, { userId, tenantSlug }, context: Context) => {
      try {
        // Check authentication
        if (!context.auth.isAuthenticated || !context.auth.user) {
          throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }

        // Require master tenant access
        await requireMasterTenantAccess(context);

        logger.info(`Removing user ${userId} from tenant ${tenantSlug}`);

        const success = await context.repositories.tenants.removeUserFromTenant(
          userId,
          tenantSlug
        );

        if (!success) {
          throw new GraphQLError("Failed to remove user from tenant", {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          });
        }

        return {
          success: true,
          message: `User ${userId} successfully removed from tenant ${tenantSlug}`,
        };
      } catch (error) {
        logger.error("Failed to remove user from tenant", error);
        
        if (error instanceof GraphQLError) {
          throw error;
        }
        
        throw new GraphQLError("Failed to remove user from tenant", {
          extensions: { 
            code: "INTERNAL_SERVER_ERROR",
            originalError: error instanceof Error ? error.message : String(error),
          },
        });
      }
    },
  },
};

/**
 * Performance optimization notes:
 * 
 * 1. Master Tenant Access Control:
 *    - Uses database function is_user_master_tenant_admin() for efficient checks
 *    - Results are cached per request context
 *    - Single database round-trip for authorization
 * 
 * 2. DataLoader Integration:
 *    - The repository uses DataLoader to batch and cache tenant fetches
 *    - Multiple requests for the same user's tenants are automatically deduplicated
 *    - Results are cached for 5 minutes to reduce database load
 * 
 * 3. Efficient Queries:
 *    - Single JOIN query fetches all tenant data in one round trip
 *    - No N+1 query problems thanks to batching
 *    - User counts are fetched in batch for admin views
 * 
 * 4. Caching Strategy:
 *    - In-memory caching via DataLoader reduces repeated database queries
 *    - Cache is automatically cleared on mutations to ensure consistency
 *    - Master tenant status cached per request
 * 
 * 5. Scalability Considerations:
 *    - Batch size limits prevent memory issues with large datasets
 *    - Pagination support in getAllTenants for admin operations
 *    - Optimized indexes on database (slug as primary key, user_id indexed)
 * 
 * 6. Security Features:
 *    - All admin operations require master tenant access
 *    - Cannot delete master tenant to prevent system lockout
 *    - Tenant access validated before returning data
 * 
 * 7. Future Optimizations:
 *    - Add Redis caching layer for cross-instance cache sharing
 *    - Implement field-level permissions for tenant data
 *    - Add subscription support for real-time tenant updates
 *    - Add audit logging for all tenant management operations
 */