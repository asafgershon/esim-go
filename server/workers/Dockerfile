# Stage 1: Prune the monorepo
FROM oven/bun:1-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy the entire monorepo
COPY server ./server

# Install turbo globally
RUN bun add -g turbo

# Prune the monorepo for the workers package
WORKDIR /app/server
RUN turbo prune @hiilo/workers --docker

# Stage 2: Build the application
FROM oven/bun:1-alpine AS builder
RUN apk add --no-cache python3 make g++ libc6-compat
WORKDIR /app

# Copy pruned lockfile and package files
COPY --from=pruner /app/server/out/json/ .
COPY --from=pruner /app/server/out/bun.lock ./bun.lock

# Install dependencies
RUN bun install --frozen-lockfile --ignore-scripts

# Copy pruned source code
COPY --from=pruner /app/server/out/full/ .

# Build the workspace packages that workers depends on
WORKDIR /app/packages/utils
RUN bun run build

WORKDIR /app/packages/esim-go-client
RUN bun run build

# Stage 3: Runtime
FROM oven/bun:1-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/workers ./workers
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/bun.lock ./bun.lock
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Set working directory for workers runtime
WORKDIR /app/workers

# Switch to non-root user
USER nodejs

# Set runtime environment
ENV NODE_ENV=production

# Expose port if needed for health checks
EXPOSE 5002

# Run the workers directly with Bun
CMD ["bun", "run", "start"]