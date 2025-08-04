import type { CatalogueResponseInner } from './generated';

// Enhanced bundle with computed properties
export interface EnhancedBundle extends CatalogueResponseInner {
  readonly isUnlimited: boolean;
  readonly pricePerGB?: number;
  readonly durationCategory: 'short' | 'medium' | 'long';
  readonly supportedCountryCodes: string[];
}

// Catalog search criteria
export interface CatalogSearchCriteria {
  countries?: string[];
  minDuration?: number;
  maxDuration?: number;
  dataAmountMin?: number;
  dataAmountMax?: number;
  bundleGroups?: string[];
  unlimited?: boolean;
}

// Worker job types
export interface CatalogSyncJobData {
  type: 'full-sync' | 'country-sync' | 'group-sync';
  countryId?: string;
  bundleGroup?: string;
  priority: 'high' | 'normal' | 'low';
  metadata?: Record<string, any>;
}

// API response wrappers with metadata
export interface ESimGoApiResponse<T> {
  data: T;
  metadata: {
    requestId: string;
    timestamp: string;
    cached: boolean;
    source: 'api' | 'cache' | 'database';
  };
}

// Client configuration
export interface ESimGoClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  enableLogging?: boolean;
}

// Error types
export class ESimGoApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: any,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ESimGoApiError';
  }
}

export class ESimGoRateLimitError extends ESimGoApiError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number,
    response?: any
  ) {
    super(message, 429, response);
    this.name = 'ESimGoRateLimitError';
  }
}

export class ESimGoAuthError extends ESimGoApiError {
  constructor(message: string = 'Authentication failed', response?: any) {
    super(message, 401, response);
    this.name = 'ESimGoAuthError';
  }
}