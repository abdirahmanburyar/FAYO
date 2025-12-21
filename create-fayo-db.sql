-- Create fayo database for unified monolithic API
-- Run with: cat create-fayo-db.sql | docker exec -i postgres psql -U postgres

-- Create database if it doesn't exist
SELECT 'Creating database: fayo' AS status;

-- Check if database exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'fayo') THEN
        CREATE DATABASE fayo;
        RAISE NOTICE 'Database fayo created successfully';
    ELSE
        RAISE NOTICE 'Database fayo already exists';
    END IF;
END
$$;

