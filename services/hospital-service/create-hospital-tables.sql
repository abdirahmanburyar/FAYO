-- Create hospitals schema
CREATE SCHEMA IF NOT EXISTS hospitals;

-- Create HospitalType enum
DO $$ BEGIN
    CREATE TYPE hospitals."HospitalType" AS ENUM ('HOSPITAL', 'CLINIC');
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "services_pkey" PRIMARY KEY (id)
);

-- Create hospital_specialties table
CREATE TABLE IF NOT EXISTS hospitals.hospital_specialties (
    id TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hospital_specialties_pkey" PRIMARY KEY (id)
);

-- Create unique constraint on hospital_specialties
CREATE UNIQUE INDEX IF NOT EXISTS "hospital_specialties_hospitalId_specialtyId_key" ON hospitals.hospital_specialties("hospitalId", "specialtyId");

-- Create hospital_services table
CREATE TABLE IF NOT EXISTS hospitals.hospital_services (
    id TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hospital_services_pkey" PRIMARY KEY (id)
);

-- Create unique constraint on hospital_services
CREATE UNIQUE INDEX IF NOT EXISTS "hospital_services_hospitalId_serviceId_key" ON hospitals.hospital_services("hospitalId", "serviceId");

-- Create hospital_doctors table
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hospital_doctors_pkey" PRIMARY KEY (id)
);

-- Create unique constraint on hospital_doctors
CREATE UNIQUE INDEX IF NOT EXISTS "hospital_doctors_doctorId_hospitalId_key" ON hospitals.hospital_doctors("doctorId", "hospitalId");

-- Create doctors table (in hospitals schema)
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "doctors_pkey" PRIMARY KEY (id)
);

-- Create unique indexes on doctors
CREATE UNIQUE INDEX IF NOT EXISTS "doctors_userId_key" ON hospitals.doctors("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "doctors_licenseNumber_key" ON hospitals.doctors("licenseNumber");

-- Create foreign key constraints
ALTER TABLE hospitals.hospital_specialties 
ADD CONSTRAINT IF NOT EXISTS "hospital_specialties_hospitalId_fkey" 
FOREIGN KEY ("hospitalId") REFERENCES hospitals.hospitals(id) ON DELETE CASCADE;

ALTER TABLE hospitals.hospital_services 
ADD CONSTRAINT IF NOT EXISTS "hospital_services_hospitalId_fkey" 
FOREIGN KEY ("hospitalId") REFERENCES hospitals.hospitals(id) ON DELETE CASCADE;

ALTER TABLE hospitals.hospital_services 
ADD CONSTRAINT IF NOT EXISTS "hospital_services_serviceId_fkey" 
FOREIGN KEY ("serviceId") REFERENCES hospitals.services(id) ON DELETE CASCADE;

ALTER TABLE hospitals.hospital_doctors 
ADD CONSTRAINT IF NOT EXISTS "hospital_doctors_hospitalId_fkey" 
FOREIGN KEY ("hospitalId") REFERENCES hospitals.hospitals(id) ON DELETE CASCADE;

ALTER TABLE hospitals.hospital_doctors 
ADD CONSTRAINT IF NOT EXISTS "hospital_doctors_doctorId_fkey" 
FOREIGN KEY ("doctorId") REFERENCES hospitals.doctors(id) ON DELETE CASCADE;

