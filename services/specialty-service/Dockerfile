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

# Install dependencies
RUN npm ci

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
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3004

# Start the application
CMD ["node", "dist/main.js"]

