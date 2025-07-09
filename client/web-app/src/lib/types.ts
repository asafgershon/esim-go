export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignInResponse {
  success: boolean;
  error?: string;
  user?: User;
  sessionToken?: string;
  refreshToken?: string;
}

export interface SignUpResponse {
  success: boolean;
  error?: string;
  user?: User;
  sessionToken?: string;
  refreshToken?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface SocialSignInInput {
  idToken: string;
  firstName?: string;
  lastName?: string;
}

export interface SendOTPResponse {
  success: boolean;
  error?: string;
  messageId?: string;
}

export interface VerifyOTPInput {
  phoneNumber: string;
  otp: string;
  firstName?: string;
  lastName?: string;
}

// Apple Sign-In specific types
export interface AppleSignInResponse {
  authorization: {
    id_token: string;
    code: string;
  };
  user?: {
    name?: {
      firstName?: string;
      lastName?: string;
    };
    email?: string;
  };
}

// Google Sign-In specific types  
export interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

// Country ISO Code type for URL state management
export type CountryISOCode = string; // 2-letter ISO country code (e.g., 'US', 'IL', 'FR')
