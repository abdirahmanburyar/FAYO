FROM node:22.17.1-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate && npm run build

# Production stage
FROM node:22.17.1-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

# Copy built app and Prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3002

CMD ["node", "dist/main.js"]