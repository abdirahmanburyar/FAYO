# Build stage
FROM node:22.17.1-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma (needed during build for prisma generate)
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for build) with retry logic
RUN for i in 1 2 3; do \
      (npm ci --no-audit --no-fund --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 || \
       npm install --legacy-peer-deps --no-audit --no-fund --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 || \
       npm install --force --no-audit --no-fund --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000) && break || \
      (echo "Attempt $i failed, retrying in $((i*10)) seconds..." && sleep $((i*10))); \
    done

# Copy source code
COPY . .

# Generate Prisma client (unified schema with multiple schemas)
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:22.17.1-alpine AS production

WORKDIR /app

# Install dumb-init, OpenSSL for Prisma, and su-exec for user switching
RUN apk add --no-cache dumb-init openssl libc6-compat su-exec

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies (including prisma for ORM) with retry logic
RUN for i in 1 2 3; do \
      npm install --omit=dev --legacy-peer-deps --no-audit --no-fund --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 && \
      npm install prisma@^5.20.0 --save-prod --legacy-peer-deps --no-audit --no-fund --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 && break || \
      (echo "Attempt $i failed, retrying in $((i*10)) seconds..." && sleep $((i*10))); \
    done

# Copy built application and Prisma client
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy SQL migration file
COPY --chown=nestjs:nodejs create-unified-schema.sql /app/create-unified-schema.sql

# Copy startup and migration scripts
COPY --chown=root:root start.sh /app/start.sh
COPY --chown=root:root scripts/migrate.sh /app/scripts/migrate.sh
RUN chmod +x /app/start.sh /app/scripts/migrate.sh

# Note: We stay as root to run the entrypoint script which will switch to nestjs user
# This allows the script to fix permissions on mounted volumes

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
# The start.sh script will handle permissions and switch to nestjs user
ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/start.sh", "node", "dist/main.js"]

