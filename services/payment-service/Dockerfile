FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./

# Install production dependencies (including prisma for migrations)
RUN npm ci --only=production && \
    npm install prisma --save-prod && \
    npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Ensure migrations directory exists
RUN mkdir -p /app/prisma/migrations

# Create startup script that runs migrations then starts the app
RUN cat > /app/start.sh << 'SCRIPT_END' && chmod +x /app/start.sh
#!/bin/sh
set -e
echo "🗄️ Running Prisma migrations..."
npx prisma migrate deploy || echo "⚠️ Migration failed or already applied"
echo "🚀 Starting application..."
exec node dist/main.js
SCRIPT_END

EXPOSE 3006

# Start the application
CMD ["/app/start.sh"]

