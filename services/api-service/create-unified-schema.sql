-- Unified Database Schema for FAYO Healthcare API
-- Single database with multiple schemas
-- Run with: cat services/api-service/create-unified-schema.sql | docker exec -i postgres psql -U postgres -d fayo

-- ============================================
-- CREATE SCHEMAS
-- ============================================

CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS hospitals;
CREATE SCHEMA IF NOT EXISTS appointments;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS ads;

-- ============================================
-- USERS SCHEMA
-- ============================================

-- Create UserRole enum
DO $$ BEGIN
    CREATE TYPE users."UserRole" AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN', 'HOSPITAL', 'CLINIC');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create UserType enum
DO $$ BEGIN
    CREATE TYPE users."UserType" AS ENUM ('PATIENT', 'DOCTOR', 'HOSPITAL_MANAGER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Gender enum
DO $$ BEGIN
    CREATE TYPE users."Gender" AS ENUM ('MALE', 'FEMALE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users.users (
    id TEXT NOT NULL,
    username TEXT,
    email TEXT,
    phone TEXT,
    password TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    role users."UserRole" NOT NULL DEFAULT 'PATIENT',
    "userType" users."UserType" NOT NULL DEFAULT 'PATIENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateOfBirth" TIMESTAMP(3),
    gender users."Gender",
    address TEXT,
    CONSTRAINT "users_pkey" PRIMARY KEY (id)
);

-- Create unique indexes for users
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON users.users(username) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON users.users(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key" ON users.users(phone) WHERE phone IS NOT NULL;

-- Create otp_codes table
CREATE TABLE IF NOT EXISTS users.otp_codes (
    id TEXT NOT NULL,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "otp_codes_pkey" PRIMARY KEY (id)
);

-- ============================================
-- PUBLIC SCHEMA (Specialties and Doctors)
-- ============================================

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

-- Create unique index on specialty name
CREATE UNIQUE INDEX IF NOT EXISTS "specialties_name_key" ON specialties(name);

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

-- Create unique indexes for doctors
CREATE UNIQUE INDEX IF NOT EXISTS "doctors_userId_key" ON doctors("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "doctors_licenseNumber_key" ON doctors("licenseNumber");

-- Create doctor_specialties table
CREATE TABLE IF NOT EXISTS doctor_specialties (
    id TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "doctor_specialties_pkey" PRIMARY KEY (id),
    CONSTRAINT "doctor_specialties_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES doctors(id) ON DELETE CASCADE,
    CONSTRAINT "doctor_specialties_doctorId_specialtyId_key" UNIQUE ("doctorId", "specialtyId")
);

-- ============================================
-- HOSPITALS SCHEMA
-- ============================================

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

-- Create unique index for hospital userId
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

-- Create hospital_specialties table
CREATE TABLE IF NOT EXISTS hospitals.hospital_specialties (
    id TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hospital_specialties_pkey" PRIMARY KEY (id),
    CONSTRAINT "hospital_specialties_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES hospitals.hospitals(id) ON DELETE CASCADE,
    CONSTRAINT "hospital_specialties_hospitalId_specialtyId_key" UNIQUE ("hospitalId", "specialtyId")
);

-- Create hospital_services table
CREATE TABLE IF NOT EXISTS hospitals.hospital_services (
    id TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hospital_services_pkey" PRIMARY KEY (id),
    CONSTRAINT "hospital_services_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES hospitals.hospitals(id) ON DELETE CASCADE,
    CONSTRAINT "hospital_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES hospitals.services(id) ON DELETE CASCADE,
    CONSTRAINT "hospital_services_hospitalId_serviceId_key" UNIQUE ("hospitalId", "serviceId")
);

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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hospital_doctors_pkey" PRIMARY KEY (id),
    CONSTRAINT "hospital_doctors_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES hospitals.hospitals(id) ON DELETE CASCADE,
    CONSTRAINT "hospital_doctors_doctorId_hospitalId_key" UNIQUE ("doctorId", "hospitalId")
);

-- ============================================
-- APPOINTMENTS SCHEMA
-- ============================================

-- Create AppointmentStatus enum
DO $$ BEGIN
    CREATE TYPE appointments."AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ConsultationType enum
DO $$ BEGIN
    CREATE TYPE appointments."ConsultationType" AS ENUM ('IN_PERSON', 'VIDEO', 'PHONE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments.appointments (
    id TEXT NOT NULL,
    "appointmentNumber" INTEGER,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "hospitalId" TEXT,
    "specialtyId" TEXT,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "appointmentTime" TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30,
    status appointments."AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "consultationType" appointments."ConsultationType" NOT NULL DEFAULT 'IN_PERSON',
    reason TEXT,
    description TEXT,
    "consultationFee" INTEGER NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paymentTransactionId" TEXT,
    "createdBy" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    "completedAt" TIMESTAMP(3),
    notes TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "appointments_pkey" PRIMARY KEY (id)
);

-- Create indexes for appointments
CREATE UNIQUE INDEX IF NOT EXISTS "appointments_appointmentNumber_key" ON appointments.appointments("appointmentNumber") WHERE "appointmentNumber" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "appointments_patientId_idx" ON appointments.appointments("patientId");
CREATE INDEX IF NOT EXISTS "appointments_doctorId_idx" ON appointments.appointments("doctorId") WHERE "doctorId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "appointments_hospitalId_idx" ON appointments.appointments("hospitalId") WHERE "hospitalId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "appointments_appointmentDate_idx" ON appointments.appointments("appointmentDate");
CREATE INDEX IF NOT EXISTS "appointments_status_idx" ON appointments.appointments(status);
CREATE INDEX IF NOT EXISTS "appointments_paymentStatus_idx" ON appointments.appointments("paymentStatus");
CREATE INDEX IF NOT EXISTS "appointments_appointmentNumber_idx" ON appointments.appointments("appointmentNumber") WHERE "appointmentNumber" IS NOT NULL;

-- ============================================
-- PAYMENTS SCHEMA
-- ============================================

-- Create PaymentMethod enum
DO $$ BEGIN
    CREATE TYPE payments."PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHEQUE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create PaymentType enum
DO $$ BEGIN
    CREATE TYPE payments."PaymentType" AS ENUM ('APPOINTMENT', 'AD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create PaymentStatus enum
DO $$ BEGIN
    CREATE TYPE payments."PaymentStatus" AS ENUM ('PAID', 'REFUNDED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments.payments (
    id TEXT NOT NULL,
    "paymentType" payments."PaymentType" NOT NULL DEFAULT 'APPOINTMENT',
    "appointmentId" TEXT,
    "adId" TEXT,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" payments."PaymentMethod" NOT NULL,
    "paymentStatus" payments."PaymentStatus" NOT NULL DEFAULT 'PAID',
    "transactionId" TEXT,
    "receiptNumber" TEXT,
    "paidBy" TEXT,
    "processedBy" TEXT,
    notes TEXT,
    "paymentDate" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "refundReason" TEXT,
    "refundedBy" TEXT,
    metadata JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY (id)
);

-- Create unique indexes for payments
CREATE UNIQUE INDEX IF NOT EXISTS "payments_transactionId_key" ON payments.payments("transactionId") WHERE "transactionId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "payments_receiptNumber_key" ON payments.payments("receiptNumber") WHERE "receiptNumber" IS NOT NULL;

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS "payments_appointmentId_idx" ON payments.payments("appointmentId") WHERE "appointmentId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "payments_adId_idx" ON payments.payments("adId") WHERE "adId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "payments_paymentType_idx" ON payments.payments("paymentType");
CREATE INDEX IF NOT EXISTS "payments_paymentStatus_idx" ON payments.payments("paymentStatus");
CREATE INDEX IF NOT EXISTS "payments_paymentMethod_idx" ON payments.payments("paymentMethod");
CREATE INDEX IF NOT EXISTS "payments_transactionId_idx" ON payments.payments("transactionId") WHERE "transactionId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "payments_receiptNumber_idx" ON payments.payments("receiptNumber") WHERE "receiptNumber" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "payments_paidBy_idx" ON payments.payments("paidBy") WHERE "paidBy" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "payments_processedBy_idx" ON payments.payments("processedBy") WHERE "processedBy" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "payments_paymentDate_idx" ON payments.payments("paymentDate") WHERE "paymentDate" IS NOT NULL;

-- ============================================
-- ADS SCHEMA
-- ============================================

-- Create AdStatus enum
DO $$ BEGIN
    CREATE TYPE ads."AdStatus" AS ENUM ('INACTIVE', 'PENDING', 'ACTIVE', 'EXPIRED', 'PUBLISHED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create AdType enum
DO $$ BEGIN
    CREATE TYPE ads."AdType" AS ENUM ('BANNER', 'CAROUSEL', 'INTERSTITIAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ads table
CREATE TABLE IF NOT EXISTS ads.ads (
    id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    company TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    type ads."AdType" NOT NULL DEFAULT 'BANNER',
    status ads."AdStatus" NOT NULL DEFAULT 'PENDING',
    price DECIMAL(10, 2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ads_pkey" PRIMARY KEY (id)
);

-- Create indexes for ads
CREATE INDEX IF NOT EXISTS "ads_status_startDate_endDate_idx" ON ads.ads(status, "startDate", "endDate");
CREATE INDEX IF NOT EXISTS "ads_priority_status_idx" ON ads.ads(priority DESC, status);

