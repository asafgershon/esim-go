#!/bin/bash

# Local E2E Test Script
# This script simulates the GitHub Actions workflow locally

set -e

echo "🚀 Starting local E2E test simulation..."

# Check if required tools are available
echo "📋 Checking prerequisites..."
command -v bun >/dev/null 2>&1 || { echo "❌ Bun is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }

# Start services in Docker
echo "🐳 Starting PostgreSQL and Redis services..."
docker run -d --name esim-test-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=esim_test \
  -p 5433:5432 \
  postgres:15

docker run -d --name esim-test-redis \
  -p 6380:6379 \
  redis:7

echo "⏳ Waiting for services to be ready..."
sleep 10

# Setup environment
echo "⚙️ Setting up test environment..."
cd "$(dirname "$0")/.."
cp server/server/.env.example server/server/.env.test
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5433/esim_test" >> server/server/.env.test
echo "REDIS_URL=redis://localhost:6380" >> server/server/.env.test

# Install dependencies
echo "📦 Installing dependencies..."
bun install
cd server/server && bun install
cd ../../client/apps/web-app && bun install

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
bunx playwright install --with-deps

# Start backend server
echo "🚀 Starting backend server..."
cd ../server/server
NODE_ENV=test bun run dev &
SERVER_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
timeout 60 bash -c 'until curl -f http://localhost:4000/graphql; do sleep 2; done'

# Run E2E tests
echo "🧪 Running E2E tests..."
cd ../client/apps/web-app
CI=true bun run test:e2e

# Cleanup
echo "🧹 Cleaning up..."
kill $SERVER_PID || true
docker stop esim-test-postgres esim-test-redis || true
docker rm esim-test-postgres esim-test-redis || true

echo "✅ E2E tests completed!"