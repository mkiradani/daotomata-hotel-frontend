# Multi-stage Dockerfile optimizado para Astro SSG
# Basado en mejores prácticas 2024

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Copy package files for better caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile --prefer-offline

# Stage 2: Development (for docker-compose dev)
FROM node:20-alpine AS development
WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml* ./

# Copy source code
COPY . .

# Expose port
EXPOSE 4321

# Development command with hot reload
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# Stage 3: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Copy dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build for production
ENV NODE_ENV=production
RUN pnpm build

# Stage 4: Production runtime
FROM nginx:alpine AS production
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built application
COPY --from=builder /app/dist .

# Copy nginx config for SPA
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 4321;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle client-side routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Expose port
EXPOSE 4321

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
