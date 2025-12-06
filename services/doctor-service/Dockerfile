FROM node:22.17.1-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci || npm install --legacy-peer-deps || npm install --force

# Copy source code
COPY . .

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Create startup script
RUN cat > /app/start.sh << 'SCRIPT_END' && chmod +x /app/start.sh
#!/bin/sh
set -e
echo "🚀 Starting application..."
exec npm run start:prod
SCRIPT_END

# Expose port
EXPOSE 3003

# Start the application
CMD ["/app/start.sh"]
