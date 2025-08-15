import { createLogger } from '../lib/logger';

const logger = createLogger({ component: 'retry-utils' });

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: () => true,
};

/**
 * Execute a function with exponential backoff retry logic
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable
      if (!opts.retryableErrors!(error)) {
        logger.warn('Error is not retryable, throwing immediately', {
          error: error.message,
          attempt,
          operationType: 'retry-not-retryable'
        });
        throw error;
      }

      if (attempt === opts.maxRetries) {
        logger.error('Max retries reached', error, {
          maxRetries: opts.maxRetries,
          operationType: 'retry-exhausted'
        });
        break;
      }

      logger.warn('Operation failed, retrying...', {
        error: error.message,
        attempt: attempt + 1,
        delay,
        operationType: 'retry-attempt'
      });

      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Calculate next delay with exponential backoff
      delay = Math.min(delay * opts.backoffMultiplier!, opts.maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Check if an error is a transient network error that should be retried
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNREFUSED' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET') {
    return true;
  }

  // HTTP status codes that are retryable
  if (error.statusCode >= 500 || error.statusCode === 429) {
    return true;
  }

  // AWS SDK specific errors
  if (error.name === 'Throttling' || 
      error.name === 'TooManyRequestsException' ||
      error.name === 'ServiceUnavailable' ||
      error.name === 'RequestTimeout') {
    return true;
  }

  return false;
}