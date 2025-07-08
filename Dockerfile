# Astro SSG + Middleware Frontend Production Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:22.16.0-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.1.2

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build for production using Docker config (Node.js adapter)
RUN pnpm build --config astro.config.docker.mjs

# Production stage
FROM node:22.16.0-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.1.2

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Install only production dependencies (ignore scripts to prevent husky setup)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built application from builder stage (Node.js standalone)
COPY --from=builder /app/dist ./dist

# Install curl for healthchecks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S astro -u 1001

# Change ownership of app directory
RUN chown -R astro:nodejs /app

USER astro

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=4321
ENV HOST=0.0.0.0

# Expose port
EXPOSE 4321

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4321/ || exit 1

# Production command - run Node.js standalone server
CMD ["node", "./dist/server/entry.mjs"]
