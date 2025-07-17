import { GraphQLError } from 'graphql';
import type { Context } from '../context/types';
import type { Resolvers } from '../types';
import { getUserRole, inviteUserByEmail } from '../context/supabase-auth';

export const usersResolvers: Resolvers = {
  Query: {
    users: async (_, __, context: Context) => {
      try {
        const users = await context.repositories.users.getAllUsers();
        
        return users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.user_metadata?.first_name || '',
          lastName: user.user_metadata?.last_name || '',
          phoneNumber: user.user_metadata?.phone_number || null,
          role: user.user_metadata?.role || 'USER',
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        }));
      } catch (error) {
        console.error('Error fetching users in resolver:', error);
        throw new GraphQLError('Failed to fetch users', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },
  },

  Mutation: {
    updateUserRole: async (_, { userId, role }, context: Context) => {
      try {
        // Additional validation: ensure current user is admin
        const currentUserRole = getUserRole(context.auth.supabaseUser);
        if (currentUserRole !== 'ADMIN') {
          throw new GraphQLError('Only administrators can update user roles', {
            extensions: { code: 'INSUFFICIENT_PERMISSIONS' },
          });
        }

        // Prevent self-demotion from admin role
        if (context.auth.user?.id === userId && role !== 'ADMIN') {
          throw new GraphQLError('You cannot remove your own admin privileges', {
            extensions: { code: 'SELF_DEMOTION_FORBIDDEN' },
          });
        }

        const result = await context.repositories.users.updateUserRole(userId, role);
        
        if (!result.success) {
          throw new GraphQLError('Failed to update user role', {
            extensions: { code: 'UPDATE_FAILED' },
          });
        }

        // Return the updated user
        return {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.user_metadata?.first_name || '',
          lastName: result.user.user_metadata?.last_name || '',
          phoneNumber: result.user.user_metadata?.phone_number || null,
          role: result.user.user_metadata?.role || 'USER',
          createdAt: result.user.created_at,
          updatedAt: result.user.updated_at,
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
    },

    inviteAdminUser: async (_, { input }, context: Context) => {
      try {
        // Additional validation: ensure current user is admin
        const currentUserRole = getUserRole(context.auth.supabaseUser);
        if (currentUserRole !== 'ADMIN') {
          throw new GraphQLError('Only administrators can invite other admins', {
            extensions: { code: 'INSUFFICIENT_PERMISSIONS' },
          });
        }

        // Validate role is either ADMIN or PARTNER
        if (!['ADMIN', 'PARTNER'].includes(input.role)) {
          throw new GraphQLError('Invalid role. Only ADMIN and PARTNER roles can be invited', {
            extensions: { code: 'INVALID_ROLE' },
          });
        }

        // Invite the user
        const result = await inviteUserByEmail(
          input.email,
          input.role,
          input.redirectUrl || ''
        );

        if (!result.success) {
          throw new GraphQLError(result.error || 'Failed to invite user', {
            extensions: { code: 'INVITATION_FAILED' },
          });
        }

        return {
          success: true,
          error: null,
          invitedEmail: input.email,
        };
      } catch (error) {
        console.error('Error inviting admin user:', error);
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('Failed to invite admin user', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },
  },
};