"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NonRetryableError = exports.RetryableError = void 0;
exports.withRetry = withRetry;
class RetryableError extends Error {
    cause;
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'RetryableError';
    }
}
exports.RetryableError = RetryableError;
class NonRetryableError extends Error {
    cause;
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'NonRetryableError';
    }
}
exports.NonRetryableError = NonRetryableError;
async function withRetry(operation, options, logger) {
    const { maxAttempts, baseDelay = 1000, maxDelay = 30000, exponential = true, jitter = true, shouldRetry = (error) => !(error instanceof NonRetryableError), onRetry } = options;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
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
