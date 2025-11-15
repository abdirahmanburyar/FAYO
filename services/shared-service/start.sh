#!/bin/bash

# Set environment variables
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fayo_shared?schema=public"
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=""
export JWT_SECRET="your-super-secret-jwt-key-here-shared-service"
export JWT_EXPIRES_IN="1h"
export PORT=3004
export NODE_ENV=development
export CORS_ORIGIN="http://localhost:3000"

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed the database
npx prisma db seed

# Start the service
npm run start:dev
