import type { V2PackagesGet200ResponseDataInner, V2OrdersGet200ResponseDataInner } from './generated';

// Enhanced package with computed properties
export interface EnhancedPackage extends V2PackagesGet200ResponseDataInner {
  readonly isUnlimited: boolean;
  readonly pricePerGB?: number;
  readonly durationCategory: 'short' | 'medium' | 'long';
  readonly supportedCountryCodes: string[];
}

// Package search criteria
export interface PackageSearchCriteria {
  countries?: string[];
  minDuration?: number;
  maxDuration?: number;
  dataAmountMin?: number;
  dataAmountMax?: number;
  unlimited?: boolean;
  limit?: number;
  page?: number;
}

// Worker job types
export interface PackageSyncJobData {
  type: 'full-sync' | 'country-sync' | 'operator-sync';
  countryId?: string;
  operatorId?: string;
  priority: 'high' | 'normal' | 'low';
  metadata?: Record<string, any>;
}

// API response wrappers with metadata
export interface AirhaloApiResponse<T> {
  data: T;
  metadata: {
    requestId: string;
    timestamp: string;
    cached: boolean;
    source: 'api' | 'cache' | 'database';
  };
}

// Client configuration
export interface AirhaloClientConfig {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  enableLogging?: boolean;
}

// Error types
export class AirhaloApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: any,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AirhaloApiError';
  }
}

export class AirhaloRateLimitError extends AirhaloApiError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number,
    response?: any
  ) {
    super(message, 429, response);
    this.name = 'AirhaloRateLimitError';
  }
}

export class AirhaloAuthError extends AirhaloApiError {
  constructor(message: string = 'Authentication failed', response?: any) {
    super(message, 401, response);
    this.name = 'AirhaloAuthError';
  }
}

// Order types
export interface OrderRequest {
  packageId: string;
  quantity?: number;
  referenceId?: string;
}

export interface OrderResponse extends V2OrdersGet200ResponseDataInner {
  // Add any additional properties if needed
}