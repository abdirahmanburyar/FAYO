-- Create all required databases for FAYO services (Safe version - only creates if not exists)
-- Run with: cat create-databases-safe.sql | docker exec -i postgres psql -U postgres
-- This version will NOT drop existing databases or terminate connections

-- Create fayo database (default database)
SELECT 'Creating database: fayo' AS status;
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fayo') THEN
        CREATE DATABASE fayo;
        RAISE NOTICE 'Database fayo created';
    ELSE
        RAISE NOTICE 'Database fayo already exists';
    END IF;
END $$;

-- Create user_service database
SELECT 'Creating database: user_service' AS status;
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'user_service') THEN
        CREATE DATABASE user_service;
        RAISE NOTICE 'Database user_service created';
    ELSE
        RAISE NOTICE 'Database user_service already exists';
    END IF;
END $$;

-- Create hospital_service database
SELECT 'Creating database: hospital_service' AS status;
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hospital_service') THEN
        CREATE DATABASE hospital_service;
        RAISE NOTICE 'Database hospital_service created';
    ELSE
        RAISE NOTICE 'Database hospital_service already exists';
    END IF;
END $$;

-- Create doctor_service database
SELECT 'Creating database: doctor_service' AS status;
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'doctor_service') THEN
        CREATE DATABASE doctor_service;
        RAISE NOTICE 'Database doctor_service created';
    ELSE
        RAISE NOTICE 'Database doctor_service already exists';
    END IF;
END $$;

-- Create specialty_service database
SELECT 'Creating database: specialty_service' AS status;
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'specialty_service') THEN
        CREATE DATABASE specialty_service;
        RAISE NOTICE 'Database specialty_service created';
    ELSE
        RAISE NOTICE 'Database specialty_service already exists';
    END IF;
END $$;

-- Create appointment_service database
SELECT 'Creating database: appointment_service' AS status;
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'appointment_service') THEN
        CREATE DATABASE appointment_service;
        RAISE NOTICE 'Database appointment_service created';
    ELSE
        RAISE NOTICE 'Database appointment_service already exists';
    END IF;
END $$;

-- Create ads_service database
SELECT 'Creating database: ads_service' AS status;
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ads_service') THEN
        CREATE DATABASE ads_service;
        RAISE NOTICE 'Database ads_service created';
    ELSE
        RAISE NOTICE 'Database ads_service already exists';
    END IF;
END $$;

-- Create payment_service database
SELECT 'Creating database: payment_service' AS status;
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'payment_service') THEN
        CREATE DATABASE payment_service;
        RAISE NOTICE 'Database payment_service created';
    ELSE
        RAISE NOTICE 'Database payment_service already exists';
    END IF;
END $$;

-- List all databases
SELECT 'Database creation completed!' AS status;
SELECT datname FROM pg_database WHERE datname IN ('fayo', 'user_service', 'hospital_service', 'doctor_service', 'specialty_service', 'appointment_service', 'ads_service', 'payment_service') ORDER BY datname;

