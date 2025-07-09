# Hotel Frontend - SSR with Node.js
# Single-stage build for SSR deployment

FROM node:18-alpine

WORKDIR /app

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
