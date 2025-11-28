-- Run this SQL in your PostgreSQL database to add the new fields to hospital_doctors table
-- Connect to your database and run:
-- psql -U postgres -d your_database_name -f run-migration.sql

-- Or if using Docker:
-- docker exec -i your_postgres_container psql -U postgres -d your_database_name < run-migration.sql

ALTER TABLE "hospitals"."hospital_doctors" 
ADD COLUMN IF NOT EXISTS "shift" TEXT,
ADD COLUMN IF NOT EXISTS "startTime" TEXT,
ADD COLUMN IF NOT EXISTS "endTime" TEXT,
ADD COLUMN IF NOT EXISTS "consultationFee" INTEGER,
ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE';

