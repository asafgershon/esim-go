# Stage 1: Prune the monorepo
FROM oven/bun:1-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy the entire monorepo
COPY . ./backend

# Install turbo globally
RUN bun add -g turbo

# Prune the monorepo for the workers package
WORKDIR /app/backend

# Remove 'server' workspace from root package.json workspaces
RUN sed -i '/"server"/d' package.json
RUN bun install --ignore-scripts
RUN turbo prune @hiilo/workers --docker

# Stage 2: Build the application
FROM oven/bun:1-alpine AS builder
RUN apk add --no-cache python3 make g++ libc6-compat
WORKDIR /app

# Copy pruned lockfile and package files
COPY --from=pruner /app/backend/out/json/ .
COPY --from=pruner /app/backend/out/bun.lock ./bun.lock


# Install dependencies
RUN bun install --frozen-lockfile --ignore-scripts --production

# Copy pruned source code
COPY --from=pruner /app/backend/out/full/ .

# Build the workspace packages that workers depends on
WORKDIR /app
RUN bunx turbo run build --filter=...@hiilo/workers
CMD ["sleep", "5h"]

# Stage 3: Runtime
FROM oven/bun:1-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/ .

# # Switch to non-root user
USER nodejs

# # Set runtime environment
ENV NODE_ENV=production

# # Expose port if needed for health checks
EXPOSE 5002

# # Run the workers directly with Bun
CMD ["bun", "run", "dev:workers"]