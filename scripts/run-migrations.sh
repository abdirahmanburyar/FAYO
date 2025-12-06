#!/bin/bash

# Script to start all services (Prisma is used only as ORM, not for migrations)
# Usage: bash scripts/run-migrations.sh

set -e

echo "=========================================="
echo "🚀 Starting All Services"
echo "=========================================="

cd /root/fayo || cd "$(dirname "$0")/.."

# Start infrastructure services first
echo ""
echo "🚀 Starting infrastructure services (postgres, redis, rabbitmq)..."
docker compose -f docker-compose.prod.yml up -d postgres redis rabbitmq

# Wait for PostgreSQL to be ready
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=60
counter=0
until docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    counter=$((counter + 1))
    if [ $counter -ge $timeout ]; then
        echo "❌ PostgreSQL failed to start within $timeout seconds"
        exit 1
    fi
    echo "   Waiting for PostgreSQL... ($counter/$timeout)"
    sleep 2
done
echo "✅ PostgreSQL is ready"

# Start all application services
echo ""
echo "🚀 Starting application services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be running
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Function to check if a container is running
is_container_running() {
    local SERVICE=$1
    # Use set +e temporarily to avoid exiting on grep failure
    set +e
    docker compose -f docker-compose.prod.yml ps $SERVICE 2>/dev/null | grep -q "Up"
    local result=$?
    if [ $result -ne 0 ]; then
        docker ps 2>/dev/null | grep -q "$SERVICE"
        result=$?
    fi
    set -e
    return $result
}

# Function to wait for a service to be running
wait_for_service() {
    local SERVICE=$1
    local SERVICE_NAME=$2
    local timeout=60
    local counter=0
    
    echo "  ⏳ Waiting for $SERVICE_NAME to be running..."
    while ! is_container_running $SERVICE; do
        counter=$((counter + 1))
        if [ $counter -ge $timeout ]; then
            echo "  ⚠️  $SERVICE_NAME did not start within $timeout seconds, but continuing..."
            return 1
        fi
        sleep 2
    done
    echo "  ✅ $SERVICE_NAME is running"
    sleep 3  # Give service a moment to fully initialize
    return 0
}

# Check service status
echo ""
echo "📊 Service Status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=========================================="
echo "✅ All services started!"
echo "=========================================="
echo ""
echo "ℹ️  Note: Prisma is used only as an ORM in this deployment."
echo "   Database schema should be managed separately (e.g., via dump.sql)."
echo ""

