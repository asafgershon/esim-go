import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cleanEnv, str } from "envalid";
import type { IncomingMessage } from "node:http";
import type { User } from "../types";

const env = cleanEnv(process.env, {
  SUPABASE_URL: str(),
  SUPABASE_ANON_KEY: str(),
  SUPABASE_SERVICE_ROLE_KEY: str(),
});

// Create Supabase clients
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const supabaseClient = createClient(
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
    // Verify JWT with Supabase
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
      phoneNumber:
        supabaseUser.phone || supabaseUser.user_metadata?.phone_number || null,
      createdAt: supabaseUser.created_at,
      updatedAt: supabaseUser.updated_at || supabaseUser.created_at,
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
  const userRole = supabaseUser?.user_metadata?.role || "USER";
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
 * Get user role from Supabase user metadata
 */
export const getUserRole = (
  supabaseUser: any
): "USER" | "ADMIN" | "PARTNER" => {
  return supabaseUser?.user_metadata?.role || "USER";
};

/**
 * Sign in with Apple ID token
 */
export const signInWithApple = async (
  idToken: string,
  firstName?: string,
  lastName?: string
) => {
  try {
    const { data, error } = await supabaseAdmin.auth.signInWithIdToken({
      provider: "apple",
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
    console.error("Apple sign-in error:", error);
    return {
      success: false,
      error: "Apple sign-in failed",
      user: null,
      session: null,
    };
  }
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
 * Send OTP to phone number using AWS SNS
 * This function integrates with our OTP service
 */
export const sendPhoneOTP = async (phoneNumber: string) => {
  try {
    // Import here to avoid circular dependencies
    const { otpService } = await import("../services/otp-service");

    const result = await otpService.sendOTP(phoneNumber);

    return {
      success: result.success,
      error: result.error,
      messageId: result.messageId,
      expiresAt: result.expiresAt,
    };
  } catch (error) {
    console.error("Send AWS OTP error:", error);
    return {
      success: false,
      error: "Failed to send OTP",
      messageId: null,
      expiresAt: null,
    };
  }
};

/**
 * Verify OTP and create/sign in user using AWS SNS
 */
export const verifyPhoneOTP = async (
  phoneNumber: string,
  otp: string,
  firstName?: string,
  lastName?: string
) => {
  try {
    // Import here to avoid circular dependencies
    const { otpService } = await import("../services/otp-service");
    const { awsSMS } = await import("../services/aws-sms");

    // First verify OTP
    const otpResult = otpService.verifyOTP(phoneNumber, otp);

    if (!otpResult.success) {
      return {
        success: false,
        error: otpResult.error,
        user: null,
        session: null,
        attemptsRemaining: otpResult.attemptsRemaining,
      };
    }

    // Check if user exists by phone number using Admin API
    const { data: userListData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000, // Increase to handle more users - you might want to implement pagination
      });

    if (listError) {
      console.error("❌ User list error:", listError);
      return {
        success: false,
        error: "Failed to check existing user",
        user: null,
        session: null,
      };
    }

    // Find user by phone number
    const existingUser = userListData.users.find(
      (user) => user.phone === phoneNumber
    );

    let user;
    let session;

    if (existingUser) {
      // EXISTING USER FLOW
      console.log(`🔄 Existing user login: ${phoneNumber.substring(0, 6)}***`);

      // Update user metadata if new info provided
      if (firstName || lastName) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            ...existingUser.user_metadata,
            first_name: firstName || existingUser.user_metadata?.first_name,
            last_name: lastName || existingUser.user_metadata?.last_name,
            last_login_method: "phone",
            last_login_at: new Date().toISOString(),
          },
        });
      }

      // For existing users, we'll create a session using Admin API
      // Note: After OTP verification, we trust the user is authentic
      user = existingUser;

      // Generate a session by creating a magic link and extracting the session URL
      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email:
            existingUser.email ||
            `${phoneNumber.replace("+", "")}@phone.esimgo.com`,
        });

      if (linkError) {
        console.error("❌ Link generation error:", linkError);
        return {
          success: false,
          error: "Failed to create session",
          user: null,
          session: null,
        };
      }

      // Extract tokens from the magic link URL
      const linkUrl = linkData.properties.action_link;
      const urlParams = new URLSearchParams(
        linkUrl.split("#")[1] || linkUrl.split("?")[1]
      );

      session = {
        access_token: urlParams.get("access_token") || "",
        refresh_token: urlParams.get("refresh_token") || "",
        expires_in: parseInt(urlParams.get("expires_in") || "3600"),
        token_type: "bearer",
      };
    } else {
      console.log(`👤 Creating new user: ${phoneNumber.substring(0, 6)}***`);

      // Create user with comprehensive metadata
      const newUserEmail = `${phoneNumber.replace("+", "")}@phone.esimgo.com`;
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: newUserEmail,
        phone: phoneNumber,
        phone_confirm: true, // Phone already verified by our OTP
        email_confirm: true, // Auto-confirm generated email
        user_metadata: {
          first_name: firstName || "",
          last_name: lastName || "",
          phone_number: phoneNumber,
          role: "USER",
          auth_method: "phone",
          created_via: "phone_verification",
          created_at: new Date().toISOString(),
          onboarding_completed: false,
        },
        app_metadata: {
          provider: "phone",
          providers: ["phone"],
        },
      });

      if (error) {
        console.error("❌ User creation error:", error);
        return {
          success: false,
          error: error.message,
          user: null,
          session: null,
        };
      }

      console.log("✅ New user created in Supabase:", {
        id: data.user!.id,
        phone: phoneNumber.substring(0, 6) + "***",
        email: newUserEmail,
      });

      user = data.user;

      // Generate session for new user
      const { data: sessionData, error: sessionError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: newUserEmail,
        });

      if (sessionError) {
        console.error("❌ Session creation error:", sessionError);
        return {
          success: false,
          error: "User created but session failed",
          user: null,
          session: null,
        };
      }

      // Extract tokens from the magic link URL
      const linkUrl = sessionData.properties.action_link;
      const urlParams = new URLSearchParams(
        linkUrl.split("#")[1] || linkUrl.split("?")[1]
      );

      session = {
        access_token: urlParams.get("access_token") || "",
        refresh_token: urlParams.get("refresh_token") || "",
        expires_in: parseInt(urlParams.get("expires_in") || "3600"),
        token_type: "bearer",
      };

      // Send welcome SMS to new user
      try {
        await awsSMS.sendWelcome(phoneNumber, firstName);
        console.log("📱 Welcome SMS sent to new user");
      } catch (welcomeError) {
        console.warn("⚠️ Welcome SMS failed:", welcomeError);
        // Don't fail the registration for this
      }
    }

    return {
      success: true,
      error: null,
      user,
      session,
    };
  } catch (error) {
    console.error("Verify AWS OTP error:", error);
    return {
      success: false,
      error: "OTP verification failed",
      user: null,
      session: null,
    };
  }
};
