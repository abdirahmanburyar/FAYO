#!/bin/sh
set -e

echo "🔄 Running unified database schema migration..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "📦 Database URL: ${DATABASE_URL}"
echo ""

# Navigate to the api-service directory
cd /app || exit 1

# Check if SQL migration file exists
if [ -f "/app/create-unified-schema.sql" ]; then
    echo "📝 Found SQL migration file. Running SQL migration..."
    
    # Extract database name from DATABASE_URL
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    if [ -z "$DB_NAME" ]; then
        DB_NAME="fayo"
    fi
    
    # Extract connection details
    # For postgresql://user:pass@host:port/db format
    PGHOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    PGPORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    PGUSER=$(echo "$DATABASE_URL" | sed -n 's/postgresql:\/\/\([^:]*\):.*/\1/p')
    PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    # If we're in Docker and postgres is accessible, use psql directly
    if command -v psql > /dev/null 2>&1; then
        export PGHOST="${PGHOST:-postgres}"
        export PGPORT="${PGPORT:-5432}"
        export PGUSER="${PGUSER:-postgres}"
        export PGPASSWORD="${PGPASSWORD:-postgres}"
        export PGDATABASE="$DB_NAME"
        
        psql -f /app/create-unified-schema.sql
    else
        echo "⚠️  psql not available, skipping SQL migration"
        echo "   Please run the SQL migration manually:"
        echo "   cat services/api-service/create-unified-schema.sql | docker exec -i postgres psql -U postgres -d fayo"
    fi
else
    echo "⚠️  SQL migration file not found at /app/create-unified-schema.sql"
fi

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
if command -v npx > /dev/null 2>&1; then
    npx prisma generate
    echo "✅ Prisma client generated"
else
    echo "⚠️  npx not available, skipping Prisma client generation"
fi

echo ""
echo "🏁 Migration process completed!"

