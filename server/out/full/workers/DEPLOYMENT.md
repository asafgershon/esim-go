# Deployment Guide for eSIM Go Catalog Sync Workers

## Railway Deployment (Recommended)

### Prerequisites
- Railway account with a project created
- Redis add-on or external Redis instance
- Supabase project with catalog tables migrated

### Step 1: Add Redis to Railway
```bash
# In Railway dashboard
# 1. Click "New" → "Database" → "Redis"
# 2. Copy the REDIS_URL from the Redis service
```

### Step 2: Configure Environment Variables
In Railway dashboard, add these variables:

```env
# Required
NODE_ENV=production
LOG_LEVEL=info
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
ESIM_GO_API_KEY=your-api-key

# Redis (use Railway's Redis plugin URL)
REDIS_URL=${{Redis.REDIS_URL}}

# Or configure manually
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Optional overrides
WORKER_CONCURRENCY=5
SYNC_INTERVAL=0 0 * * *
STUCK_JOB_THRESHOLD=60
CLEANUP_OLD_JOBS_DAYS=30
```

### Step 3: Deploy from GitHub
1. Connect your GitHub repository to Railway
2. Railway will auto-detect the configuration from `railway.toml`
3. Deploy will start automatically on push to main branch

### Step 4: Monitor Deployment
- Check build logs in Railway dashboard
- Verify health endpoint: `https://your-app.railway.app/health`
- Monitor worker logs for sync activity

## Docker Deployment

### Build and Run Locally
```bash
# Build the image
docker build -t esim-go-workers -f server/workers/Dockerfile .

# Run with environment variables
docker run -d \
  --name esim-go-workers \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e REDIS_HOST=redis \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_ANON_KEY=your-anon-key \
  -e ESIM_GO_API_KEY=your-api-key \
  esim-go-workers
```

### Docker Compose Example
```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    
  workers:
    build:
      context: .
      dockerfile: server/workers/Dockerfile
    depends_on:
      - redis
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - ESIM_GO_API_KEY=${ESIM_GO_API_KEY}
    ports:
      - "3000:3000"
    restart: unless-stopped

volumes:
  redis_data:
```

## Manual Deployment (VPS/EC2)

### Prerequisites
- Node.js 18+ or Bun runtime
- Redis server
- PM2 or systemd for process management

### Install and Setup
```bash
# Clone repository
git clone https://github.com/your-org/esim-go.git
cd esim-go

# Install dependencies
bun install

# Build packages
cd server/packages/utils && bun run build && cd -
cd server/packages/esim-go-client && bun run build && cd -
cd server/workers && bun run build

# Create .env file
cp server/workers/.env.example server/workers/.env
# Edit .env with your values
```

### Run with PM2
```bash
# Install PM2
npm install -g pm2

# Start workers
cd server/workers
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save
pm2 startup
```

### PM2 Ecosystem Config
Create `server/workers/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'esim-go-workers',
    script: 'bun',
    args: 'run start',
    cwd: '/path/to/esim-go/server/workers',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

## Health Monitoring

### Health Check Endpoint
The workers expose a health check endpoint at `http://localhost:3000/health`:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "checks": {
    "redis": true,
    "supabase": true,
    "queue": true
  },
  "queue": {
    "waiting": 0,
    "active": 1,
    "completed": 150,
    "failed": 2
  }
}
```

### Monitoring Setup
1. Configure your monitoring service (Datadog, New Relic, etc.) to check `/health`
2. Set up alerts for:
   - Health check failures
   - High queue depth (waiting > 100)
   - High failure rate
   - Worker restarts

## Scaling Considerations

### Horizontal Scaling
- Deploy multiple worker instances
- Each instance processes jobs independently
- Redis handles job distribution

### Vertical Scaling
- Increase `WORKER_CONCURRENCY` for more parallel processing
- Monitor memory usage and adjust accordingly

### Queue Management
- Monitor queue depth and processing time
- Adjust concurrency based on API rate limits
- Use priority settings for time-sensitive syncs

## Troubleshooting

### Common Issues

1. **Redis Connection Errors**
   - Verify Redis is running and accessible
   - Check firewall rules
   - Confirm Redis credentials

2. **Supabase Connection Errors**
   - Verify Supabase URL and anon key
   - Check network connectivity
   - Ensure catalog tables are migrated

3. **High Memory Usage**
   - Reduce `WORKER_CONCURRENCY`
   - Check for memory leaks in logs
   - Monitor bundle processing size

4. **Stuck Jobs**
   - Check worker logs for errors
   - Manually clear stuck jobs via API
   - Adjust `STUCK_JOB_THRESHOLD`

### Debug Mode
Run workers in debug mode:
```bash
LOG_LEVEL=debug bun run dev
```

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use secrets management in production
   - Rotate API keys regularly

2. **Network Security**
   - Use private networking for Redis
   - Restrict health endpoint access
   - Enable SSL/TLS for all connections

3. **Access Control**
   - Limit Supabase permissions
   - Use read-only credentials where possible
   - Monitor API usage for anomalies