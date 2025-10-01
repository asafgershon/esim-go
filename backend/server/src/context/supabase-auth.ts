// FINAL FIX: This is the root of the problem. We change the import to use our new, locally generated types file.
import type { Database } from "../types/database.types";
import { createClient } from "@supabase/supabase-js";
import { cleanEnv, str } from "envalid";
import type { IncomingMessage } from "node:http";
import type { User } from "../types";

const env = cleanEnv(process.env, {
  SUPABASE_URL: str(),
  SUPABASE_ANON_KEY: str(),
  SUPABASE_SERVICE_ROLE_KEY: str(),
});

// Create Supabase clients
export const supabaseAdmin = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
  }
);

export const supabaseClient = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);

export interface SupabaseAuthContext {
  user: User | null;
  isAuthenticated: boolean;
  supabaseUser: any | null;
}

/**
 * Creates authentication context using Supabase Auth
 */
export const createSupabaseAuthContext = async (
  token: string | undefined
): Promise<SupabaseAuthContext> => {
  if (!token) {
    return {
      user: null,
      isAuthenticated: false,
      supabaseUser: null,
    };
  }

  try {
    const {
      data: { user: supabaseUser },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !supabaseUser) {
      console.warn("Supabase auth verification failed:", error?.message);
      return {
        user: null,
        isAuthenticated: false,
        supabaseUser: null,
      };
    }

    // Map Supabase user to your GraphQL User type
    const user: User = {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      firstName:
        supabaseUser.user_metadata?.first_name ||
        supabaseUser.user_metadata?.firstName ||
        "",
      lastName:
        supabaseUser.user_metadata?.last_name ||
        supabaseUser.user_metadata?.lastName ||
        "",
      phoneNumber: (() => {
        // Prioritize user_metadata.phone_number which should be in E164 format
        const metadataPhone = supabaseUser.user_metadata?.phone_number;
        if (metadataPhone) return metadataPhone;
        
        // Fallback to phone field, add + if missing
        const phone = supabaseUser.phone;
        if (!phone) return null;
        
        // Check if already has + prefix
        return phone.startsWith('+') ? phone : `+${phone}`;
      })(),
      role: getUserRole(supabaseUser),
      createdAt: supabaseUser.created_at,
      updatedAt: supabaseUser.updated_at || supabaseUser.created_at,
      orderCount: 0, // Will be resolved by field resolver
    };

    return {
      user,
      isAuthenticated: true,
      supabaseUser,
    };
  } catch (error) {
    console.error("Supabase auth context creation failed:", error);
    return {
      user: null,
      isAuthenticated: false,
      supabaseUser: null,
    };
  }
};

/**
 * Extract Bearer token from request headers
 */
export const getSupabaseToken = (
  request: IncomingMessage
): string | undefined => {
  const authHeader = request?.headers?.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return undefined;
  }
  return authHeader.substring(7);
};

/**
 * Extract token from WebSocket connection params
 */
export const getSupabaseTokenFromConnectionParams = (
  connectionParams: Record<string, any> | undefined
): string | undefined => {
  if (!connectionParams) return undefined;

  // Try different possible parameter names
  const authParam =
    connectionParams.authorization ||
    connectionParams.Authorization ||
    connectionParams.token ||
    connectionParams.accessToken;

  if (typeof authParam === "string") {
    return authParam.startsWith("Bearer ") ? authParam.substring(7) : authParam;
  }

  return undefined;
};

/**
 * Check if user has specific role
 */
export const hasRole = (supabaseUser: any, role: string): boolean => {
  const userRole =
    supabaseUser?.app_metadata?.role ||
    supabaseUser?.user_metadata?.role ||
    "USER";
  return userRole === role;
};

/**
 * Check if user has admin privileges
 */
export const isAdmin = (supabaseUser: any): boolean => {
  return hasRole(supabaseUser, "ADMIN");
};

/**
 * Check if user has partner privileges
 */
export const isPartner = (supabaseUser: any): boolean => {
  return hasRole(supabaseUser, "PARTNER");
};

/**
 * Get user role from Supabase metadata (app_metadata first, then user_metadata for backward compatibility)
 */
export const getUserRole = (
  supabaseUser: any
): "USER" | "ADMIN" | "PARTNER" => {
  return (
    supabaseUser?.app_metadata?.role ||
    supabaseUser?.user_metadata?.role ||
    "USER"
  );
};


/**
 * Sign in with Google ID token
 */
export const signInWithGoogle = async (
  idToken: string,
  firstName?: string,
  lastName?: string
) => {
  try {
    const { data, error } = await supabaseAdmin.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        user: null,
        session: null,
      };
    }

    return {
      success: true,
      error: null,
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    console.error("Google sign-in error:", error);
    return {
      success: false,
      error: "Google sign-in failed",
      user: null,
      session: null,
    };
  }
};

/**
 * Send OTP using Supabase's native phone auth (SMS via Twilio webhook)
 */
export const sendPhoneOTP = async (phoneNumber: string) => {
  try {
    const { data, error } = await supabaseAdmin.auth.signInWithOtp({
      phone: phoneNumber,
      options: {
        channel: "sms",
      },
    });

    if (error) {
      return { success: false, error: error.message, messageId: null };
    }

    return {
      success: true,
      error: null,
      messageId: data?.messageId || "supabase-otp",
    };
  } catch (error) {
    console.error("Send OTP error:", error);
    return { success: false, error: "Failed to send OTP", messageId: null };
  }
};

/**
 * Verify OTP using Supabase's native phone auth
 */
export const verifyPhoneOTP = async (
  phoneNumber: string,
  otp: string,
  firstName?: string,
  lastName?: string
) => {
  try {
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      phone: phoneNumber,
      token: otp,
      type: "sms",
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        user: null,
        session: null,
      };
    }

    return {
      success: true,
      error: null,
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    console.error("Verify OTP error:", error);
    return {
      success: false,
      error: "OTP verification failed",
      user: null,
      session: null,
    };
  }
};

/**
 * Invite a user by email (admin only)
 */
export const inviteUserByEmail = async (
  email: string,
  role: string,
  redirectUrl?: string
) => {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo:
          redirectUrl ||
          `${
            process.env.DASHBOARD_URL || "http://localhost:3000"
          }/auth/callback`,
      }
    );

    // Set role in app_metadata after invitation
    if (data.user && !error) {
      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
          app_metadata: { role: role },
        });

      if (updateError) {
        console.error("Failed to set role after invitation:", updateError);
        return {
          success: false,
          error: `User invited but failed to set role: ${updateError.message}`,
          user: null,
        };
      }
    }

    if (error) {
      return {
        success: false,
        error: error.message,
        user: null,
      };
    }

    return {
      success: true,
      error: null,
      user: data.user,
    };
  } catch (error) {
    console.error("Invite user error:", error);
    return {
      success: false,
      error: "Failed to invite user",
      user: null,
    };
  }
};
