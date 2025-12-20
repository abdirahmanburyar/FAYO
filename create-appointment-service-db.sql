-- Create appointment_service database
-- Run with: cat create-appointment-service-db.sql | docker exec -i postgres psql -U postgres
-- Note: If database already exists, this will show an error but that's okay

-- Create appointment_service database
-- This will fail if it already exists, but that's fine
CREATE DATABASE appointment_service;

