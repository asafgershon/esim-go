# Use the official Bun image
FROM oven/bun:1-alpine

# Install dependencies for building
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy the entire server monorepo
COPY server ./

# Install all dependencies
RUN bun install --frozen-lockfile --ignore-scripts

# Build the workspace packages
WORKDIR /app/packages/utils
RUN bun run build

WORKDIR /app/packages/esim-go-client  
RUN bun run build

# Set working directory for workers runtime
WORKDIR /app/workers

# Set runtime environment
ENV NODE_ENV=production

# Expose port if needed for health checks
EXPOSE 3000

# Run the workers directly with Bun
CMD ["bun", "run", "start"]