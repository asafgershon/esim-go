import { BaseSupabaseRepository } from "./base-supabase.repository";
import { supabaseAdmin } from "../context/supabase-auth";
import { GraphQLError } from "graphql";
import { z } from "zod";

type UserRow = {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
};

export interface UserUpdate {
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    role?: string;
  };
  app_metadata?: {
    role?: string;
  };
}

export class UserRepository extends BaseSupabaseRepository<
  UserRow,
  never,
  UserUpdate
> {
  constructor() {
    // Users are managed through auth.users table, not a regular table
    super("users" as any);
  }

  // Override getById to use auth.users table
  async getById(id: string): Promise<any | null> {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);

      if (error) {
        console.warn(`User not found in auth.users: ${error.message}`);
        return null;
      }

      // Return user data in the expected format
      return {
        id: data.user.id,
        email: data.user.email,
        first_name: data.user.user_metadata?.first_name,
        last_name: data.user.user_metadata?.last_name,
        phone_number: data.user.user_metadata?.phone_number,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at,
      };
    } catch (error) {
      console.error("Error fetching user from auth.users:", error);
      return null;
    }
  }

  async updateUserRole(
    userId: string,
    role: string
  ): Promise<{ success: boolean; user?: any }> {
    try {
      // Validate role
      const validRoles = ["USER", "ADMIN", "PARTNER"];
      if (!validRoles.includes(role)) {
        throw new GraphQLError(
          `Invalid role: ${role}. Must be one of: ${validRoles.join(", ")}`,
          {
            extensions: { code: "INVALID_ROLE" },
          }
        );
      }

      // Get current user to preserve existing metadata
      const { data: currentUser, error: getUserError } =
        await supabaseAdmin.auth.admin.getUserById(userId);

      if (getUserError) {
        throw new GraphQLError(`Failed to get user: ${getUserError.message}`, {
          extensions: { code: "USER_NOT_FOUND" },
        });
      }

      // Update app metadata with new role (app_metadata is admin-only, more secure)
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          app_metadata: {
            ...currentUser.user.app_metadata,
            role: role,
          },
        }
      );

      if (error) {
        throw new GraphQLError(`Failed to update user role: ${error.message}`, {
          extensions: { code: "UPDATE_FAILED" },
        });
      }

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      console.error("Error updating user role:", error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError("Failed to update user role", {
        extensions: { code: "INTERNAL_ERROR" },
      });
    }
  }

  async updateProfile(
    userId: string,
    updates: { firstName?: string; lastName?: string; phoneNumber?: string }
  ): Promise<{ success: boolean; user?: any }> {
    try {
      if (!userId || !z.string().uuid().safeParse(userId).success) {
        throw new GraphQLError("Invalid user ID", {
          extensions: { code: "INVALID_USER_ID" },
        });
      }

      // Get current user to preserve existing metadata
      const { data: currentUser, error: getUserError } =
        await supabaseAdmin.auth.admin.getUserById(userId);

      if (getUserError) {
        throw new GraphQLError(`Failed to get user: ${getUserError.message}`, {
          extensions: { code: "USER_NOT_FOUND" },
        });
      }

      // Update user metadata with new profile info
      const updateData: any = {
        user_metadata: {
          ...currentUser.user.user_metadata,
        },
      };

      if (updates.firstName !== undefined) {
        updateData.user_metadata.first_name = updates.firstName;
      }
      if (updates.lastName !== undefined) {
        updateData.user_metadata.last_name = updates.lastName;
      }
      if (updates.phoneNumber !== undefined) {
        updateData.phone = updates.phoneNumber;
        updateData.user_metadata.phone_number = updates.phoneNumber;
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        updateData
      );

      if (error) {
        throw new GraphQLError(
          `Failed to update user profile: ${error.message}`,
          {
            extensions: { code: "UPDATE_FAILED" },
          }
        );
      }

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      console.error("Error updating user profile:", error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError("Failed to update user profile", {
        extensions: { code: "INTERNAL_ERROR" },
      });
    }
  }

  async getAllUsers(): Promise<UserRow[]> {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();

      if (error) {
        throw new GraphQLError(`Failed to fetch users: ${error.message}`, {
          extensions: { code: "FETCH_USERS_FAILED" },
        });
      }

      return data.users.map((user) => ({
        id: user.id,
        email: user.email || "",
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
        user_metadata: user.user_metadata || {},
        app_metadata: user.app_metadata || {},
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError("Failed to fetch users", {
        extensions: { code: "INTERNAL_ERROR" },
      });
    }
  }

  async getUserById(userId: string): Promise<UserRow | null> {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(
        userId
      );

      if (error) {
        if (error.message.includes("not found")) {
          return null;
        }
        throw new GraphQLError(`Failed to get user: ${error.message}`, {
          extensions: { code: "USER_FETCH_FAILED" },
        });
      }

      return {
        id: data.user.id,
        email: data.user.email || "",
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
        user_metadata: data.user.user_metadata || {},
        app_metadata: data.user.app_metadata || {},
      };
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError("Failed to fetch user", {
        extensions: { code: "INTERNAL_ERROR" },
      });
    }
  }

  async deleteUser(
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First check if user exists
      const { error: getUserError } =
        await supabaseAdmin.auth.admin.getUserById(userId);

      if (getUserError) {
        if (getUserError.message.includes("not found")) {
          return {
            success: false,
            error: "User not found",
          };
        }
        throw new GraphQLError(`Failed to get user: ${getUserError.message}`, {
          extensions: { code: "USER_NOT_FOUND" },
        });
      }

      // Delete the user from auth.users (this will cascade delete related records)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
        userId
      );

      if (deleteError) {
        throw new GraphQLError(
          `Failed to delete user: ${deleteError.message}`,
          {
            extensions: { code: "DELETE_FAILED" },
          }
        );
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error deleting user:", error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      return {
        success: false,
        error: "Failed to delete user",
      };
    }
  }
}
