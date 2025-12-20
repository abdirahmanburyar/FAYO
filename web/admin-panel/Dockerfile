# Use Node.js 22.17.1 Alpine as base image
FROM node:22.17.1-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci || npm install --legacy-peer-deps

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
# Increased to 4GB to handle large builds and prevent OOM errors
ENV NODE_OPTIONS="--max-old-space-size=4096"

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
