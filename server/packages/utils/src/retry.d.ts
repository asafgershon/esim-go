import { StructuredLogger } from './logger';
export interface RetryOptions {
    maxAttempts: number;
    baseDelay?: number;
    maxDelay?: number;
    exponential?: boolean;
    jitter?: boolean;
    shouldRetry?: (error: Error) => boolean;
    onRetry?: (error: Error, attempt: number) => void;
}
export declare class RetryableError extends Error {
    readonly cause?: Error | undefined;
    constructor(message: string, cause?: Error | undefined);
}
export declare class NonRetryableError extends Error {
    readonly cause?: Error | undefined;
    constructor(message: string, cause?: Error | undefined);
}
export declare function withRetry<T>(operation: () => Promise<T>, options: RetryOptions, logger?: StructuredLogger): Promise<T>;
