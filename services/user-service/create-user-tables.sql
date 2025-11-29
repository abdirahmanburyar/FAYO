-- Create users schema
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    gender users."Gender",
    address TEXT,
    CONSTRAINT "users_pkey" PRIMARY KEY (id)
);

-- Create unique indexes
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

