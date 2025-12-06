FROM node:22.17.1-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
# Use npm install instead of npm ci to handle package-lock.json mismatches
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

FROM node:22.17.1-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./

# Install production dependencies (including prisma for ORM)
RUN npm install --only=production --legacy-peer-deps && \
    npm install prisma --save-prod && \
    npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create startup script
# Using Docker's native heredoc syntax (requires Docker 20.10+)
RUN <<EOF cat > /app/start.sh && chmod +x /app/start.sh
#!/bin/sh
set -e
echo "🚀 Starting application..."
exec node dist/main.js
EOF

EXPOSE 3006

# Start the application
CMD ["/app/start.sh"]

