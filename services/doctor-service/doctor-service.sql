-- Doctor Service Database Schema
-- This file creates the complete database schema for the doctor-service
-- Run with: cat services/doctor-service/doctor-service.sql | docker exec -i postgres psql -U postgres -d doctor_service

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    experience INTEGER NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "selfEmployedConsultationFee" INTEGER,
    bio TEXT,
    "imageUrl" TEXT,
    education TEXT,
    certifications TEXT,
    languages TEXT,
    awards TEXT,
    publications TEXT,
    memberships TEXT,
    "researchInterests" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "doctors_pkey" PRIMARY KEY (id)
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "doctors_userId_key" ON doctors("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "doctors_licenseNumber_key" ON doctors("licenseNumber");

-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'HOSPITAL',
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    website TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hospitals_pkey" PRIMARY KEY (id)
);

-- Create hospital_doctors junction table
CREATE TABLE IF NOT EXISTS hospital_doctors (
    id TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "workingDays" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "consultationFee" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hospital_doctors_pkey" PRIMARY KEY (id),
    CONSTRAINT "hospital_doctors_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES doctors(id) ON DELETE CASCADE,
    CONSTRAINT "hospital_doctors_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES hospitals(id) ON DELETE CASCADE
);

-- Create unique constraint on doctor-hospital combination
CREATE UNIQUE INDEX IF NOT EXISTS "hospital_doctors_doctorId_hospitalId_key" ON hospital_doctors("doctorId", "hospitalId");

-- Create doctor_specialties junction table
CREATE TABLE IF NOT EXISTS doctor_specialties (
    id TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "doctor_specialties_pkey" PRIMARY KEY (id),
    CONSTRAINT "doctor_specialties_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES doctors(id) ON DELETE CASCADE
);

-- Create unique constraint on doctor-specialty combination
CREATE UNIQUE INDEX IF NOT EXISTS "doctor_specialties_doctorId_specialtyId_key" ON doctor_specialties("doctorId", "specialtyId");

-- Add comments for documentation
COMMENT ON TABLE doctors IS 'Stores doctor information and professional details';
COMMENT ON TABLE hospitals IS 'Stores hospital information';
COMMENT ON TABLE hospital_doctors IS 'Junction table for many-to-many relationship between doctors and hospitals';
COMMENT ON TABLE doctor_specialties IS 'Junction table for many-to-many relationship between doctors and specialties';
COMMENT ON COLUMN doctors."userId" IS 'Reference to user ID in user-service';
COMMENT ON COLUMN doctors."selfEmployedConsultationFee" IS 'Self-employed consultation fee in cents';
COMMENT ON COLUMN hospital_doctors."consultationFee" IS 'Consultation fee in cents (specific to this hospital)';
COMMENT ON COLUMN hospital_doctors."workingDays" IS 'JSON array of working days: ["MONDAY", "TUESDAY", etc.]';
COMMENT ON COLUMN hospital_doctors."startTime" IS 'Working start time in 24-hour format (e.g., "09:00")';
COMMENT ON COLUMN hospital_doctors."endTime" IS 'Working end time in 24-hour format (e.g., "17:00")';
COMMENT ON COLUMN doctor_specialties."specialtyId" IS 'Reference to specialty ID in specialty-service';

