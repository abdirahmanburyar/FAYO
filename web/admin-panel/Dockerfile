# Use Node.js 22.17.1 Alpine as base image
FROM node:22.17.1-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager with retry logic
COPY package.json package-lock.json* ./
RUN for i in 1 2 3; do \
      (npm ci --no-audit --no-fund --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 || \
       npm install --legacy-peer-deps --no-audit --no-fund --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000) && break || \
      (echo "Attempt $i failed, retrying in $((i*10)) seconds..." && sleep $((i*10))); \
    done

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Ensure public directory exists (create if it doesn't)
RUN mkdir -p ./public || true

# Disable Next.js telemetry during build for security and privacy
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable Next.js telemetry for security and privacy
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir -p .next
RUN chown nextjs:nodejs .next

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
