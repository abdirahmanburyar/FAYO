-- Create hospital_service database
-- Run with: cat create-hospital-service-db.sql | docker exec -i postgres psql -U postgres

-- Create hospital_service database if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hospital_service') THEN
        CREATE DATABASE hospital_service;
        RAISE NOTICE 'Database hospital_service created';
    ELSE
        RAISE NOTICE 'Database hospital_service already exists';
    END IF;
END $$;

-- Verify the database was created
SELECT 'Database hospital_service created successfully!' AS status;
SELECT datname FROM pg_database WHERE datname = 'hospital_service';

