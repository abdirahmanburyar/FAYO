-- Create doctor_service database
-- Run with: cat create-doctor-service-db.sql | docker exec -i postgres psql -U postgres

-- Create doctor_service database if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'doctor_service') THEN
        CREATE DATABASE doctor_service;
        RAISE NOTICE 'Database doctor_service created';
    ELSE
        RAISE NOTICE 'Database doctor_service already exists';
    END IF;
END $$;

-- Verify the database was created
SELECT 'Database doctor_service created successfully!' AS status;
SELECT datname FROM pg_database WHERE datname = 'doctor_service';

