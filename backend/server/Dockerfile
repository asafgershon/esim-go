# Stage 1: Pruning stage
FROM oven/bun:1-alpine AS pruner

WORKDIR /app

# Copy package files for pruning
COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apis ./apis
COPY utils ./utils
COPY server ./server
COPY workers ./workers

# Prune the workspace for just the server
RUN bunx turbo prune @hiilo/apollo-server --out-dir=out

# Stage 2: Build stage
FROM oven/bun:1-alpine AS builder

# Install dependencies for building
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy the pruned workspace
COPY --from=pruner /app/out .

# Fix package.json to remove workers workspace reference
RUN node -e "const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8')); pkg.workspaces = pkg.workspaces.filter(w => w !== 'workers'); require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Install all dependencies (skip postinstall scripts)
RUN bun install --ignore-scripts

# Use turbo to build dependencies for @hiilo/apollo-server
RUN bunx turbo run build --filter=...@hiilo/apollo-server

WORKDIR /app/server

# Stage 3: Runtime stage
FROM oven/bun:1-alpine

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app .

# Set runtime environment
ENV NODE_ENV=production

# Expose GraphQL port
EXPOSE 4000

# Stay in server directory for runtime
WORKDIR /app/server

# Run the server directly (build already done)
CMD ["bun", "run", "src/app.ts"]