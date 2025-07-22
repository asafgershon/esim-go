# Use the official Bun image
FROM oven/bun:1-alpine

# Install dependencies for building
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy root package files
COPY package.json bun.lockb ./
COPY server/packages ./server/packages
COPY server/server/src/database.types.ts ./server/server/src/
COPY server/server/src/repositories ./server/server/src/repositories
COPY server/server/src/lib/logger.ts ./server/server/src/lib/

# Copy workers package
COPY server/workers ./server/workers

# Install all dependencies
RUN bun install --frozen-lockfile

# Build the packages
WORKDIR /app/server/packages/utils
RUN bun run build

WORKDIR /app/server/packages/esim-go-client
RUN bun run build

# Build workers
WORKDIR /app/server/workers
RUN bun run build

# Set runtime environment
ENV NODE_ENV=production

# Expose port if needed for health checks
EXPOSE 3000

# Run the workers
CMD ["bun", "run", "start"]