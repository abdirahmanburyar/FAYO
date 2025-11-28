-- Database setup SQL script for FAYO Healthcare services
-- Run this script to create all required databases and schemas
-- Usage: docker exec -i postgres psql -U postgres < setup-databases.sql

-- Create databases if they don't exist
CREATE DATABASE IF NOT EXISTS user_service;
CREATE DATABASE IF NOT EXISTS hospital_service;
CREATE DATABASE IF NOT EXISTS doctor_service;
CREATE DATABASE IF NOT EXISTS specialty_service;
CREATE DATABASE IF NOT EXISTS appointment_service;
CREATE DATABASE IF NOT EXISTS payment_service;

-- Connect to hospital_service and create the hospitals schema
-- (Note: PostgreSQL doesn't support IF NOT EXISTS in CREATE DATABASE in older versions)
-- So we'll use a DO block to handle this

DO $$
BEGIN
    -- Create databases
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'user_service') THEN
        PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE user_service');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'hospital_service') THEN
        PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE hospital_service');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'doctor_service') THEN
        PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE doctor_service');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'specialty_service') THEN
        PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE specialty_service');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'appointment_service') THEN
        PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE appointment_service');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'payment_service') THEN
        PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE payment_service');
    END IF;
END
$$;

-- Note: The above won't work without dblink extension
-- Better approach: Use separate commands for each database

