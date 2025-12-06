FROM node:22.17.1-bullseye-slim

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

# Expose port
EXPOSE 3005

# Start the application
CMD ["npm", "run", "start:prod"]

