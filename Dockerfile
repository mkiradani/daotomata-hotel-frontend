# Hotel Frontend - Static Site with NGINX
# Multi-stage build for optimized static file serving with 0 JavaScript

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Set environment for production build
ENV NODE_ENV=production

# Generate themes and build static site
RUN pnpm run build

# Production stage - NGINX for static file serving
FROM nginx:alpine

# Copy custom NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Install curl for health checks
RUN apk add --no-cache curl

# Create nginx user and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
  chmod -R 755 /usr/share/nginx/html

# Remove default nginx config if it exists
RUN rm -f /etc/nginx/conf.d/default.conf.bak

# Health check for static site
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Expose port 80
EXPOSE 80

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
