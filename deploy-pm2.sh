#!/bin/bash
# Deployment script for PM2 (no Docker)
# Run this after code updates

set -e

echo "🚀 Deploying FAYO Application with PM2..."

# Install/update dependencies for api-service
echo "📦 Updating api-service dependencies..."
cd services/api-service
if [ -f package-lock.json ]; then
    npm ci --legacy-peer-deps --no-audit --no-fund
else
    npm install --legacy-peer-deps --no-audit --no-fund
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build api-service
echo "🔨 Building api-service..."
npm run build

cd ../..

# Install/update dependencies for admin-panel
echo "📦 Updating admin-panel dependencies..."
cd web/admin-panel
if [ -f package-lock.json ]; then
    npm ci --legacy-peer-deps --no-audit --no-fund
else
    npm install --legacy-peer-deps --no-audit --no-fund
fi

# Build admin-panel
echo "🔨 Building admin-panel..."
NODE_OPTIONS="--max-old-space-size=3072" npm run build

cd ../..

# Run database migrations (if needed)
echo "🗄️  Running database migrations..."
cd services/api-service
npx prisma migrate deploy || echo "⚠️  Migration failed or no new migrations"
cd ../..

# Restart PM2 services (zero-downtime)
echo "🔄 Reloading PM2 services..."
pm2 reload ecosystem.config.js

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Check status:"
echo "  pm2 status"
echo ""
echo "📋 View logs:"
echo "  pm2 logs"
echo ""

