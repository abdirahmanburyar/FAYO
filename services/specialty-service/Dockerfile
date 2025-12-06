FROM node:22.17.1-bullseye-slim AS builder

WORKDIR /app

# Install OpenSSL and required libraries for Prisma
# Debian Bullseye includes OpenSSL 1.1.x which Prisma requires
RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies with retry logic for network failures
RUN for i in 1 2 3; do \
      npm ci --no-audit --no-fund --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 && break || \
      (echo "Attempt $i failed, retrying in $((i*10)) seconds..." && sleep $((i*10))); \
    done

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:22.17.1-bullseye-slim

WORKDIR /app

# Install OpenSSL and required libraries for Prisma (needed at runtime)
# Debian Bullseye includes OpenSSL 1.1.x which Prisma requires
RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies with retry logic
RUN for i in 1 2 3; do \
      npm install --omit=dev --no-audit --no-fund --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 && break || \
      (echo "Attempt $i failed, retrying in $((i*10)) seconds..." && sleep $((i*10))); \
    done

# Copy built application and Prisma from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3004

# Start the application
CMD ["node", "dist/main.js"]

