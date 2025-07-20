# Task: Implement Health Check and Monitoring System

## Overview
Create a comprehensive health check and monitoring system for the catalog sync functionality with real-time observability.

## Requirements

### 1. Health Check Endpoint
Create `/health/catalog` endpoint returning:
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "lastSync": "2025-01-20T10:30:00Z",
  "cacheHitRate": 0.95,
  "bundleCount": 15420,
  "bundleGroups": ["Standard Fixed", "Standard - Unlimited Lite", ...],
  "syncDuration": 45000,
  "apiLatency": 1250,
  "memoryUsage": {
    "heapUsed": 128.5,
    "heapTotal": 256.0,
    "external": 45.2
  },
  "cacheHealth": {
    "connected": true,
    "latency": 2.5,
    "errorRate": 0.001
  },
  "checks": {
    "catalogFreshness": "pass",
    "cacheConnectivity": "pass", 
    "apiConnectivity": "pass",
    "memoryUsage": "pass"
  }
}
```

### 2. Performance Metrics Collection
- Sync operation duration tracking
- API response time monitoring
- Cache hit/miss ratios
- Memory usage patterns
- Error rate calculations
- Throughput measurements (bundles/second)

### 3. Monitoring Hooks for External Systems
```typescript
interface MonitoringHooks {
  // Prometheus metrics integration
  prometheus: {
    registerMetrics(): void;
    updateCounter(name: string, value: number, labels?: Record<string, string>): void;
    updateGauge(name: string, value: number, labels?: Record<string, string>): void;
    updateHistogram(name: string, value: number, labels?: Record<string, string>): void;
  };
  
  // DataDog integration
  datadog: {
    increment(metric: string, tags?: string[]): void;
    gauge(metric: string, value: number, tags?: string[]): void;
    histogram(metric: string, value: number, tags?: string[]): void;
  };
  
  // Custom webhook integration
  webhook: {
    sendMetric(metric: MonitoringMetric): Promise<void>;
    sendAlert(alert: MonitoringAlert): Promise<void>;
  };
}
```

### 4. Alerting Rules Configuration
```typescript
interface AlertRule {
  name: string;
  condition: AlertCondition;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  channels: string[]; // ['slack', 'email', 'pagerduty']
  cooldown: number; // milliseconds
  escalation?: EscalationRule[];
}

interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '==' | '!=' | '>=' | '<=';
  threshold: number;
  duration: number; // how long condition must persist
}
```

### 5. Catalog Freshness Monitoring
- Detect stale catalog data (>24 hours without sync)
- Monitor sync frequency and success rates
- Track bundle count changes over time
- Identify missing or corrupt bundle groups

### 6. Admin Dashboard Integration
Create admin interface showing:
- Real-time sync status and progress
- Historical sync performance trends
- Cache performance metrics
- Error logs and resolution status
- System resource utilization

## Key Files to Create

### Core Monitoring Files
- `server/server/src/health/catalog-health.ts`
  - Main health check logic
  - Status determination algorithms
  - Health check caching and optimization

- `server/server/src/monitoring/catalog-metrics.ts`
  - Metrics collection and aggregation
  - Performance tracking utilities
  - Data export for external systems

- `server/server/src/monitoring/alert-manager.ts`
  - Alert rule evaluation engine
  - Alert delivery and escalation
  - Alert deduplication and rate limiting

- `server/server/src/monitoring/prometheus-integration.ts`
  - Prometheus metrics registry
  - Custom metric definitions
  - Scraping endpoint setup

### Configuration Files
- `server/server/src/config/monitoring.ts`
  - Monitoring configuration schema
  - Alert rule definitions
  - Threshold configurations

### API Endpoints
- `server/server/src/routes/health.ts`
  - Health check endpoints
  - Metrics endpoints for external scraping
  - Admin dashboard data endpoints

## Monitoring Metrics

### Catalog Sync Metrics
```typescript
// Counters
catalog_sync_total{status="success|failure"}
catalog_sync_bundles_processed_total
catalog_api_requests_total{endpoint, status_code}

// Gauges  
catalog_bundles_count{bundle_group}
catalog_last_sync_timestamp
catalog_cache_hit_ratio
catalog_memory_usage_bytes

