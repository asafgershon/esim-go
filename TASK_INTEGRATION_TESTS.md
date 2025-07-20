# Task: Add Integration Tests for Fallback Chains

## Overview
Create comprehensive integration tests to verify the entire catalog sync fallback chain works correctly under various failure scenarios.

## Requirements

### 1. Complete Fallback Chain Testing
Test the full fallback sequence: **API → Cache → Backup → Error**

```typescript
describe('Catalog Sync Fallback Chain', () => {
  describe('Primary API Success', () => {
    // Test normal operation when eSIM Go API is healthy
  });
  
  describe('API Failure → Cache Fallback', () => {
    // Test cache retrieval when API fails
  });
  
  describe('API + Cache Failure → Backup Fallback', () => {
    // Test backup data retrieval when both API and cache fail
  });
  
  describe('Complete Failure → Error Handling', () => {
    // Test graceful degradation when all systems fail
  });
});
```

### 2. eSIM Go API Failure Scenarios
Mock various API failure conditions:
- **Network timeouts**: Simulate network connectivity issues
- **Rate limiting**: Test 429 responses and backoff behavior
- **Server errors**: 500/502/503 responses from eSIM Go
- **Partial failures**: Some bundle groups succeed, others fail
- **Malformed responses**: Invalid JSON or missing required fields
- **Authentication failures**: Invalid API key scenarios

### 3. Cache Invalidation and Refresh Scenarios
```typescript
describe('Cache Invalidation Scenarios', () => {
  test('should refresh cache when TTL expires', async () => {
    // Test automatic cache refresh after 30-day TTL
  });
  
  test('should handle cache corruption gracefully', async () => {
    // Test behavior when cached data is corrupted
  });
  
  test('should recover from cache connection loss', async () => {
    // Test Redis connection failures and recovery
  });
  
  test('should handle concurrent cache operations', async () => {
    // Test race conditions during cache updates
  });
});
```

### 4. Sync Behavior Under Various Failure Conditions
- **Distributed lock failures**: Test concurrent sync attempts
- **Memory pressure**: Test behavior under high memory usage
- **Disk space issues**: Test when backup file loading fails
- **Database connection loss**: Test Supabase connection failures
- **Partial data corruption**: Test handling of corrupted bundle data

### 5. Performance Tests for Large Catalog Datasets
```typescript
describe('Performance Under Load', () => {
  test('should handle 50,000+ bundles efficiently', async () => {
    // Test memory usage and performance with large datasets
  });
  
  test('should complete sync within acceptable timeframe', async () => {
    // Test that full sync completes within 5 minutes
  });
  
  test('should handle concurrent search requests during sync', async () => {
    // Test system remains responsive during sync operations
  });
});
```

### 6. Concurrent Access Patterns and Race Conditions
- **Multiple sync processes**: Test distributed lock effectiveness
- **Search during sync**: Test data consistency during updates
- **Cache warming**: Test concurrent cache population
- **Index rebuilding**: Test index consistency during updates

### 7. Chaos Engineering Scenarios
```typescript
describe('Chaos Engineering Tests', () => {
  test('should survive random API failures', async () => {
    // Inject random failures into API calls
  });
  
  test('should handle network partitions', async () => {
    // Test behavior when external services are unreachable
  });
  
  test('should recover from memory exhaustion', async () => {
    // Test garbage collection and memory recovery
  });
  
  test('should handle process restarts gracefully', async () => {
    // Test state recovery after unexpected shutdowns
  });
});
```

## Key Files to Create

### Core Test Files
- `server/server/src/tests/integration/catalog-sync.test.ts`
  - Main sync flow integration tests
  - Distributed lock testing
  - Performance benchmarks

- `server/server/src/tests/integration/catalog-fallback.test.ts`
  - Complete fallback chain testing
  - API failure simulation
  - Cache and backup fallback verification

- `server/server/src/tests/integration/catalog-concurrent.test.ts`
  - Concurrent access pattern testing
  - Race condition verification
  - Data consistency checks

- `server/server/src/tests/integration/catalog-chaos.test.ts`
  - Chaos engineering tests
  - Random failure injection
  - Recovery time measurement

### Test Utilities and Fixtures
- `server/server/src/tests/fixtures/esim-go-responses.ts`
  - Mock API responses for different scenarios
  - Bundle data fixtures
  - Error response templates

- `server/server/src/tests/utils/test-helpers.ts`
  - Test database setup and teardown
  - Mock service creation utilities
  - Performance measurement helpers

