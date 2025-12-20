-- Create user_service database
-- Run with: cat create-user-service-db.sql | docker exec -i postgres psql -U postgres

-- Create user_service database if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'user_service') THEN
        CREATE DATABASE user_service;
        RAISE NOTICE 'Database user_service created';
    ELSE
        RAISE NOTICE 'Database user_service already exists';
    END IF;
END $$;

-- Verify the database was created
SELECT 'Database user_service created successfully!' AS status;
SELECT datname FROM pg_database WHERE datname = 'user_service';

