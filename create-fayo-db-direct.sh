#!/bin/bash

# Script to create fayo database directly
# This avoids the DO block limitation in PostgreSQL

set -e

echo "🔄 Creating fayo database..."
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

# Check if database already exists
DB_EXISTS=$(docker exec postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='fayo'")

if [ "$DB_EXISTS" = "1" ]; then
    echo "✅ Database 'fayo' already exists"
else
    echo "📝 Creating database 'fayo'..."
    docker exec -i postgres psql -U postgres -c "CREATE DATABASE fayo;"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database 'fayo' created successfully"
    else
        echo "❌ Failed to create database"
        exit 1
    fi
fi

echo ""
echo "🔍 Verifying database..."
docker exec postgres psql -U postgres -d fayo -c "SELECT current_database();"

echo ""
echo "🏁 Database setup completed!"

