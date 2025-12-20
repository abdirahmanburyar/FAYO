-- Hospital Service Database Schema
-- This file creates the complete database schema for the hospital-service
-- Run with: cat services/hospital-service/hospital-service.sql | docker exec -i postgres psql -U postgres -d hospital_service

-- Create hospitals schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS hospitals;

-- Create HospitalType enum
DO $$ BEGIN
    CREATE TYPE hospitals."HospitalType" AS ENUM ('HOSPITAL', 'CLINIC');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create BookingPolicy enum
DO $$ BEGIN
    CREATE TYPE hospitals."BookingPolicy" AS ENUM ('HOSPITAL_ASSIGNED', 'DIRECT_DOCTOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals.hospitals (
    id TEXT NOT NULL,
    "userId" TEXT,
    name TEXT NOT NULL,
    type hospitals."HospitalType" NOT NULL DEFAULT 'HOSPITAL',
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    website TEXT,
    "logoUrl" TEXT,
    "bookingPolicy" hospitals."BookingPolicy" NOT NULL DEFAULT 'DIRECT_DOCTOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hospitals_pkey" PRIMARY KEY (id)
);

-- Create unique index on userId
CREATE UNIQUE INDEX IF NOT EXISTS "hospitals_userId_key" ON hospitals.hospitals("userId") WHERE "userId" IS NOT NULL;

-- Create services table
CREATE TABLE IF NOT EXISTS hospitals.services (
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "services_pkey" PRIMARY KEY (id)
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS hospitals.doctors (
    id TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    specialty TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    experience INTEGER NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "consultationFee" INTEGER,
    bio TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "doctors_pkey" PRIMARY KEY (id)
);

-- Create unique indexes on doctors
CREATE UNIQUE INDEX IF NOT EXISTS "doctors_userId_key" ON hospitals.doctors("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "doctors_licenseNumber_key" ON hospitals.doctors("licenseNumber");

-- Create hospital_specialties junction table
CREATE TABLE IF NOT EXISTS hospitals.hospital_specialties (
    id TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hospital_specialties_pkey" PRIMARY KEY (id),
    CONSTRAINT "hospital_specialties_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES hospitals.hospitals(id) ON DELETE CASCADE
);

-- Create unique constraint on hospital-specialty combination
CREATE UNIQUE INDEX IF NOT EXISTS "hospital_specialties_hospitalId_specialtyId_key" ON hospitals.hospital_specialties("hospitalId", "specialtyId");

-- Create hospital_services junction table
CREATE TABLE IF NOT EXISTS hospitals.hospital_services (
    id TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hospital_services_pkey" PRIMARY KEY (id),
    CONSTRAINT "hospital_services_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES hospitals.hospitals(id) ON DELETE CASCADE,
    CONSTRAINT "hospital_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES hospitals.services(id) ON DELETE CASCADE
);

-- Create unique constraint on hospital-service combination
CREATE UNIQUE INDEX IF NOT EXISTS "hospital_services_hospitalId_serviceId_key" ON hospitals.hospital_services("hospitalId", "serviceId");

-- Create hospital_doctors junction table
CREATE TABLE IF NOT EXISTS hospitals.hospital_doctors (
    id TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'CONSULTANT',
    shift TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "consultationFee" INTEGER,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hospital_doctors_pkey" PRIMARY KEY (id),
    CONSTRAINT "hospital_doctors_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES hospitals.doctors(id) ON DELETE CASCADE,
    CONSTRAINT "hospital_doctors_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES hospitals.hospitals(id) ON DELETE CASCADE
);

-- Create unique constraint on doctor-hospital combination
CREATE UNIQUE INDEX IF NOT EXISTS "hospital_doctors_doctorId_hospitalId_key" ON hospitals.hospital_doctors("doctorId", "hospitalId");

-- Add comments for documentation
COMMENT ON SCHEMA hospitals IS 'Schema for hospital management';
COMMENT ON TABLE hospitals.hospitals IS 'Stores hospital information';
COMMENT ON TABLE hospitals.services IS 'Stores hospital services (e.g., Emergency, Surgery, Radiology)';
COMMENT ON TABLE hospitals.doctors IS 'Stores doctor information associated with hospitals';
COMMENT ON TABLE hospitals.hospital_specialties IS 'Junction table for many-to-many relationship between hospitals and specialties';
COMMENT ON TABLE hospitals.hospital_services IS 'Junction table for many-to-many relationship between hospitals and services';
COMMENT ON TABLE hospitals.hospital_doctors IS 'Junction table for many-to-many relationship between hospitals and doctors';
COMMENT ON COLUMN hospitals.hospitals."userId" IS 'Reference to user ID in user-service';
COMMENT ON COLUMN hospitals.doctors."userId" IS 'Reference to user ID in user-service';
COMMENT ON COLUMN hospitals.hospital_specialties."specialtyId" IS 'Reference to specialty ID in specialty-service';
COMMENT ON COLUMN hospitals.hospital_doctors.role IS 'Doctor role: CONSULTANT, SENIOR_CONSULTANT, HEAD_OF_DEPARTMENT, RESIDENT, INTERN, GENERAL_PRACTITIONER';
COMMENT ON COLUMN hospitals.hospital_doctors.shift IS 'Working shift: MORNING, AFTERNOON, EVENING, NIGHT, FULL_DAY';
COMMENT ON COLUMN hospitals.hospital_doctors."startTime" IS 'Working start time in 24-hour format (e.g., "09:00")';
COMMENT ON COLUMN hospitals.hospital_doctors."endTime" IS 'Working end time in 24-hour format (e.g., "17:00")';
COMMENT ON COLUMN hospitals.hospital_doctors."consultationFee" IS 'Consultation fee in cents (specific to this hospital association)';

