# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci || npm install --legacy-peer-deps || npm install --force

# Copy Prisma schema and migrations (must be before generate)
# Create prisma directory first
RUN mkdir -p ./prisma
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma/migrations ./prisma/migrations

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Install dumb-init and OpenSSL for Prisma
RUN apk add --no-cache dumb-init openssl libc6-compat

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies (including prisma for migrations)
RUN (npm ci --omit=dev || npm install --omit=dev --legacy-peer-deps || npm install --omit=dev --force) && \
    npm install prisma --save-prod && \
    npm cache clean --force

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy Prisma files (schema + migrations) - explicitly copy each
# Switch to root temporarily to create directory and copy files
USER root
RUN mkdir -p ./prisma
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/prisma/migrations ./prisma/migrations
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Verify prisma files are copied and fix ownership
RUN ls -la /app/prisma/ && \
    test -f /app/prisma/schema.prisma && echo "✅ schema.prisma found" || echo "❌ schema.prisma missing" && \
    chown -R nestjs:nodejs /app/prisma /app/node_modules/.prisma

# Copy startup script
COPY --chown=nestjs:nodejs start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3010/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/start.sh"]

