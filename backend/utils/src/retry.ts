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

export class RetryableError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class NonRetryableError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
  logger?: StructuredLogger
): Promise<T> {
  const {
    maxAttempts,
    baseDelay = 1000,
    maxDelay = 30000,
    exponential = true,
    jitter = true,
    shouldRetry = (error) => !(error instanceof NonRetryableError),
    onRetry
  } = options;

  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if it's the last attempt
      if (attempt === maxAttempts) {
        break;
      }
      
      // Check if we should retry this error
      if (!shouldRetry(lastError)) {
        logger?.warn('Non-retryable error encountered', {
          error: lastError.message,
          attempt,
          operationType: 'retry-skip'
        });
        break;
      }
      
      // Calculate delay
      let delay = exponential ? baseDelay * Math.pow(2, attempt - 1) : baseDelay;
      delay = Math.min(delay, maxDelay);
      
      // Add jitter to prevent thundering herd
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }
      
      logger?.warn('Operation failed, retrying', {
        attempt,
        maxAttempts,
        delay: Math.round(delay),
        error: lastError.message,
        operationType: 'retry-attempt'
      });
      
      // Call retry callback if provided
      onRetry?.(lastError, attempt);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  if (lastError) {
    logger?.error('Operation failed after all retry attempts', lastError, {
      maxAttempts,
      operationType: 'retry-exhausted'
    });
    throw lastError;
  }
  
  throw new Error('Retry operation completed without success or error');
}