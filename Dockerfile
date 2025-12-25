# Multi-stage build for production
FROM node:22-alpine AS base

# Install pnpm and system dependencies for sharp
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev \
    && npm install -g pnpm@9.15.9

# Install dependencies (including devDependencies for build)
FROM base AS deps
WORKDIR /app

# Sharp will automatically detect and use system libvips (vips-dev)
# No need to download binaries when vips-dev is available

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/

# Install dependencies
# Sharp will use system libvips (vips-dev) instead of downloading binaries
RUN pnpm install --frozen-lockfile || \
    (echo "Retrying installation with relaxed lockfile..." && sleep 5 && pnpm install --no-frozen-lockfile) || \
    (echo "Final retry with build from source..." && npm_config_build_from_source=true pnpm install --no-frozen-lockfile)

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /app/apps/web/package.json ./apps/web/package.json
COPY --from=deps /app/packages/types/package.json ./packages/types/package.json
# Reinstall to recreate symlinks for binaries (offline mode to use cached packages)
RUN pnpm install --offline --no-frozen-lockfile || pnpm install --no-frozen-lockfile
COPY . .

# Railway passes environment variables, but they need to be available during build
# We use ARG to accept them and ENV to make them available to Next.js
# Railway automatically passes all environment variables, but we need to explicitly accept them
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DEFAULT_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID

# Convert ARG to ENV so Next.js can access them during build
# Next.js only reads NEXT_PUBLIC_* variables from ENV, not ARG
# Use ${VAR:-} syntax to allow empty values (Railway might not pass all vars)
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-}
ENV NEXT_PUBLIC_DEFAULT_API_URL=${NEXT_PUBLIC_DEFAULT_API_URL:-}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-}
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN:-}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID:-}

ENV PATH="/app/node_modules/.bin:$PATH"

# Debug: Print environment variables before preparing build env
RUN echo "=== Environment variables before build ===" && \
    echo "All NEXT_PUBLIC_* vars:" && \
    (env | grep "^NEXT_PUBLIC_" || echo "No NEXT_PUBLIC_* variables found") && \
    echo "=========================================="

# Prepare build environment: create .env.local from environment variables
# Railway passes environment variables, but they may not be available as build args
# This script reads them from the environment and creates .env.local for Next.js
RUN cd apps/web && node scripts/prepare-build-env.js

# Verify .env.local was created
RUN echo "=== .env.local contents ===" && \
    (cat apps/web/.env.local 2>/dev/null | sed 's/=.*/=***/' || echo "No .env.local file created") && \
    echo "==========================="

# Build Next.js application
# Next.js will read variables from .env.local (created above) or ENV
RUN cd apps/web && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
# Next.js standalone mode creates .next/standalone with server.js at apps/web/server.js
# The standalone directory already contains the correct structure, so we copy it as-is
COPY --from=builder /app/apps/web/.next/standalone ./
# Copy public files (standalone doesn't include public directory)
COPY --from=builder /app/apps/web/public ./apps/web/public
# Ensure static files are in the correct location relative to server.js
# Static files should be at apps/web/.next/static (same level as server.js)
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Set working directory to where server.js is located BEFORE switching user
# This ensures Next.js can find static files and other resources correctly
WORKDIR /app/apps/web

USER nextjs

# Railway provides PORT via environment variable, default to 3000 for local development
EXPOSE 3000

# Use PORT from Railway environment, fallback to 3000
ENV PORT=${PORT:-3000}
ENV HOSTNAME="0.0.0.0"

# Use ENTRYPOINT to prevent Railway from overriding the command
# This ensures Railway executes node directly without shell parsing
# Use exec form to avoid shell interpretation
# Run server.js from the apps/web directory
ENTRYPOINT ["/usr/bin/env", "node"]
CMD ["server.js"]

