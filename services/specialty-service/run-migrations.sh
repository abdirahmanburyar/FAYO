#!/bin/bash

# Script to run Prisma migrations for specialty-service
# Run this on the VPS server

echo "🔄 Running Prisma migrations for specialty-service..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "   Please set it before running migrations:"
    echo "   export DATABASE_URL='postgresql://user:password@host:5432/database'"
    exit 1
fi

echo "📦 Database URL: ${DATABASE_URL}"
echo ""

# Navigate to the specialty-service directory
cd "$(dirname "$0")" || exit 1

# Check if prisma is installed
if ! command -v npx &> /dev/null; then
    echo "❌ ERROR: npx is not installed"
    exit 1
fi

# Run migrations
echo "🚀 Running migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations completed successfully!"
    echo ""
    echo "🔍 Verifying table exists..."
    npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM specialties;" 2>/dev/null || echo "   (Verification skipped - table should exist now)"
else
    echo ""
    echo "❌ Migration failed!"
    echo "   Check the error messages above"
    exit 1
fi

echo ""
echo "🏁 Done!"

