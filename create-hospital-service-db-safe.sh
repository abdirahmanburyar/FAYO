#!/bin/bash
# Safe script to create hospital_service database
# Run with: bash create-hospital-service-db-safe.sh

# Check if database exists
DB_EXISTS=$(docker exec postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='hospital_service'")

if [ "$DB_EXISTS" != "1" ]; then
    echo "Creating database hospital_service..."
    docker exec -i postgres psql -U postgres -c "CREATE DATABASE hospital_service"
    echo "✅ Database hospital_service created successfully!"
else
    echo "✅ Database hospital_service already exists"
fi

# Verify
docker exec postgres psql -U postgres -c "\l" | grep hospital_service

