-- Specialty Service Database Schema
-- This file creates the complete database schema for the specialty-service
-- Run with: cat services/specialty-service/specialty-service.sql | docker exec -i postgres psql -U postgres -d specialty_service

-- Create specialties table
CREATE TABLE IF NOT EXISTS specialties (
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "specialties_pkey" PRIMARY KEY (id)
);

-- Create unique index on name
CREATE UNIQUE INDEX IF NOT EXISTS "specialties_name_key" ON specialties(name);

-- Add comments for documentation
COMMENT ON TABLE specialties IS 'Stores medical specialties information';
COMMENT ON COLUMN specialties.name IS 'Unique name of the specialty (e.g., "Cardiology", "Pediatrics")';
COMMENT ON COLUMN specialties.description IS 'Description of the specialty';
COMMENT ON COLUMN specialties."isActive" IS 'Whether the specialty is currently active/available';

