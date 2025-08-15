// Common types used across the eSIM Go project

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  error?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export interface CacheMetadata {
  cached: boolean;
  cacheKey?: string;
  ttl?: number;
  source: 'cache' | 'api' | 'database';
  timestamp: string;
}

export interface JobMetadata {
  jobId: string;
  jobType: string;
  priority: 'high' | 'medium' | 'low';
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  processedAt?: string;
}

export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'retrying';

export interface WorkerJobData {
  type: string;
  payload: Record<string, any>;
  metadata?: JobMetadata;
}

// HTTP Status codes for error handling
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];