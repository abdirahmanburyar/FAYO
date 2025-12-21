-- Create fayo database for unified monolithic API
-- Run with: cat create-fayo-db.sql | docker exec -i postgres psql -U postgres

-- Note: CREATE DATABASE cannot be run inside a DO block
-- This script checks if database exists and provides instructions

SELECT 'Checking if fayo database exists...' AS status;

-- Check if database exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_database WHERE datname = 'fayo') 
        THEN 'Database fayo already exists ✅'
        ELSE 'Database fayo does NOT exist - please run: docker exec -i postgres psql -U postgres -c "CREATE DATABASE fayo;"'
    END AS status;

