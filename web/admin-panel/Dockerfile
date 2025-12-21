# Use Node.js 22.17.1 Alpine as base image
FROM node:22.17.1-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager with BuildKit cache
COPY package.json package-lock.json* ./

# Configure npm for faster installs
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retries 3 && \
    npm config set fetch-retry-factor 2 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm config set maxsockets 15 && \
    npm config set progress false

# Use BuildKit cache mounts to speed up npm install
# Use npm ci for faster, more reliable installs (requires package-lock.json)
# Falls back to npm install if package-lock.json doesn't exist
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/app/node_modules/.cache \
    (test -f package-lock.json && npm ci --legacy-peer-deps --no-audit --no-fund --prefer-offline --silent) || \
    npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline --silent

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Ensure public directory exists (create if it doesn't)
RUN mkdir -p ./public || true

# Disable Next.js telemetry during build for security and privacy
ENV NEXT_TELEMETRY_DISABLED=1

# Increase Node.js memory limit for build process (Next.js 15 requires more memory)
# Set to 3GB for faster builds (only affects build time, not runtime)
# If you have limited RAM, reduce this to 2048
ENV NODE_OPTIONS="--max-old-space-size=3072"

# Build with cache mounts for faster builds
# Cache .next directory, node_modules/.cache, and npm cache
# Set NODE_ENV=production for faster builds (skips dev-only code)
RUN --mount=type=cache,target=/app/.next/cache \
    --mount=type=cache,target=/app/node_modules/.cache \
    --mount=type=cache,target=/root/.npm \
    NODE_ENV=production npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable Next.js telemetry for security and privacy
ENV NEXT_TELEMETRY_DISABLED=1

# Combine user creation and directory setup to reduce layers
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p .next && \
    chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Public directory should already be included in the standalone output
# Next.js standalone automatically includes public files, so we don't need to copy it separately
# If needed, the public files will be in ./app/public after copying the standalone output
RUN mkdir -p ./public && \
    if [ -d "./app/public" ] && [ "$(ls -A ./app/public 2>/dev/null)" ]; then \
      cp -r ./app/public/* ./public/ 2>/dev/null || true; \
    fi && \
    chown -R nextjs:nodejs ./public || true

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
