FROM node:22.17.1-bullseye-slim AS builder

WORKDIR /app

# Install OpenSSL and required libraries for Prisma
RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy source code
COPY . .

# Generate Prisma Client and build
RUN npx prisma generate && npm run build

# Production stage
FROM node:22.17.1-bullseye-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

# Copy built app and Prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3005

CMD ["node", "dist/main.js"]

