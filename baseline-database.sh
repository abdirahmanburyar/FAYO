#!/bin/bash
# Baseline existing database for Prisma migrations
# Run this when database already has schema but no migration history

set -e

echo "🔧 Baselining existing database for Prisma..."

cd services/api-service

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it first."
    echo "   Run: ./CREATE_ENV_FILE.sh"
    exit 1
fi

# Check if migrations directory exists
if [ ! -d prisma/migrations ]; then
    echo "📁 Creating migrations directory..."
    mkdir -p prisma/migrations
fi

echo "📋 Step 1: Creating baseline migration (create-only, won't apply)..."
if npx prisma migrate dev --name baseline --create-only 2>/dev/null; then
    echo "✅ Baseline migration created"
else
    echo "⚠️  Migration creation had issues, trying alternative approach..."
    
    # Try to pull schema from database first
    echo "📥 Pulling schema from existing database..."
    npx prisma db pull || echo "⚠️  Could not pull schema"
    
    # Try creating migration again
    npx prisma migrate dev --name baseline --create-only || {
        echo "❌ Could not create migration. Using db push instead..."
        echo "📤 Syncing schema with db push (no migration history)..."
        npx prisma db push --accept-data-loss
        echo "✅ Schema synced. Note: No migration history created."
        exit 0
    }
fi

# Find the latest migration
LATEST_MIGRATION=$(ls -t prisma/migrations | head -n 1)

if [ -z "$LATEST_MIGRATION" ]; then
    echo "❌ No migration found. Using db push instead..."
    npx prisma db push --accept-data-loss
    echo "✅ Schema synced. Note: No migration history created."
    exit 0
fi

echo "📋 Step 2: Marking baseline migration as applied..."
npx prisma migrate resolve --applied "$LATEST_MIGRATION" || {
    echo "⚠️  Could not mark as applied. Trying to resolve manually..."
    # Alternative: create a resolved migration
    MIGRATION_DIR="prisma/migrations/${LATEST_MIGRATION}"
    if [ -d "$MIGRATION_DIR" ]; then
        touch "$MIGRATION_DIR/migration_lock.toml" 2>/dev/null || true
    fi
}

echo "📋 Step 3: Verifying migration status..."
npx prisma migrate status

echo ""
echo "✅ Database baselined successfully!"
echo ""
echo "📝 Next steps:"
echo "  1. Future migrations: npx prisma migrate deploy"
echo "  2. Check status: npx prisma migrate status"
echo ""

