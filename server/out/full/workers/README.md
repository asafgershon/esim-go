# eSIM Go Catalog Sync Workers

Reliable background workers for syncing eSIM catalog data from the eSIM Go API to persistent storage.

## Architecture

### Components

1. **BullMQ Workers** - Process catalog sync jobs with retry logic and error handling
2. **Scheduler** - Manages periodic tasks like health checks and cleanup
3. **Supabase Integration** - Persists catalog data to PostgreSQL
4. **Type-safe API Client** - Generated from OpenAPI spec for reliable API communication

### Job Types

- **Full Sync** - Syncs entire catalog using bundle group strategy
- **Group Sync** - Syncs a specific bundle group
- **Country Sync** - Syncs bundles for a specific country
- **Bundle Sync** - Syncs a single bundle (planned)

## Setup

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `ESIM_GO_API_KEY` - eSIM Go API key
- `REDIS_HOST` - Redis host for BullMQ

### Installation

```bash
bun install
```

### Database Migration

Run the catalog tables migration in your Supabase project:

```sql
-- See server/db/migrations/005_create_catalog_tables.sql
```

## Running

### Development

```bash
bun run dev
```

### Production

```bash
bun run build
bun run start
```

## Deployment

### Railway

The workers are designed to run on Railway with the following configuration:

1. **Environment Variables**: Set all required env vars in Railway dashboard
2. **Redis**: Add Redis plugin or external Redis URL
3. **Start Command**: `bun run start`
4. **Health Checks**: Workers expose health metrics via logs

### Docker

```dockerfile
FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY server/packages ./server/packages
COPY server/workers ./server/workers

# Install dependencies
RUN bun install --frozen-lockfile

# Build
WORKDIR /app/server/workers
RUN bun run build

# Run
CMD ["bun", "run", "start"]
```

## Monitoring

### Logs

Workers use structured logging with correlation IDs:

```typescript
logger.info('Bundle group sync completed', {
  bundleGroup: 'Standard Fixed',
  processed: 150,
  added: 10,
  updated: 140,
  operationType: 'sync-completed'
});
```

### Queue Statistics

The scheduler logs queue statistics every 30 minutes:

```json
{
  "waiting": 2,
  "active": 1,
  "completed": 145,
  "failed": 3,
  "total": 151
}
```

### Performance Metrics

All major operations are wrapped with performance logging:

```json
{
  "operation": "full-catalog-sync",
  "duration": 45000,
  "context": {
    "jobId": "123",
    "bundleGroups": 5,
    "totalBundles": 750
  }
}
```

## API Integration

The workers follow eSIM Go's recommended bundle group strategy:

1. Fetch bundles by group (5 API calls instead of 100+)
2. Use 200 items per page (maximum allowed)
3. Cache results for 30 days (aligned with monthly updates)

Bundle groups:
- Standard Fixed
- Standard - Unlimited Lite
- Standard - Unlimited Essential
- Standard - Unlimited Plus
- Regional Bundles

## Error Handling

- **Retry Logic**: Exponential backoff with 3 attempts
- **Stuck Job Detection**: Jobs running >60 minutes are cancelled
- **Dead Letter Queue**: Failed jobs preserved for debugging
- **API Health Monitoring**: Checks every 5 minutes

## Security

- All API keys stored as environment variables
- Supabase RLS policies control data access
- No sensitive data logged
- Connection pooling for database efficiency