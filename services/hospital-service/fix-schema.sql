-- Fix script for hospital-service database schema
-- Run this if migrations have already been applied but schema is missing

-- Create the hospitals schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS "hospitals";

-- If tables exist in public schema, move them to hospitals schema
-- First, check if hospitals table exists in public schema and move it
DO $$
BEGIN
    -- Check if table exists in public schema
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'hospitals'
    ) THEN
        -- Move the table to hospitals schema
        ALTER TABLE public.hospitals SET SCHEMA hospitals;
        
        -- Move the enum type if it exists
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HospitalType' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
            ALTER TYPE "HospitalType" SET SCHEMA hospitals;
        END IF;
    END IF;
END $$;

-- Create enum type in hospitals schema if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'HospitalType' 
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'hospitals')
    ) THEN
        CREATE TYPE "hospitals"."HospitalType" AS ENUM ('HOSPITAL', 'CLINIC');
    END IF;
END $$;

-- Ensure the hospitals table exists in the hospitals schema
-- If it doesn't exist, create it
CREATE TABLE IF NOT EXISTS "hospitals"."hospitals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "hospitals"."HospitalType" NOT NULL DEFAULT 'HOSPITAL',
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);

-- Create unique index on userId if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS "hospitals_userId_key" ON "hospitals"."hospitals"("userId");