- `server/server/src/tests/utils/chaos-injection.ts`
  - Random failure injection utilities
  - Network partition simulation
  - Memory pressure simulation

### Mock Services
- `server/server/src/tests/mocks/esim-go-api.mock.ts`
  - eSIM Go API mock server
  - Configurable failure scenarios
  - Response time simulation

- `server/server/src/tests/mocks/redis.mock.ts`
  - Redis mock with failure injection
  - TTL and expiration simulation
  - Connection failure scenarios

## Test Scenarios Matrix

### API Failure Scenarios
| Scenario | API Response | Expected Behavior |
|----------|--------------|-------------------|
| Network Timeout | Connection timeout | Retry with exponential backoff, fallback to cache |
| Rate Limiting | 429 status | Implement rate limit backoff, continue with cached data |
| Server Error | 500/502/503 | Immediate fallback to cache, log error for monitoring |
| Invalid API Key | 401 status | Alert administrators, use backup data |
| Malformed Response | Invalid JSON | Parse error handling, fallback to cache |
| Partial Success | Some groups fail | Continue with successful data, retry failed groups |

### Cache Failure Scenarios
| Scenario | Cache State | Expected Behavior |
|----------|-------------|-------------------|
| Redis Connection Lost | Connection error | Continue with in-memory cache, attempt reconnection |
| Cache Corruption | Parse errors | Clear corrupted keys, rebuild from API |
| TTL Expiration | Stale data | Trigger background refresh, serve stale until updated |
| Memory Pressure | Redis OOM | Implement LRU eviction, fallback to backup |
| Concurrent Updates | Race conditions | Use atomic operations, implement proper locking |

### Performance Requirements
| Metric | Target | Test Method |
|--------|--------|-------------|
| Sync Duration | < 5 minutes | Time full catalog sync with 50k+ bundles |
| Memory Usage | < 512MB peak | Monitor heap usage during large operations |
| Cache Hit Rate | > 95% | Measure cache performance under load |
| Search Response | < 100ms | Test search performance during sync |
| Recovery Time | < 30 seconds | Measure time to recover from failures |

## Implementation Strategy

### Phase 1: Basic Integration Tests
1. Set up test environment with Docker containers
2. Create mock eSIM Go API server
3. Implement basic fallback chain tests
4. Add cache invalidation testing

### Phase 2: Failure Scenario Testing
1. Implement comprehensive API failure mocks
2. Add cache corruption and recovery tests
3. Create concurrent access pattern tests
4. Add performance benchmarking

### Phase 3: Chaos Engineering
1. Implement random failure injection
2. Add network partition simulation
3. Create memory pressure tests
4. Build automated recovery validation

### Phase 4: Performance and Load Testing
1. Create large dataset test fixtures
2. Implement performance regression detection
3. Add memory leak detection
4. Build load testing scenarios

## Test Environment Setup

### Docker Compose Configuration
```yaml
version: '3.8'
services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: esim_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"
  
  redis-test:
    image: redis:7-alpine
    ports:
      - "6380:6379"
  
  esim-go-mock:
    build: ./tests/mocks/esim-go-api
    ports:
      - "3001:3000"
    environment:
      - FAILURE_RATE=0.1
      - LATENCY_MS=100
```

### Test Data Management
```typescript
// Test data factory
class TestDataFactory {
  static createBundle(overrides?: Partial<ESIMGoDataPlan>): ESIMGoDataPlan;
  static createBundles(count: number, groupName: string): ESIMGoDataPlan[];
  static createCorruptedBundle(): string; // Invalid JSON
  static createLargeDataset(size: number): ESIMGoDataPlan[];
}

// Test database utilities
class TestDatabase {
  static async setup(): Promise<void>;
  static async teardown(): Promise<void>;
  static async seed(data: any[]): Promise<void>;
  static async clear(): Promise<void>;
}
```

## Success Criteria
- 100% test coverage of fallback chain scenarios
- All API failure modes tested and verified
- Cache invalidation and recovery tested thoroughly
- Performance benchmarks established and monitored
- Chaos engineering tests pass consistently
- Integration tests complete in <10 minutes
- Test environment setup automated and reliable

## Continuous Integration Integration
```yaml
# GitHub Actions workflow
name: Integration Tests
on:
  pull_request:
  push:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:integration
      - run: npm run test:performance
      - run: npm run test:chaos
```

## Monitoring and Reporting
- Test execution time tracking
- Performance regression detection
- Failure rate monitoring across test runs
- Coverage reporting for integration scenarios
- Automated alerts for test failures in CI/CD pipeline