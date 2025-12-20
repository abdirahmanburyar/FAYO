-- Create specialty_service database
-- Run with: cat create-specialty-service-db.sql | docker exec -i postgres psql -U postgres

-- Create specialty_service database if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'specialty_service') THEN
        CREATE DATABASE specialty_service;
        RAISE NOTICE 'Database specialty_service created';
    ELSE
        RAISE NOTICE 'Database specialty_service already exists';
    END IF;
END $$;

-- Verify the database was created
SELECT 'Database specialty_service created successfully!' AS status;
SELECT datname FROM pg_database WHERE datname = 'specialty_service';

