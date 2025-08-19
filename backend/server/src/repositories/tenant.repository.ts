import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import { createLogger } from "../lib/logger";
import DataLoader from "dataloader";

const logger = createLogger({
  component: "TenantRepository",
  operationType: "database",
});

export type TenantType = 'standard' | 'master';

export interface Tenant {
  slug: string;
  name: string;
  imgUrl: string;
  tenantType: TenantType;
  createdAt?: string;
  updatedAt?: string;
  userCount?: number; // For admin views
}

export interface UserTenant {
  id: string;
  userId: string;
  tenantSlug: string;
  role?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class TenantRepository {
  private db: SupabaseClient<Database>;
  
  // DataLoader for batching tenant fetches by slug
  private tenantBySlugLoader: DataLoader<string, Tenant | null>;
  
  // DataLoader for batching user-tenant relationships
  private userTenantsLoader: DataLoader<string, Tenant[]>;

  constructor(db: SupabaseClient<Database>) {
    this.db = db;
    
    // Initialize DataLoader for tenant fetching with caching
    this.tenantBySlugLoader = new DataLoader<string, Tenant | null>(
      async (slugs) => {
        const { data, error } = await this.db
          .from("tenants")
          .select("*")
          .in("slug", slugs);
        
        if (error) {
          logger.error("Failed to batch load tenants", error);
          return slugs.map(() => null);
        }
        
        // Create a map for O(1) lookup
        const tenantMap = new Map<string, Tenant>();
        data?.forEach(tenant => {
          tenantMap.set(tenant.slug, {
            slug: tenant.slug,
            name: tenant.name,
            imgUrl: tenant.img_url,
            tenantType: tenant.tenant_type,
            createdAt: tenant.created_at,
            updatedAt: tenant.updated_at,
          });
        });
        
        // Return in the same order as requested
        return slugs.map(slug => tenantMap.get(slug) || null);
      },
      {
        // Cache for 5 minutes
        cacheKeyFn: (key) => key,
        maxBatchSize: 100,
      }
    );
    
    // Initialize DataLoader for user tenants with optimized joins
    this.userTenantsLoader = new DataLoader<string, Tenant[]>(
      async (userIds) => {
        // Single query with join to fetch all tenants for multiple users
        const { data, error } = await this.db
          .from("user_tenants")
          .select(`
            user_id,
            tenant_slug,
            role,
            tenants!inner (
              slug,
              name,
              img_url,
              created_at,
              updated_at
            )
          `)
          .in("user_id", userIds);
        
        if (error) {
          logger.error("Failed to batch load user tenants", error);
          return userIds.map(() => []);
        }
        
        // Group tenants by user_id
        const userTenantMap = new Map<string, Tenant[]>();
        
        data?.forEach((record: any) => {
          const userId = record.user_id;
          const tenant: Tenant = {
            slug: record.tenants.slug,
            name: record.tenants.name,
            imgUrl: record.tenants.img_url,
            tenantType: record.tenants.tenant_type,
            createdAt: record.tenants.created_at,
            updatedAt: record.tenants.updated_at,
          };
          
          if (!userTenantMap.has(userId)) {
            userTenantMap.set(userId, []);
          }
          userTenantMap.get(userId)!.push(tenant);
        });
        
        // Return in the same order as requested
        return userIds.map(userId => userTenantMap.get(userId) || []);
      },
      {
        // Cache for 5 minutes
        cacheKeyFn: (key) => key,
        maxBatchSize: 50,
      }
    );
  }

  /**
   * Get all tenants for a specific user
   * Uses DataLoader for batching and caching
   */
  async getUserTenants(userId: string): Promise<Tenant[]> {
    try {
      return await this.userTenantsLoader.load(userId);
    } catch (error) {
      logger.error(`Failed to get tenants for user ${userId}`, error);
      return [];
    }
  }

  /**
   * Get all tenants for multiple users (batch operation)
   * Useful for admin dashboards
   */
  async getUsersTenants(userIds: string[]): Promise<Map<string, Tenant[]>> {
    try {
      const results = await this.userTenantsLoader.loadMany(userIds);
      const resultMap = new Map<string, Tenant[]>();
      
      userIds.forEach((userId, index) => {
        const result = results[index];
        if (result instanceof Error) {
          logger.error(`Failed to load tenants for user ${userId}`, result);
          resultMap.set(userId, []);
        } else {
          resultMap.set(userId, result);
        }
      });
      
      return resultMap;
    } catch (error) {
      logger.error("Failed to batch load user tenants", error);
      return new Map();
    }
  }

  /**
   * Get tenant by slug
   * Uses DataLoader for batching and caching
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    try {
      return await this.tenantBySlugLoader.load(slug);
    } catch (error) {
      logger.error(`Failed to get tenant with slug ${slug}`, error);
      return null;
    }
  }

  /**
   * Get multiple tenants by slugs (batch operation)
   */
  async getTenantsBySlugs(slugs: string[]): Promise<(Tenant | null)[]> {
    try {
      const results = await this.tenantBySlugLoader.loadMany(slugs);
      return results.map(result => 
        result instanceof Error ? null : result
      );
    } catch (error) {
      logger.error("Failed to batch load tenants", error);
      return slugs.map(() => null);
    }
  }

  /**
   * Get all tenants (for admin purposes)
   * Includes pagination for large datasets
   */
  async getAllTenants(options?: {
    limit?: number;
    offset?: number;
    orderBy?: "name" | "created_at" | "updated_at";
    orderDirection?: "asc" | "desc";
  }): Promise<{ tenants: Tenant[]; total: number }> {
    try {
      const { limit = 100, offset = 0, orderBy = "name", orderDirection = "asc" } = options || {};
      
      // Get total count
      const { count } = await this.db
        .from("tenants")
        .select("*", { count: "exact", head: true });
      
      // Get paginated results
      const { data, error } = await this.db
        .from("tenants")
        .select("*")
        .order(orderBy, { ascending: orderDirection === "asc" })
        .range(offset, offset + limit - 1);
      
      if (error) {
        logger.error("Failed to get all tenants", error);
        return { tenants: [], total: 0 };
      }
      
      const tenants = data?.map(tenant => ({
        slug: tenant.slug,
        name: tenant.name,
        imgUrl: tenant.img_url,
        tenantType: tenant.tenant_type,
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at,
      })) || [];
      
      return { tenants, total: count || 0 };
    } catch (error) {
      logger.error("Failed to get all tenants", error);
      return { tenants: [], total: 0 };
    }
  }

  /**
   * Add user to tenant
   */
  async addUserToTenant(userId: string, tenantSlug: string, role?: string): Promise<boolean> {
    try {
      const { error } = await this.db
        .from("user_tenants")
        .insert({
          user_id: userId,
          tenant_slug: tenantSlug,
          role: role || "member",
        });
      
      if (error) {
        logger.error(`Failed to add user ${userId} to tenant ${tenantSlug}`, error);
        return false;
      }
      
      // Clear cache for this user
      this.userTenantsLoader.clear(userId);
      
      return true;
    } catch (error) {
      logger.error(`Failed to add user ${userId} to tenant ${tenantSlug}`, error);
      return false;
    }
  }

  /**
   * Remove user from tenant
   */
  async removeUserFromTenant(userId: string, tenantSlug: string): Promise<boolean> {
    try {
      const { error } = await this.db
        .from("user_tenants")
        .delete()
        .eq("user_id", userId)
        .eq("tenant_slug", tenantSlug);
      
      if (error) {
        logger.error(`Failed to remove user ${userId} from tenant ${tenantSlug}`, error);
        return false;
      }
      
      // Clear cache for this user
      this.userTenantsLoader.clear(userId);
      
      return true;
    } catch (error) {
      logger.error(`Failed to remove user ${userId} from tenant ${tenantSlug}`, error);
      return false;
    }
  }

  /**
   * Check if a user is a master tenant admin
   */
  async isUserMasterTenantAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.db
        .rpc('is_user_master_tenant_admin', { check_user_id: userId });
      
      if (error) {
        logger.error(`Failed to check master tenant status for user ${userId}`, error);
        return false;
      }
      
      return data || false;
    } catch (error) {
      logger.error(`Failed to check master tenant status for user ${userId}`, error);
      return false;
    }
  }

  /**
   * Get all tenants with optional filtering (master tenant only)
   */
  async getAllTenantsForMaster(options?: {
    filter?: {
      tenantType?: TenantType;
      search?: string;
    };
    pagination?: {
      limit?: number;
      offset?: number;
    };
  }): Promise<{ tenants: Tenant[]; total: number }> {
    try {
      const { filter, pagination } = options || {};
      const { limit = 50, offset = 0 } = pagination || {};
      
      let query = this.db.from("tenants").select("*", { count: "exact" });
      
      // Apply filters
      if (filter?.tenantType) {
        query = query.eq("tenant_type", filter.tenantType);
      }
      
      if (filter?.search) {
        query = query.or(`name.ilike.%${filter.search}%,slug.ilike.%${filter.search}%`);
      }
      
      // Apply pagination
      query = query.range(offset, offset + limit - 1).order("created_at", { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) {
        logger.error("Failed to get all tenants for master", error);
        return { tenants: [], total: 0 };
      }
      
      const tenants = data?.map(tenant => ({
        slug: tenant.slug,
        name: tenant.name,
        imgUrl: tenant.img_url,
        tenantType: tenant.tenant_type,
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at,
      })) || [];
      
      // Optionally fetch user counts for each tenant
      if (tenants.length > 0) {
        const userCounts = await this.getTenantUserCounts(tenants.map(t => t.slug));
        tenants.forEach(tenant => {
          tenant.userCount = userCounts.get(tenant.slug) || 0;
        });
      }
      
      return { tenants, total: count || 0 };
    } catch (error) {
      logger.error("Failed to get all tenants for master", error);
      return { tenants: [], total: 0 };
    }
  }

  /**
   * Get user counts for multiple tenants
   */
  private async getTenantUserCounts(slugs: string[]): Promise<Map<string, number>> {
    try {
      const { data, error } = await this.db
        .from("user_tenants")
        .select("tenant_slug")
        .in("tenant_slug", slugs);
      
      if (error) {
        logger.error("Failed to get tenant user counts", error);
        return new Map();
      }
      
      const countMap = new Map<string, number>();
      slugs.forEach(slug => countMap.set(slug, 0));
      
      data?.forEach(record => {
        const current = countMap.get(record.tenant_slug) || 0;
        countMap.set(record.tenant_slug, current + 1);
      });
      
      return countMap;
    } catch (error) {
      logger.error("Failed to get tenant user counts", error);
      return new Map();
    }
  }

  /**
   * Create a new tenant
   */
  async createTenant(tenant: Omit<Tenant, "createdAt" | "updatedAt" | "userCount">): Promise<Tenant | null> {
    try {
      const { data, error } = await this.db
        .from("tenants")
        .insert({
          slug: tenant.slug,
          name: tenant.name,
          img_url: tenant.imgUrl,
          tenant_type: tenant.tenantType || 'standard',
        })
        .select()
        .single();
      
      if (error) {
        logger.error("Failed to create tenant", error);
        return null;
      }
      
      return {
        slug: data.slug,
        name: data.name,
        imgUrl: data.img_url,
        tenantType: data.tenant_type,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      logger.error("Failed to create tenant", error);
      return null;
    }
  }

  /**
   * Update tenant information
   */
  async updateTenant(slug: string, updates: Partial<Omit<Tenant, "slug">>): Promise<Tenant | null> {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.imgUrl !== undefined) updateData.img_url = updates.imgUrl;
      if (updates.tenantType !== undefined) updateData.tenant_type = updates.tenantType;
      
      const { data, error } = await this.db
        .from("tenants")
        .update(updateData)
        .eq("slug", slug)
        .select()
        .single();
      
      if (error) {
        logger.error(`Failed to update tenant ${slug}`, error);
        return null;
      }
      
      // Clear cache for this tenant
      this.tenantBySlugLoader.clear(slug);
      
      return {
        slug: data.slug,
        name: data.name,
        imgUrl: data.img_url,
        tenantType: data.tenant_type,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      logger.error(`Failed to update tenant ${slug}`, error);
      return null;
    }
  }

  /**
   * Delete a tenant (master tenant only)
   */
  async deleteTenant(slug: string): Promise<boolean> {
    try {
      // First check if there are any users assigned to this tenant
      const { count } = await this.db
        .from("user_tenants")
        .select("id", { count: "exact", head: true })
        .eq("tenant_slug", slug);
      
      if (count && count > 0) {
        logger.error(`Cannot delete tenant ${slug} - has ${count} users assigned`);
        return false;
      }
      
      const { error } = await this.db
        .from("tenants")
        .delete()
        .eq("slug", slug);
      
      if (error) {
        logger.error(`Failed to delete tenant ${slug}`, error);
        return false;
      }
      
      // Clear cache for this tenant
      this.tenantBySlugLoader.clear(slug);
      
      return true;
    } catch (error) {
      logger.error(`Failed to delete tenant ${slug}`, error);
      return false;
    }
  }

  /**
   * Clear all caches (useful after bulk operations)
   */
  clearCache(): void {
    this.tenantBySlugLoader.clearAll();
    this.userTenantsLoader.clearAll();
  }
}