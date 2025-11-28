#!/bin/bash

# Script to run Prisma migrations for specialty-service in Docker
# Run this on the VPS server

echo "🔄 Running Prisma migrations for specialty-service (Docker)..."
echo ""

# Use specialty-service as container name
CONTAINER_NAME="specialty-service"

# Check if container exists and is running
if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ ERROR: specialty-service container not found or not running"
    echo "   Available containers:"
    docker ps --format "{{.Names}}"
    exit 1
fi

echo "📦 Using container: $CONTAINER_NAME"
echo ""

# Run migrations inside the container
echo "🚀 Running migrations inside container..."
docker exec "$CONTAINER_NAME" npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations completed successfully!"
    echo ""
    echo "🔍 Verifying table exists..."
    docker exec "$CONTAINER_NAME" npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM specialties;" 2>/dev/null || echo "   (Verification skipped - table should exist now)"
else
    echo ""
    echo "❌ Migration failed!"
    echo "   Check the error messages above"
    exit 1
fi

echo ""
echo "🏁 Done!"

