# Use the official Bun image
FROM oven/bun:1-alpine

# Install dependencies for building
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy the entire server monorepo
COPY server ./

# Install all dependencies
RUN bun install --frozen-lockfile

# Build the workspace packages
WORKDIR /app/packages/utils
RUN bun run build

WORKDIR /app/packages/esim-go-client  
RUN bun run build

# Build the server (this runs codegen)
WORKDIR /app/server
RUN bun run build

# Set runtime environment
ENV NODE_ENV=production

# Expose GraphQL port
EXPOSE 4000

# Run the server
CMD ["bun", "run", "src/app.ts"]