#!/bin/bash

# Script to run the unified database schema migration
# Run this on the VPS server

echo "🔄 Running unified database schema migration..."
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

# Run the SQL migration
echo "🚀 Running SQL migration..."
cat services/api-service/create-unified-schema.sql | docker exec -i postgres psql -U postgres -d fayo

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🔍 Verifying schemas..."
    docker exec -i postgres psql -U postgres -d fayo -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('users', 'hospitals', 'appointments', 'payments', 'ads') ORDER BY schema_name;"
else
    echo ""
    echo "❌ Migration failed!"
    echo "   Check the error messages above"
    exit 1
fi

echo ""
echo "🏁 Done!"

