#!/bin/bash

# Script to run Prisma migrations for api-service in Docker
# Run this on the VPS server

echo "🔄 Running Prisma migrations for api-service (Docker)..."
echo ""

# Use api-service as container name
CONTAINER_NAME="api-service"

# Check if container exists and is running
if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ ERROR: api-service container not found or not running"
    echo "   Available containers:"
    docker ps --format "{{.Names}}"
    exit 1
fi

echo "📦 Using container: $CONTAINER_NAME"
echo ""

# Run migrations inside the container
echo "🚀 Running migrations inside container..."
docker exec "$CONTAINER_NAME" /app/scripts/migrate.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations completed successfully!"
    echo ""
    echo "🔍 Verifying database schemas..."
    docker exec "$CONTAINER_NAME" npx prisma db execute --stdin <<< "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('users', 'hospitals', 'public', 'appointments', 'payments', 'ads');" 2>/dev/null || echo "   (Verification skipped)"
else
    echo ""
    echo "❌ Migration failed!"
    echo "   Check the error messages above"
    exit 1
fi

echo ""
echo "🏁 Done!"

