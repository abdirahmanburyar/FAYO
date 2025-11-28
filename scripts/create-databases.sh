#!/bin/bash

# Simple script to create all required databases
# Run this on the VPS: bash scripts/create-databases.sh
# Or via Docker: docker exec -i postgres psql -U postgres -c "..."

echo "Creating FAYO Healthcare databases..."

# Create each database
docker exec -i postgres psql -U postgres <<EOF
-- Create databases (PostgreSQL 9.1+ supports IF NOT EXISTS)
SELECT 'CREATE DATABASE user_service'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'user_service')\gexec

SELECT 'CREATE DATABASE hospital_service'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hospital_service')\gexec

SELECT 'CREATE DATABASE doctor_service'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'doctor_service')\gexec

SELECT 'CREATE DATABASE specialty_service'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'specialty_service')\gexec

SELECT 'CREATE DATABASE appointment_service'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'appointment_service')\gexec

SELECT 'CREATE DATABASE payment_service'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'payment_service')\gexec
EOF

echo "Creating hospitals schema in hospital_service..."
docker exec -i postgres psql -U postgres -d hospital_service <<EOF
CREATE SCHEMA IF NOT EXISTS "hospitals";
EOF

echo "✅ All databases and schemas created!"

