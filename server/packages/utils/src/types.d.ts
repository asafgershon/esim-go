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
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly RATE_LIMITED: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly SERVICE_UNAVAILABLE: 503;
};
export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
