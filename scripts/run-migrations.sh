#!/bin/bash

# Script to run Prisma migrations for all services
# Usage: bash scripts/run-migrations.sh

set -e

echo "=========================================="
echo "🔄 Running Prisma Migrations for All Services"
echo "=========================================="

cd /root/fayo || cd "$(dirname "$0")/.."

# Function to run migrations for a service
run_migrations() {
    local SERVICE=$1
    local SERVICE_NAME=$2
    
    echo ""
    echo "📦 $SERVICE_NAME: Starting migration process..."
    
    # Generate Prisma Client
    echo "  → Generating Prisma Client..."
    if docker compose -f docker-compose.prod.yml exec -T $SERVICE sh -c "cd /app && npx prisma generate"; then
        echo "  ✅ Prisma Client generated successfully"
    else
        echo "  ❌ Failed to generate Prisma Client for $SERVICE_NAME"
        return 1
    fi
    
    # Run migrations
    echo "  → Running database migrations..."
    if docker compose -f docker-compose.prod.yml exec -T $SERVICE sh -c "cd /app && npx prisma migrate deploy"; then
        echo "  ✅ Migrations completed successfully for $SERVICE_NAME"
        return 0
    else
        echo "  ❌ Migration failed for $SERVICE_NAME"
        echo "  Showing logs for $SERVICE_NAME:"
        docker logs $SERVICE --tail 50 || true
        return 1
    fi
}

# Track migration failures
MIGRATION_FAILED=0

# Run migrations for each service
echo ""
echo "1️⃣  User Service Migrations"
if ! run_migrations "user-service" "user-service"; then
    MIGRATION_FAILED=1
fi

echo ""
echo "2️⃣  Hospital Service Migrations"
if ! run_migrations "hospital-service" "hospital-service"; then
    MIGRATION_FAILED=1
fi

echo ""
echo "3️⃣  Doctor Service Migrations"
if ! run_migrations "doctor-service" "doctor-service"; then
    MIGRATION_FAILED=1
fi

echo ""
echo "4️⃣  Specialty Service Migrations"
if ! run_migrations "specialty-service" "specialty-service"; then
    MIGRATION_FAILED=1
fi

echo ""
echo "5️⃣  Appointment Service Migrations"
if ! run_migrations "appointment-service" "appointment-service"; then
    MIGRATION_FAILED=1
fi

echo ""
echo "6️⃣  Payment Service Migrations"
if ! run_migrations "payment-service" "payment-service"; then
    # Payment service might not use Prisma, so this is not critical
    echo "  ℹ️  Payment service may not use Prisma (non-critical)"
fi

echo ""
echo "=========================================="
if [ $MIGRATION_FAILED -eq 1 ]; then
    echo "❌ Some migrations failed! Check logs above."
    exit 1
else
    echo "✅ All migrations completed successfully!"
fi
echo "=========================================="

