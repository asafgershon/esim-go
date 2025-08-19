/**
 * TypeScript interfaces for Airalo API responses
 */

// Authentication
export interface AiraloAuthRequest {
  client_id: string;
  client_secret: string;
  grant_type: 'client_credentials';
}

export interface AiraloAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Package/Catalog interfaces
export interface AiraloCountry {
  id: string;
  name: string;
  iso: string;
  regions: string[];
}

export interface AiraloPackage {
  id: string;
  title: string;
  slug: string;
  price: number;
  data: number; // MB, -1 for unlimited
  validity: number; // days
  is_unlimited: boolean;
  type: 'local' | 'global';
  countries: AiraloCountry[];
  description?: string;
  operator?: string;
  coverage_type: string;
  price_currency: string;
}

export interface AiraloPackagesResponse {
  data: AiraloPackage[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Order interfaces
export interface AiraloOrderRequest {
  package_id: string;
  quantity: number;
  type: 'sim' | 'esim';
  description?: string;
}

export interface AiraloOrderResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  package_id: string;
  quantity: number;
  price: number;
  currency: string;
  created_at: string;
  sims?: AiraloSIM[];
}

export interface AiraloSIM {
  id: string;
  iccid: string;
  lpa: string; // LPA code for eSIM activation
  qr_code: string;
  manual_code: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  created_at: string;
  package: {
    id: string;
    title: string;
    data: number;
    validity: number;
  };
}

// Usage tracking
export interface AiraloUsageResponse {
  remaining_data: number; // bytes
  used_data: number; // bytes
  total_data: number; // bytes
  status: string;
  expires_at: string;
}

// Balance
export interface AiraloBalanceResponse {
  balance: number;
  currency: string;
}

// Topup interfaces
export interface AiraloTopupPackage {
  id: string;
  title: string;
  price: number;
  data: number;
  validity: number;
  currency: string;
}

export interface AiraloTopupRequest {
  iccid: string;
  package_id: string;
}

export interface AiraloTopupResponse {
  id: string;
  status: string;
  price: number;
  currency: string;
  created_at: string;
}

// Error response
export interface AiraloErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status_code: number;
}

// API configuration
export interface AiraloConfig {
  client_id: string;
  client_secret: string;
  environment: 'sandbox' | 'production';
}