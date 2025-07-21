#!/bin/bash

# Clear eSIM Go catalog cache and sync lock
# Uses environment variables from .env file

# Load environment variables
if [ -f "server/server/.env" ]; then
    export $(cat server/server/.env | grep -v '^#' | xargs)
fi

# Redis connection using environment variables
REDIS_CONN="redis://localhost:6379"
if [ ! -z "$REDIS_PASSWORD" ]; then
    REDIS_CONN="redis://:$REDIS_PASSWORD@localhost:6379"
fi

echo "🧹 Clearing eSIM Go catalog cache and sync lock..."
echo "Using Redis: $REDIS_CONN"

# Clear all catalog-related cache keys
redis-cli -u "$REDIS_CONN" --scan --pattern "esim-go:catalog:*" | xargs redis-cli -u "$REDIS_CONN" DEL
redis-cli -u "$REDIS_CONN" --scan --pattern "esim-go:country-catalog:*" | xargs redis-cli -u "$REDIS_CONN" DEL
redis-cli -u "$REDIS_CONN" --scan --pattern "esim-go:full-catalog" | xargs redis-cli -u "$REDIS_CONN" DEL

# Clear the distributed lock
redis-cli -u "$REDIS_CONN" DEL "catalog-sync"

echo "✅ Cache cleared successfully!"
echo "You can now run the catalog sync again."