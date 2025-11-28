#!/bin/bash

# Database setup script for FAYO Healthcare services
# This script creates all required databases and schemas

set -e

echo "=========================================="
echo "🗄️  Setting up FAYO Healthcare Databases"
echo "=========================================="

# PostgreSQL connection details
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

# Export password for psql
export PGPASSWORD="$POSTGRES_PASSWORD"

# Function to create database if it doesn't exist
create_database() {
    local DB_NAME=$1
    echo "  → Creating database: $DB_NAME"
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -tc \
        "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c \
        "CREATE DATABASE $DB_NAME;" || echo "    ⚠️  Database $DB_NAME might already exist"
    echo "    ✅ Database $DB_NAME is ready"
}

# Function to create schema if it doesn't exist
create_schema() {
    local DB_NAME=$1
    local SCHEMA_NAME=$2
    echo "  → Creating schema '$SCHEMA_NAME' in database: $DB_NAME"
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$DB_NAME" -c \
        "CREATE SCHEMA IF NOT EXISTS \"$SCHEMA_NAME\";" || echo "    ⚠️  Schema $SCHEMA_NAME might already exist"
    echo "    ✅ Schema $SCHEMA_NAME is ready in $DB_NAME"
}

echo ""
echo "1️⃣  Creating databases..."

# Create all service databases
create_database "user_service"
create_database "hospital_service"
create_database "doctor_service"
create_database "specialty_service"
create_database "appointment_service"
create_database "payment_service"

echo ""
echo "2️⃣  Creating schemas..."

# Hospital service uses multi-schema with "hospitals" schema
create_schema "hospital_service" "hospitals"

echo ""
echo "=========================================="
echo "✅ Database setup completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Run Prisma migrations for each service:"
echo "   docker compose -f docker-compose.prod.yml exec user-service npx prisma migrate deploy"
echo "   docker compose -f docker-compose.prod.yml exec hospital-service npx prisma migrate deploy"
echo "   docker compose -f docker-compose.prod.yml exec doctor-service npx prisma migrate deploy"
echo "   docker compose -f docker-compose.prod.yml exec specialty-service npx prisma migrate deploy"
echo "   docker compose -f docker-compose.prod.yml exec appointment-service npx prisma migrate deploy"
echo "   docker compose -f docker-compose.prod.yml exec payment-service npx prisma migrate deploy"
echo ""
echo "2. Or use the CI/CD workflow which handles migrations automatically"
echo ""

