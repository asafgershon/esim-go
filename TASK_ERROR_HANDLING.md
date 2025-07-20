# Task: Implement Structured Error Handling

## Overview
Create a comprehensive error handling system for the catalog sync flow with proper recovery mechanisms.

## Requirements

### 1. Error Classification System
- Implement error classification (transient vs permanent)
- Create error hierarchy with specific error types:
  - `CatalogSyncError`: Base error for catalog operations
  - `ApiTimeoutError`: API request timeouts (transient)
  - `CacheConnectionError`: Redis connection issues (transient)
  - `InvalidDataError`: Data corruption/parsing errors (permanent)
  - `RateLimitError`: API rate limiting (transient with backoff)

### 2. Automatic Retry with Exponential Backoff
```typescript
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
  jitter: boolean;
}

class RetryService {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    isRetryable: (error: Error) => boolean
  ): Promise<T>;
}
```

### 3. Error Alerting System
- Implement error alerting for critical failures
- Integration points for external monitoring (Slack/PagerDuty webhooks)
- Error aggregation to prevent alert spam
- Severity levels: LOW, MEDIUM, HIGH, CRITICAL

### 4. Error Correlation IDs
- Add error correlation IDs for debugging
- Link errors across services and operations
- Include correlation ID in all error logs and alerts

### 5. Circuit Breaker Pattern
```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

class CircuitBreaker {
  async execute<T>(operation: () => Promise<T>): Promise<T>;
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  getMetrics(): CircuitBreakerMetrics;
}
```

## Key Files to Modify

### Primary Files
- `server/server/src/services/catalog-sync.service.ts`
  - Replace basic error logging on lines 84-87, 280-283
  - Add structured error handling with retry logic
  - Implement circuit breaker for external API calls

- `server/server/src/datasources/esim-go/catalogue-datasource.ts`
  - Fix error swallowing in fallback logic (line 327 area)
  - Add comprehensive error classification
  - Implement retry mechanisms for cache operations

### New Files to Create
- `server/server/src/lib/error-handler.ts`
  - Central error handling utilities
  - Error classification functions
  - Error transformation and enrichment

- `server/server/src/lib/circuit-breaker.ts`
  - Circuit breaker implementation
  - Metrics collection and reporting
  - State management and recovery

- `server/server/src/lib/retry-service.ts`
  - Exponential backoff implementation
  - Jitter for distributed systems
  - Operation timeout handling

- `server/server/src/services/alert-service.ts`
  - Error alerting and notification
  - Alert deduplication and rate limiting
  - Integration with external monitoring systems

## Implementation Strategy

### Phase 1: Error Classification
1. Define error hierarchy and types
2. Update existing error handling to use new error types
3. Add error enrichment with context data

### Phase 2: Retry Logic
1. Implement RetryService with exponential backoff
2. Update catalog sync operations to use retry logic
3. Add retry metrics and monitoring

### Phase 3: Circuit Breaker
1. Implement circuit breaker for eSIM Go API calls
2. Add circuit breaker state monitoring
3. Implement automatic recovery mechanisms

### Phase 4: Alerting System
1. Create alert service with configurable thresholds
2. Add webhook integrations for external systems
3. Implement alert deduplication and escalation

## Success Criteria
- All errors are properly categorized and logged with context
- Transient errors are automatically retried with appropriate backoff
- Circuit breaker prevents cascade failures during API outages
- Critical errors trigger immediate alerts to operations team
- Error correlation IDs enable efficient debugging across services
- System degrades gracefully under failure conditions

## Testing Requirements
- Unit tests for all error classification logic
- Integration tests for retry mechanisms
- Chaos engineering tests for circuit breaker behavior
- Alert system tests with mock external services
- End-to-end error recovery scenarios

## Monitoring Integration
- Error rate dashboards by error type and severity
- Circuit breaker state monitoring
- Retry attempt metrics and success rates
- Alert delivery confirmation and response times
- System recovery time measurement

## Configuration
All error handling should be configurable via environment variables:
```env
ERROR_RETRY_MAX_ATTEMPTS=5
ERROR_RETRY_BASE_DELAY=1000
ERROR_CIRCUIT_BREAKER_THRESHOLD=10
ERROR_ALERT_WEBHOOK_URL=https://hooks.slack.com/...
ERROR_ALERT_RATE_LIMIT=60000
```