# Use the official Bun image
FROM oven/bun:1-alpine

# Install dependencies for building
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy the monorepo root files from server directory
COPY server/package.json ./
COPY server/turbo.json ./
COPY server/bun.lock ./

# Copy packages directory
COPY server/packages ./packages

# Copy server workspace (only what workers need)
COPY server/server/package.json ./server/package.json
COPY server/server/src/database.types.ts ./server/src/database.types.ts
COPY server/server/src/repositories ./server/src/repositories
COPY server/server/src/lib/logger.ts ./server/src/lib/logger.ts

# Copy workers workspace
COPY server/workers ./workers

# Install all dependencies
RUN bun install --frozen-lockfile

# Build the packages
WORKDIR /app/packages/utils
RUN bun run build

WORKDIR /app/packages/esim-go-client
RUN bun run build

# Build workers
WORKDIR /app/workers
RUN bun run build

# Set runtime environment
ENV NODE_ENV=production

# Expose port if needed for health checks
EXPOSE 3000

# Run the workers
CMD ["bun", "run", "start"]