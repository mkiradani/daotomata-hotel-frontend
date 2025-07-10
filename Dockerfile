# Hotel Frontend - SSR with Node.js
# Single-stage build for SSR deployment

FROM node:18-alpine

WORKDIR /app

# Accept build arguments and set as environment variables
ARG HOTEL_ID
ARG DIRECTUS_URL
ARG DIRECTUS_ADMIN_TOKEN
ARG SITE_URL

ENV HOTEL_ID=${HOTEL_ID}
ENV DIRECTUS_URL=${DIRECTUS_URL}
ENV DIRECTUS_ADMIN_TOKEN=${DIRECTUS_ADMIN_TOKEN}
ENV SITE_URL=${SITE_URL}

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile || pnpm install --force

# Copy source code
COPY . .

# Set environment for production build
ENV NODE_ENV=production

# Debug environment variables before build
RUN echo "🔍 [DOCKER DEBUG] Environment variables during build:" && \
  echo "🔍 [DOCKER DEBUG] HOTEL_ID: $HOTEL_ID" && \
  echo "🔍 [DOCKER DEBUG] DIRECTUS_URL: $DIRECTUS_URL" && \
  echo "🔍 [DOCKER DEBUG] SITE_URL: $SITE_URL" && \
  echo "🔍 [DOCKER DEBUG] All env vars:" && env | grep -E "(HOTEL_ID|DIRECTUS_URL|SITE_URL)" || echo "No matching env vars found"

# Generate themes and build SSR site
RUN pnpm run build

# Install curl for health checks
RUN apk add --no-cache curl

# Set environment variables for SSR
ENV HOST=0.0.0.0
ENV PORT=4321

# Health check for SSR server
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4321/health || exit 1

# Expose port 4321
EXPOSE 4321

# Start SSR server
CMD ["node", "./dist/server/entry.mjs"]