// Histograms
catalog_sync_duration_seconds
catalog_api_response_time_seconds
catalog_cache_operation_duration_seconds
```

### Cache Performance Metrics
```typescript
// Counters
cache_operations_total{operation="get|set|delete", status="success|failure"}
cache_connections_total{status="success|failure"}

// Gauges
cache_connections_active
cache_memory_usage_bytes
cache_key_count

// Histograms
cache_operation_duration_seconds{operation}
```

### System Health Metrics
```typescript
// Gauges
nodejs_heap_space_size_used_bytes{space}
nodejs_heap_space_size_available_bytes{space}
nodejs_external_memory_bytes
process_cpu_user_seconds_total
process_cpu_system_seconds_total

// Counters
nodejs_gc_runs_total{gc_type}
process_open_file_descriptors
```

## Implementation Strategy

### Phase 1: Basic Health Checks
1. Create basic health check endpoint
2. Implement catalog freshness detection
3. Add cache connectivity checks
4. Create simple status aggregation

### Phase 2: Metrics Collection
1. Implement performance metrics collection
2. Add memory and resource monitoring
3. Create metrics storage and aggregation
4. Build basic dashboard data endpoints

### Phase 3: External Integrations
1. Implement Prometheus metrics export
2. Add DataDog integration hooks
3. Create webhook-based alert delivery
4. Build custom metrics pipeline

### Phase 4: Advanced Monitoring
1. Implement predictive alerting (trend analysis)
2. Add anomaly detection for catalog data
3. Create automated remediation triggers
4. Build comprehensive admin dashboard

## Alert Rules Configuration

### Critical Alerts
```yaml
# Catalog sync failure
- name: catalog_sync_failure
  condition:
    metric: catalog_sync_total{status="failure"}
    operator: ">="
    threshold: 3
    duration: 300000 # 5 minutes
  severity: CRITICAL
  channels: ["slack", "pagerduty"]
  cooldown: 900000 # 15 minutes

# Cache connection failure  
- name: cache_connection_failure
  condition:
    metric: cache_connections_active
    operator: "<"
    threshold: 1
    duration: 60000 # 1 minute
  severity: CRITICAL
  channels: ["slack", "pagerduty"]
  cooldown: 300000 # 5 minutes
```

### Warning Alerts
```yaml
# High memory usage
- name: high_memory_usage
  condition:
    metric: nodejs_heap_space_size_used_bytes
    operator: ">"
    threshold: 536870912 # 512MB
    duration: 300000 # 5 minutes
  severity: MEDIUM
  channels: ["slack"]
  cooldown: 1800000 # 30 minutes

# Low cache hit rate
- name: low_cache_hit_rate
  condition:
    metric: catalog_cache_hit_ratio
    operator: "<"
    threshold: 0.8
    duration: 600000 # 10 minutes
  severity: MEDIUM
  channels: ["slack"]
  cooldown: 3600000 # 1 hour
```

## Success Criteria
- Health checks provide accurate system status in <100ms
- All critical metrics are collected and exported
- Alerts fire within 60 seconds of threshold breach
- Dashboard provides real-time visibility into system health
- External monitoring systems receive consistent data feeds
- Automated remediation reduces manual intervention by 80%

## Testing Requirements
- Unit tests for all health check logic
- Integration tests for metrics collection
- Load tests for monitoring overhead impact
- Alert delivery tests with mock external services
- Dashboard performance tests under high data volume

## Performance Considerations
- Health checks must not impact system performance
- Metrics collection should use <1% CPU overhead
- Alert evaluation should complete in <10ms
- Dashboard queries should respond in <500ms
- Monitoring data retention policies to prevent storage bloat

## Configuration Examples
```env
MONITORING_ENABLED=true
HEALTH_CHECK_CACHE_TTL=30000
METRICS_COLLECTION_INTERVAL=15000
PROMETHEUS_METRICS_PORT=9090
DATADOG_API_KEY=your_key_here
ALERT_WEBHOOK_URL=https://hooks.slack.com/...
ALERT_RATE_LIMIT_WINDOW=300000
```