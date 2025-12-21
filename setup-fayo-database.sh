#!/bin/bash

# Script to create fayo database and run migrations
# Run this on the VPS server or locally if postgres is accessible

set -e

echo "🔄 Setting up fayo database..."
echo ""

# Check if postgres container is running
if ! docker ps --format "{{.Names}}" | grep -q "^postgres$"; then
    echo "❌ ERROR: postgres container not found or not running"
    echo "   Available containers:"
    docker ps --format "{{.Names}}"
    exit 1
fi

echo "📦 Using postgres container"
echo ""

# Step 1: Create the database
echo "1️⃣  Creating fayo database..."
cat create-fayo-db.sql | docker exec -i postgres psql -U postgres

if [ $? -eq 0 ]; then
    echo "✅ Database created successfully"
else
    echo "⚠️  Database might already exist (this is okay)"
fi

echo ""
echo "2️⃣  Running schema migration..."
cat services/api-service/create-unified-schema.sql | docker exec -i postgres psql -U postgres -d fayo

if [ $? -eq 0 ]; then
    echo "✅ Schema migration completed successfully"
else
    echo "❌ Schema migration failed"
    exit 1
fi

echo ""
echo "🔍 Verifying schemas..."
docker exec -i postgres psql -U postgres -d fayo -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('users', 'hospitals', 'appointments', 'payments', 'ads', 'public') ORDER BY schema_name;"

echo ""
echo "🏁 Database setup completed!"

