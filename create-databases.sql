-- Create all required databases for FAYO services
-- Run with: cat create-databases.sql | docker exec -i postgres psql -U postgres

-- Create fayo database (default database)
SELECT 'Creating database: fayo' AS status;
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'fayo'
  AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS fayo;
CREATE DATABASE fayo;

-- Create user_service database
SELECT 'Creating database: user_service' AS status;
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'user_service'
  AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS user_service;
CREATE DATABASE user_service;

-- Create hospital_service database
SELECT 'Creating database: hospital_service' AS status;
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'hospital_service'
  AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS hospital_service;
CREATE DATABASE hospital_service;

-- Create doctor_service database
SELECT 'Creating database: doctor_service' AS status;
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'doctor_service'
  AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS doctor_service;
CREATE DATABASE doctor_service;

-- Create specialty_service database
SELECT 'Creating database: specialty_service' AS status;
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'specialty_service'
  AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS specialty_service;
CREATE DATABASE specialty_service;

-- Create appointment_service database
-- Note: This will terminate existing connections, so services using it will be disconnected
SELECT 'Creating database: appointment_service' AS status;
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'appointment_service'
  AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS appointment_service;
CREATE DATABASE appointment_service;

-- Create ads_service database
SELECT 'Creating database: ads_service' AS status;
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'ads_service'
  AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS ads_service;
CREATE DATABASE ads_service;

-- Create payment_service database
SELECT 'Creating database: payment_service' AS status;
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'payment_service'
  AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS payment_service;
CREATE DATABASE payment_service;

-- List all created databases
SELECT 'All databases created successfully!' AS status;
SELECT datname FROM pg_database WHERE datname IN ('fayo', 'user_service', 'hospital_service', 'doctor_service', 'specialty_service', 'appointment_service', 'ads_service', 'payment_service') ORDER BY datname;

