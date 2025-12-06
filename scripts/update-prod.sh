#!/bin/bash

# Production Update Script
# Usage: bash scripts/update-prod.sh

set -e

echo "=========================================="
echo "🚀 FAYO Healthcare - Production Update"
echo "=========================================="

# Ensure we are in the project root
cd "$(dirname "$0")/.."

echo "1️⃣  Rebuilding and restarting services..."
echo "   This ensures new code is loaded into containers."
# Build specifically the services we touched, or all to be safe. All is safer.
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "2️⃣  Waiting for services to stabilize..."
sleep 10

# Wait for Postgres specifically
echo "   Checking database availability..."
until docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U postgres -d fayo; do
  echo "   Waiting for postgres..."
  sleep 5
done
echo "   ✅ Database is ready"

echo ""
echo "3️⃣  Verifying Services Status..."
# Check service status
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=========================================="
echo "✅ Production Update Complete!"
echo "=========================================="
echo ""
echo "ℹ️  Note: Prisma is used only as an ORM in this deployment."
echo "   Database schema should be managed separately (e.g., via dump.sql)."
echo ""

