-- User Service Database Schema
-- This file creates the complete database schema for the user-service
-- Run with: cat services/user-service/user-service.sql | docker exec -i postgres psql -U postgres -d user_service

-- Create users schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS users;

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

-- Create unique indexes for username, email, and phone
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

-- Add comments for documentation
COMMENT ON SCHEMA users IS 'Schema for user management';
COMMENT ON TABLE users.users IS 'Stores user information and authentication data';
COMMENT ON TABLE users.otp_codes IS 'Stores OTP codes for phone verification';
COMMENT ON COLUMN users.users.role IS 'User role: PATIENT, DOCTOR, ADMIN, HOSPITAL, CLINIC';
COMMENT ON COLUMN users.users."userType" IS 'User type: PATIENT, DOCTOR, HOSPITAL_MANAGER';

