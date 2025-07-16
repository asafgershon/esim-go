import { BaseSupabaseRepository } from '../base-supabase.repository';
import { supabaseAdmin } from '../../context/supabase-auth';
import { GraphQLError } from 'graphql';
import { Database } from '../../database.types';


type UserRow = Database['public']['Tables']['profiles']['Row'];
export interface UserUpdate {
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    role?: string;
  };
}

export class UserRepository extends BaseSupabaseRepository<UserRow, never, UserUpdate> {
  constructor() {
    // Users are managed through auth.users table, not a regular table
    super('users');
  }

  async updateUserRole(userId: string, role: string): Promise<{ success: boolean; user?: any }> {
    try {
      // Validate role
      const validRoles = ['USER', 'ADMIN', 'PARTNER'];
      if (!validRoles.includes(role)) {
        throw new GraphQLError(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`, {
          extensions: { code: 'INVALID_ROLE' },
        });
      }

      // Get current user to preserve existing metadata
      const { data: currentUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (getUserError) {
        throw new GraphQLError(`Failed to get user: ${getUserError.message}`, {
          extensions: { code: 'USER_NOT_FOUND' },
        });
      }

      // Update user metadata with new role
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...currentUser.user.user_metadata,
          role: role
        }
      });

      if (error) {
        throw new GraphQLError(`Failed to update user role: ${error.message}`, {
          extensions: { code: 'UPDATE_FAILED' },
        });
      }

      return {
        success: true,
        user: data.user
      };

    } catch (error) {
      console.error('Error updating user role:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to update user role', {
        extensions: { code: 'INTERNAL_ERROR' },
      });
    }
  }

  async getAllUsers(): Promise<UserRow[]> {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        throw new GraphQLError(`Failed to fetch users: ${error.message}`, {
          extensions: { code: 'FETCH_USERS_FAILED' },
        });
      }

      return data.users.map(user => ({
        id: user.id,
        email: user.email || '',
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
        user_metadata: user.user_metadata || {}
      }));

    } catch (error) {
      console.error('Error fetching users:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to fetch users', {
        extensions: { code: 'INTERNAL_ERROR' },
      });
    }
  }

  async getUserById(userId: string): Promise<UserRow | null> {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (error) {
        if (error.message.includes('not found')) {
          return null;
        }
        throw new GraphQLError(`Failed to get user: ${error.message}`, {
          extensions: { code: 'USER_FETCH_FAILED' },
        });
      }

      return {
        id: data.user.id,
        email: data.user.email || '',
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
        user_metadata: data.user.user_metadata || {}
      };

    } catch (error) {
      console.error('Error fetching user by ID:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to fetch user', {
        extensions: { code: 'INTERNAL_ERROR' },
      });
    }
  }
}