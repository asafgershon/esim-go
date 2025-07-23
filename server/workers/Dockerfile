# Multi-stage build for optimized image
FROM oven/bun:1-alpine AS pruner

# Install turbo globally
RUN bun add -g turbo

WORKDIR /app

# Copy entire monorepo
COPY server ./

# Prune the monorepo to include only workers and its dependencies
RUN turbo prune @esim-go/workers --docker

# Second stage - build the pruned monorepo
FROM oven/bun:1-alpine AS builder

# Install dependencies for building
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy pruned lockfile and package files
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock

# Install dependencies (skip postinstall scripts)
RUN bun install --frozen-lockfile --ignore-scripts

# Copy pruned source code
COPY --from=pruner /app/out/full/ .

# Build all packages in the pruned workspace
RUN bun run build

# Final stage - runtime
FROM oven/bun:1-alpine

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app .

# Set working directory for workers runtime
WORKDIR /app/workers

# Set runtime environment
ENV NODE_ENV=production

# Expose port if needed for health checks
EXPOSE 3000

# Run the workers directly with Bun
CMD ["bun", "run", "start"]